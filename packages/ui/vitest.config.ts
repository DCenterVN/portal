import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@dcentervn/design-tokens": resolve(__dirname, "../design-tokens/src"),
      "@dcentervn/auth-core": resolve(__dirname, "../auth-core/src"),
    },
  },
});
