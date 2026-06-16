import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Farmcast",
        short_name: "Farmcast",
        description: "Weeradvies voor Nederlandse boeren — spuitvensters, vorstrisico, oogstcondities",
        theme_color: "#070b14",
        background_color: "#070b14",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\//,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "open-meteo",
              expiration: { maxAgeSeconds: 600 },
            },
          },
          {
            urlPattern: /^https:\/\/geocoding-api\.open-meteo\.com\//,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "open-meteo-geo",
              expiration: { maxAgeSeconds: 86400 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
