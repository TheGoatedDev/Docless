# Electron desktop app

Docless is a local desktop app, not a hosted web service. Electron gives a main process that owns filesystem, tray, and OS APIs, and a renderer for UI. Renderer never touches Node FS directly — only `window.api` via preload — so privileges stay in main.
