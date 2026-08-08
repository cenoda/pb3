import { defineConfig, devices } from "@playwright/test";

/** Drop IDE/agent color env pair that makes every Node child emit NO_COLOR warnings. */
function cleanColorEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.NO_COLOR;
  delete env.FORCE_COLOR;
  return env;
}

/**
 * Phase-0 exit scenario E2E (headless Chromium).
 * Serves the built SPA via `vite preview` so fixture paths match production
 * (dist/parts, dist/benchmarks) — not only the Vite dev middleware.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command:
      "pnpm build && pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: cleanColorEnv(),
  },
});
