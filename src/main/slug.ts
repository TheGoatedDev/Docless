const EXT = /\.(pdf|png|jpe?g|webp|gif|tiff?|heic)$/i;

export function slugStem(raw: string): string {
    const line = (raw.split(/\r?\n/).find((l) => l.trim()) ?? "")
        .trim()
        .replace(/^["'`]+|["'`]+$/g, "")
        .replace(EXT, "");
    return line
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80)
        .replace(/-+$/g, "");
}

export function pickDest(
    dir: string,
    stem: string,
    ext: string,
    taken: (rel: string) => boolean,
): string | null {
    const prefix = dir === "." ? "" : `${dir}/`;
    for (let n = 1; n <= 99; n++) {
        const rel = `${prefix}${n === 1 ? stem : `${stem}-${n}`}${ext}`;
        if (!taken(rel)) return rel;
    }
    return null;
}
