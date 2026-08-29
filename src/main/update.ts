import { is } from "@electron-toolkit/utils";
import electronUpdater from "electron-updater";
import { logger as rootLogger } from "./logger";
import { notifyMain } from "./notify";

const logger = rootLogger.child({ mod: "update" });

export function startUpdates(): void {
    if (is.dev) return;

    // ponytail: CJS default export — named ESM import is undefined at runtime
    const { autoUpdater } = electronUpdater;
    autoUpdater.logger = {
        info: (m) => logger.info(m),
        warn: (m) => logger.warn(m),
        error: (m) => logger.error(m),
        debug: (m) => logger.debug(m),
    };

    autoUpdater.on("update-downloaded", (info) => {
        notifyMain({
            title: "Update ready",
            body: `Docless ${info.version} installs when you quit.`,
        });
    });
    autoUpdater.on("error", (err) => {
        logger.error({ err }, "update check failed");
    });

    void autoUpdater.checkForUpdates();
}
