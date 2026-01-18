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
  test('手動操作モード', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:3333/fixture.html');

    // ここで一時停止 - ブラウザを自由に操作できる
    // Playwright Inspectorの「Resume」ボタンで再開
    await page.pause();
  });

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

  test('拡大された文字のベースラインが大きくずれない', async ({ context }) => {
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

    // ベースラインのズレをチェック
    // transform: scale() は要素boxの下端からスケールするため
    // 完全一致ではなく、許容範囲内かを確認
    const baselineOffset = await page.evaluate(() => {
      const magnifiedEl = document.querySelector('.text-magnifier-word.magnified');
      if (!magnifiedEl) return 999;

      const magnifiedRect = magnifiedEl.getBoundingClientRect();
      const nextSibling = magnifiedEl.nextSibling;

      if (!nextSibling || nextSibling.nodeType !== Node.TEXT_NODE) return 0;

      const range = document.createRange();
      range.selectNodeContents(nextSibling);
      const rects = range.getClientRects();

      if (rects.length === 0) return 0;

      const adjacentRect = rects[0];
      if (!adjacentRect || adjacentRect.width === 0) return 0;

      return Math.abs(magnifiedRect.bottom - adjacentRect.bottom);
    });

    // transform: scale()では多少のズレは許容（8px以内）
    expect(baselineOffset).toBeLessThan(8);
  });

  test('拡大中の要素上でマウスを動かしても再発火しない', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:3333/fixture.html');
    await page.waitForTimeout(2000);

    const paragraph = page.locator('#english-text');
    const box = await paragraph.boundingBox();
    if (!box) throw new Error('Element not found');

    // 最初のホバー
    await page.mouse.move(box.x + 60, box.y + 10);
    await page.waitForTimeout(300);

    const magnified = page.locator('.text-magnifier-word.magnified');
    await expect(magnified).toBeVisible({ timeout: 5000 });

    // 拡大された要素の初期テキストを記録
    const initialText = await magnified.textContent();

    // DOM変更を監視
    const mutationCount = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let count = 0;
        const observer = new MutationObserver((mutations) => {
          count += mutations.length;
        });
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
        });

        // 500ms後に監視終了
        setTimeout(() => {
          observer.disconnect();
          resolve(count);
        }, 500);
      });
    });

    // 拡大された要素の範囲内でマウスを少し動かす
    const magnifiedBox = await magnified.boundingBox();
    if (magnifiedBox) {
      // 要素内で5回マウスを動かす
      for (let i = 0; i < 5; i++) {
        await page.mouse.move(
          magnifiedBox.x + magnifiedBox.width * (0.3 + i * 0.1),
          magnifiedBox.y + magnifiedBox.height * 0.5
        );
        await page.waitForTimeout(50);
      }
    }

    // 要素が変わっていないことを確認
    const finalText = await magnified.textContent();
    expect(finalText).toBe(initialText);

    // DOM変更が発生していないことを確認（または最小限）
    // アニメーション関連の変更は許容するため、大きな変更がないことを確認
    expect(mutationCount).toBeLessThan(10);
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
      const testEl = document.createElement('span');
      testEl.className = 'text-magnifier-word';
      document.body.appendChild(testEl);
      const style = getComputedStyle(testEl);
      const transition = style.transition || '';
      document.body.removeChild(testEl);

      return transition.includes('transform') || transition.includes('0.18s');
    });

    expect(hasTransition).toBe(true);

    // 実際にスケールが適用されるか確認
    await page.mouse.move(box.x + 60, box.y + 10);
    await page.waitForTimeout(300);

    const isScaled = await page.evaluate(() => {
      const el = document.querySelector('.text-magnifier-word.magnified');
      if (!el) return false;

      const style = getComputedStyle(el);
      const transform = style.transform;

      // matrix(a, b, c, d, tx, ty) の形式でscaleが含まれるか
      // scale(1.35) → matrix(1.35, 0, 0, 1.35, 0, 0)
      if (transform === 'none') return false;

      const match = transform.match(/matrix\(([^,]+)/);
      if (!match) return false;

      const scaleValue = parseFloat(match[1] ?? '1');
      return scaleValue > 1;
    });

    expect(isScaled).toBe(true);
  });
});
