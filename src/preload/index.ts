import { electronAPI } from "@electron-toolkit/preload";
import { contextBridge, ipcRenderer } from "electron";

const api = {
    settings: {
        get: (): Promise<Record<string, unknown>> =>
            ipcRenderer.invoke("settings:get"),
        set: (
            data: Record<string, unknown>,
        ): Promise<Record<string, unknown>> =>
            ipcRenderer.invoke("settings:set", data),
    },
};

if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld("electron", electronAPI);
        contextBridge.exposeInMainWorld("api", api);
    } catch (error) {
        console.error(error);
    }
} else {
    // @ts-expect-error contextIsolation false
    window.electron = electronAPI;
    // @ts-expect-error contextIsolation false
    window.api = api;
}
