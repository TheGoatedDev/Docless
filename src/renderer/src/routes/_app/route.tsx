import { Separator } from "@renderer/components/ui/separator";
import { cn } from "@renderer/lib/utils";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
    component: AppLayout,
});

function AppLayout(): React.JSX.Element {
    return (
        <div className="flex min-h-full flex-col">
            <header className="flex items-center gap-4 px-4 py-3">
                <span className="font-heading text-sm font-medium">
                    Docless
                </span>
                <Separator orientation="vertical" className="h-4" />
                <nav className="flex gap-3 text-sm">
                    <NavLink to="/">Home</NavLink>
                    <NavLink to="/status">Status</NavLink>
                </nav>
            </header>
            <Separator />
            <main className="flex-1 p-6">
                <Outlet />
            </main>
        </div>
    );
}

function NavLink({
    to,
    children,
}: {
    to: "/" | "/status";
    children: React.ReactNode;
}): React.JSX.Element {
    return (
        <Link
            to={to}
            className="text-muted-foreground hover:text-foreground transition-colors"
            activeProps={{
                className: cn("text-foreground font-medium"),
            }}
        >
            {children}
        </Link>
    );
}
