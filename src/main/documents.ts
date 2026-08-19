import { join, resolve, sep } from "node:path";
import { BrowserWindow, ipcMain, shell } from "electron";
import type { DocumentRow, OcrStatus } from "../shared/document";
import { getLibrary, listLibraryRoots } from "./db";
import { retryOcr } from "./ocr";

const EMIT_MS = 200;
let emitTimer: ReturnType<typeof setTimeout> | null = null;

function nameOf(path: string): string {
    const i = path.lastIndexOf("/");
    return i === -1 ? path : path.slice(i + 1);
}

function rowOf(
    root: string,
    r: { path: string; ocr_status: string; ocr_error: string | null },
): DocumentRow {
    return {
        root,
        path: r.path,
        name: nameOf(r.path),
        ocrStatus: r.ocr_status as OcrStatus,
        ocrError: r.ocr_error,
    };
}

export function listDocuments(): DocumentRow[] {
    const out: DocumentRow[] = [];
    for (const root of listLibraryRoots()) {
        const db = getLibrary(root);
        if (!db) continue;
        const rows = db
            .prepare(
                "SELECT path, ocr_status, ocr_error FROM documents ORDER BY path COLLATE NOCASE",
            )
            .all() as {
            path: string;
            ocr_status: string;
            ocr_error: string | null;
        }[];
        for (const r of rows) out.push(rowOf(root, r));
    }
    return out;
}

/** Turn free text into a safe FTS5 MATCH query (AND of prefix tokens). */
export function ftsQuery(raw: string): string | null {
    const tokens = raw
        .trim()
        .split(/[^\p{L}\p{N}_./-]+/u)
        .map((t) => t.replace(/"/g, "").trim())
        .filter((t) => t.length > 0);
    if (tokens.length === 0) return null;
    return tokens.map((t) => `"${t}"*`).join(" AND ");
}

export function searchDocuments(q: string): DocumentRow[] {
    const match = ftsQuery(q);
    if (!match) return listDocuments();

    const out: DocumentRow[] = [];
    for (const root of listLibraryRoots()) {
        const db = getLibrary(root);
        if (!db) continue;
        try {
            const rows = db
                .prepare(
                    `SELECT d.path, d.ocr_status, d.ocr_error
           FROM documents_fts f
           JOIN documents d ON d.rowid = f.rowid
           WHERE documents_fts MATCH ?
           ORDER BY bm25(documents_fts)`,
                )
                .all(match) as {
                path: string;
                ocr_status: string;
                ocr_error: string | null;
            }[];
            for (const r of rows) out.push(rowOf(root, r));
        } catch {
            // bad MATCH / missing FTS — skip this root
        }
    }
    return out;
}

export async function openDocument(
    root: string,
    path: string,
): Promise<boolean> {
    if (!listLibraryRoots().includes(root)) return false;
    if (!path || path.startsWith("/") || path.includes("\0")) return false;
    const parts = path.split("/");
    if (parts.some((p) => p === ".." || p === "")) return false;

    const abs = resolve(join(root, ...parts));
    const rootResolved = resolve(root);
    if (abs !== rootResolved && !abs.startsWith(rootResolved + sep)) {
        return false;
    }

    const err = await shell.openPath(abs);
    return err === "";
}

export function notifyDocumentsChanged(): void {
    if (emitTimer) clearTimeout(emitTimer);
    emitTimer = setTimeout(() => {
        emitTimer = null;
        for (const w of BrowserWindow.getAllWindows()) {
            w.webContents.send("documents:changed");
        }
    }, EMIT_MS);
}

export function registerDocumentsIpc(): void {
    ipcMain.handle("documents:list", () => listDocuments());
    ipcMain.handle("documents:search", (_, q: string) =>
        searchDocuments(typeof q === "string" ? q : ""),
    );
    ipcMain.handle("documents:open", (_, p: { root: string; path: string }) =>
        openDocument(p?.root ?? "", p?.path ?? ""),
    );
    ipcMain.handle("documents:retry", (_, p: { root: string; path: string }) =>
        retryOcr(p.root, p.path),
    );
}
