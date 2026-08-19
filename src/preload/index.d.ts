import type { ElectronAPI } from "@electron-toolkit/preload";
import type { DocumentDetail, DocumentRow } from "../shared/document";
import type { OllamaProgress } from "../shared/ollama";

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
            documents: {
                list: () => Promise<DocumentRow[]>;
                search: (q: string) => Promise<DocumentRow[]>;
                get: (p: {
                    root: string;
                    path: string;
                }) => Promise<DocumentDetail | null>;
                open: (p: { root: string; path: string }) => Promise<boolean>;
                retry: (p: { root: string; path: string }) => Promise<boolean>;
                onChange: (cb: () => void) => () => void;
            };
        };
    }
}
