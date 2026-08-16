import { join } from "node:path";
import { is } from "@electron-toolkit/utils";
import { app, ipcMain } from "electron";
import pino, { type Logger, multistream } from "pino";
import build from "pino-roll";

const LEVELS = ["debug", "info", "warn", "error", "fatal"] as const;
type Level = (typeof LEVELS)[number];

let root: Logger = pino({ level: "silent" });

function wrap(bindings?: pino.Bindings): Logger {
    return new Proxy({} as Logger, {
        get(_t, prop) {
            if (prop === "child") {
                return (more: pino.Bindings) => wrap({ ...bindings, ...more });
            }
            const target = bindings ? root.child(bindings) : root;
            const v = Reflect.get(target, prop, target);
            return typeof v === "function"
                ? (v as (...a: unknown[]) => unknown).bind(target)
                : v;
        },
    });
}

// stable export — .child() at module load stays live after initLogger
export const logger: Logger = wrap();

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

    root = pino({ level: is.dev ? "debug" : "info" }, multistream(streams));
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
