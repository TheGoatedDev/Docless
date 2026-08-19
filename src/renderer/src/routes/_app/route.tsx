import { AppSidebar } from "@renderer/components/app-sidebar";
import { Badge } from "@renderer/components/ui/badge";
import { Input } from "@renderer/components/ui/input";
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
import { useDocuments } from "@renderer/stores/documents";
import { useOllama } from "@renderer/stores/ollama";
import { IconSearch } from "@tabler/icons-react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
    component: AppLayout,
});

function AppLayout(): React.JSX.Element {
    const { ready, busy, error, message, status } = useOllama();
    const query = useDocuments((s) => s.query);
    const setQuery = useDocuments((s) => s.setQuery);
    const mac = window.electron.process.platform === "darwin";
    const chrome = window.api.windowRole !== "compact";
    const ollama = error
        ? {
              label: "Ollama error",
              tip: error,
              dot: "bg-destructive",
          }
        : busy
          ? {
                label: "Ollama…",
                tip: message || status || "Busy",
                dot: "bg-amber-500",
            }
          : ready
            ? { label: "Ollama", tip: "Ready", dot: "bg-emerald-500" }
            : {
                  label: "Ollama off",
                  tip: "Offline",
                  dot: "bg-muted-foreground/40",
              };

    return (
        <TooltipProvider>
            <SidebarProvider className="h-svh min-h-0 overflow-hidden">
                <div className="flex h-full w-full flex-col overflow-hidden">
                    <header
                        className={`app-drag z-20 flex h-11 shrink-0 items-center gap-2 border-b bg-background px-4 ${chrome ? (mac ? "pl-24" : "pr-28") : ""}`}
                    >
                        <SidebarTrigger className="app-no-drag md:hidden" />
                        {chrome ? (
                            <span className="font-heading text-sm font-medium leading-none">
                                Docless
                            </span>
                        ) : null}
                        <div className="app-no-drag relative ml-2 w-56 max-w-xs flex-1">
                            <IconSearch className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search…"
                                className="h-8 pl-8"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
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
                                    className={`size-1.5 rounded-full ${ollama.dot}`}
                                />
                                {ollama.label}
                            </Badge>
                            <TooltipContent>{ollama.tip}</TooltipContent>
                        </Tooltip>
                    </header>
                    <div className="flex min-h-0 flex-1 overflow-hidden">
                        <AppSidebar />
                        <SidebarInset className="min-h-0 overflow-auto">
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
