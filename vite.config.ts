import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useHttps = mode === "https";

  return {
    base: env.VITE_BASE_PATH || "/",
    plugins: [
      react(),
      ...(useHttps ? [basicSsl()] : []),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["logo.png", "img/logo.png"],
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
              src: "logo.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "logo.png",
              sizes: "512x512",
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
      },
    },
  };
});
