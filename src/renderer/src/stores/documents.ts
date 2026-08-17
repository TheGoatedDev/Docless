import { create } from "zustand";
import type { DocumentRow } from "../../../shared/document";

export type { DocumentRow };

type State = {
    docs: DocumentRow[];
    hydrate: () => Promise<void>;
};

let listening = false;

export const useDocuments = create<State>((set) => ({
    docs: [],

    hydrate: async () => {
        if (!listening) {
            listening = true;
            window.api.documents.onChange(() => {
                void window.api.documents.list().then((docs) => set({ docs }));
            });
        }
        set({ docs: await window.api.documents.list() });
    },
}));
