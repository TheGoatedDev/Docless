import "./assets/main.css";

import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { router } from "./router";
import { useOllama } from "./stores/ollama";
import { useSettings } from "./stores/settings";

const root = document.getElementById("root");
if (!root) throw new Error("root missing");

void useSettings.getState().hydrate();
void useOllama.getState().hydrate();

createRoot(root).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
);
