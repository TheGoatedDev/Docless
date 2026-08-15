import { create } from "zustand";

export type OllamaProgress =
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

type State = {
    ready: boolean;
    busy: boolean;
    running: boolean;
    modelPresent: boolean;
    owned: boolean;
    phase: "idle" | "runtime" | "model";
    status: string;
    percent: number | null;
    message: string;
    error: string | null;
    hydrate: () => Promise<void>;
    ensureRuntime: () => Promise<void>;
    ensureModel: () => Promise<void>;
    reinstall: () => Promise<void>;
};

let listening = false;

export const useOllama = create<State>((set, get) => ({
    ready: false,
    busy: false,
    running: false,
    modelPresent: false,
    owned: false,
    phase: "idle",
    status: "idle",
    percent: null,
    message: "",
    error: null,

    hydrate: async () => {
        if (!listening) {
            listening = true;
            window.api.ollama.onProgress((e) => {
                const done = e.status === "ready" || e.status === "error";
                set({
                    phase: e.phase,
                    status: e.status,
                    percent: e.percent ?? get().percent,
                    message: e.message ?? "",
                    error: e.status === "error" ? (e.message ?? "error") : null,
                    // ponytail: terminal progress unblocks UI; runOp also clears busy
                    ...(done ? { busy: false } : {}),
                    ...(e.phase === "runtime" && e.status === "ready"
                        ? { running: true }
                        : {}),
                    ...(e.phase === "model" && e.status === "ready"
                        ? { modelPresent: true, ready: true }
                        : {}),
                });
            });
        }
        const s = await window.api.ollama.status();
        // ponytail: never overwrite busy from status — stale hydrate races runOp
        set({
            running: s.running,
            modelPresent: s.modelPresent,
            owned: s.owned,
            ready: s.running && s.modelPresent,
        });
    },

    ensureRuntime: async () => {
        await runOp(() => window.api.ollama.ensureRuntime(), set);
    },

    ensureModel: async () => {
        await runOp(() => window.api.ollama.ensureModel(), set);
    },

    reinstall: async () => {
        await runOp(() => window.api.ollama.reinstall(), set);
    },
}));

async function runOp(
    op: () => Promise<unknown>,
    set: (partial: Partial<State>) => void,
): Promise<void> {
    set({ busy: true, error: null });
    try {
        await op();
        const s = await window.api.ollama.status();
        set({
            running: s.running,
            modelPresent: s.modelPresent,
            owned: s.owned,
            busy: false,
            ready: s.running && s.modelPresent,
        });
    } catch (e) {
        set({
            busy: false,
            ready: false,
            error: e instanceof Error ? e.message : String(e),
            status: "error",
        });
    }
}
