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
import { useOllama } from "@renderer/stores/ollama";
import { IconSearch } from "@tabler/icons-react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
    component: AppLayout,
});

function AppLayout(): React.JSX.Element {
    const { ready, busy, error, message, status } = useOllama();
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
            <SidebarProvider>
                <div className="flex h-svh w-full flex-col">
                    <header
                        className={`app-drag relative z-20 flex h-11 shrink-0 items-center gap-2 border-b px-4 ${chrome ? (mac ? "pl-24" : "pr-28") : ""}`}
                    >
                        <SidebarTrigger className="app-no-drag md:hidden" />
                        <span className="font-heading text-sm font-medium leading-none">
                            Docless
                        </span>
                        <div className="app-no-drag absolute top-1/2 left-1/2 w-56 -translate-x-1/2 -translate-y-1/2">
                            <IconSearch className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search…"
                                className="h-8 pl-8"
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
