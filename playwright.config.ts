import { defineConfig, devices } from "@playwright/test";

process.loadEnvFile(".env.local");

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  // One worker: specs share one local database (cleanup deletes all abandoned rows) and parallel cold compiles race on the dev server.
  workers: 1,
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/en",
    reuseExistingServer: true,
    timeout: 120_000,
    // Dummy IDs so e2e/seo.spec.ts can prove GA4 waits for consent. Specs block both vendors' scripts.
    // A dev server you started yourself needs them too: GA_MEASUREMENT_ID=G-E2ETEST1 COOKIESCRIPT_ID=e2etest npm run dev
    env: { GA_MEASUREMENT_ID: "G-E2ETEST1", COOKIESCRIPT_ID: "e2etest" },
  },
});
