import { Button } from "@renderer/components/ui/button";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@renderer/components/ui/card";
import { useSettings } from "@renderer/stores/settings";
import { IconFolderPlus, IconTrash } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings")({
    component: Settings,
});

function Settings(): React.JSX.Element {
    const { settings, setSettings } = useSettings();
    const paths = settings.watchPaths;

    const add = async (): Promise<void> => {
        const path = await window.api.dialog.openDirectory();
        if (!path || paths.includes(path)) return;
        await setSettings({ watchPaths: [...paths, path] });
    };

    const remove = async (path: string): Promise<void> => {
        await setSettings({
            watchPaths: paths.filter((p) => p !== path),
        });
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="font-heading text-xl font-medium">Settings</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Folders Docless watches for documents.
                </p>
            </div>

            <Card size="sm">
                <CardHeader>
                    <CardTitle>Watched folders</CardTitle>
                    <CardDescription>
                        Paths stored in settings. Watching not built yet.
                    </CardDescription>
                    <CardAction>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => void add()}
                        >
                            <IconFolderPlus />
                            Add folder
                        </Button>
                    </CardAction>
                </CardHeader>
                <CardContent>
                    {paths.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            No watched folders.
                        </p>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {paths.map((path) => (
                                <li
                                    key={path}
                                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                                >
                                    <span className="min-w-0 flex-1 truncate font-mono text-xs">
                                        {path}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => void remove(path)}
                                        aria-label={`Remove ${path}`}
                                    >
                                        <IconTrash />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
