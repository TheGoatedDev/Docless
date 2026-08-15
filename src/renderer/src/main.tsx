import "./assets/main.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { useOllama } from "./stores/ollama";
import { useSettings } from "./stores/settings";

const root = document.getElementById("root");
if (!root) throw new Error("root missing");

void useSettings.getState().hydrate();
void useOllama.getState().hydrate();

createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
