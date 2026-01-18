import { test as base, expect, chromium, BrowserContext } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const extensionPath = join(__dirname, '..', 'dist');

const test = base.extend<{ context: BrowserContext }>({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
    await use(context);
    await context.close();
  },
});

const SPOTLIGHT_SELECTOR = '#reading-spotlight';

test.describe('Reading Spotlight', () => {
  test('手動操作モード', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:3333/fixture.html');
    await page.pause();
  });

  test('マウス移動でスポットライトが表示される', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:3333/fixture.html');
    await page.waitForTimeout(300);

    await page.mouse.move(400, 200);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });
  });

  test('スポットライトがマウス位置を中心に配置される', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:3333/fixture.html');
    await page.waitForTimeout(300);

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

      // 中心位置がマウス位置と一致（2px以内）
      expect(Math.abs(centerX - mouseX)).toBeLessThanOrEqual(2);
      expect(Math.abs(centerY - mouseY)).toBeLessThanOrEqual(2);
    }
  });

  test('マウスがドキュメントから離れるとスポットライトが消える', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:3333/fixture.html');
    await page.waitForTimeout(300);

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

  test('スポットライトがクリックを妨げない（pointer-events: none）', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:3333/fixture.html');
    await page.waitForTimeout(300);

    await page.mouse.move(400, 200);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    const pointerEvents = await spotlight.evaluate((el) =>
      getComputedStyle(el).pointerEvents
    );

    expect(pointerEvents).toBe('none');
  });

  test('スポットライトが最前面に表示される（z-index）', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:3333/fixture.html');
    await page.waitForTimeout(300);

    await page.mouse.move(400, 200);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    const zIndex = await spotlight.evaluate((el) =>
      parseInt(getComputedStyle(el).zIndex, 10)
    );

    expect(zIndex).toBe(2147483647);
  });

  test('周囲がディム（暗く）される', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:3333/fixture.html');
    await page.waitForTimeout(300);

    await page.mouse.move(400, 200);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    // box-shadowが設定されていることを確認
    const boxShadow = await spotlight.evaluate((el) =>
      getComputedStyle(el).boxShadow
    );

    // box-shadow should contain rgba with some opacity
    expect(boxShadow).toMatch(/rgba?\([^)]+\)/);
    expect(boxShadow).not.toBe('none');
  });

  test('スムーズに追従する（transitionが設定されている）', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:3333/fixture.html');
    await page.waitForTimeout(300);

    await page.mouse.move(400, 200);
    await page.waitForTimeout(100);

    const spotlight = page.locator(SPOTLIGHT_SELECTOR);
    await expect(spotlight).toBeVisible({ timeout: 2000 });

    const transition = await spotlight.evaluate((el) =>
      getComputedStyle(el).transition
    );

    // transition should include top and left
    expect(transition).toMatch(/top|left/);
  });
});
