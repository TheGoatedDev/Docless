import { join } from "node:path";
import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { app, BrowserWindow, Menu, nativeImage, shell, Tray } from "electron";
import icon from "../../resources/icon.png?asset";
import { closeAllLibraries } from "./db";
import { registerDocumentsIpc } from "./documents";
import { registerLogIpc } from "./logger";
import { registerNotifyIpc } from "./notify";
import { startOcr } from "./ocr";
import {
    ensureRenameModel,
    registerOllamaIpc,
    stopOllamaIfOwned,
} from "./ollama";
import { loadSettings, registerSettingsIpc } from "./settings";
import { startUpdates } from "./update";
import { stopAllWatchers, syncWatchPaths } from "./watch";

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

function openExternal(win: BrowserWindow): void {
    win.webContents.setWindowOpenHandler((details) => {
        void shell.openExternal(details.url);
        return { action: "deny" };
    });
}

function wireWindow(win: BrowserWindow): void {
    win.on("ready-to-show", () => win.show());
    openExternal(win);
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
        titleBarStyle: "hiddenInset",
        trafficLightPosition: { x: 12, y: 14 },
        ...(process.platform !== "darwin"
            ? {
                  titleBarOverlay: {
                      color: "#ffffff",
                      symbolColor: "#0a0a0a",
                      height: 44,
                  },
              }
            : {}),
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

const COMPACT_W = 390;
const COMPACT_H = 680;

function positionBelowTray(win: BrowserWindow): void {
    if (!tray) return;
    const tb = tray.getBounds();
    const x = Math.round(tb.x + tb.width / 2 - COMPACT_W / 2);
    // macOS menu bar is top; Windows/Linux tray is usually bottom
    const y =
        process.platform === "darwin"
            ? Math.round(tb.y + tb.height + 4)
            : Math.round(tb.y - COMPACT_H - 4);
    win.setPosition(x, y);
}

function ensureCompactWindow(): BrowserWindow {
    if (compactWindow && !compactWindow.isDestroyed()) return compactWindow;

    compactWindow = new BrowserWindow({
        width: COMPACT_W,
        height: COMPACT_H,
        show: false,
        frame: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        fullscreenable: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        ...(process.platform === "linux" ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, "../preload/index.js"),
            sandbox: false,
            additionalArguments: ["--docless-window=compact"],
        },
    });

    compactWindow.on("closed", () => {
        compactWindow = null;
    });
    compactWindow.on("blur", () => {
        if (compactWindow && !compactWindow.isDestroyed()) compactWindow.hide();
    });
    openExternal(compactWindow);
    loadRenderer(compactWindow);
    return compactWindow;
}

function toggleCompactWindow(): void {
    if (
        compactWindow &&
        !compactWindow.isDestroyed() &&
        compactWindow.isVisible()
    ) {
        compactWindow.hide();
        return;
    }
    const win = ensureCompactWindow();
    const reveal = (): void => {
        positionBelowTray(win);
        win.show();
        win.focus();
    };
    if (win.webContents.isLoading()) {
        win.webContents.once("did-finish-load", reveal);
    } else {
        reveal();
    }
}

function createTray(): void {
    // 512px app icon blows up the menu bar; tray wants ~16–22px
    const trayIcon = nativeImage
        .createFromPath(icon)
        .resize({ width: 16, height: 16 });
    tray = new Tray(trayIcon);
    tray.setToolTip("Docless");
    // Don't setContextMenu — on macOS that steals primary click. Menu on right-click only.
    const menu = Menu.buildFromTemplate([
        { label: "Open App", click: () => createMainWindow() },
        { type: "separator" },
        { label: "Quit", click: () => app.quit() },
    ]);
    tray.on("click", () => toggleCompactWindow());
    tray.on("right-click", () => tray?.popUpContextMenu(menu));
}

app.whenReady().then(() => {
    electronApp.setAppUserModelId("com.docless.app");

    app.on("browser-window-created", (_, window) => {
        optimizer.watchWindowShortcuts(window);
    });

    registerLogIpc();
    registerSettingsIpc();
    registerOllamaIpc();
    registerNotifyIpc();
    registerDocumentsIpc();
    syncWatchPaths(loadSettings().watchPaths);
    startOcr();
    if (loadSettings().autoRename) void ensureRenameModel();
    startUpdates();

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
    void stopAllWatchers().then(() => closeAllLibraries());
    void stopOllamaIfOwned();
});
