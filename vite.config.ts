import { defineConfig, UserConfig } from "vite";
import { ViteMinifyPlugin } from "vite-plugin-minify";

function replaceTws() {
    return {
        name: "replace-tws",
        transform(code: string) {
            return {
                code: code.replace(/tw`(.*)`/g, '"$1"'),
            };
        },
    };
}

// https://vitejs.dev/config/
export default defineConfig(
    async () =>
        ({
            // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
            //
            // 1. prevent vite from obscuring rust errors
            clearScreen: false,
            root: "./src",
            build: {
                minify: "terser",
                cssMinify: false,
                cssCodeSplit: true,
                rollupOptions: {
                    input: {
                        main: "./src/main.html",
                        options: "./src/settings.html",
                        about: "./src/about.html",
                        help: "./src/help.html",
                        compile: "./src/compile.html",
                        read: "./src/read.html",
                    },
                    plugins: [replaceTws()],
                },
            },
            // 2. tauri expects a fixed port, fail if that port is not available
            server: {
                port: 1420,
                strictPort: true,
                watch: {
                    // 3. tell vite to ignore watching `src-tauri`
                    ignored: ["**/src-tauri/**"],
                },
            },
            plugins: [ViteMinifyPlugin()],
        }) satisfies UserConfig,
);
