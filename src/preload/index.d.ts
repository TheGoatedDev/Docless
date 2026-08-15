import type { ElectronAPI } from "@electron-toolkit/preload";

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

declare global {
    interface Window {
        electron: ElectronAPI;
        api: {
            settings: {
                get: () => Promise<Record<string, unknown>>;
                set: (
                    data: Record<string, unknown>,
                ) => Promise<Record<string, unknown>>;
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
        };
    }
}
