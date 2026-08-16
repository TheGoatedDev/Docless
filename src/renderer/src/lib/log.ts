import pino from "pino";

export const log = pino({
    level: import.meta.env.DEV ? "debug" : "info",
    browser: {
        asObject: true,
        transmit: {
            send(level, logEvent) {
                const data: Record<string, unknown> = {};
                for (const b of logEvent.bindings) Object.assign(data, b);
                let msg = "";
                for (const m of logEvent.messages) {
                    if (typeof m === "string") {
                        msg = msg ? `${msg} ${m}` : m;
                    } else if (m instanceof Error) {
                        data.err = { message: m.message, stack: m.stack };
                        if (!msg) msg = m.message;
                    } else if (m !== null && typeof m === "object") {
                        Object.assign(data, m);
                    } else if (m !== undefined) {
                        msg = msg ? `${msg} ${String(m)}` : String(m);
                    }
                }
                const lv =
                    level === "debug" ||
                    level === "info" ||
                    level === "warn" ||
                    level === "error" ||
                    level === "fatal"
                        ? level
                        : "info";
                window.api.log.write(
                    lv,
                    msg || lv,
                    Object.keys(data).length > 0 ? data : undefined,
                );
            },
        },
    },
});
