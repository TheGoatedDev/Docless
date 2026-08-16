---
name: add-adr
description: >-
  Add or supersede an architecture decision record in docs/adr/.
  Use when the user asks to add an ADR, record a decision, document why
  we chose X, write an architecture decision, or supersede an ADR.
---

# Add ADR

## When to write

All three must be true — otherwise refuse in one line:

1. **Hard to reverse** — changing later is costly
2. **Surprising without context** — a reader would wonder why
3. **Real trade-off** — genuine alternatives existed

Skip easy reversals, obvious choices, and implementation notes (those go in code or `docs/architecture.md`).

## Steps

1. List `docs/adr/*.md`. Next number = highest `NNNN` + 1 (zero-pad 4).
2. Check for an existing ADR on the same decision — update/supersede instead of duplicating.
3. Write `docs/adr/NNNN-slug.md` using the format below.
4. If the decision changes runtime shape (processes, storage paths, IPC, windows), patch `docs/architecture.md` in the same change.
5. Do not invent Proposed ADRs unless the user asks.

## Format

```md
# Short title

1–3 sentences: context, decision, why.
```

Optional (only if useful):

- **Status:** `proposed` | `accepted` | `deprecated` | `superseded by ADR-NNNN`
- **Considered options** — rejected alternatives worth remembering
- **Consequences** — non-obvious downstream effects

Slug: kebab-case, no date in the filename. Numbering is the order key.

## Superseding

New ADR states the new decision. Old ADR gets a one-line status: `superseded by ADR-NNNN`. Do not delete old ADRs.

## Examples that qualify

- Electron vs web SaaS; local Ollama vs cloud OCR; JSON settings vs DB
- Tray-resident lifecycle; `.docless` sidecar intent
- Later: SQLite vs files, watcher library, search engine — when actually chosen

## Do not

- One ADR per tiny library pin
- Restate the README
- Spec unbuilt pipelines “for later”
- Add tooling (generators, npm scripts) for ADRs
