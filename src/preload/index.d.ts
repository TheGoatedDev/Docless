import type { ElectronAPI } from "@electron-toolkit/preload";

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
                ensure: () => Promise<{ ready: true }>;
                reinstall: () => Promise<{ ready: true }>;
                status: () => Promise<{
                    running: boolean;
                    modelPresent: boolean;
                    owned: boolean;
                    busy: boolean;
                }>;
                onProgress: (cb: (e: OllamaProgress) => void) => () => void;
            };
        };
    }
}
