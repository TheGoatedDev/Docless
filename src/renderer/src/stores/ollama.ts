import { create } from "zustand";

export type OllamaProgress =
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

type State = {
    ready: boolean;
    busy: boolean;
    running: boolean;
    modelPresent: boolean;
    owned: boolean;
    installed: boolean;
    version: string | null;
    phase: "idle" | "runtime" | "model";
    status: string;
    percent: number | null;
    message: string;
    error: string | null;
    hydrate: () => Promise<void>;
    /** Start runtime + model when binary already present; no-op if ready */
    boot: () => Promise<void>;
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
    installed: false,
    version: null,
    phase: "idle",
    status: "idle",
    percent: null,
    message: "",
    error: null,

    hydrate: async () => {
        if (!listening) {
            listening = true;
            window.api.ollama.onProgress((e) => {
                const cur = get();
                // ignore chatter once healthy and not in an op
                if (cur.ready && !cur.busy && e.status !== "error") return;
                const done = e.status === "ready" || e.status === "error";
                set({
                    phase: e.phase,
                    status: e.status,
                    percent: e.percent ?? cur.percent,
                    message: e.message ?? "",
                    error: e.status === "error" ? (e.message ?? "error") : null,
                    // ponytail: terminal progress unblocks UI; runOp also clears busy
                    ...(done ? { busy: false } : {}),
                    ...(e.phase === "runtime" && e.status === "ready"
                        ? {
                              running: true,
                              ...(e.version ? { version: e.version } : {}),
                          }
                        : {}),
                    ...(e.phase === "model" && e.status === "ready"
                        ? { modelPresent: true, ready: true }
                        : {}),
                });
            });
        }
        const s = await window.api.ollama.status();
        // ponytail: never overwrite busy from status — stale hydrate races runOp
        const healthy = s.running && s.modelPresent;
        set({
            running: s.running,
            modelPresent: s.modelPresent,
            owned: s.owned,
            installed: s.installed,
            version: s.version,
            ready: healthy,
            ...(!get().busy && healthy
                ? {
                      phase: "idle" as const,
                      status: "idle",
                      message: "",
                      percent: null,
                  }
                : {}),
        });
    },

    boot: async () => {
        await get().hydrate();
        const { ready, installed, running } = get();
        if (ready || !installed) return;
        // ponytail: binary on disk — start quietly, setup only for first install
        if (!running) await get().ensureRuntime();
        if (!get().ready) await get().ensureModel();
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
        const healthy = s.running && s.modelPresent;
        set({
            running: s.running,
            modelPresent: s.modelPresent,
            owned: s.owned,
            installed: s.installed,
            version: s.version,
            busy: false,
            ready: healthy,
            phase: "idle",
            status: "idle",
            message: "",
            percent: null,
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
