# Auto-rename with a small local text model

After OCR succeeds, if `autoRename` is on, a separate queue asks `llama3.2:1b` for DATE/VENDOR/WHAT over the full OCR text and `fs.rename`s to `YYYY-MM-DD-Vendor-What.ext` (document date, else mtime, else omit; missing parts omitted; hyphens). Does not block the OCR pool. Sidecar path PK is updated first; watcher events for that move are ignored. Default off, future OCR only, once per row (`auto_renamed`). Not Finder rename-merge (ADR 0008). Still on-device, still a fixed tag (ADR 0003).

**Status:** accepted

**Considered:** display-name only (leaves SCAN_001.pdf on disk); model picker (extra UI + missing-model states); confirm UI; backfill existing `done` rows.

**Consequences:**
- Second Ollama pull, only when the toggle turns on — setup wizard stays OCR-only.
- In-app rename is not general rename-merge; Finder rename is still unlink + add.
