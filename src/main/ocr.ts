import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { getLibrary, listLibraryRoots } from "./db";
import { notifyDocumentsChanged } from "./documents";
import { logger as rootLogger } from "./logger";
import { getOllamaStatus, ocrGenerate } from "./ollama";

const logger = rootLogger.child({ mod: "ocr" });

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "webp", "gif"]);

type Claim = { root: string; path: string };

let busy = false;
let started = false;

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

function claimNext(): Claim | null {
    for (const root of listLibraryRoots()) {
        const db = getLibrary(root);
        if (!db) continue;
        const row = db
            .prepare(
                "SELECT path FROM documents WHERE ocr_status = 'pending' ORDER BY updated_at_ms LIMIT 1",
            )
            .get() as { path: string } | undefined;
        if (!row) continue;
        const now = Date.now();
        const r = db
            .prepare(
                "UPDATE documents SET ocr_status = 'running', updated_at_ms = ? WHERE path = ? AND ocr_status = 'pending'",
            )
            .run(now, row.path);
        if (r.changes) return { root, path: row.path };
    }
    return null;
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

async function pdfPagesB64(abs: string): Promise<string[]> {
    // ponytail: dynamic import — pdfjs is ESM; CJS require of .mjs breaks in Electron
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const data = new Uint8Array(await readFile(abs));
    const doc = await getDocument({ data, useSystemFonts: true }).promise;
    const out: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
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
        out.push(canvas.toBuffer("image/png").toString("base64"));
    }
    return out;
}

async function imagesFor(abs: string, ext: string): Promise<string[]> {
    if (IMAGE_EXT.has(ext)) {
        return [(await readFile(abs)).toString("base64")];
    }
    if (ext === "pdf") return pdfPagesB64(abs);
    throw new Error(`OCR supports images and PDF only (not .${ext})`);
}

async function runOne(job: Claim): Promise<void> {
    const abs = join(job.root, job.path);
    const ext = extname(job.path).slice(1).toLowerCase();
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
        logger.info({ root: job.root, path: job.path }, "ocr done");
    } catch (e) {
        const msg = errMsg(e);
        finish(job.root, job.path, false, null, msg);
        logger.warn({ root: job.root, path: job.path, err: msg }, "ocr failed");
    }
}

async function loop(): Promise<void> {
    if (busy) return;
    busy = true;
    try {
        for (;;) {
            const st = await getOllamaStatus();
            if (!st.running || !st.modelPresent) return;
            const job = claimNext();
            if (!job) return;
            notifyDocumentsChanged();
            await runOne(job);
        }
    } finally {
        busy = false;
    }
}

export function kickOcr(): void {
    if (!started) return;
    void loop();
}

export function startOcr(): void {
    if (started) return;
    started = true;
    resetRunning();
    kickOcr();
}
