import { defineConfig, devices } from '@playwright/test';

const e2ePort = 3187;
const useFirefox = process.env.E2E_BROWSER === 'firefox';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL: `http://localhost:${e2ePort}`,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        { name: useFirefox ? 'desktop-firefox' : 'desktop-chromium', use: { ...devices[useFirefox ? 'Desktop Firefox' : 'Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
        { name: useFirefox ? 'mobile-firefox' : 'mobile-chromium', use: { ...devices[useFirefox ? 'Desktop Firefox' : 'Pixel 7'], viewport: { width: 390, height: 844 } } },
    ],
    webServer: {
        command: `NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npm run dev -- --port ${e2ePort}`,
        url: `http://localhost:${e2ePort}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
