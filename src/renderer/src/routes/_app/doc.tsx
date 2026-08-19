import { Badge } from "@renderer/components/ui/badge";
import { Button } from "@renderer/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import type { DocumentDetail } from "../../../../shared/document";

type DocSearch = { root: string; path: string };

export const Route = createFileRoute("/_app/doc")({
    validateSearch: (s: Record<string, unknown>): DocSearch => ({
        root: typeof s.root === "string" ? s.root : "",
        path: typeof s.path === "string" ? s.path : "",
    }),
    component: Doc,
});

function Doc(): React.JSX.Element {
    const { root, path } = Route.useSearch();
    const [doc, setDoc] = useState<DocumentDetail | null | undefined>(
        undefined,
    );

    const load = useCallback(() => {
        if (!root || !path) {
            setDoc(null);
            return;
        }
        void window.api.documents.get({ root, path }).then(setDoc);
    }, [root, path]);

    useEffect(() => {
        load();
        return window.api.documents.onChange(load);
    }, [load]);

    if (!root || !path) {
        return (
            <div className="flex flex-col gap-4">
                <Back />
                <p className="text-muted-foreground text-sm">
                    Missing document location.
                </p>
            </div>
        );
    }

    if (doc === undefined) {
        return (
            <div className="flex flex-col gap-4">
                <Back />
                <p className="text-muted-foreground text-sm">Loading…</p>
            </div>
        );
    }

    if (doc === null) {
        return (
            <div className="flex flex-col gap-4">
                <Back />
                <p className="text-muted-foreground text-sm">
                    Document not found.
                </p>
            </div>
        );
    }

    const text = doc.text?.trim() ? doc.text : null;
    const failed = doc.ocrStatus === "failed";
    const busy = doc.ocrStatus === "pending" || doc.ocrStatus === "running";

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <Back />
                    <h1 className="font-heading mt-2 truncate text-xl font-medium">
                        {doc.name}
                    </h1>
                    <p className="text-muted-foreground mt-1 truncate font-mono text-xs">
                        {doc.root}/{doc.path}
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Badge variant="secondary">{doc.ocrStatus}</Badge>
                    <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                            void window.api.documents.open({
                                root: doc.root,
                                path: doc.path,
                            });
                        }}
                    >
                        Open file
                    </Button>
                    {failed ? (
                        <Button
                            size="xs"
                            variant="outline"
                            onClick={() => {
                                void window.api.documents.retry({
                                    root: doc.root,
                                    path: doc.path,
                                });
                            }}
                        >
                            Retry
                        </Button>
                    ) : null}
                </div>
            </div>

            {failed && doc.ocrError ? (
                <p className="text-destructive text-sm">{doc.ocrError}</p>
            ) : null}

            {busy ? (
                <p className="text-muted-foreground text-sm">
                    OCR in progress…
                </p>
            ) : text ? (
                <pre className="bg-muted/40 max-h-[min(70vh,40rem)] overflow-auto rounded-md border p-3 text-sm whitespace-pre-wrap">
                    {text}
                </pre>
            ) : failed ? (
                <p className="text-muted-foreground text-sm">
                    No text available.
                </p>
            ) : doc.ocrStatus === "skipped" ? (
                <p className="text-muted-foreground text-sm">Skipped.</p>
            ) : doc.ocrStatus === "done" ? (
                <p className="text-muted-foreground text-sm">
                    No text extracted.
                </p>
            ) : (
                <p className="text-muted-foreground text-sm">
                    No text available.
                </p>
            )}
        </div>
    );
}

function Back(): React.JSX.Element {
    return (
        <Link
            to="/"
            className="text-muted-foreground hover:text-foreground text-sm underline"
        >
            ← Documents
        </Link>
    );
}
