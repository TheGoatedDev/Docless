import {
    copyFileSync,
    existsSync,
    mkdirSync,
    readdirSync,
    renameSync,
    unlinkSync,
    writeFileSync,
} from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import { logger as rootLogger } from "../logger";
import { notifyMain } from "../notify";

const logger = rootLogger.child({ mod: "db" });

export const APP_SCHEMA_VERSION = 3;

const pools = new Map<string, Database.Database>();

type Step = (db: Database.Database) => void;

const steps: Step[] = [
    // v0 → v1
    (db) => {
        db.exec(`
      CREATE TABLE documents (
        path TEXT PRIMARY KEY NOT NULL,
        mtime_ms INTEGER NOT NULL,
        size INTEGER NOT NULL,
        content_hash TEXT,
        ocr_status TEXT NOT NULL,
        ocr_error TEXT,
        text TEXT,
        created_at_ms INTEGER NOT NULL,
        updated_at_ms INTEGER NOT NULL
      );
    `);
    },
    // v1 → v2: FTS5 over path + OCR text
    (db) => {
        db.exec(`
      CREATE VIRTUAL TABLE documents_fts USING fts5(
        path,
        text,
        content='documents',
        content_rowid='rowid'
      );
      CREATE TRIGGER documents_ai AFTER INSERT ON documents BEGIN
        INSERT INTO documents_fts(rowid, path, text)
        VALUES (new.rowid, new.path, ifnull(new.text, ''));
      END;
      CREATE TRIGGER documents_ad AFTER DELETE ON documents BEGIN
        INSERT INTO documents_fts(documents_fts, rowid, path, text)
        VALUES ('delete', old.rowid, old.path, ifnull(old.text, ''));
      END;
      CREATE TRIGGER documents_au AFTER UPDATE ON documents BEGIN
        INSERT INTO documents_fts(documents_fts, rowid, path, text)
        VALUES ('delete', old.rowid, old.path, ifnull(old.text, ''));
        INSERT INTO documents_fts(rowid, path, text)
        VALUES (new.rowid, new.path, ifnull(new.text, ''));
      END;
      INSERT INTO documents_fts(rowid, path, text)
        SELECT rowid, path, ifnull(text, '') FROM documents;
    `);
    },
    // v2 → v3: once-per-doc auto-rename flag
    (db) => {
        db.exec(
            `ALTER TABLE documents ADD COLUMN auto_renamed INTEGER NOT NULL DEFAULT 0`,
        );
    },
];

function doclessDir(root: string): string {
    return join(root, ".docless");
}

function dbPath(root: string): string {
    return join(doclessDir(root), "docless.sqlite");
}

function ensureGitignore(dir: string): void {
    writeFileSync(join(dir, ".gitignore"), "*\n");
}

function userVersion(db: Database.Database): number {
    return (db.pragma("user_version", { simple: true }) as number) ?? 0;
}

function setUserVersion(db: Database.Database, v: number): void {
    db.pragma(`user_version = ${v}`);
}

function pruneBackups(dir: string): void {
    const baks = readdirSync(dir)
        .filter((f) => /^docless\.sqlite\.bak-v\d+$/.test(f))
        .sort()
        .reverse();
    for (const f of baks.slice(2)) {
        try {
            unlinkSync(join(dir, f));
        } catch {
            /* ignore */
        }
    }
}

function migrate(db: Database.Database, file: string, dir: string): void {
    let v = userVersion(db);
    if (v > APP_SCHEMA_VERSION) {
        throw new NewerSchemaError(v);
    }
    while (v < APP_SCHEMA_VERSION) {
        const step = steps[v];
        if (!step) throw new Error(`missing migrate step for v${v}`);
        copyFileSync(file, join(dir, `docless.sqlite.bak-v${v}`));
        pruneBackups(dir);
        const txn = db.transaction(() => {
            step(db);
            setUserVersion(db, v + 1);
        });
        txn();
        v += 1;
        logger.info({ file, version: v }, "migrated sidecar db");
    }
}

export class NewerSchemaError extends Error {
    constructor(readonly found: number) {
        super(`sidecar schema v${found} newer than app v${APP_SCHEMA_VERSION}`);
        this.name = "NewerSchemaError";
    }
}

function quarantine(file: string): string {
    const dest = `${file}.corrupt-${Date.now()}`;
    renameSync(file, dest);
    return dest;
}

function openFresh(file: string, dir: string): Database.Database {
    const db = new Database(file);
    db.pragma("journal_mode = WAL");
    migrate(db, file, dir);
    return db;
}

/** Open (or return cached) library DB for a watch root. null if refused (newer schema). */
export function openLibrary(root: string): Database.Database | null {
    const cached = pools.get(root);
    if (cached) return cached;

    const dir = doclessDir(root);
    mkdirSync(dir, { recursive: true });
    ensureGitignore(dir);
    const file = dbPath(root);

    try {
        if (existsSync(file)) {
            let db: Database.Database;
            try {
                db = new Database(file);
                db.pragma("journal_mode = WAL");
            } catch (err) {
                logger.error({ root, err }, "sidecar db unreadable");
                quarantine(file);
                notifyMain({
                    title: "Docless library reset",
                    body: `Could not read library under ${root}. A backup was kept; a fresh library was created.`,
                });
                db = openFresh(file, dir);
                pools.set(root, db);
                return db;
            }

            try {
                migrate(db, file, dir);
            } catch (err) {
                if (err instanceof NewerSchemaError) {
                    db.close();
                    notifyMain({
                        title: "Update Docless",
                        body: `Library under ${root} was written by a newer Docless (schema v${err.found}). Update the app to open it.`,
                    });
                    logger.warn(
                        { root, found: err.found },
                        "refused newer sidecar schema",
                    );
                    return null;
                }
                // migrate blew up mid-flight — quarantine and start clean
                try {
                    db.close();
                } catch {
                    /* ignore */
                }
                logger.error({ root, err }, "sidecar migrate failed");
                if (existsSync(file)) quarantine(file);
                notifyMain({
                    title: "Docless library reset",
                    body: `Library under ${root} was corrupt. A backup was kept; a fresh library was created.`,
                });
                const fresh = openFresh(file, dir);
                pools.set(root, fresh);
                return fresh;
            }

            pools.set(root, db);
            return db;
        }

        const db = openFresh(file, dir);
        pools.set(root, db);
        return db;
    } catch (err) {
        logger.error({ root, err }, "openLibrary failed");
        return null;
    }
}

export function getLibrary(root: string): Database.Database | null {
    return pools.get(root) ?? null;
}

export function listLibraryRoots(): string[] {
    return [...pools.keys()];
}

function checkpoint(db: Database.Database): void {
    try {
        db.pragma("wal_checkpoint(TRUNCATE)");
    } catch (err) {
        logger.warn({ err }, "wal checkpoint failed");
    }
}

export function closeLibrary(root: string): void {
    const db = pools.get(root);
    if (!db) return;
    pools.delete(root);
    checkpoint(db);
    db.close();
}

export function closeAllLibraries(): void {
    for (const root of [...pools.keys()]) closeLibrary(root);
}
