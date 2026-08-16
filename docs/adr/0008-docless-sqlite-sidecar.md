# SQLite sidecar per watched root

Each watched root keeps library state in `.docless/docless.sqlite` (OCR text included). Document identity is the canonical relative path. Electron main is the sole writer, via `better-sqlite3` + Drizzle for schema/queries. Chosen over JSON files for query/FTS-ready storage while keeping metadata portable with the folder (ADR 0006).

**Status:** accepted

**Considered:** JSON/text files (portable, dual-write pain); SQLite in `userData` (faster global search, breaks folder portability); Prisma (poor fit for N dynamic DB paths).

**Consequences:**
- One DB per root; app unions at query time — no global mirror.
- Schema evolves with forward-only migrates (`PRAGMA user_version`), backup before each step, refuse DBs newer than the app.
- FTS, page rows, rename-merge, multi-instance locking are non-goals of this decision (later ADRs/stories).
- Layout detail: TGD-96 / architecture storage section.
