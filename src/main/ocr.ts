import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { getLibrary, listLibraryRoots } from "./db";
import { notifyDocumentsChanged } from "./documents";
import { logger as rootLogger } from "./logger";
import { getOllamaStatus, ocrGenerate } from "./ollama";

const logger = rootLogger.child({ mod: "ocr" });

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "webp", "gif"]);
// ponytail: LightOnOCR-2 wants longest edge ~1540px
const MAX_EDGE = 1540;
// ponytail: fixed pool; bump if Ollama keeps up without thrash
const CONCURRENCY = 2;
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [5_000, 15_000] as const;

type Claim = { root: string; path: string };

let active = 0;
let started = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
// ponytail: in-memory attempts, lost on quit — leftover failed stay failed until Retry / Retry All
const attempts = new Map<string, number>();

function jobKey(root: string, path: string): string {
    return `${root}\0${path}`;
}

function isTransient(msg: string): boolean {
    return msg.includes("OCR timed out") || msg.includes("Ollama unavailable");
}

export function clearOcrAttempts(root: string, path: string): void {
    attempts.delete(jobKey(root, path));
}

function errMsg(e: unknown): string {
    if (e instanceof Error) {
        if (e.name === "TimeoutError" || e.name === "AbortError") {
            return "OCR timed out";
        }
        if (
            e.message.includes("ECONNREFUSED") ||
            e.message.includes("fetch failed")
        ) {
            return "Ollama unavailable at 127.0.0.1:11434";
        }
        return e.message;
    }
    return String(e);
}

function resetRunning(): void {
    for (const root of listLibraryRoots()) {
        const db = getLibrary(root);
        if (!db) continue;
        const r = db
            .prepare(
                "UPDATE documents SET ocr_status = 'pending', updated_at_ms = ? WHERE ocr_status = 'running'",
            )
            .run(Date.now());
        if (r.changes) {
            logger.info(
                { root, n: r.changes },
                "reset stale running → pending",
            );
        }
    }
}

function hasPending(): boolean {
    for (const root of listLibraryRoots()) {
        const db = getLibrary(root);
        if (!db) continue;
        const row = db
            .prepare(
                "SELECT 1 AS ok FROM documents WHERE ocr_status = 'pending' LIMIT 1",
            )
            .get() as { ok: number } | undefined;
        if (row) return true;
    }
    return false;
}

function scheduleKick(ms: number): void {
    if (retryTimer) return;
    retryTimer = setTimeout(() => {
        retryTimer = null;
        kickOcr();
    }, ms);
}

/** Newest pending across all roots (just-dropped files first). */
function claimNext(): Claim | null {
    let best: { root: string; path: string; t: number } | null = null;
    for (const root of listLibraryRoots()) {
        const db = getLibrary(root);
        if (!db) continue;
        const row = db
            .prepare(
                "SELECT path, updated_at_ms FROM documents WHERE ocr_status = 'pending' ORDER BY updated_at_ms DESC LIMIT 1",
            )
            .get() as { path: string; updated_at_ms: number } | undefined;
        if (row && (!best || row.updated_at_ms > best.t)) {
            best = { root, path: row.path, t: row.updated_at_ms };
        }
    }
    if (!best) return null;
    const now = Date.now();
    const db = getLibrary(best.root);
    if (!db) return null;
    const r = db
        .prepare(
            "UPDATE documents SET ocr_status = 'running', updated_at_ms = ? WHERE path = ? AND ocr_status = 'pending'",
        )
        .run(now, best.path);
    if (!r.changes) return null;
    return { root: best.root, path: best.path };
}

function finish(
    root: string,
    path: string,
    ok: boolean,
    text: string | null,
    error: string | null,
): void {
    const db = getLibrary(root);
    if (!db) return;
    const now = Date.now();
    if (ok) {
        attempts.delete(jobKey(root, path));
        db.prepare(
            `UPDATE documents SET ocr_status = 'done', text = ?, ocr_error = NULL, updated_at_ms = ?
       WHERE path = ? AND ocr_status = 'running'`,
        ).run(text, now, path);
    } else {
        db.prepare(
            `UPDATE documents SET ocr_status = 'failed', ocr_error = ?, updated_at_ms = ?
       WHERE path = ? AND ocr_status = 'running'`,
        ).run(error, now, path);
    }
    notifyDocumentsChanged();
}

async function encodeBufForOcr(buf: Buffer): Promise<string> {
    const img = await loadImage(buf);
    let w = img.width;
    let h = img.height;
    const max = Math.max(w, h);
    if (max > MAX_EDGE) {
        const s = MAX_EDGE / max;
        w = Math.max(1, Math.round(w * s));
        h = Math.max(1, Math.round(h * s));
    }
    const canvas = createCanvas(w, h);
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
    return canvas.toBuffer("image/jpeg", 85).toString("base64");
}

