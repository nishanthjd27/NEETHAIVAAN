/*
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),

      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "robots.txt", "icons/*.png"],
        manifest: false, // we use our own /public/manifest.json
        workbox: {
          // Cache strategies
          runtimeCaching: [
            {
              // API responses: network-first (fresh data preferred)
              urlPattern: /^https?:\/\/.*\/api\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
                networkTimeoutSeconds: 10,
              },
            },
            {
              // Static assets: cache-first
              urlPattern: /\.(?:js|css|woff2?|png|svg|ico)$/i,
              handler: "CacheFirst",
              options: {
                cacheName: "static-assets",
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
          // Serve offline.html when network fails
          navigateFallback: "/offline.html",
          navigateFallbackDenylist: [/^\/api/],
        },
        devOptions: {
          enabled: false, // disable SW in dev to avoid cache confusion
        },
      }),
    ],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },

    build: {
      target: "es2020",
      outDir: "dist",
      sourcemap: mode !== "production",
      // Split vendor chunks for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom"],
            router: ["react-router-dom"],
            axios: ["axios"],
          },
        },
      },
      // Warn on chunks > 500 kB
      chunkSizeWarningLimit: 500,
    },

    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://localhost:5000",
          changeOrigin: true,
        },
      },
    },

    preview: {
      port: 4173,
    },
  };
});
*/
