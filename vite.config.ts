import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "apple-touch-icon-180x180.png", "pwa-*.png", "maskable-icon-512x512.png", "favicon.ico"],
      manifest: {
        name: "Farmcast",
        short_name: "Farmcast",
        description: "Weeradvies voor Nederlandse boeren — spuitvensters, vorstrisico, oogstcondities",
        theme_color: "#14110b",
        background_color: "#14110b",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
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
