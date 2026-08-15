import { createFileRoute } from "@tanstack/react-router";
import electronLogo from "../assets/electron.svg";
import Versions from "../components/Versions";
import { useStore } from "../stores/store";

export const Route = createFileRoute("/")({
    component: Index,
});

function Index(): React.JSX.Element {
    const ipcHandle = (): void => window.electron.ipcRenderer.send("ping");
    const count = useStore((s) => s.count);
    const inc = useStore((s) => s.inc);

    return (
        <>
            <img alt="logo" className="logo" src={electronLogo} />
            <div className="creator">Powered by electron-vite</div>
            <div className="text">
                Build an Electron app with <span className="react">React</span>
                &nbsp;and <span className="ts">TypeScript</span>
            </div>
            <p className="tip">
                Please try pressing <code>F12</code> to open the devTool
            </p>
            <div className="actions">
                <div className="action">
                    <a
                        href="https://electron-vite.org/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Documentation
                    </a>
                </div>
                <div className="action">
                    <button type="button" onClick={ipcHandle}>
                        Send IPC
                    </button>
                </div>
                <div className="action">
                    <button type="button" onClick={inc}>
                        Count: {count}
                    </button>
                </div>
            </div>
            <Versions />
        </>
    );
}
