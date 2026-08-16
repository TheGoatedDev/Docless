---
name: shadcn
description: >-
  Add or update shadcn/ui components via CLI. Use when user asks for shadcn,
  shadcn/ui, ui components under components/ui, button/card/dialog/etc from
  the registry, or to refresh/overwrite existing shadcn components.
---

# shadcn/ui

Always use the CLI. Never hand-write or paste registry components.

## Commands

```bash
pnpm dlx shadcn@latest add <name>
pnpm dlx shadcn@latest add <name> --overwrite   # update
pnpm dlx shadcn@latest diff [name]              # upstream drift
pnpm dlx shadcn@latest add <name1> <name2>      # batch
```

## Project facts

- Config: `components.json` (repo root)
- UI: `src/renderer/src/components/ui/`
- Utils: `@renderer/lib/utils` (`cn`)
- Import: `import { Button } from "@renderer/components/ui/button"`
- Theme CSS: `src/renderer/src/assets/main.css`
- Electron-vite: CLI `init` cannot detect framework — manual once; `add` works
- After add/update: `pnpm typecheck:web`

## Do not

- Copy component source from docs/GitHub
- Edit `components.json` aliases unless asked
- Install extra theme libs until needed
