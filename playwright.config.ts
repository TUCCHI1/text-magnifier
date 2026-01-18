import { defineConfig } from '@playwright/test';

function getReporter() {
  if (process.env.CI) {
    return 'html';
  }
  return 'list';
}

export default defineConfig({
  testDir: './tests',
  testMatch: 'spotlight.spec.ts',
  timeout: 60000,
  reporter: getReporter(),
  webServer: {
    command: 'npx serve tests -l 3333 --no-clipboard',
    port: 3333,
    reuseExistingServer: true,
  },
});
