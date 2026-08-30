const ILLEGAL = new Set(["/", "\\", ":", "*", "?", '"', "<", ">", "|"]);

export function hyphenate(raw: string): string {
    let s = "";
    for (const ch of raw) {
        s += ch.charCodeAt(0) < 32 || ILLEGAL.has(ch) ? " " : ch;
    }
    return s
        .replace(/['`]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80)
        .replace(/-+$/g, "");
}

export function parseDate(raw: string): string | null {
    const m = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m || m[1] == null || m[2] == null || m[3] == null) return null;
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    return `${m[1]}-${m[2]}-${m[3]}`;
}

export function dateFromMs(ms: number): string {
    const d = new Date(ms);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${day}`;
}

function field(raw: string, key: string): string {
    const m = raw.match(new RegExp(`^${key}\\s*:\\s*(.*)$`, "im"));
    const v = m?.[1]?.trim() ?? "";
    if (/^none$/i.test(v) || v === "") return "";
    return v;
}

export function parseNameFields(raw: string): {
    date: string | null;
    vendor: string;
    what: string;
} {
    return {
        date: parseDate(field(raw, "DATE")),
        vendor: field(raw, "VENDOR"),
        what: field(raw, "WHAT"),
    };
}

export function assembleStem(
    date: string | null,
    vendor: string,
    what: string,
): string {
    const parts: string[] = [];
    if (date) parts.push(date);
    const v = hyphenate(vendor);
    const w = hyphenate(what);
    if (v) parts.push(v);
    if (w) parts.push(w);
    return parts.join("-");
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
