import { Toaster } from "@renderer/components/ui/sonner";
import { useOllama } from "@renderer/stores/ollama";
import { createRootRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createRootRoute({
    beforeLoad: async ({ location }) => {
        await useOllama.getState().boot();
        const { running, ready } = useOllama.getState();
        const path = location.pathname;

        if (ready) {
            if (path.startsWith("/setup")) throw redirect({ to: "/" });
            return;
        }

        const to = !running ? "/setup/1-ollama" : "/setup/2-ocr-model";
        if (path !== to) throw redirect({ to });
    },
    component: () => (
        <>
            <Outlet />
            <Toaster richColors position="top-right" />
        </>
    ),
});
