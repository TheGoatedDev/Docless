import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/dev")({
    beforeLoad: () => {
        if (!import.meta.env.DEV) throw notFound();
    },
    component: Dev,
});

function Dev(): React.JSX.Element {
    return (
        <div>
            <h1 className="font-heading text-xl font-medium">Dev</h1>
            <p className="text-muted-foreground mt-1 text-sm">
                Development only.
            </p>
        </div>
    );
}
