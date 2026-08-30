const IGNORE_MS = 1500;
const ignored = new Set<string>();

function key(root: string, abs: string): string {
    return `${root}\0${abs}`;
}

export function ignorePath(root: string, abs: string): void {
    const k = key(root, abs);
    ignored.add(k);
    setTimeout(() => ignored.delete(k), IGNORE_MS);
}

export function isIgnored(root: string, abs: string): boolean {
    return ignored.has(key(root, abs));
}
