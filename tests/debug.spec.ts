import { test, expect } from '@playwright/test';

test('拡張機能が読み込まれているか確認', async ({ page }) => {
  await page.goto('/fixture.html');
  await page.waitForTimeout(2000);

  // CSSルールが存在するか確認
  const hasMagnifierStyles = await page.evaluate(() => {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.cssText.includes('text-magnifier-word')) {
            return true;
          }
        }
      } catch {
        // Cross-origin stylesheets cannot be accessed
      }
    }
    return false;
  });

  console.log('拡張機能のCSS読み込み:', hasMagnifierStyles);

  // 実際のマウス移動を試す
  const paragraph = page.locator('#english-text');
  const box = await paragraph.boundingBox();

  if (box) {
    console.log('要素の位置:', box);

    // Playwrightのmouse.move()を使用
    await page.mouse.move(box.x + 30, box.y + 10);
    await page.waitForTimeout(500);

    // DOMの状態を確認
    const html = await page.locator('#english-text').innerHTML();
    console.log('ホバー後のHTML:', html);

    const magnifiedCount = await page.locator('.text-magnifier-word').count();
    console.log('拡大要素の数:', magnifiedCount);
  }

  // スクリーンショットを保存
  await page.screenshot({ path: 'test-results/debug-screenshot.png' });
});
