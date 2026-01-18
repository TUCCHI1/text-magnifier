import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'spotlight.spec.ts',
  timeout: 60000,
  reporter: process.env.CI ? 'html' : 'list',
  webServer: {
    command: 'npx serve tests -l 3333 --no-clipboard',
    port: 3333,
    reuseExistingServer: true,
  },
});
