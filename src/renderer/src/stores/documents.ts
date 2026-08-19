import { create } from "zustand";
import type { DocumentRow } from "../../../shared/document";

export type { DocumentRow };

const SEARCH_MS = 150;

type State = {
    docs: DocumentRow[];
    query: string;
    setQuery: (q: string) => void;
    hydrate: () => Promise<void>;
};

let listening = false;
let searchTimer: ReturnType<typeof setTimeout> | null = null;
let searchGen = 0;

async function load(query: string): Promise<DocumentRow[]> {
    const q = query.trim();
    return q ? window.api.documents.search(q) : window.api.documents.list();
}

export const useDocuments = create<State>((set, get) => ({
    docs: [],
    query: "",

    setQuery: (q) => {
        set({ query: q });
        if (searchTimer) clearTimeout(searchTimer);
        const gen = ++searchGen;
        searchTimer = setTimeout(() => {
            searchTimer = null;
            void load(q).then((docs) => {
                if (gen !== searchGen) return;
                set({ docs });
            });
        }, SEARCH_MS);
    },

    hydrate: async () => {
        if (!listening) {
            listening = true;
            window.api.documents.onChange(() => {
                void load(get().query).then((docs) => set({ docs }));
            });
        }
        set({ docs: await load(get().query) });
    },
}));
