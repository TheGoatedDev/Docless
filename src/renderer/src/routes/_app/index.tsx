import { Badge } from "@renderer/components/ui/badge";
import { Button } from "@renderer/components/ui/button";
import { useDocuments } from "@renderer/stores/documents";
import { useSettings } from "@renderer/stores/settings";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
    component: Home,
});

function Home(): React.JSX.Element {
    const docs = useDocuments((s) => s.docs);
    const paths = useSettings((s) => s.settings.watchPaths);

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="font-heading text-xl font-medium">Documents</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Files discovered in watched folders.
                </p>
            </div>

            {paths.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                    No watched folders.{" "}
                    <Link to="/settings" className="text-foreground underline">
                        Add one in Settings
                    </Link>
                    .
                </p>
            ) : docs.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                    No documents yet. Drop PDF or image files into a watched
                    folder.
                </p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {docs.map((d) => (
                        <li
                            key={`${d.root}\0${d.path}`}
                            className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="truncate font-medium">
                                    {d.name}
                                </div>
                                <div className="text-muted-foreground truncate font-mono text-xs">
                                    {d.root}/{d.path}
                                </div>
                                {d.ocrStatus === "failed" && d.ocrError ? (
                                    <div className="text-destructive mt-0.5 truncate text-xs">
                                        {d.ocrError}
                                    </div>
                                ) : null}
                            </div>
                            <Badge variant="secondary">{d.ocrStatus}</Badge>
                            {d.ocrStatus === "failed" ? (
                                <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => {
                                        void window.api.documents.retry({
                                            root: d.root,
                                            path: d.path,
                                        });
                                    }}
                                >
                                    Retry
                                </Button>
                            ) : null}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
