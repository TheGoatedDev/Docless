import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@renderer/components/ui/sidebar";
import { IconActivity, IconFileText, IconHome } from "@tabler/icons-react";
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
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="pointer-events-none"
                        >
                            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                <IconFileText />
                            </div>
                            <span className="font-heading text-sm font-medium">
                                Docless
                            </span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
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
            <SidebarRail />
        </Sidebar>
    );
}
