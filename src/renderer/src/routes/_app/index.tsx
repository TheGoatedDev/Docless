import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
    component: Home,
});

function Home(): React.JSX.Element {
    return (
        <div>
            <h1 className="font-heading text-xl font-medium">Home</h1>
            <p className="text-muted-foreground mt-1 text-sm">
                Nothing here yet.
            </p>
        </div>
    );
}
