import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
    useSidebar,
} from "@renderer/components/ui/sidebar";
import {
    IconActivity,
    IconChevronLeft,
    IconCode,
    IconHome,
    IconSettings,
} from "@tabler/icons-react";
import { Link, useMatchRoute } from "@tanstack/react-router";
import { useEffect } from "react";

const top = [{ title: "Home", to: "/", icon: IconHome }] as const;
const bottom = [
    ...(import.meta.env.DEV
        ? ([{ title: "Dev", to: "/dev", icon: IconCode }] as const)
        : []),
    { title: "Status", to: "/status", icon: IconActivity },
    { title: "Settings", to: "/settings", icon: IconSettings },
] as const;

export function AppSidebar(): React.JSX.Element {
    const matchRoute = useMatchRoute();
    const { state, toggleSidebar, setOpenMobile } = useSidebar();

    useEffect(() => {
        if (window.api.windowRole !== "compact") return;
        const close = (): void => setOpenMobile(false);
        window.addEventListener("blur", close);
        return () => window.removeEventListener("blur", close);
    }, [setOpenMobile]);

    const menu = (
        items: readonly { title: string; to: string; icon: typeof IconHome }[],
    ) => (
        <SidebarMenu className="gap-1 p-2">
            {items.map((item) => (
                <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                        render={<Link to={item.to} />}
                        isActive={!!matchRoute({ to: item.to })}
                        tooltip={item.title}
                    >
                        <item.icon />
                        <span>{item.title}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );

    return (
        <Sidebar collapsible="icon">
            <SidebarContent>{menu(top)}</SidebarContent>
            <SidebarFooter className="gap-0 p-0">
                <SidebarSeparator className="mx-0" />
                {menu(bottom)}
            </SidebarFooter>
            <div className="absolute inset-y-0 right-0 z-20 hidden translate-x-1/2 items-center md:flex">
                <button
                    type="button"
                    className="flex size-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground"
                    onClick={toggleSidebar}
                >
                    <IconChevronLeft
                        className={`size-4 transition-transform duration-200 ${state === "expanded" ? "" : "rotate-180"}`}
                    />
                    <span className="sr-only">Toggle Sidebar</span>
                </button>
            </div>
        </Sidebar>
    );
}
