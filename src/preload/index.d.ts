import type { ElectronAPI } from "@electron-toolkit/preload";

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
        };
    }
}
