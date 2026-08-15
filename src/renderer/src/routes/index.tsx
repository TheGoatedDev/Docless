import { Button } from "@renderer/components/ui/button";
import { notify } from "@renderer/lib/notify";
import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "../stores/store";

export const Route = createFileRoute("/")({
    component: Index,
});

function Index(): React.JSX.Element {
    const ipcHandle = (): void => window.electron.ipcRenderer.send("ping");
    const count = useStore((s) => s.count);
    const inc = useStore((s) => s.inc);

    return (
        <div className="flex flex-col items-center gap-4 p-8">
            <h1 className="text-2xl font-semibold">Docless</h1>
            <div className="flex gap-2">
                <Button type="button" onClick={ipcHandle}>
                    Send IPC
                </Button>
                <Button type="button" variant="secondary" onClick={inc}>
                    Count: {count}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                        notify({
                            title: "Hello",
                            description: "Focus app = toast, blur = OS",
                            type: "success",
                        })
                    }
                >
                    Notify
                </Button>
            </div>
        </div>
    );
}
