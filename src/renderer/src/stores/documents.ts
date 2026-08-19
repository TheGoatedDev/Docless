import { create } from "zustand";
import type { DocumentRow } from "../../../shared/document";

export type { DocumentRow };

const SEARCH_MS = 150;

type State = {
    docs: DocumentRow[];
    query: string;
    runningOcr: number;
    setQuery: (q: string) => void;
    hydrate: () => Promise<void>;
};

let listening = false;
let searchTimer: ReturnType<typeof setTimeout> | null = null;
let searchGen = 0;

async function load(
    query: string,
): Promise<{ docs: DocumentRow[]; runningOcr: number }> {
    const all = await window.api.documents.list();
    const runningOcr = all.reduce(
        (n, d) => n + (d.ocrStatus === "running" ? 1 : 0),
        0,
    );
    const q = query.trim();
    const docs = q ? await window.api.documents.search(q) : all;
    return { docs, runningOcr };
}

export const useDocuments = create<State>((set, get) => ({
    docs: [],
    query: "",
    runningOcr: 0,

    setQuery: (q) => {
        set({ query: q });
        if (searchTimer) clearTimeout(searchTimer);
        const gen = ++searchGen;
        searchTimer = setTimeout(() => {
            searchTimer = null;
            void load(q).then((s) => {
                if (gen !== searchGen) return;
                set(s);
            });
        }, SEARCH_MS);
    },

    hydrate: async () => {
        if (!listening) {
            listening = true;
            window.api.documents.onChange(() => {
                void load(get().query).then((s) => set(s));
            });
        }
        set(await load(get().query));
    },
}));
