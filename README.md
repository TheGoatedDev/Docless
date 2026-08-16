# Docless

Local-first document app: watch folders, keep metadata on disk, OCR on-device. Nothing leaves the machine.

## Intent

- You add watched paths.
- Each watched root gets a `.docless` sidecar for Docless metadata.
- OCR runs via local [Ollama](https://ollama.com) (`glm-ocr`).

## Status

**Works:** Electron shell, tray + compact window, setup wizard, Ollama install/start/pull, settings with `watchPaths`, chokidar watch, per-root `.docless/docless.sqlite` (migrate + WAL).

**Not yet:** file track/upserts, OCR jobs, search/index, document UI.

## Stack

Electron + React + TypeScript ([electron-vite](https://electron-vite.org)), TanStack Router, Zustand, Tailwind/shadcn, Ollama, better-sqlite3 + Drizzle (main).

## Setup

```bash
pnpm install
pnpm dev
```

| script | what |
|--------|------|
| `pnpm dev` | run app |
| `pnpm build` | typecheck + production build |
| `pnpm lint` | biome check |
| `pnpm format` | biome write |
| `pnpm deps:check` | syncpack pin check |
| `pnpm deps:pin` | pin all deps exact |

Pre-commit: lint-staged (biome) + deps:check.  
Commit-msg: conventional commits (commitlint).

## Docs

- [Architecture](docs/architecture.md) — as-built process map
- [ADRs](docs/adr/) — decisions worth remembering
