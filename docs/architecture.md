# Architecture

As-built map of Docless. Product pipeline beyond watch (index → search → OCR jobs) is not built yet — see Status in the README and ADRs 0006–0008.

## Purpose

Desktop app for local document handling: folders you choose stay on disk; OCR via a local Ollama runtime. No cloud backend.

## Process layout

```
src/main/       Electron main: windows, tray, settings, watch, ollama, notify
src/preload/    contextBridge → window.api
src/renderer/   React UI (TanStack Router, Zustand, shadcn)
```

| Layer | Owns |
|-------|------|
| **main** | FS, watchers, OS notifications, tray, Ollama lifecycle, `settings.json` |
| **preload** | Thin IPC surface; no business logic |
| **renderer** | UI + client stores; talks only through `window.api` |

```mermaid
flowchart LR
  renderer --> preload --> main
  main --> settings[(userData/settings.json)]
  main --> watch[chokidar per watchPath]
  watch --> docless["root/.docless/docless.sqlite"]
  main --> ollama[Ollama localhost]
  main --> tray[Tray / windows]
```

## Cold start

1. Main registers IPC (settings, ollama, notify), creates tray + windows.
2. `syncWatchPaths(loadSettings().watchPaths)` — open sidecar DB (migrate) + chokidar per root.
3. Renderer hydrates settings + ollama status.
4. Root route `beforeLoad` boots Ollama:
   - Binary already on disk → quiet ensure runtime + model.
   - First run → `/setup/1-ollama` then `/setup/2-ocr-model`.
5. Ready when Ollama is running and `glm-ocr` is present → app routes.

## Windows

| Window | Role |
|--------|------|
| **main** | Full app chrome (~900×670), hiddenInset titlebar |
| **compact** | Tray popover (~390×680), frameless, `alwaysOnTop`, hide on blur; argv `--docless-window=compact` |

Tray left-click toggles compact; right-click Open App / Quit. Closing all windows does not quit; quit via tray or Cmd+Q. On quit, stop watchers and stop Ollama only if this app started it (`owned`).

## Storage today

| Path | Contents |
|------|----------|
| `app.getPath("userData")/settings.json` | App settings (`watchPaths: string[]`) |
| `<watchRoot>/.docless/` | Sidecar dir (mkdir + layout on watch start) |
| `<watchRoot>/.docless/docless.sqlite` | Per-root library DB (ADR 0008) |
| `<watchRoot>/.docless/.gitignore` | `*` so sidecar junk stays out of git |
| `userData/electron-ollama/` | Managed Ollama binary (when installed by app) |
| Ollama’s own model store | `glm-ocr` weights (not under app control) |

### Sidecar DB (ADR 0008)

- **File:** `.docless/docless.sqlite` (WAL; checkpoint on quit). Opened from main when a watch root starts (`src/main/db`).
- **Owner:** Electron main only (`better-sqlite3`, hand migrates). Renderer never opens the file.
- **Identity:** canonical relative path (NFC, `/`, preserve case) = primary key (`src/main/track.ts`).
- **Track:** allowlist (case-insensitive): `pdf`, `png`, `jpg`, `jpeg`, `webp`, `tif`, `tiff`, `heic`, `gif`. No symlink follow. Chokidar cold scan (`ignoreInitial: false`) + live add/change/unlink; prune missing rows on `ready`.
- **documents columns:** `path`, `mtime_ms`, `size`, `content_hash`, `ocr_status`, `ocr_error`, `text`, `created_at_ms`, `updated_at_ms`.
- **ocr_status:** `pending` \| `running` \| `done` \| `failed` \| `skipped`.
- **Change detect:** mtime+size gate → SHA-256; hash change → `pending`, keep old `text` until new OCR succeeds.
- **Delete:** unlink → hard delete row. Rename = new path (re-OCR).
- **Migrate:** forward-only `PRAGMA user_version` TS steps in transactions; backup `docless.sqlite.bak-v{k}` before each step (keep ~2); refuse DB newer than app + notify. Corrupt open → quarantine `docless.sqlite.corrupt-<ts>` + fresh DB + notify.
- **Non-goals:** FTS, page table, rename-merge, multi-instance, global `userData` index.

## IPC (`window.api`)

- `settings.get` / `settings.set` → `{ watchPaths: string[] }` (set also resyncs watchers)
- `dialog.openDirectory` → `string | null`
- `ollama.ensureRuntime` / `ensureModel` / `reinstall` / `status` / `onProgress`
- `notify.show`
- `windowRole`: `"main"` \| `"compact"`

## Not built

OCR job queue, calling `glm-ocr`, FTS/search, tags, document viewer, watch→renderer IPC.

## Decisions

See [docs/adr/](adr/).
