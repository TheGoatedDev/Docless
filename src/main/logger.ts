import { join } from "node:path";
import { is } from "@electron-toolkit/utils";
import { app, ipcMain } from "electron";
import pino, { type Logger, multistream } from "pino";
import build from "pino-roll";

const LEVELS = ["debug", "info", "warn", "error", "fatal"] as const;
type Level = (typeof LEVELS)[number];

// reassigned in initLogger — ESM live binding; don't cache .child() before init
export let log: Logger = pino({ level: "silent" });

function isLevel(v: unknown): v is Level {
    return typeof v === "string" && (LEVELS as readonly string[]).includes(v);
}

export async function initLogger(): Promise<void> {
    const dir = join(app.getPath("userData"), "logs");
    const roll = {
        frequency: "daily" as const,
        size: "10m",
        mkdir: true,
        dateFormat: "yyyy-MM-dd",
    };

    const appFile = await build({
        ...roll,
        file: join(dir, "app"),
        limit: { count: 7 },
    });
    const errFile = await build({
        ...roll,
        file: join(dir, "error"),
        limit: { count: 14 },
    });

    const streams: pino.StreamEntry[] = [
        { level: "info", stream: appFile },
        { level: "error", stream: errFile },
    ];

    if (is.dev) {
        const pretty = (await import("pino-pretty")).default;
        streams.push({
            level: "debug",
            stream: pretty({ colorize: true, destination: 1 }),
        });
    }

    log = pino({ level: is.dev ? "debug" : "info" }, multistream(streams));
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
        if (data) log[level]({ src: "renderer", ...data }, msg);
        else log[level]({ src: "renderer" }, msg);
    });
}
