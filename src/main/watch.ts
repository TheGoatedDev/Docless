import { mkdirSync } from "node:fs";
import { join } from "node:path";
import chokidar, { type FSWatcher } from "chokidar";

const watchers = new Map<string, FSWatcher>();

function ensureDocless(root: string): void {
    try {
        mkdirSync(join(root, ".docless"), { recursive: true });
    } catch (err) {
        console.error("[watch] .docless mkdir failed", root, err);
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
        w.on(ev, (path) => console.log("[watch]", ev, path));
    }
    w.on("error", (err) => console.error("[watch] error", root, err));
    watchers.set(root, w);
}

async function stop(root: string): Promise<void> {
    const w = watchers.get(root);
    if (!w) return;
    watchers.delete(root);
    await w.close();
}

export function syncWatchPaths(paths: string[]): void {
    const want = new Set(paths);
    for (const root of watchers.keys()) {
        if (!want.has(root)) void stop(root);
    }
    for (const root of paths) start(root);
}

export async function stopAllWatchers(): Promise<void> {
    await Promise.all([...watchers.keys()].map(stop));
}
