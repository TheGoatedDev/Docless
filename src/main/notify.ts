import { BrowserWindow, ipcMain, Notification } from "electron";

export type NotifyPayload = {
    title: string;
    body?: string;
};

/** Main-originated OS notification (no click-to-focus window). */
export function notifyMain(payload: NotifyPayload): boolean {
    if (!Notification.isSupported()) return false;
    const title = payload.title?.trim();
    if (!title) return false;
    new Notification({
        title,
        body: payload.body?.trim() || undefined,
    }).show();
    return true;
}

export function registerNotifyIpc(): void {
    ipcMain.handle("notify:show", (e, payload: NotifyPayload): boolean => {
        if (!Notification.isSupported()) return false;

        const title = payload.title?.trim();
        if (!title) return false;

        const n = new Notification({
            title,
            body: payload.body?.trim() || undefined,
        });

        n.on("click", () => {
            const win = BrowserWindow.fromWebContents(e.sender);
            if (!win) return;
            if (win.isMinimized()) win.restore();
            win.show();
            win.focus();
        });

        n.show();
        return true;
    });
}
