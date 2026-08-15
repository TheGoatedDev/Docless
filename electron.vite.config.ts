import { resolve } from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";

export default defineConfig({
    main: {},
    preload: {},
    renderer: {
        resolve: {
            alias: {
                "@renderer": resolve("src/renderer/src"),
            },
        },
        plugins: [
            // ponytail: cast — dual vite copies from router-plugin vs electron-vite
            tanstackRouter({
                target: "react",
                routesDirectory: "./src/routes",
                generatedRouteTree: "./src/routeTree.gen.ts",
                autoCodeSplitting: true,
            }) as never,
            react(),
        ],
    },
});
