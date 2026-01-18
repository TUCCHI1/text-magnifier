import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'magnifier.spec.ts',
  timeout: 60000,
  webServer: {
    command: 'npx serve tests -l 3333 --no-clipboard',
    port: 3333,
    reuseExistingServer: true,
  },
});
