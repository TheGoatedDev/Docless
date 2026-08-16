# Chokidar folder watching

Watched roots are observed in Electron main with chokidar (not `node:fs.watch`) for reliable recursive, cross-platform events. Main owns start/stop synced to `settings.watchPaths`; each root gets a `.docless` directory (mkdir only until layout is decided). Event handling stays in main for now — no renderer IPC until index/OCR needs it.

**Considered:** `fs.watch({ recursive: true })` — no dep, weaker/uneven on Linux.
