import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
} from "@renderer/components/ui/sidebar";
import { IconActivity, IconHome } from "@tabler/icons-react";
import { Link, useMatchRoute } from "@tanstack/react-router";

const items = [
    { title: "Home", to: "/", icon: IconHome },
    { title: "Status", to: "/status", icon: IconActivity },
] as const;

export function AppSidebar(
    props: React.ComponentProps<typeof Sidebar>,
): React.JSX.Element {
    const matchRoute = useMatchRoute();

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
            <SidebarTrigger className="absolute top-1/2 right-0 z-20 size-6 -translate-y-1/2 translate-x-1/2 rounded-full border bg-background shadow-sm" />
        </Sidebar>
    );
}
