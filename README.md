# Docless

Electron + React + TypeScript (electron-vite).

## Setup

```bash
pnpm install
pnpm dev
```

## Scripts

| script | what |
|--------|------|
| `pnpm dev` | run app |
| `pnpm build` | typecheck + production build |
| `pnpm lint` | biome check |
| `pnpm format` | biome write |
| `pnpm deps:check` | syncpack pin check |
| `pnpm deps:pin` | pin all deps exact |

Pre-commit: lint-staged (biome) + deps:check.
