import { rmSync } from "node:fs";
import { join } from "node:path";
import { app, BrowserWindow, ipcMain } from "electron";
import { ElectronOllama } from "electron-ollama";
import type { OllamaProgress } from "../shared/ollama";

export type { OllamaProgress };

const HOST = "http://127.0.0.1:11434";
const MODEL = "maternion/LightOnOCR-2:1b";
const RENAME_MODEL = "llama3.2:1b";
const RUNTIME_DIR = "electron-ollama";

export type OllamaStatus = {
    running: boolean;
    modelPresent: boolean;
    owned: boolean;
    busy: boolean;
    /** electron-ollama binary already on disk (skip setup wizard if so) */
    installed: boolean;
    /** installed electron-ollama tag, or running server version */
    version: string | null;
};

let eo: ElectronOllama | null = null;
let owned = false;
let busy = false;

const client = (): ElectronOllama => {
    if (!eo) {
        eo = new ElectronOllama({ basePath: app.getPath("userData") });
    }
    return eo;
};

const emit = (event: OllamaProgress): void => {
    for (const w of BrowserWindow.getAllWindows()) {
        w.webContents.send("ollama:progress", event);
    }
};

const hasModel = async (name = MODEL): Promise<boolean> => {
    const res = await fetch(`${HOST}/api/tags`);
    if (!res.ok) return false;
    const data = (await res.json()) as {
        models?: { name?: string }[];
    };
    const want = name.toLowerCase();
    return (data.models ?? []).some((m) => {
        const n = m.name?.toLowerCase();
        return n === want || n?.startsWith(`${want}:`);
    });
};

const pullModel = async (name = MODEL): Promise<void> => {
    emit({ phase: "model", status: "pulling", percent: 0, message: name });
    const res = await fetch(`${HOST}/api/pull`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, stream: true }),
    });
    if (!res.ok || !res.body) {
        throw new Error(`pull failed: ${res.status}`);
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";

    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
            if (!line.trim()) continue;
            let row: {
                status?: string;
                completed?: number;
                total?: number;
                error?: string;
            };
            try {
                row = JSON.parse(line);
            } catch {
                continue;
            }
            if (row.error) throw new Error(row.error);
            const completed = row.completed;
            const total = row.total;
            const percent =
                completed != null && total != null && total > 0
                    ? Math.round((completed / total) * 100)
                    : undefined;
            emit({
                phase: "model",
                status: "pulling",
                percent,
                completed,
                total,
                message: row.status,
            });
        }
    }

    emit({ phase: "model", status: "ready", percent: 100 });
};

const diskVersion = async (): Promise<string | null> => {
    const downloaded = await client().downloadedVersions();
    // ponytail: tags sort ok enough; no semver dep
    return downloaded.sort().at(-1) ?? null;
};

const apiVersion = async (): Promise<string | null> => {
    try {
        const res = await fetch(`${HOST}/api/version`);
        if (!res.ok) return null;
        const data = (await res.json()) as { version?: string };
        return data.version ?? null;
    } catch {
        return null;
    }
};

const resolveVersion = async (): Promise<string | null> =>
    (await apiVersion()) ?? (await diskVersion());

const ensureRuntime = async (): Promise<void> => {
    emit({ phase: "runtime", status: "checking" });
    const c = client();
    if (await c.isRunning()) {
        emit({
            phase: "runtime",
            status: "ready",
            version: (await resolveVersion()) ?? undefined,
        });
        return;
    }

    const meta = await c.getMetadata("latest");
    emit({
        phase: "runtime",
        status: "downloading",
        percent: 0,
        message: meta.version,
    });
    // ponytail: serverLog is lifetime stdout (GIN access logs) — never map to progress
    await c.serve(meta.version, {
        downloadLog: (percent, message) => {
            emit({
                phase: "runtime",
                status: percent >= 100 ? "starting" : "downloading",
                percent,
                message,
            });
        },
    });
    owned = true;
    emit({
        phase: "runtime",
        status: "ready",
        percent: 100,
        version: (await resolveVersion()) ?? meta.version,
    });
};

const ensureModel = async (): Promise<void> => {
    emit({ phase: "model", status: "checking" });
    if (await hasModel()) {
        emit({ phase: "model", status: "ready", percent: 100 });
        return;
    }
    await pullModel();
};

