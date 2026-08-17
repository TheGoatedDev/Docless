import { createHash } from "node:crypto";
import { createReadStream, existsSync, lstatSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";
import { getLibrary } from "./db";
import { notifyDocumentsChanged } from "./documents";
import { logger as rootLogger } from "./logger";

const logger = rootLogger.child({ mod: "track" });

const ALLOWED = new Set([
    "pdf",
    "png",
    "jpg",
    "jpeg",
    "webp",
    "tif",
    "tiff",
    "heic",
    "gif",
]);

const DEBOUNCE_MS = 400;
const timers = new Map<string, ReturnType<typeof setTimeout>>();

export function relPath(root: string, abs: string): string {
    return relative(root, abs).normalize("NFC").split(sep).join("/");
}

function shouldTrack(root: string, abs: string): boolean {
    const rel = relPath(root, abs);
    if (!rel || rel.startsWith("..") || rel.includes("/../")) return false;
    const ext = extname(abs).slice(1).toLowerCase();
    if (!ALLOWED.has(ext)) return false;
    try {
        if (lstatSync(abs).isSymbolicLink()) return false;
    } catch {
        return false;
    }
    return true;
}

function hashFile(abs: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const h = createHash("sha256");
        const s = createReadStream(abs);
        s.on("data", (c) => h.update(c));
        s.on("error", reject);
        s.on("end", () => resolve(h.digest("hex")));
    });
}

type Row = {
    path: string;
    mtime_ms: number;
    size: number;
    content_hash: string | null;
};

export async function upsert(root: string, abs: string): Promise<void> {
    const db = getLibrary(root);
    if (!db || !shouldTrack(root, abs)) return;

    let st: ReturnType<typeof lstatSync>;
    try {
        st = lstatSync(abs);
    } catch {
        return;
    }
    if (!st.isFile()) return;

    const path = relPath(root, abs);
    const mtime_ms = Math.trunc(st.mtimeMs);
    const size = st.size;

    const row = db
        .prepare(
            "SELECT path, mtime_ms, size, content_hash FROM documents WHERE path = ?",
        )
        .get(path) as Row | undefined;

    if (row && row.mtime_ms === mtime_ms && row.size === size) return;

    let content_hash: string;
    try {
        content_hash = await hashFile(abs);
    } catch (err) {
        logger.warn({ root, path, err }, "hash failed");
        return;
    }

    const now = Date.now();

    if (!row) {
        db.prepare(
            `INSERT INTO documents
        (path, mtime_ms, size, content_hash, ocr_status, ocr_error, text, created_at_ms, updated_at_ms)
       VALUES (?, ?, ?, ?, 'pending', NULL, NULL, ?, ?)`,
        ).run(path, mtime_ms, size, content_hash, now, now);
        logger.info({ root, path }, "document added");
        notifyDocumentsChanged();
        return;
    }

    if (row.content_hash === content_hash) {
        db.prepare(
            "UPDATE documents SET mtime_ms = ?, size = ?, updated_at_ms = ? WHERE path = ?",
        ).run(mtime_ms, size, now, path);
        return;
    }

    db.prepare(
        `UPDATE documents SET mtime_ms = ?, size = ?, content_hash = ?,
       ocr_status = 'pending', ocr_error = NULL, updated_at_ms = ?
       WHERE path = ?`,
    ).run(mtime_ms, size, content_hash, now, path);
    logger.info({ root, path }, "document changed");
    notifyDocumentsChanged();
}

export function remove(root: string, abs: string): void {
    const db = getLibrary(root);
    if (!db) return;
    const path = relPath(root, abs);
    if (!path || path.startsWith("..")) return;
    const r = db.prepare("DELETE FROM documents WHERE path = ?").run(path);
    if (r.changes) {
        logger.info({ root, path }, "document removed");
        notifyDocumentsChanged();
    }
}

export function prune(root: string): void {
    const db = getLibrary(root);
    if (!db) return;
    const rows = db.prepare("SELECT path FROM documents").all() as {
        path: string;
    }[];
    const del = db.prepare("DELETE FROM documents WHERE path = ?");
    let n = 0;
    for (const { path } of rows) {
        if (!existsSync(join(root, path))) {
            del.run(path);
            n++;
        }
    }
    if (n) {
        logger.info({ root, n }, "pruned missing documents");
        notifyDocumentsChanged();
    }
}

export function schedule(root: string, abs: string): void {
    const key = `${root}\0${abs}`;
    const prev = timers.get(key);
    if (prev) clearTimeout(prev);
    timers.set(
        key,
        setTimeout(() => {
            timers.delete(key);
            void upsert(root, abs);
        }, DEBOUNCE_MS),
    );
}

export function clearSchedules(root?: string): void {
    for (const [key, t] of timers) {
        if (root === undefined || key.startsWith(`${root}\0`)) {
            clearTimeout(t);
            timers.delete(key);
        }
    }
}
