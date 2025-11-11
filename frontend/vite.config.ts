import { VitePWA } from "vite-plugin-pwa";
import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import fs from "fs";

// Plugin to handle SPA routing fallback for preview server
function spaFallbackPlugin(): Plugin {
  return {
    name: "spa-fallback",
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        // Skip if it's an API request or has a file extension
        if (req.url?.startsWith("/api") || req.url?.includes(".")) {
          return next();
        }
        
        // For all other routes, serve index.html
        const indexPath = path.resolve(__dirname, "dist", "index.html");
        if (fs.existsSync(indexPath)) {
          res.setHeader("Content-Type", "text/html");
          fs.createReadStream(indexPath).pipe(res);
        } else {
          next();
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: "globalThis",
      },
      // Enable esbuild polyfill plugins
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
        }),
      ],
    },
  },
  plugins: [
    react(),
    spaFallbackPlugin(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      pwaAssets: {
        disabled: false,
        config: true,
      },
      manifest: {
        name: "frontend",
        short_name: "fe",
        description: "Frontend for Hunt App",
        theme_color: "#ffffff",
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        navigateFallback: "/index.html",
      },
      devOptions: {
        enabled: false,
        navigateFallback: "index.html",
        suppressWarnings: true,
        type: "module",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  preview: {
    port: 4173,
    strictPort: false,
    open: false,
  },
});
