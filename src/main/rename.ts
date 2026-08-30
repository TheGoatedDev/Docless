import { existsSync, renameSync } from "node:fs";
import { join, posix } from "node:path";
import { getLibrary } from "./db";
import { notifyDocumentsChanged } from "./documents";
import { ignorePath } from "./ignore";
import { logger as rootLogger } from "./logger";
import { nameGenerate } from "./ollama";
import { loadSettings } from "./settings";
import { pickDest, slugStem } from "./slug";

const logger = rootLogger.child({ mod: "rename" });

export async function maybeRenameAfterOcr(
    root: string,
    path: string,
    text: string,
): Promise<void> {
    if (!loadSettings().autoRename) return;
    const db = getLibrary(root);
    if (!db) return;
    const row = db
        .prepare("SELECT auto_renamed FROM documents WHERE path = ?")
        .get(path) as { auto_renamed: number } | undefined;
    if (!row || row.auto_renamed) return;
    if (!text.trim()) return;

    let raw: string;
    try {
        raw = await nameGenerate(text);
    } catch (err) {
        logger.warn({ root, path, err }, "name generate failed");
        return;
    }
    const stem = slugStem(raw);
    if (!stem) return;

    const ext = posix.extname(path);
    const dir = posix.dirname(path);
    const dest = pickDest(
        dir,
        stem,
        ext,
        (rel) => rel !== path && existsSync(join(root, rel)),
    );
    if (!dest) return;

    const now = Date.now();
    if (dest === path) {
        db.prepare(
            "UPDATE documents SET auto_renamed = 1, updated_at_ms = ? WHERE path = ?",
        ).run(now, path);
        return;
    }

    const srcAbs = join(root, path);
    const destAbs = join(root, dest);
    ignorePath(root, srcAbs);
    ignorePath(root, destAbs);

    try {
        db.prepare(
            "UPDATE documents SET path = ?, auto_renamed = 1, updated_at_ms = ? WHERE path = ?",
        ).run(dest, now, path);
    } catch (err) {
        logger.warn({ root, path, dest, err }, "path update failed");
        return;
    }
    try {
        renameSync(srcAbs, destAbs);
    } catch (err) {
        logger.warn({ root, path, dest, err }, "fs rename failed");
        try {
            db.prepare(
                "UPDATE documents SET path = ?, updated_at_ms = ? WHERE path = ?",
            ).run(path, Date.now(), dest);
        } catch (e2) {
            logger.error({ root, path, dest, err: e2 }, "path rollback failed");
        }
        return;
    }
    logger.info({ root, from: path, to: dest }, "renamed");
    notifyDocumentsChanged();
}
