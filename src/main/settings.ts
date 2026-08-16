import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { app, dialog, ipcMain } from "electron";

export type Settings = {
    watchPaths: string[];
};

const defaults: Settings = { watchPaths: [] };

const file = (): string => join(app.getPath("userData"), "settings.json");

function withDefaults(base: unknown, over: unknown): unknown {
    if (Array.isArray(base)) return Array.isArray(over) ? over : base;
    if (base !== null && typeof base === "object") {
        const b = base as Record<string, unknown>;
        const o =
            over !== null && typeof over === "object" && !Array.isArray(over)
                ? (over as Record<string, unknown>)
                : {};
        const out: Record<string, unknown> = {};
        for (const k of Object.keys(b)) {
            out[k] = withDefaults(b[k], o[k]);
        }
        return out;
    }
    return over === undefined ? base : over;
}

export function loadSettings(): Settings {
    try {
        const raw = existsSync(file())
            ? JSON.parse(readFileSync(file(), "utf8"))
            : null;
        return withDefaults(defaults, raw) as Settings;
    } catch {
        return withDefaults(defaults, null) as Settings;
    }
}

export function saveSettings(data: Settings): Settings {
    const next = withDefaults(defaults, data) as Settings;
    writeFileSync(file(), JSON.stringify(next, null, 2));
    return next;
}

export function registerSettingsIpc(): void {
    ipcMain.handle("settings:get", () => loadSettings());
    ipcMain.handle("settings:set", (_, data: Settings) => saveSettings(data));
    ipcMain.handle("dialog:openDirectory", async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ["openDirectory"],
        });
        return canceled ? null : (filePaths[0] ?? null);
    });
}
