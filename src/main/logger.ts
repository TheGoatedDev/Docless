import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { is } from "@electron-toolkit/utils";
import { app, ipcMain } from "electron";
import pino, { type Logger, multistream } from "pino";

const require = createRequire(import.meta.url);

const dir = join(app.getPath("userData"), "logs");
mkdirSync(dir, { recursive: true });

const streams: pino.StreamEntry[] = [
    { stream: pino.destination({ dest: join(dir, "app.log"), mkdir: true }) },
];

if (is.dev) {
    // ponytail: sync require — CJS main can't top-level-await pino-pretty
    const pretty = require("pino-pretty") as typeof import("pino-pretty");
    streams.push({ stream: pretty({ colorize: true, destination: 1 }) });
}

export const logger: Logger = pino(
    { level: is.dev ? "debug" : "info" },
    multistream(streams),
);

const levels = new Set(["debug", "info", "warn", "error", "fatal"]);

export function registerLogIpc(): void {
    ipcMain.on(
        "log:write",
        (_e, p: { level?: string; msg?: string; data?: object }) => {
            const level = levels.has(p?.level ?? "")
                ? (p.level as pino.Level)
                : "info";
            const msg = typeof p?.msg === "string" ? p.msg : "";
            if (p?.data && typeof p.data === "object")
                logger[level]({ src: "renderer", ...p.data }, msg);
            else logger[level]({ src: "renderer" }, msg);
        },
    );
}
