import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { app, ipcMain } from "electron";

export type Settings = Record<string, unknown>;

const defaults: Settings = {};

const file = (): string => join(app.getPath("userData"), "settings.json");

export function loadSettings(): Settings {
    try {
        if (!existsSync(file())) return { ...defaults };
        return { ...defaults, ...JSON.parse(readFileSync(file(), "utf8")) };
    } catch {
        return { ...defaults };
    }
}

export function saveSettings(data: Settings): Settings {
    writeFileSync(file(), JSON.stringify(data, null, 2));
    return data;
}

export function registerSettingsIpc(): void {
    ipcMain.handle("settings:get", () => loadSettings());
    ipcMain.handle("settings:set", (_, data: Settings) => saveSettings(data));
}
