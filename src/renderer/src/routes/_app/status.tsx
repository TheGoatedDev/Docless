import { Badge } from "@renderer/components/ui/badge";
import { Button } from "@renderer/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@renderer/components/ui/card";
import { useOllama } from "@renderer/stores/ollama";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_app/status")({
    component: Status,
});

function Status(): React.JSX.Element {
    const [versions] = useState(() => window.electron.process.versions);
    const {
        ready,
        running,
        modelPresent,
        owned,
        version: ollamaVersion,
        busy,
        phase,
        status,
        percent,
        message,
        error,
        hydrate,
        ensureRuntime,
        ensureModel,
        reinstall,
    } = useOllama();

    useEffect(() => {
        void hydrate();
    }, [hydrate]);

    const detail =
        error ??
        (ready && !busy ? "ok" : message || (status !== "idle" ? status : ""));
    const pct = !ready && percent != null ? ` (${percent}%)` : "";

    return (
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
            <div>
                <h1 className="font-heading text-xl font-medium">Status</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Runtime and local AI diagnostics.
                </p>
            </div>

            <Card size="sm">
                <CardHeader>
                    <CardTitle>Runtime</CardTitle>
                    <CardDescription>Process versions</CardDescription>
                </CardHeader>
                <CardContent>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                        <dt className="text-muted-foreground">Electron</dt>
                        <dd>{versions.electron}</dd>
                        <dt className="text-muted-foreground">Chromium</dt>
                        <dd>{versions.chrome}</dd>
                        <dt className="text-muted-foreground">Node</dt>
                        <dd>{versions.node}</dd>
                        <dt className="text-muted-foreground">Ollama</dt>
                        <dd>{ollamaVersion ?? "—"}</dd>
                    </dl>
                </CardContent>
            </Card>

            <Card size="sm">
                <CardHeader>
                    <CardTitle>Ollama</CardTitle>
                    <CardDescription>
                        {detail}
                        {pct}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    <Flag ok={ready} label="Ready" />
                    <Flag ok={running} label="Running" />
                    <Flag ok={modelPresent} label="Model" />
                    <Flag ok={owned} label="Owned" />
                    {busy ? <Badge variant="secondary">Busy</Badge> : null}
                    {phase !== "idle" && !(ready && !busy) ? (
                        <Badge variant="outline">
                            {phase}: {status}
                        </Badge>
                    ) : null}
                    {error ? <Badge variant="destructive">Error</Badge> : null}
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => void hydrate()}
                    >
                        Refresh
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => void ensureRuntime()}
                    >
                        Ensure runtime
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => void ensureModel()}
                    >
                        Ensure model
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={busy}
                        onClick={() => void reinstall()}
                    >
                        Reinstall
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

function Flag({
    ok,
    label,
}: {
    ok: boolean;
    label: string;
}): React.JSX.Element {
    return (
        <Badge variant={ok ? "default" : "outline"}>
            {label}: {ok ? "yes" : "no"}
        </Badge>
    );
}
