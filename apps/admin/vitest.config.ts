import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
      "@contracts": resolve(__dirname, "./lib/contracts"),
      "@dcentervn/design-tokens": resolve(__dirname, "../../packages/design-tokens/src"),
      "@dcentervn/ui": resolve(__dirname, "../../packages/ui/src"),
      "@dcentervn/auth-core": resolve(__dirname, "../../packages/auth-core/src"),
      "@dcentervn/api-client": resolve(__dirname, "../../packages/api-client/src"),
      "@dcentervn/auth-react": resolve(__dirname, "../../packages/auth-react/src"),
    },
  },
});
