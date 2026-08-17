import { BrowserWindow, ipcMain } from "electron";
import type { DocumentRow, OcrStatus } from "../shared/document";
import { getLibrary, listLibraryRoots } from "./db";

const EMIT_MS = 200;
let emitTimer: ReturnType<typeof setTimeout> | null = null;

function nameOf(path: string): string {
    const i = path.lastIndexOf("/");
    return i === -1 ? path : path.slice(i + 1);
}

export function listDocuments(): DocumentRow[] {
    const out: DocumentRow[] = [];
    for (const root of listLibraryRoots()) {
        const db = getLibrary(root);
        if (!db) continue;
        const rows = db
            .prepare(
                "SELECT path, ocr_status FROM documents ORDER BY path COLLATE NOCASE",
            )
            .all() as { path: string; ocr_status: string }[];
        for (const r of rows) {
            out.push({
                root,
                path: r.path,
                name: nameOf(r.path),
                ocrStatus: r.ocr_status as OcrStatus,
            });
        }
    }
    return out;
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
}