async function pdfPagesB64(abs: string): Promise<string[]> {
    // ponytail: dynamic import — pdfjs is ESM; CJS require of .mjs breaks in Electron
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const data = new Uint8Array(await readFile(abs));
    const doc = await getDocument({ data, useSystemFonts: true }).promise;
    const out: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const scale = Math.min(2, MAX_EDGE / Math.max(base.width, base.height));
        const viewport = page.getViewport({ scale });
        const canvas = createCanvas(
            Math.ceil(viewport.width),
            Math.ceil(viewport.height),
        );
        const ctx = canvas.getContext("2d");
        await page.render({
            canvasContext: ctx as unknown as CanvasRenderingContext2D,
            viewport,
            canvas: canvas as unknown as HTMLCanvasElement,
        }).promise;
        out.push(await encodeBufForOcr(canvas.toBuffer("image/png")));
    }
    return out;
}

async function imagesFor(abs: string, ext: string): Promise<string[]> {
    if (IMAGE_EXT.has(ext)) {
        return [await encodeBufForOcr(await readFile(abs))];
    }
    if (ext === "pdf") return pdfPagesB64(abs);
    throw new Error(`OCR supports images and PDF only (not .${ext})`);
}

async function runOne(job: Claim): Promise<void> {
    const abs = join(job.root, job.path);
    const ext = extname(job.path).slice(1).toLowerCase();
    logger.info({ root: job.root, path: job.path }, "ocr start");
    try {
        const images = await imagesFor(abs, ext);
        const parts: string[] = [];
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            if (img == null) continue;
            try {
                parts.push(await ocrGenerate(img));
            } catch (e) {
                throw new Error(
                    images.length > 1
                        ? `page ${i + 1}/${images.length}: ${errMsg(e)}`
                        : errMsg(e),
                );
            }
        }
        finish(job.root, job.path, true, parts.join("\n\n"), null);
        logger.info(
            { root: job.root, path: job.path, pages: parts.length },
            "ocr done",
        );
    } catch (e) {
        const msg = errMsg(e);
        const k = jobKey(job.root, job.path);
        const n = (attempts.get(k) ?? 0) + 1;
        attempts.set(k, n);
        finish(job.root, job.path, false, null, msg);
        logger.warn(
            { root: job.root, path: job.path, err: msg, n },
            "ocr failed",
        );
        if (isTransient(msg) && n < MAX_ATTEMPTS) {
            const delay =
                BACKOFF_MS[n - 1] ?? BACKOFF_MS[BACKOFF_MS.length - 1];
            setTimeout(() => {
                requeueFailed(job.root, job.path);
            }, delay);
        }
    }
}

/** Reserve a slot, claim one job, run it. Returns false when nothing to start. */
async function tryStartOne(): Promise<boolean> {
    if (active >= CONCURRENCY) return false;
    active++;
    try {
        const st = await getOllamaStatus();
        if (!st.running || !st.modelPresent) {
            if (hasPending()) {
                logger.debug(
                    { running: st.running, modelPresent: st.modelPresent },
                    "ocr wait: ollama not ready",
                );
                scheduleKick(2000);
            }
            active--;
            return false;
        }
        const job = claimNext();
        if (!job) {
            active--;
            return false;
        }
        notifyDocumentsChanged();
        void runOne(job).finally(() => {
            active--;
            void fill();
        });
        return true;
    } catch (e) {
        active--;
        throw e;
    }
}

async function fill(): Promise<void> {
    while (await tryStartOne()) {
        /* fill pool */
    }
}

export function kickOcr(): void {
    if (!started) return;
    void fill();
}

function requeueFailed(root: string, path: string): boolean {
    const db = getLibrary(root);
    if (!db) return false;
    const r = db
        .prepare(
            `UPDATE documents SET ocr_status = 'pending', ocr_error = NULL, updated_at_ms = ?
       WHERE path = ? AND ocr_status = 'failed'`,
        )
        .run(Date.now(), path);
    if (!r.changes) return false;
    notifyDocumentsChanged();
    kickOcr();
    return true;
}

/** failed → pending; no-op if not failed. */
export function retryOcr(root: string, path: string): boolean {
    clearOcrAttempts(root, path);
    return requeueFailed(root, path);
}

export function retryAllFailed(): number {
    attempts.clear();
    let n = 0;
    const now = Date.now();
    for (const root of listLibraryRoots()) {
        const db = getLibrary(root);
        if (!db) continue;
        n += db
            .prepare(
                `UPDATE documents SET ocr_status = 'pending', ocr_error = NULL, updated_at_ms = ?
         WHERE ocr_status = 'failed'`,
            )
            .run(now).changes;
    }
    if (n) {
        notifyDocumentsChanged();
        kickOcr();
    }
    return n;
}

export function startOcr(): void {
    if (started) return;
    started = true;
    resetRunning();
    kickOcr();
}
