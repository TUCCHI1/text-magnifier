import { join } from 'node:path';
import { chromium, type Page } from '@playwright/test';
import { spawn } from 'node:child_process';

const extensionPath = join(import.meta.dirname, '..', 'dist');
const outputDir = join(import.meta.dirname, '..', 'store', 'screenshots');
const storeDir = join(import.meta.dirname, '..', 'store');

const addAnnotation = async (page: Page, text: string) => {
  await page.evaluate((t) => {
    const el = document.createElement('div');
    el.textContent = t;
    el.style.cssText = `
      position: fixed;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #111;
      color: #fff;
      padding: 14px 28px;
      border-radius: 10px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 17px;
      font-weight: 500;
      z-index: 2147483647;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    `;
    document.body.appendChild(el);
  }, text);
};

const waitForSpotlight = async (page: Page) => {
  await page.waitForSelector('#reading-spotlight', { timeout: 5000 });
};

const triggerMouseMove = async (page: Page, x: number, y: number) => {
  await page.mouse.move(x, y);
  await page.evaluate((coords) => {
    document.dispatchEvent(new MouseEvent('mousemove', {
      clientX: coords[0],
      clientY: coords[1],
      bubbles: true,
    }));
  }, [x, y] as [number, number]);
};

const takeScreenshots = async () => {
  const server = spawn('npx', ['serve', storeDir, '-l', '3456', '--no-clipboard'], {
    stdio: 'ignore',
  });

  await new Promise((r) => setTimeout(r, 2000));

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  await page.goto('http://localhost:3456/demo.html');
  await page.waitForTimeout(3000);

  const p1 = await page.locator('article p').first().boundingBox();
  if (p1) {
    const x = p1.x + p1.width / 2;
    const y = p1.y + 20;
    await triggerMouseMove(page, x, y);
    await waitForSpotlight(page);
    await page.waitForTimeout(300);
  }

  await addAnnotation(page, 'Spotlight follows your cursor as you read');
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(outputDir, 'screenshot-1.png') });
  console.log('Saved: screenshot-1.png');

  await page.goto('http://localhost:3456/demo.html');
  await page.waitForTimeout(3000);

  const p2 = await page.locator('article p').nth(2).boundingBox();
  if (p2) {
    const x = p2.x + p2.width / 2;
    const y = p2.y + 20;
    await triggerMouseMove(page, x, y);
    await waitForSpotlight(page);
    await page.waitForTimeout(300);
  }

  await addAnnotation(page, 'Toggle with ⌘ + Shift + S');
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(outputDir, 'screenshot-2.png') });
  console.log('Saved: screenshot-2.png');

  await context.close();
  server.kill();
};

takeScreenshots();
