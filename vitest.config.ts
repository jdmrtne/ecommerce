import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Separate from vite.config.ts (rather than merged with defineConfig +
// mergeConfig) so the app build config stays untouched by test-only
// settings - same reasoning as keeping tsconfig.app.json / tsconfig.node.json
// split in this project already.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    globals: false,
    restoreMocks: true,
  },
});
