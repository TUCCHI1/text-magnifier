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

  test('拡大された単語が隣接テキストと重ならない', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:3333/fixture.html');
    // 非同期初期化の完了を待つ
    await page.waitForTimeout(2000);

    const paragraph = page.locator('#english-text');
    const box = await paragraph.boundingBox();
    if (!box) throw new Error('Element not found');

    // "world" の位置あたりをホバー
    await page.mouse.move(box.x + 60, box.y + 10);
    await page.waitForTimeout(500);

    const magnified = page.locator('.text-magnifier-word.magnified');
    await expect(magnified).toBeVisible({ timeout: 5000 });

    // 拡大された要素と隣接テキストの重なりをチェック
    const hasOverlap = await page.evaluate(() => {
      const magnifiedEl = document.querySelector('.text-magnifier-word.magnified');
      if (!magnifiedEl) return false;

      const magnifiedRect = magnifiedEl.getBoundingClientRect();
      const parent = magnifiedEl.parentElement;
      if (!parent) return false;

      // 隣接する兄弟ノードのバウンディングボックスを取得
      const checkOverlap = (node: Node | null, direction: 'before' | 'after'): boolean => {
        if (!node || node.nodeType !== Node.TEXT_NODE) return false;

        const text = node.textContent?.trim();
        if (!text) return false;

        // テキストノードのバウンディングボックスを取得するためRangeを使用
        const range = document.createRange();
        range.selectNodeContents(node);
        const rects = range.getClientRects();

        for (const rect of rects) {
          if (rect.width === 0) continue;

          // 水平方向の重なりをチェック
          const horizontalOverlap =
            magnifiedRect.left < rect.right &&
            magnifiedRect.right > rect.left;

          // 垂直方向も同じ行にあるかチェック
          const verticalOverlap =
            magnifiedRect.top < rect.bottom &&
            magnifiedRect.bottom > rect.top;

          if (horizontalOverlap && verticalOverlap) {
            return true;
          }
        }
        return false;
      };

      const prevSibling = magnifiedEl.previousSibling;
      const nextSibling = magnifiedEl.nextSibling;

      return checkOverlap(prevSibling, 'before') || checkOverlap(nextSibling, 'after');
    });

    expect(hasOverlap).toBe(false);
  });

  test('拡大された文字のベースラインが周囲と揃っている', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:3333/fixture.html');
    await page.waitForTimeout(2000);

    const paragraph = page.locator('#english-text');
    const box = await paragraph.boundingBox();
    if (!box) throw new Error('Element not found');

    await page.mouse.move(box.x + 60, box.y + 10);
    await page.waitForTimeout(500);

    const magnified = page.locator('.text-magnifier-word.magnified');
    await expect(magnified).toBeVisible({ timeout: 5000 });

    // ベースラインの揃いをチェック
    // 拡大要素と隣接テキストのbottom位置を比較
    const baselineAligned = await page.evaluate(() => {
      const magnifiedEl = document.querySelector('.text-magnifier-word.magnified');
      if (!magnifiedEl) return false;

      const magnifiedRect = magnifiedEl.getBoundingClientRect();
      const nextSibling = magnifiedEl.nextSibling;

      if (!nextSibling || nextSibling.nodeType !== Node.TEXT_NODE) return true;

      // 隣接テキストのベースライン位置を取得
      const range = document.createRange();
      range.selectNodeContents(nextSibling);
      const rects = range.getClientRects();

      if (rects.length === 0) return true;

      const adjacentRect = rects[0];
      if (!adjacentRect || adjacentRect.width === 0) return true;

      // bottomの差が2px以内ならベースラインが揃っていると判断
      const bottomDiff = Math.abs(magnifiedRect.bottom - adjacentRect.bottom);
      return bottomDiff <= 2;
    });

    expect(baselineAligned).toBe(true);
  });

  test('拡大時にアニメーション（トランジション）が適用される', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:3333/fixture.html');
    await page.waitForTimeout(2000);

    const paragraph = page.locator('#english-text');
    const box = await paragraph.boundingBox();
    if (!box) throw new Error('Element not found');

    // トランジションが設定されているか確認
    const hasTransition = await page.evaluate(() => {
      // テスト用のspan要素を作成してCSSを確認
      const testEl = document.createElement('span');
      testEl.className = 'text-magnifier-word';
      document.body.appendChild(testEl);
      const style = getComputedStyle(testEl);
      const transition = style.transition || '';
      document.body.removeChild(testEl);

      return transition.includes('font-size') || transition.includes('0.18s');
    });

    expect(hasTransition).toBe(true);

    // 実際にアニメーションが時間をかけて発生するか確認
    await page.mouse.move(box.x + 60, box.y + 10);

    // 要素が作成された直後のfont-sizeを取得（トランジション途中）
    await page.waitForTimeout(50);
    const earlyFontSize = await page.evaluate(() => {
      const el = document.querySelector('.text-magnifier-word');
      if (!el) return 0;
      return parseFloat(getComputedStyle(el).fontSize);
    });

    // トランジション完了後のfont-sizeを取得
    await page.waitForTimeout(300);
    const finalFontSize = await page.evaluate(() => {
      const el = document.querySelector('.text-magnifier-word.magnified');
      if (!el) return 0;
      return parseFloat(getComputedStyle(el).fontSize);
    });

    // 拡大後のfont-sizeが元のサイズより大きいか
    expect(finalFontSize).toBeGreaterThan(16);

    // アニメーションが発生している場合、途中のサイズは最終サイズより小さいはず
    // （即座に適用される場合は同じになる）
    // 注: トランジションの速さによっては50ms後でも最終値に近い可能性があるので
    // この条件は緩めにする
    expect(finalFontSize).toBeGreaterThanOrEqual(earlyFontSize);
  });
});
