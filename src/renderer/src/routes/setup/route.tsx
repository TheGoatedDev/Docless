import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/setup")({
    component: SetupLayout,
});

function SetupLayout(): React.JSX.Element {
    return (
        <div className="flex min-h-full flex-col">
            <div className="app-drag h-8 shrink-0" />
            <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-8 pt-0">
                <h1 className="text-2xl font-semibold">Setup</h1>
                <Outlet />
            </div>
        </div>
    );
}
