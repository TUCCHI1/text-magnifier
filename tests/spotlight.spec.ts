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
const LAYOUTS = {
  singleColumn: 'http://localhost:3333/layouts/single-column.html',
  twoColumn: 'http://localhost:3333/layouts/two-column.html',
  fixedHeader: 'http://localhost:3333/layouts/fixed-header.html',
  narrowContent: 'http://localhost:3333/layouts/narrow-content.html',
};

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

  test('マウス移動に即座に追従する', async ({ page }) => {
    await page.mouse.move(400, 200);
    await page.waitForTimeout(200);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    const box1 = await spotlight.boundingBox();
    expect(box1).not.toBeNull();

    await page.mouse.move(500, 300);
    await page.waitForTimeout(100);

    const box2 = await spotlight.boundingBox();
    expect(box2).not.toBeNull();

    const centerX = box2!.x + box2!.width / 2;
    const centerY = box2!.y + box2!.height / 2;

    expect(Math.abs(centerX - 500)).toBeLessThanOrEqual(5);
    expect(Math.abs(centerY - 300)).toBeLessThanOrEqual(5);
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

    const workers = extensionContext.serviceWorkers();
    const worker = workers[0] ?? (await extensionContext.waitForEvent('serviceworker'));

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

test.describe('リーディングモード', () => {
  test.beforeEach(async ({ extensionContext }) => {
    const workers = extensionContext.serviceWorkers();
    const worker = workers[0] ?? (await extensionContext.waitForEvent('serviceworker'));
    await worker.evaluate(() => chrome.storage.sync.set({ mode: 'reading', fixedYPercent: 40 }));
  });

  test.afterEach(async ({ extensionContext }) => {
    const workers = extensionContext.serviceWorkers();
    const worker = workers[0] ?? (await extensionContext.waitForEvent('serviceworker'));
    await worker.evaluate(() => chrome.storage.sync.set({ mode: 'follow' }));
  });

  test('Y位置が画面の固定位置に配置される', async ({ page }) => {
    await page.goto(DEMO_URL);
    await page.waitForTimeout(300);

    await page.mouse.move(400, 200);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    const viewportHeight = await page.evaluate(() => window.innerHeight);
    const expectedY = viewportHeight * 0.4;

    const box = await spotlight.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      const centerY = box.y + box.height / 2;
      expect(Math.abs(centerY - expectedY)).toBeLessThanOrEqual(5);
    }
  });

  test('X位置はマウスに追従する', async ({ page }) => {
    await page.goto(DEMO_URL);
    await page.waitForTimeout(300);

    const mouseX1 = 300;
    await page.mouse.move(mouseX1, 200);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    const box1 = await spotlight.boundingBox();
    expect(box1).not.toBeNull();
    const centerX1 = box1!.x + box1!.width / 2;
    expect(Math.abs(centerX1 - mouseX1)).toBeLessThanOrEqual(5);

    const mouseX2 = 600;
    await page.mouse.move(mouseX2, 200);
    await page.waitForTimeout(100);

    const box2 = await spotlight.boundingBox();
    expect(box2).not.toBeNull();
    const centerX2 = box2!.x + box2!.width / 2;
    expect(Math.abs(centerX2 - mouseX2)).toBeLessThanOrEqual(5);
  });

  test('マウスが離れてもスポットライトは消えない', async ({ page }) => {
    await page.goto(DEMO_URL);
    await page.waitForTimeout(300);

    await page.mouse.move(400, 200);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    await page.evaluate(() => {
      document.dispatchEvent(new MouseEvent('mouseleave'));
    });
    await page.waitForTimeout(100);

    await expect(spotlight).toBeVisible();
  });

  test('1カラムレイアウトで正常に動作する', async ({ page }) => {
    await page.goto(LAYOUTS.singleColumn);
    await page.waitForTimeout(300);

    const article = await page.locator('article p').first().boundingBox();
    expect(article).not.toBeNull();

    const mouseX = article!.x + article!.width / 2;
    await page.mouse.move(mouseX, 300);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    const box = await spotlight.boundingBox();
    expect(box).not.toBeNull();

    const centerX = box!.x + box!.width / 2;
    expect(Math.abs(centerX - mouseX)).toBeLessThanOrEqual(5);
  });

  test('2カラムレイアウトで本文エリアに合わせられる', async ({ page }) => {
    await page.goto(LAYOUTS.twoColumn);
    await page.waitForTimeout(300);

    const mainContent = await page.locator('.main-content article p').first().boundingBox();
    expect(mainContent).not.toBeNull();

    const mouseX = mainContent!.x + mainContent!.width / 2;
    await page.mouse.move(mouseX, 300);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    const box = await spotlight.boundingBox();
    expect(box).not.toBeNull();

    const centerX = box!.x + box!.width / 2;
    expect(Math.abs(centerX - mouseX)).toBeLessThanOrEqual(5);
  });

  test('固定ヘッダーレイアウトでコンテンツエリアに配置できる', async ({ page }) => {
    await page.goto(LAYOUTS.fixedHeader);
    await page.waitForTimeout(300);

    const content = await page.locator('.content article p').first().boundingBox();
    expect(content).not.toBeNull();

    const mouseX = content!.x + content!.width / 2;
    await page.mouse.move(mouseX, 300);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    const box = await spotlight.boundingBox();
    expect(box).not.toBeNull();
  });

  test('狭いコンテンツレイアウトでも正常に動作する', async ({ page }) => {
    await page.goto(LAYOUTS.narrowContent);
    await page.waitForTimeout(300);

    const card = await page.locator('.card article p').first().boundingBox();
    expect(card).not.toBeNull();

    const mouseX = card!.x + card!.width / 2;
    await page.mouse.move(mouseX, 300);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    const box = await spotlight.boundingBox();
    expect(box).not.toBeNull();

    const centerX = box!.x + box!.width / 2;
    expect(Math.abs(centerX - mouseX)).toBeLessThanOrEqual(5);
  });

  test('ウィンドウリサイズでY位置が再計算される', async ({ page }) => {
    await page.goto(DEMO_URL);
    await page.waitForTimeout(300);

    await page.mouse.move(400, 200);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    const initialBox = await spotlight.boundingBox();
    expect(initialBox).not.toBeNull();
    const initialCenterY = initialBox!.y + initialBox!.height / 2;

    await page.setViewportSize({ width: 800, height: 400 });
    await page.waitForTimeout(200);

    const newHeight = await page.evaluate(() => window.innerHeight);
    const expectedNewY = newHeight * 0.4;

    const newBox = await spotlight.boundingBox();
    expect(newBox).not.toBeNull();
    const newCenterY = newBox!.y + newBox!.height / 2;

    expect(Math.abs(newCenterY - expectedNewY)).toBeLessThanOrEqual(5);
    expect(newCenterY).not.toEqual(initialCenterY);
  });

  test('マウスが停止するとカーソルが非表示になる', async ({ page }) => {
    await page.goto(DEMO_URL);
    await page.waitForTimeout(300);

    await page.mouse.move(400, 200);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    const cursorBefore = await page.evaluate(() => getComputedStyle(document.body).cursor);
    expect(cursorBefore).not.toBe('none');

    await page.waitForTimeout(1200);

    const cursorAfter = await page.evaluate(() => getComputedStyle(document.body).cursor);
    expect(cursorAfter).toBe('none');
  });

  test('マウス移動でカーソルが再表示される', async ({ page }) => {
    await page.goto(DEMO_URL);
    await page.waitForTimeout(300);

    await page.mouse.move(400, 200);
    await page.waitForTimeout(1200);

    const cursorHidden = await page.evaluate(() => getComputedStyle(document.body).cursor);
    expect(cursorHidden).toBe('none');

    await page.mouse.move(450, 200);
    await page.waitForTimeout(50);

    const cursorVisible = await page.evaluate(() => getComputedStyle(document.body).cursor);
    expect(cursorVisible).not.toBe('none');
  });
});

test.describe('レインボーカラー', () => {
  test.beforeEach(async ({ extensionContext, page }) => {
    const workers = extensionContext.serviceWorkers();
    const worker = workers[0] ?? (await extensionContext.waitForEvent('serviceworker'));
    await worker.evaluate(() => chrome.storage.sync.set({ color: 'rainbow' }));
    await page.goto(DEMO_URL);
    await page.waitForTimeout(500);
  });

  test.afterEach(async ({ extensionContext }) => {
    const workers = extensionContext.serviceWorkers();
    const worker = workers[0] ?? (await extensionContext.waitForEvent('serviceworker'));
    await worker.evaluate(() => chrome.storage.sync.set({ color: 'yellow' }));
  });

  test('マウスX位置で色が変化する', async ({ page }) => {
    await page.mouse.move(100, 200);
    await page.waitForTimeout(200);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    const color1 = await spotlight.evaluate((el) =>
      el.style.getPropertyValue('--color')
    );

    await page.mouse.move(700, 200);
    await page.waitForTimeout(100);

    const color2 = await spotlight.evaluate((el) =>
      el.style.getPropertyValue('--color')
    );

    expect(color1).toMatch(/hsla/);
    expect(color2).toMatch(/hsla/);
    expect(color1).not.toBe(color2);
  });
});
