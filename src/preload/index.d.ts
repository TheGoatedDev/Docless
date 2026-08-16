import type { ElectronAPI } from "@electron-toolkit/preload";
import type { OllamaProgress } from "./ollama-progress";

declare global {
    interface Window {
        electron: ElectronAPI;
        api: {
            windowRole: "main" | "compact";
            logger: {
                write: (
                    level: "debug" | "info" | "warn" | "error" | "fatal",
                    msg: string,
                    data?: Record<string, unknown>,
                ) => void;
            };
            settings: {
                get: () => Promise<{ watchPaths: string[] }>;
                set: (data: {
                    watchPaths: string[];
                }) => Promise<{ watchPaths: string[] }>;
            };
            ollama: {
                ensureRuntime: () => Promise<{ ok: true }>;
                ensureModel: () => Promise<{ ok: true }>;
                reinstall: () => Promise<{ ok: true }>;
                status: () => Promise<{
                    running: boolean;
                    modelPresent: boolean;
                    owned: boolean;
                    busy: boolean;
                    installed: boolean;
                    version: string | null;
                }>;
                onProgress: (cb: (e: OllamaProgress) => void) => () => void;
            };
            notify: {
                show: (p: { title: string; body?: string }) => Promise<boolean>;
            };
            dialog: {
                openDirectory: () => Promise<string | null>;
            };
        };
    }
}
