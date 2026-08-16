import { Button } from "@renderer/components/ui/button";
import { useOllama } from "@renderer/stores/ollama";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/setup/2-ocr-model")({
    component: StepOcrModel,
});

function StepOcrModel(): React.JSX.Element {
    const navigate = useNavigate();
    const {
        busy,
        ready,
        modelPresent,
        status,
        percent,
        message,
        error,
        hydrate,
        ensureModel,
    } = useOllama();

    useEffect(() => {
        void hydrate();
    }, [hydrate]);

    return (
        <div className="flex flex-col gap-4">
            <div>
                <p className="text-muted-foreground text-sm">Step 2 of 2</p>
                <h2 className="text-lg font-medium">OCR model</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Download the glm-ocr model for document recognition.
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
                    onClick={() => void ensureModel()}
                >
                    {busy
                        ? "Working…"
                        : modelPresent
                          ? "Re-check"
                          : "Download model"}
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    disabled={!ready || busy}
                    onClick={() => void navigate({ to: "/" })}
                >
                    Done
                </Button>
            </div>
        </div>
    );
}
