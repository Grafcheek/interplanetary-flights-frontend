import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const viteVars = Object.fromEntries(
    Object.entries(env).filter(([key]) => key.startsWith("VITE_")),
  );

  if (mode === "tauri") {
    // Force .env.tauri values for Tauri builds even if OS-level env vars are stale.
    Object.entries(viteVars).forEach(([key, value]) => {
      process.env[key] = value;
    });
  }

  const useHttps = mode === "https";
  const tauriEnvDefines =
    mode === "tauri"
      ? Object.fromEntries(
          Object.entries(viteVars).map(([key, value]) => [
            `import.meta.env.${key}`,
            JSON.stringify(value),
          ]),
        )
      : {};

  return {
    base: env.VITE_BASE_PATH || "/",
    define: tauriEnvDefines,
    optimizeDeps: {
      exclude: ["@mlc-ai/web-llm"],
    },
    plugins: [
      react(),
      svelte(),
      ...(useHttps ? [basicSsl()] : []),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["logo.png", "pwa-192.png", "pwa-512.png"],
        workbox: {
          maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
        },
        manifest: {
          name: "Interplanetary Flights",
          short_name: "Flights",
          description: "Каталог межпланетных перелетов",
          theme_color: "#000000",
          background_color: "#000000",
          display: "standalone",
          start_url: ".",
          icons: [
            {
              src: "pwa-192.png",
              sizes: "128x128",
              type: "image/png",
            },
            {
              src: "pwa-512.png",
              sizes: "256x256",
              type: "image/png",
            },
          ],
        },
      }),
    ],
    server: {
      watch: {
        usePolling: true,
      },
      host: true,
      strictPort: true,
      port: 3000,
      proxy: {
        "/api": {
          target: "http://localhost:8080",
          changeOrigin: true,
        },
        "/minio": {
          target: "http://localhost:9000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/minio/, ""),
        },
      },
    },
  };
});
