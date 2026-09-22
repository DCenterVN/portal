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
      "@dcentervn/auth-core": resolve(__dirname, "../auth-core/src"),
      "@dcentervn/api-client": resolve(__dirname, "../api-client/src"),
    },
  },
});
