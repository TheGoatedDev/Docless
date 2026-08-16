import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@renderer/components/ui/card";
import { useOllama } from "@renderer/stores/ollama";
import { useSettings } from "@renderer/stores/settings";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/dev")({
    beforeLoad: () => {
        if (!import.meta.env.DEV) throw notFound();
    },
    component: Dev,
});

function dump(state: object): string {
    return JSON.stringify(
        state,
        (_, v) => (typeof v === "function" ? undefined : v),
        2,
    );
}

function Dev(): React.JSX.Element {
    const ollama = useOllama();
    const settings = useSettings();

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="font-heading text-xl font-medium">Dev</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Development only.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {(
                    [
                        ["ollama", ollama],
                        ["settings", settings],
                    ] as const
                ).map(([name, state]) => (
                    <Card key={name} size="sm">
                        <CardHeader>
                            <CardTitle>{name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="overflow-auto text-xs">
                                {dump(state)}
                            </pre>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
