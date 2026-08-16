import { Button } from "@renderer/components/ui/button";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@renderer/components/ui/sidebar";
import {
    IconActivity,
    IconChevronLeft,
    IconChevronRight,
    IconHome,
} from "@tabler/icons-react";
import { Link, useMatchRoute } from "@tanstack/react-router";

const items = [
    { title: "Home", to: "/", icon: IconHome },
    { title: "Status", to: "/status", icon: IconActivity },
] as const;

export function AppSidebar(
    props: React.ComponentProps<typeof Sidebar>,
): React.JSX.Element {
    const matchRoute = useMatchRoute();
    const { state, toggleSidebar } = useSidebar();
    const open = state === "expanded";

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
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
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <div className="absolute inset-y-0 right-0 z-20 flex translate-x-1/2 items-center">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-6 rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-none transition-none hover:bg-sidebar active:translate-y-0"
                    onClick={toggleSidebar}
                >
                    {open ? <IconChevronLeft /> : <IconChevronRight />}
                    <span className="sr-only">Toggle Sidebar</span>
                </Button>
            </div>
        </Sidebar>
    );
}
