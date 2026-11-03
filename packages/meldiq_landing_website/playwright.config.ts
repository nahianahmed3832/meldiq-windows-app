import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests of the built site (`npm run build` first): the static export served with production's headers
 * (scripts/serve.mjs) in front of a mock of the Meldiq API (e2e/mock-api.mjs). Desktop and phone-sized Chromium, and
 * WebKit. The real API's billing behaviour is tested in meldiq_android/server.
 */
const API_PORT = 8199;
const SITE_PORT = 4199;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://127.0.0.1:${SITE_PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 860 } } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: [
    { command: `node e2e/mock-api.mjs ${API_PORT}`, port: API_PORT, reuseExistingServer: false },
    { command: `node scripts/serve.mjs out ${SITE_PORT}`, port: SITE_PORT, reuseExistingServer: false, env: { MELDIQ_API_UPSTREAM: `http://127.0.0.1:${API_PORT}` } },
  ],
});
