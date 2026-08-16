import { AppSidebar } from "@renderer/components/app-sidebar";
import { Badge } from "@renderer/components/ui/badge";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@renderer/components/ui/sidebar";
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
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
                        <SidebarTrigger className="-ml-1" />
                        <span className="font-heading text-sm font-medium md:hidden">
                            Docless
                        </span>
                        <Tooltip>
                            <Badge
                                className="ml-auto"
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
                    <main className="mx-auto w-full max-w-4xl flex-1 p-6">
                        <Outlet />
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}
