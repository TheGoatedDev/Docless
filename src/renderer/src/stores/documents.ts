import { create } from "zustand";
import type { DocumentRow } from "../../../shared/document";

export type { DocumentRow };

const SEARCH_MS = 150;

type State = {
    docs: DocumentRow[];
    query: string;
    runningOcr: number;
    pendingOcr: number;
    setQuery: (q: string) => void;
    hydrate: () => Promise<void>;
};

let listening = false;
let searchTimer: ReturnType<typeof setTimeout> | null = null;
let searchGen = 0;

async function load(
    query: string,
): Promise<{ docs: DocumentRow[]; runningOcr: number; pendingOcr: number }> {
    const all = await window.api.documents.list();
    let runningOcr = 0;
    let pendingOcr = 0;
    for (const d of all) {
        if (d.ocrStatus === "running") runningOcr++;
        else if (d.ocrStatus === "pending") pendingOcr++;
    }
    const q = query.trim();
    const docs = q ? await window.api.documents.search(q) : all;
    return { docs, runningOcr, pendingOcr };
}

export const useDocuments = create<State>((set, get) => ({
    docs: [],
    query: "",
    runningOcr: 0,
    pendingOcr: 0,

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
