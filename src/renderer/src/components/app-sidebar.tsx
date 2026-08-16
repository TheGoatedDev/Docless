import { cn } from "@renderer/lib/utils";
import {
    IconActivity,
    IconCode,
    IconHome,
    IconSettings,
} from "@tabler/icons-react";
import { Link, useMatchRoute } from "@tanstack/react-router";

const top = [{ title: "Home", to: "/", icon: IconHome }] as const;
const bottom = [
    ...(import.meta.env.DEV
        ? ([{ title: "Dev", to: "/dev", icon: IconCode }] as const)
        : []),
    { title: "Status", to: "/status", icon: IconActivity },
    { title: "Settings", to: "/settings", icon: IconSettings },
] as const;

function Nav({
    items,
}: {
    items: readonly {
        title: string;
        to: string;
        icon: typeof IconHome;
    }[];
}): React.JSX.Element {
    const matchRoute = useMatchRoute();
    return (
        <nav className="flex flex-col gap-1 p-2">
            {items.map((item) => {
                const active = !!matchRoute({ to: item.to });
                return (
                    <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                            active &&
                                "bg-accent font-medium text-accent-foreground",
                        )}
                    >
                        <item.icon className="size-4 shrink-0" />
                        <span>{item.title}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export function AppSidebar(): React.JSX.Element {
    return (
        <aside className="flex w-48 shrink-0 flex-col border-r bg-muted/30">
            <div className="flex-1">
                <Nav items={top} />
            </div>
            <div className="border-t">
                <Nav items={bottom} />
            </div>
        </aside>
    );
}
