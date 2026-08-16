import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { is } from "@electron-toolkit/utils";
import { app, ipcMain } from "electron";
import pino, { type Logger, multistream } from "pino";

const require = createRequire(import.meta.url);
const dir = join(app.getPath("userData"), "logs");
mkdirSync(dir, { recursive: true });

const file = pino.destination({
    dest: join(dir, "app.log"),
    mkdir: true,
});

const streams: pino.StreamEntry[] = [{ stream: file }];
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
    streams.length === 1 ? file : multistream(streams),
);

export function registerLogIpc(): void {
    ipcMain.on("log:write", (_e, payload: unknown) => {
        if (payload === null || typeof payload !== "object") return;
        const p = payload as { level?: unknown; msg?: unknown; data?: unknown };
        const level =
            p.level === "debug" ||
            p.level === "info" ||
            p.level === "warn" ||
            p.level === "error" ||
            p.level === "fatal"
                ? p.level
                : "info";
        const msg = typeof p.msg === "string" ? p.msg : String(p.msg ?? "");
        const data =
            p.data !== null &&
            typeof p.data === "object" &&
            !Array.isArray(p.data)
                ? (p.data as Record<string, unknown>)
                : {};
        logger[level]({ src: "renderer", ...data }, msg);
    });
}
