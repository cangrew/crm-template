import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolve the tsconfig "@/*" path alias natively (replaces the deprecated
    // vite-tsconfig-paths plugin).
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Playwright specs live in e2e/ and are run by their own runner.
    exclude: ["**/node_modules/**", "**/.next/**", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**/*.ts", "app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
      exclude: ["**/*.test.{ts,tsx}", "**/*.d.ts", "e2e/**"],
      // Enforce the conventions' 80%+ target on the highest-risk areas
      // (domain logic and auth/permission helpers). Other dirs are reported
      // but not gated.
      thresholds: {
        "lib/domain/**": { statements: 80, branches: 80, functions: 80, lines: 80 },
        "lib/auth/**": { statements: 80, branches: 80, functions: 80, lines: 80 },
      },
    },
  },
});
