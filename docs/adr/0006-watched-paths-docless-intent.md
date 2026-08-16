# Watched paths and `.docless` intent

Users will add watched filesystem paths. For each watched root, Docless will keep app metadata under a `.docless` directory in that root so data stays next to the files (local-first, portable with the folder). This ADR records intent only — on-disk layout, watcher implementation, and index/DB choices are undecided.
