import { AppSidebar } from "@renderer/components/app-sidebar";
import { Badge } from "@renderer/components/ui/badge";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@renderer/components/ui/sidebar";
import { TooltipProvider } from "@renderer/components/ui/tooltip";
import { useOllama } from "@renderer/stores/ollama";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
    component: AppLayout,
});

function AppLayout(): React.JSX.Element {
    const { ready, busy, error } = useOllama();
    const label = error
        ? "Ollama error"
        : busy
          ? "Ollama…"
          : ready
            ? "Ollama"
            : "Ollama off";
    const variant = error ? "destructive" : ready ? "default" : "secondary";

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
                        <Badge
                            className="ml-auto"
                            variant={variant}
                            render={<Link to="/status" />}
                        >
                            {label}
                        </Badge>
                    </header>
                    <main className="mx-auto w-full max-w-4xl flex-1 p-6">
                        <Outlet />
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}
