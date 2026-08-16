import chokidar, { type FSWatcher } from "chokidar";
import { closeLibrary, openLibrary } from "./db";
import { logger as rootLogger } from "./logger";

const logger = rootLogger.child({ mod: "watch" });
const watchers = new Map<string, FSWatcher>();

function ensureDocless(root: string): void {
    try {
        openLibrary(root);
    } catch (err) {
        logger.error({ root, err }, ".docless open failed");
    }
}

function start(root: string): void {
    if (watchers.has(root)) return;
    ensureDocless(root);
    const w = chokidar.watch(root, {
        ignoreInitial: true,
        ignored: [
            /(^|[/\\])\.docless([/\\]|$)/,
            /(^|[/\\])\.git([/\\]|$)/,
            /(^|[/\\])node_modules([/\\]|$)/,
        ],
    });
    for (const ev of [
        "add",
        "change",
        "unlink",
        "addDir",
        "unlinkDir",
    ] as const) {
        w.on(ev, (path) => logger.info({ ev, path }, "fs event"));
    }
    w.on("error", (err) => logger.error({ root, err }, "watcher error"));
    watchers.set(root, w);
    logger.info({ root }, "watch path added");
}

async function stop(root: string): Promise<void> {
    const w = watchers.get(root);
    if (!w) return;
    watchers.delete(root);
    closeLibrary(root);
    await w.close();
    logger.info({ root }, "watch path removed");
}

export function syncWatchPaths(paths: string[]): void {
    const want = new Set(paths);
    for (const root of watchers.keys()) {
        if (!want.has(root)) void stop(root);
    }
    for (const root of paths) start(root);
    logger.debug({ paths, active: [...watchers.keys()] }, "watch paths synced");
}

export async function stopAllWatchers(): Promise<void> {
    await Promise.all([...watchers.keys()].map(stop));
}
