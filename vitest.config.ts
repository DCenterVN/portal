import { configDefaults, defineConfig } from "vitest/config";
import path from "path";

const integrationRun = process.argv.some((argument) => argument === "tests/integration");

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  test: {
    environment: "node",
    exclude: integrationRun
      ? configDefaults.exclude
      : [...configDefaults.exclude, "**/*.it.test.ts", ".aidlc/**"],
  },
});
