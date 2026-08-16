import { AppSidebar } from "@renderer/components/app-sidebar";
import { Badge } from "@renderer/components/ui/badge";
import { SidebarInset, SidebarProvider } from "@renderer/components/ui/sidebar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@renderer/components/ui/tooltip";
import { useOllama } from "@renderer/stores/ollama";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
    component: AppLayout,
});

function AppLayout(): React.JSX.Element {
    const { ready, busy, error, message, status } = useOllama();
    const mac = window.electron.process.platform === "darwin";
    const chrome = window.api.windowRole !== "compact";
    const label = error
        ? "Ollama error"
        : busy
          ? "Ollama…"
          : ready
            ? "Ollama"
            : "Ollama off";
    const tip =
        error ??
        (busy ? message || status || "Busy" : ready ? "Ready" : "Offline");
    const dot = error
        ? "bg-destructive"
        : busy
          ? "bg-amber-500"
          : ready
            ? "bg-emerald-500"
            : "bg-muted-foreground/40";

    return (
        <TooltipProvider>
            <SidebarProvider>
                <div className="flex h-svh w-full flex-col">
                    <header
                        className={`app-drag relative z-20 flex h-11 shrink-0 items-center gap-2 border-b px-4 ${chrome ? (mac ? "pl-24" : "pr-28") : ""}`}
                    >
                        <span className="font-heading text-sm font-medium leading-none">
                            Docless
                        </span>
                        <Tooltip>
                            <Badge
                                className="app-no-drag ml-auto"
                                variant="outline"
                                render={
                                    <TooltipTrigger
                                        render={<Link to="/status" />}
                                    />
                                }
                            >
                                <span
                                    className={`size-1.5 rounded-full ${dot}`}
                                />
                                {label}
                            </Badge>
                            <TooltipContent>{tip}</TooltipContent>
                        </Tooltip>
                    </header>
                    <div className="flex min-h-0 flex-1">
                        <AppSidebar />
                        <SidebarInset>
                            <main className="mx-auto w-full max-w-4xl flex-1 p-6">
                                <Outlet />
                            </main>
                        </SidebarInset>
                    </div>
                </div>
            </SidebarProvider>
        </TooltipProvider>
    );
}