const deleteModel = async (): Promise<void> => {
    const res = await fetch(`${HOST}/api/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: MODEL }),
    });
    // 404 = already gone
    if (!res.ok && res.status !== 404) {
        throw new Error(`delete model failed: ${res.status}`);
    }
};

const runBusy = async (
    phase: OllamaProgress["phase"],
    fn: () => Promise<void>,
): Promise<{ ok: true }> => {
    if (busy) throw new Error("ollama operation already running");
    busy = true;
    try {
        await fn();
        return { ok: true };
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        emit({ phase, status: "error", message });
        throw e;
    } finally {
        busy = false;
    }
};

export async function ensureOllamaRuntime(): Promise<{ ok: true }> {
    return runBusy("runtime", ensureRuntime);
}

export async function ensureOllamaModel(): Promise<{ ok: true }> {
    const r = await runBusy("model", ensureModel);
    const { kickOcr } = await import("./ocr");
    kickOcr();
    return r;
}

export async function ensureRenameModel(): Promise<void> {
    const { loadSettings } = await import("./settings");
    if (!loadSettings().autoRename) return;
    try {
        const st = await getOllamaStatus();
        if (!st.running) return;
        if (await hasModel(RENAME_MODEL)) return;
        await runBusy("model", () => pullModel(RENAME_MODEL));
    } catch {
        emit({
            phase: "model",
            status: "error",
            message: `failed to pull ${RENAME_MODEL}`,
        });
    }
}

/** DATE/VENDOR/WHAT lines from full OCR text via local llama3.2:1b. */
export async function nameGenerate(text: string): Promise<string> {
    const res = await fetch(`${HOST}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(2 * 60_000),
        body: JSON.stringify({
            model: RENAME_MODEL,
            prompt: `Extract from the document. Reply with exactly three lines, nothing else:
DATE: YYYY-MM-DD or NONE
VENDOR: company or person name or NONE
WHAT: short description of the document or NONE

Document:
${text}`,
            stream: false,
        }),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
            res.status === 404
                ? "llama3.2:1b model not present"
                : `Ollama generate failed: ${res.status}${body ? ` ${body.slice(0, 200)}` : ""}`,
        );
    }
    const data = (await res.json()) as { response?: string; error?: string };
    if (data.error) throw new Error(data.error);
    return data.response?.trim() ?? "";
}

/** OCR one image (base64, no data: prefix) via local LightOnOCR-2. */
export async function ocrGenerate(imageB64: string): Promise<string> {
    const res = await fetch(`${HOST}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(5 * 60_000),
        body: JSON.stringify({
            model: MODEL,
            prompt: "Extract the text.",
            images: [imageB64],
            stream: false,
        }),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
            res.status === 404
                ? "LightOnOCR-2 model not present"
                : `Ollama generate failed: ${res.status}${body ? ` ${body.slice(0, 200)}` : ""}`,
        );
    }
    const data = (await res.json()) as { response?: string; error?: string };
    if (data.error) throw new Error(data.error);
    // ponytail: blank page / logo can yield empty — still done
    return data.response?.trim() ?? "";
}

export async function reinstallOllama(): Promise<{ ok: true }> {
    const r = await runBusy("runtime", async () => {
        await stopOllamaIfOwned();
        rmSync(join(app.getPath("userData"), RUNTIME_DIR), {
            recursive: true,
            force: true,
        });
        await ensureRuntime();
        if (await hasModel()) await deleteModel();
        await pullModel();
    });
    const { kickOcr } = await import("./ocr");
    kickOcr();
    void ensureRenameModel();
    return r;
}

export async function getOllamaStatus(): Promise<OllamaStatus> {
    let running = false;
    let modelPresent = false;
    let installed = false;
    let version: string | null = null;
    try {
        const c = client();
        version = await diskVersion();
        installed = version != null;
        running = await c.isRunning();
        if (running) {
            modelPresent = await hasModel();
            version = (await apiVersion()) ?? version;
        }
    } catch {
        /* offline */
    }
    return { running, modelPresent, owned, busy, installed, version };
}

export async function stopOllamaIfOwned(): Promise<void> {
    if (!owned) return;
    await client().getServer()?.stop();
    owned = false;
}

export function registerOllamaIpc(): void {
    // ponytail: remove first so main HMR / re-entry never leaves half-registered channels
    const handlers = {
        "ollama:ensure-runtime": () => ensureOllamaRuntime(),
        "ollama:ensure-model": () => ensureOllamaModel(),
        "ollama:reinstall": () => reinstallOllama(),
        "ollama:status": () => getOllamaStatus(),
    } as const;
    for (const [channel, fn] of Object.entries(handlers)) {
        ipcMain.removeHandler(channel);
        ipcMain.handle(channel, fn);
    }
}
