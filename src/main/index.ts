import { join } from "node:path";
import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { app, BrowserWindow, ipcMain, Menu, shell, Tray } from "electron";
import icon from "../../resources/icon.png?asset";
import { registerNotifyIpc } from "./notify";
import { registerOllamaIpc, stopOllamaIfOwned } from "./ollama";
import { registerSettingsIpc } from "./settings";

let mainWindow: BrowserWindow | null = null;
let compactWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function loadRenderer(win: BrowserWindow): void {
    if (is.dev && process.env.ELECTRON_RENDERER_URL) {
        void win.loadURL(process.env.ELECTRON_RENDERER_URL);
    } else {
        void win.loadFile(join(__dirname, "../renderer/index.html"));
    }
}

function wireWindow(win: BrowserWindow): void {
    win.on("ready-to-show", () => win.show());
    win.webContents.setWindowOpenHandler((details) => {
        void shell.openExternal(details.url);
        return { action: "deny" };
    });
    loadRenderer(win);
}

function focusWindow(win: BrowserWindow): void {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
}

function createMainWindow(): BrowserWindow {
    if (mainWindow && !mainWindow.isDestroyed()) {
        focusWindow(mainWindow);
        return mainWindow;
    }

    mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === "linux" ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, "../preload/index.js"),
            sandbox: false,
        },
    });

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
    wireWindow(mainWindow);
    return mainWindow;
}

function createCompactWindow(): BrowserWindow {
    if (compactWindow && !compactWindow.isDestroyed()) {
        focusWindow(compactWindow);
        return compactWindow;
    }

    compactWindow = new BrowserWindow({
        width: 390,
        height: 680,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === "linux" ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, "../preload/index.js"),
            sandbox: false,
        },
    });

    compactWindow.on("closed", () => {
        compactWindow = null;
    });
    wireWindow(compactWindow);
    return compactWindow;
}

function createTray(): void {
    tray = new Tray(icon);
    tray.setToolTip("Docless");
    tray.setContextMenu(
        Menu.buildFromTemplate([
            { label: "Open App", click: () => createMainWindow() },
            { label: "Quick view", click: () => createCompactWindow() },
            { type: "separator" },
            { label: "Quit", click: () => app.quit() },
        ]),
    );
    tray.on("click", () => createCompactWindow());
}

app.whenReady().then(() => {
    electronApp.setAppUserModelId("com.docless.app");

    app.on("browser-window-created", (_, window) => {
        optimizer.watchWindowShortcuts(window);
    });

    ipcMain.on("ping", () => console.log("pong"));
    registerSettingsIpc();
    registerOllamaIpc();
    registerNotifyIpc();

    createTray();
    createMainWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

// ponytail: tray keeps process alive; quit only via tray/Cmd+Q
app.on("window-all-closed", () => {});

app.on("before-quit", () => {
    tray?.destroy();
    tray = null;
    void stopOllamaIfOwned();
});
