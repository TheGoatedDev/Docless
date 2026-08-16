import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { is } from "@electron-toolkit/utils";
import { app, ipcMain } from "electron";
import pino, { type Logger, multistream } from "pino";
import { createStream } from "rotating-file-stream";

const require = createRequire(import.meta.url);

const LEVELS = ["debug", "info", "warn", "error", "fatal"] as const;
type Level = (typeof LEVELS)[number];

const dir = join(app.getPath("userData"), "logs");
mkdirSync(dir, { recursive: true });

const roll = { size: "10M", interval: "1d" as const, path: dir };

const streams: pino.StreamEntry[] = [
    {
        level: "info",
        stream: createStream("app.log", { ...roll, maxFiles: 7 }),
    },
    {
        level: "error",
        stream: createStream("error.log", { ...roll, maxFiles: 14 }),
    },
];

if (is.dev) {
    // ponytail: sync require — CJS main can't top-level-await pino-pretty
    const pretty = require("pino-pretty") as typeof import("pino-pretty");
    streams.push({
        level: "debug",
        stream: pretty({ colorize: true, destination: 1 }),
    });
}

export const logger: Logger = pino(
    { level: is.dev ? "debug" : "info" },
    multistream(streams),
);

function isLevel(v: unknown): v is Level {
    return typeof v === "string" && (LEVELS as readonly string[]).includes(v);
}

export function registerLogIpc(): void {
    ipcMain.on("log:write", (_e, payload: unknown) => {
        if (payload === null || typeof payload !== "object") return;
        const p = payload as { level?: unknown; msg?: unknown; data?: unknown };
        const level: Level = isLevel(p.level) ? p.level : "info";
        const msg = typeof p.msg === "string" ? p.msg : String(p.msg ?? "");
        const data =
            p.data !== null &&
            typeof p.data === "object" &&
            !Array.isArray(p.data)
                ? (p.data as Record<string, unknown>)
                : undefined;
        if (data) logger[level]({ src: "renderer", ...data }, msg);
        else logger[level]({ src: "renderer" }, msg);
    });
}
