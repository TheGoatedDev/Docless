import { create } from "zustand";

export type Settings = Record<string, unknown>;

type State = {
    ready: boolean;
    settings: Settings;
    hydrate: () => Promise<void>;
    setSettings: (patch: Partial<Settings>) => Promise<void>;
};

export const useSettings = create<State>((set, get) => ({
    ready: false,
    settings: {},
    hydrate: async () => {
        const settings = await window.api.settings.get();
        set({ settings, ready: true });
    },
    setSettings: async (patch) => {
        const next = { ...get().settings, ...patch };
        set({ settings: next });
        await window.api.settings.set(next);
    },
}));
