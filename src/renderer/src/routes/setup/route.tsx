import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/setup")({
    component: SetupLayout,
});

function SetupLayout(): React.JSX.Element {
    return (
        <div className="mx-auto flex min-h-full max-w-lg flex-col gap-6 p-8">
            <h1 className="text-2xl font-semibold">Setup</h1>
            <Outlet />
        </div>
    );
}
