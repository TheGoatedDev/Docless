import { toast } from "sonner";

export type NotifyType = "message" | "success" | "info" | "warning" | "error";

export type NotifyOptions = {
    title: string;
    description?: string;
    type?: NotifyType;
};

function isAppFocused(): boolean {
    return document.visibilityState === "visible" && document.hasFocus();
}

export function notify(opts: NotifyOptions): void {
    const type = opts.type ?? "message";

    if (isAppFocused()) {
        if (type === "message") {
            toast(opts.title, { description: opts.description });
            return;
        }
        toast[type](opts.title, { description: opts.description });
        return;
    }

    void window.api.notify.show({
        title: opts.title,
        body: opts.description,
    });
}
