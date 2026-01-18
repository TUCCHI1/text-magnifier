/**
 * ブラウザAPI型拡張
 */

/**
 * Chrome/Safari独自のcaretRangeFromPoint APIをDocument型に追加
 * 非標準だがChrome/Safariでのテキスト位置取得に必要
 */
interface Document {
  caretRangeFromPoint(x: number, y: number): Range | null;
}
