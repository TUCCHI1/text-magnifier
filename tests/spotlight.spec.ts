import { join } from 'node:path';
import { type BrowserContext, test as base, chromium, expect } from '@playwright/test';

const extensionPath = join(import.meta.dirname, '..', 'dist');

type WorkerFixtures = {
  extensionContext: BrowserContext;
};

const test = base.extend<object, WorkerFixtures>({
  extensionContext: [
    async ({}, use) => {
      const context = await chromium.launchPersistentContext('', {
        headless: false,
        args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
      });
      await use(context);
      await context.close();
    },
    { scope: 'worker' },
  ],
  page: async ({ extensionContext }, use) => {
    const page = await extensionContext.newPage();
    await use(page);
  },
});

const SPOTLIGHT_SELECTOR = '#reading-spotlight';
const DEMO_URL = 'http://localhost:3333/demo.html';

test.describe('Reading Spotlight', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DEMO_URL);
    await page.waitForTimeout(300);
  });

  test('手動操作モード', async ({ page }) => {
    await page.pause();
  });

  test('マウス移動でスポットライトが表示される', async ({ page }) => {
    await page.mouse.move(400, 200);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });
  });

  test('スポットライトがマウス位置を中心に配置される', async ({ page }) => {
    const mouseX = 400;
    const mouseY = 250;
    await page.mouse.move(mouseX, mouseY);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    const box = await spotlight.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      expect(Math.abs(centerX - mouseX)).toBeLessThanOrEqual(2);
      expect(Math.abs(centerY - mouseY)).toBeLessThanOrEqual(2);
    }
  });

  test('マウスがドキュメントから離れるとスポットライトが消える', async ({ page }) => {
    await page.mouse.move(400, 200);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    await page.evaluate(() => {
      document.dispatchEvent(new MouseEvent('mouseleave'));
    });
    await page.waitForTimeout(100);

    await expect(spotlight).not.toBeVisible();
  });

  test('スポットライトがクリックを妨げない（pointer-events: none）', async ({ page }) => {
    await page.mouse.move(400, 200);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    const pointerEvents = await spotlight.evaluate((el) => getComputedStyle(el).pointerEvents);

    expect(pointerEvents).toBe('none');
  });

  test('スポットライトが最前面に表示される（z-index）', async ({ page }) => {
    await page.mouse.move(400, 200);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    const zIndex = await spotlight.evaluate((el) => parseInt(getComputedStyle(el).zIndex, 10));

    expect(zIndex).toBe(2147483647);
  });

  test('周囲がディム（暗く）される', async ({ page }) => {
    await page.mouse.move(400, 200);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    const boxShadow = await spotlight.evaluate((el) => getComputedStyle(el).boxShadow);

    expect(boxShadow).toMatch(/rgba?\([^)]+\)/);
    expect(boxShadow).not.toBe('none');
  });

  test('スムーズに追従する（transitionが設定されている）', async ({ page }) => {
    await page.mouse.move(400, 200);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    const transition = await spotlight.evaluate((el) => getComputedStyle(el).transition);

    expect(transition).toMatch(/top|left/);
  });

  test('無効化→有効化でスポットライトが即座に再表示される', async ({ extensionContext, page }) => {
    const article = await page.locator('article p').first().boundingBox();
    expect(article).not.toBeNull();

    const mouseX = article!.x + article!.width / 2;
    const mouseY = article!.y + 20;

    await page.mouse.move(mouseX, mouseY);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    let [worker] = extensionContext.serviceWorkers();
    if (!worker) {
      worker = await extensionContext.waitForEvent('serviceworker');
    }

    await worker.evaluate(() => chrome.storage.sync.set({ enabled: false }));
    await page.waitForTimeout(200);
    await expect(spotlight).not.toBeVisible();

    await worker.evaluate(() => chrome.storage.sync.set({ enabled: true }));
    await page.waitForTimeout(200);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    const box = await spotlight.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      expect(Math.abs(centerX - mouseX)).toBeLessThanOrEqual(5);
      expect(Math.abs(centerY - mouseY)).toBeLessThanOrEqual(5);
    }
  });
});
