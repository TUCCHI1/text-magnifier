import { test as base, expect, chromium, BrowserContext } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const extensionPath = join(__dirname, '..', 'dist');

// 拡張機能を読み込んだコンテキストを使用するカスタムテスト
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

test.describe('Text Magnifier', () => {
  test('英語テキストをホバーすると単語が拡大される', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:3333/fixture.html');
    await page.waitForTimeout(1000);

    const paragraph = page.locator('#english-text');
    const box = await paragraph.boundingBox();
    if (!box) throw new Error('Element not found');

    await page.mouse.move(box.x + 30, box.y + 10);
    await page.waitForTimeout(500);

    const magnified = page.locator('.text-magnifier-word.magnified');
    await expect(magnified).toBeVisible({ timeout: 5000 });

    const text = await magnified.textContent();
    expect(text).toBeTruthy();
  });

  test('日本語テキストをホバーすると文字が拡大される', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:3333/fixture.html');
    await page.waitForTimeout(1000);

    const paragraph = page.locator('#japanese-text');
    const box = await paragraph.boundingBox();
    if (!box) throw new Error('Element not found');

    await page.mouse.move(box.x + 30, box.y + 10);
    await page.waitForTimeout(500);

    const magnified = page.locator('.text-magnifier-word.magnified');
    await expect(magnified).toBeVisible({ timeout: 5000 });
  });

  test('マウスが離れると拡大が解除される', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:3333/fixture.html');
    await page.waitForTimeout(1000);

    const paragraph = page.locator('#english-text');
    const box = await paragraph.boundingBox();
    if (!box) throw new Error('Element not found');

    await page.mouse.move(box.x + 30, box.y + 10);
    await page.waitForTimeout(500);

    const magnified = page.locator('.text-magnifier-word.magnified');
    await expect(magnified).toBeVisible({ timeout: 5000 });

    // ドキュメントからマウスが離れたことをシミュレート
    // page.mouse.move()ではビューポート外に移動できないため、
    // mouseleaveイベントを直接発火させる
    await page.evaluate(() => {
      document.dispatchEvent(new MouseEvent('mouseleave'));
    });
    await page.waitForTimeout(500);

    await expect(magnified).not.toBeVisible();
  });

  test('input要素では拡大されない', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:3333/fixture.html');
    await page.waitForTimeout(1000);

    const input = page.locator('#test-input');
    const box = await input.boundingBox();
    if (!box) throw new Error('Element not found');

    await page.mouse.move(box.x + 50, box.y + 10);
    await page.waitForTimeout(500);

    const magnified = page.locator('.text-magnifier-word.magnified');
    await expect(magnified).not.toBeVisible();
  });

  test('contenteditable要素では拡大されない', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:3333/fixture.html');
    await page.waitForTimeout(1000);

    const editable = page.locator('#test-editable');
    const box = await editable.boundingBox();
    if (!box) throw new Error('Element not found');

    await page.mouse.move(box.x + 50, box.y + 10);
    await page.waitForTimeout(500);

    const magnified = page.locator('.text-magnifier-word.magnified');
    await expect(magnified).not.toBeVisible();
  });
});
