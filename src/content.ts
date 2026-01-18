/**
 * Text Magnifier - Chrome拡張機能
 *
 * 長文を読む際にカーソル位置を見失いやすい問題を解決するため、
 * ホバー中の単語を視覚的に強調表示する
 */

// =============================================================================
// 型定義
// =============================================================================

interface MagnifierState {
  wrapper: HTMLSpanElement | null;
  animationFrameId: number | null;
}

interface WordRange {
  start: number;
  end: number;
}

interface CaretInfo {
  node: Node;
  offset: number;
}

// =============================================================================
// 定数
// =============================================================================

/**
 * フォーム要素やスクリプトなど、テキスト拡大が不適切または
 * 予期しない動作を引き起こす要素を除外するため
 */
const EXCLUDED_TAGS = new Set([
  'input',
  'textarea',
  'script',
  'style',
  'noscript',
  'svg',
]);

const MAGNIFIER_CLASS = 'text-magnifier-word';
const MAGNIFIED_CLASS = 'magnified';

/**
 * 日本語・韓国語・中国語を含む多言語対応のため、
 * ASCII以外のUnicode範囲も単語文字として認識する
 */
const WORD_CHARACTER_PATTERN = /[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/;

// =============================================================================
// 状態
// =============================================================================

const state: MagnifierState = {
  wrapper: null,
  animationFrameId: null,
};

// =============================================================================
// DOMユーティリティ
// =============================================================================

const createTextNode = (text: string) => document.createTextNode(text);

const isWordCharacter = (char: string | undefined) =>
  char !== undefined && WORD_CHARACTER_PATTERN.test(char);

/**
 * ブラウザ間の互換性を確保するため、W3C標準APIを優先し、
 * 未対応ブラウザ（Chrome/Safari）では独自APIにフォールバック
 */
const getCaretInfoAtPoint = (x: number, y: number): CaretInfo | null => {
  if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(x, y);
    if (!position) return null;

    return {
      node: position.offsetNode,
      offset: position.offset,
    };
  }

  const range = document.caretRangeFromPoint(x, y);
  if (!range) return null;

  return {
    node: range.startContainer,
    offset: range.startOffset,
  };
};

// =============================================================================
// 要素の検証
// =============================================================================

const isExcludedElement = (element: Element | null) => {
  if (!element) return true;

  const tagName = element.tagName.toLowerCase();
  if (EXCLUDED_TAGS.has(tagName)) return true;

  // 編集可能要素では入力の邪魔になるため除外
  if (element instanceof HTMLElement && element.isContentEditable) return true;

  // 既にラップ済みの要素を再処理すると無限ループになるため除外
  if (element.closest(`.${MAGNIFIER_CLASS}`)) return true;

  return false;
};

const isValidTextNode = (node: Node) =>
  node.nodeType === Node.TEXT_NODE && !isExcludedElement(node.parentElement);

// =============================================================================
// 単語検出
// =============================================================================

const findWordRange = (text: string, offset: number): WordRange | null => {
  let start = offset;
  let end = offset;

  while (start > 0 && isWordCharacter(text[start - 1])) {
    start--;
  }

  while (end < text.length && isWordCharacter(text[end])) {
    end++;
  }

  if (start === end) return null;

  return { start, end };
};

const extractWord = (text: string, range: WordRange) =>
  text.substring(range.start, range.end);

// =============================================================================
// DOM操作
// =============================================================================

const removeMagnification = () => {
  const { wrapper } = state;
  if (!wrapper?.parentNode) return;

  const originalText = wrapper.textContent ?? '';
  wrapper.replaceWith(createTextNode(originalText));
  state.wrapper = null;
};

const applyMagnification = (textNode: Node, range: WordRange) => {
  const fullText = textNode.textContent ?? '';
  const word = extractWord(fullText, range);

  const wrapper = document.createElement('span');
  wrapper.className = MAGNIFIER_CLASS;
  wrapper.textContent = word;

  /**
   * DocumentFragmentを使用することで、DOM操作を1回にまとめ、
   * リフローの発生回数を最小化してパフォーマンスを向上させる
   */
  const fragment = document.createDocumentFragment();

  const textBefore = fullText.substring(0, range.start);
  const textAfter = fullText.substring(range.end);

  if (textBefore) fragment.appendChild(createTextNode(textBefore));
  fragment.appendChild(wrapper);
  if (textAfter) fragment.appendChild(createTextNode(textAfter));

  (textNode as ChildNode).replaceWith(fragment);

  /**
   * offsetHeightの参照でリフローを強制発生させることで、
   * 直後のクラス追加によるCSSトランジションを確実に発火させる
   */
  void wrapper.offsetHeight;
  wrapper.classList.add(MAGNIFIED_CLASS);

  return wrapper;
};

// =============================================================================
// コアロジック
// =============================================================================

const processPosition = (x: number, y: number) => {
  const caretInfo = getCaretInfoAtPoint(x, y);

  if (!caretInfo) {
    removeMagnification();
    return;
  }

  const { node, offset } = caretInfo;

  if (!isValidTextNode(node)) {
    removeMagnification();
    return;
  }

  const text = node.textContent ?? '';
  const wordRange = findWordRange(text, offset);

  if (!wordRange) {
    removeMagnification();
    return;
  }

  const word = extractWord(text, wordRange);

  // 同じ単語への不要なDOM操作を避け、パフォーマンスを維持する
  if (state.wrapper?.textContent === word) return;

  removeMagnification();
  state.wrapper = applyMagnification(node, wordRange);
};

// =============================================================================
// イベントハンドラ
// =============================================================================

/**
 * mousemoveは高頻度で発火するため、requestAnimationFrameで
 * ブラウザの描画タイミングに合わせてスロットリングする
 */
const handleMouseMove = (event: MouseEvent) => {
  if (state.animationFrameId !== null) return;

  state.animationFrameId = requestAnimationFrame(() => {
    state.animationFrameId = null;
    processPosition(event.clientX, event.clientY);
  });
};

const handleMouseLeave = () => {
  if (state.animationFrameId !== null) {
    cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }

  removeMagnification();
};

// =============================================================================
// 初期化
// =============================================================================

// passiveオプションでスクロールパフォーマンスへの影響を防ぐ
document.addEventListener('mousemove', handleMouseMove, { passive: true });
document.addEventListener('mouseleave', handleMouseLeave);
