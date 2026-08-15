import { Toaster } from "@renderer/components/ui/sonner";
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
    component: () => (
        <>
            <Outlet />
            <Toaster richColors position="top-right" />
        </>
    ),
});
