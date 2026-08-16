import { Button } from "@renderer/components/ui/button";
import { useOllama } from "@renderer/stores/ollama";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/setup/1-ollama")({
    component: StepOllama,
});

function StepOllama(): React.JSX.Element {
    const navigate = useNavigate();
    const {
        busy,
        running,
        status,
        percent,
        message,
        error,
        hydrate,
        ensureRuntime,
    } = useOllama();

    useEffect(() => {
        void hydrate();
    }, [hydrate]);

    return (
        <div className="flex flex-col gap-4">
            <div>
                <p className="text-muted-foreground text-sm">Step 1 of 2</p>
                <h2 className="text-lg font-medium">Ollama</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Install and start the local Ollama runtime.
                </p>
            </div>
            <p className="text-sm">
                {error ?? (message || status)}
                {percent != null ? ` (${percent}%)` : ""}
            </p>
            <div className="flex gap-2">
                <Button
                    type="button"
                    disabled={busy}
                    onClick={() => void ensureRuntime()}
                >
                    {busy
                        ? "Working…"
                        : running
                          ? "Re-check"
                          : "Install & start"}
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    disabled={!running || busy}
                    onClick={() => void navigate({ to: "/setup/2-ocr-model" })}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
