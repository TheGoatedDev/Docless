import { rmSync } from "node:fs";
import { join } from "node:path";
import { app, BrowserWindow, ipcMain } from "electron";
import { ElectronOllama } from "electron-ollama";

const HOST = "http://127.0.0.1:11434";
const MODEL = "glm-ocr";
const RUNTIME_DIR = "electron-ollama";

export type OllamaProgress =
    | {
          phase: "runtime";
          status: "checking" | "downloading" | "starting" | "ready" | "error";
          percent?: number;
          message?: string;
      }
    | {
          phase: "model";
          status: "checking" | "pulling" | "ready" | "error";
          percent?: number;
          message?: string;
          completed?: number;
          total?: number;
      };

export type OllamaStatus = {
    running: boolean;
    modelPresent: boolean;
    owned: boolean;
    busy: boolean;
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

const hasModel = async (): Promise<boolean> => {
    const res = await fetch(`${HOST}/api/tags`);
    if (!res.ok) return false;
    const data = (await res.json()) as {
        models?: { name?: string }[];
    };
    return (data.models ?? []).some(
        (m) => m.name === MODEL || m.name?.startsWith(`${MODEL}:`),
    );
};

const pullModel = async (): Promise<void> => {
    emit({ phase: "model", status: "pulling", percent: 0, message: MODEL });
    const res = await fetch(`${HOST}/api/pull`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: MODEL, stream: true }),
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

const ensureRuntime = async (): Promise<void> => {
    emit({ phase: "runtime", status: "checking" });
    const c = client();
    if (await c.isRunning()) {
        emit({ phase: "runtime", status: "ready" });
        return;
    }

    const meta = await c.getMetadata("latest");
    emit({
        phase: "runtime",
        status: "downloading",
        percent: 0,
        message: meta.version,
    });
    await c.serve(meta.version, {
        downloadLog: (percent, message) => {
            emit({
                phase: "runtime",
                status: percent >= 100 ? "starting" : "downloading",
                percent,
                message,
            });
        },
        serverLog: (message) => {
            emit({ phase: "runtime", status: "starting", message });
        },
    });
    owned = true;
    emit({ phase: "runtime", status: "ready", percent: 100 });
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

const runBusy = async (fn: () => Promise<void>): Promise<{ ready: true }> => {
    if (busy) throw new Error("ollama operation already running");
    busy = true;
    try {
        await fn();
        return { ready: true };
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        emit({ phase: "runtime", status: "error", message });
        throw e;
    } finally {
        busy = false;
    }
};

export async function ensureOllama(): Promise<{ ready: true }> {
    return runBusy(async () => {
        await ensureRuntime();
        await ensureModel();
    });
}

export async function reinstallOllama(): Promise<{ ready: true }> {
    return runBusy(async () => {
        await stopOllamaIfOwned();
        rmSync(join(app.getPath("userData"), RUNTIME_DIR), {
            recursive: true,
            force: true,
        });
        await ensureRuntime();
        if (await hasModel()) await deleteModel();
        await pullModel();
    });
}

export async function getOllamaStatus(): Promise<OllamaStatus> {
    let running = false;
    let modelPresent = false;
    try {
        running = await client().isRunning();
        if (running) modelPresent = await hasModel();
    } catch {
        /* offline */
    }
    return { running, modelPresent, owned, busy };
}

export async function stopOllamaIfOwned(): Promise<void> {
    if (!owned) return;
    await client().getServer()?.stop();
    owned = false;
}

export function registerOllamaIpc(): void {
    ipcMain.handle("ollama:ensure", () => ensureOllama());
    ipcMain.handle("ollama:reinstall", () => reinstallOllama());
    ipcMain.handle("ollama:status", () => getOllamaStatus());
}
