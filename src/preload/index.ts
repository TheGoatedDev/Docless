import { electronAPI } from "@electron-toolkit/preload";
import { contextBridge, ipcRenderer } from "electron";

type OllamaProgress =
    | {
          phase: "runtime";
          status: "checking" | "downloading" | "starting" | "ready" | "error";
          percent?: number;
          message?: string;
          version?: string;
      }
    | {
          phase: "model";
          status: "checking" | "pulling" | "ready" | "error";
          percent?: number;
          message?: string;
          completed?: number;
          total?: number;
      };

const windowRole = process.argv.some((a) => a === "--docless-window=compact")
    ? ("compact" as const)
    : ("main" as const);

const api = {
    windowRole,
    log: {
        write: (
            level: "debug" | "info" | "warn" | "error" | "fatal",
            msg: string,
            data?: Record<string, unknown>,
        ): void => {
            ipcRenderer.send("log:write", { level, msg, data });
        },
    },
    settings: {
        get: (): Promise<{ watchPaths: string[] }> =>
            ipcRenderer.invoke("settings:get"),
        set: (data: {
            watchPaths: string[];
        }): Promise<{ watchPaths: string[] }> =>
            ipcRenderer.invoke("settings:set", data),
    },
    ollama: {
        ensureRuntime: (): Promise<{ ok: true }> =>
            ipcRenderer.invoke("ollama:ensure-runtime"),
        ensureModel: (): Promise<{ ok: true }> =>
            ipcRenderer.invoke("ollama:ensure-model"),
        reinstall: (): Promise<{ ok: true }> =>
            ipcRenderer.invoke("ollama:reinstall"),
        status: (): Promise<{
            running: boolean;
            modelPresent: boolean;
            owned: boolean;
            busy: boolean;
            installed: boolean;
            version: string | null;
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
    notify: {
        show: (p: { title: string; body?: string }): Promise<boolean> =>
            ipcRenderer.invoke("notify:show", p),
    },
    dialog: {
        openDirectory: (): Promise<string | null> =>
            ipcRenderer.invoke("dialog:openDirectory"),
    },
};

if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld("electron", electronAPI);
        contextBridge.exposeInMainWorld("api", api);
    } catch (error) {
        ipcRenderer.send("log:write", {
            level: "error",
            msg: error instanceof Error ? error.message : String(error),
            data:
                error instanceof Error
                    ? { stack: error.stack, src: "preload" }
                    : { src: "preload" },
        });
    }
} else {
    // @ts-expect-error contextIsolation false
    window.electron = electronAPI;
    // @ts-expect-error contextIsolation false
    window.api = api;
}
