import { electronAPI } from "@electron-toolkit/preload";
import { contextBridge, ipcRenderer } from "electron";

type OllamaProgress =
    | {
          phase: "runtime";
          status: "checking" | "downloading" | "starting" | "ready" | "error";
          percent?: number;
          message?: string;
      }
    | {
          phase: "model";
          status: "checking" | "pulling" | "ready" | "error";
          percent?: number;
          message?: string;
          completed?: number;
          total?: number;
      };

const api = {
    settings: {
        get: (): Promise<Record<string, unknown>> =>
            ipcRenderer.invoke("settings:get"),
        set: (
            data: Record<string, unknown>,
        ): Promise<Record<string, unknown>> =>
            ipcRenderer.invoke("settings:set", data),
    },
    ollama: {
        ensure: (): Promise<{ ready: true }> =>
            ipcRenderer.invoke("ollama:ensure"),
        reinstall: (): Promise<{ ready: true }> =>
            ipcRenderer.invoke("ollama:reinstall"),
        status: (): Promise<{
            running: boolean;
            modelPresent: boolean;
            owned: boolean;
            busy: boolean;
        }> => ipcRenderer.invoke("ollama:status"),
        onProgress: (cb: (e: OllamaProgress) => void): (() => void) => {
            const handler = (_: Electron.IpcRendererEvent, e: OllamaProgress) =>
                cb(e);
            ipcRenderer.on("ollama:progress", handler);
            return () => {
                ipcRenderer.removeListener("ollama:progress", handler);
            };
        },
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
