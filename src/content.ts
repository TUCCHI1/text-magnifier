/**
 * Text Magnifier - Chrome拡張機能
 *
 * 長文を読む際にカーソル位置を見失いやすい問題を解決するため、
 * ホバー中の単語を視覚的に強調表示する
 */

// =============================================================================
// 型定義
// =============================================================================

type MagnificationMode = 'word' | 'character';

interface MagnifierConfig {
  mode: MagnificationMode;
  characterCount: number;
  scaleFactor: number;
}

interface MagnifierState {
  wrapper: HTMLSpanElement | null;
  animationFrameId: number | null;
}

interface TextRange {
  start: number;
  end: number;
}

interface CaretInfo {
  node: Node;
  offset: number;
}

// =============================================================================
// 設定
// =============================================================================

const DEFAULT_CONFIG: MagnifierConfig = {
  mode: 'character',
  characterCount: 3,
  scaleFactor: 1.35,
};

/**
 * chrome.storage.syncから設定を読み込み、リアルタイムで同期
 * storageが利用できない環境ではデフォルト値を使用
 */
const config: MagnifierConfig = { ...DEFAULT_CONFIG };

const loadConfig = async () => {
  if (typeof chrome === 'undefined' || !chrome.storage) return;

  try {
    const keys = Object.keys(DEFAULT_CONFIG) as (keyof MagnifierConfig)[];
    const result = await chrome.storage.sync.get(keys);
    Object.assign(config, result);
  } catch {
    // storage読み込み失敗時はデフォルト値を維持
  }
};

const listenForConfigChanges = () => {
  if (typeof chrome === 'undefined' || !chrome.storage) return;

  chrome.storage.onChanged.addListener((changes) => {
    if (changes['mode']) config.mode = changes['mode'].newValue as MagnificationMode;
    if (changes['characterCount']) config.characterCount = changes['characterCount'].newValue as number;
    if (changes['scaleFactor']) config.scaleFactor = changes['scaleFactor'].newValue as number;
  });
};

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
// 範囲検出
// =============================================================================

/**
 * 単語モード: 英語はスペース区切り、日本語は連続文字をまとめて検出
 */
const findWordRange = (text: string, offset: number): TextRange | null => {
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

/**
 * 文字数モード: カーソル位置を中心にN文字を選択
 * 日本語のように単語境界が曖昧な言語で有効
 */
const findCharacterRange = (
  text: string,
  offset: number,
  count: number
): TextRange | null => {
  // 空白や記号の上にカーソルがある場合は無視
  if (!isWordCharacter(text[offset]) && !isWordCharacter(text[offset - 1])) {
    return null;
  }

  // カーソル位置を中心に前後に広げる
  const half = Math.floor(count / 2);
  let start = Math.max(0, offset - half);
  let end = Math.min(text.length, start + count);

  // 末尾に達した場合は開始位置を調整
  if (end === text.length && end - start < count) {
    start = Math.max(0, end - count);
  }

  if (start === end) return null;

  return { start, end };
};

const findRange = (text: string, offset: number): TextRange | null => {
  if (config.mode === 'character') {
    return findCharacterRange(text, offset, config.characterCount);
  }
  return findWordRange(text, offset);
};

const extractText = (text: string, range: TextRange) =>
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

const applyMagnification = (textNode: Node, range: TextRange) => {
  const fullText = textNode.textContent ?? '';
  const targetText = extractText(fullText, range);

  const wrapper = document.createElement('span');
  wrapper.className = MAGNIFIER_CLASS;
  wrapper.textContent = targetText;

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
   * font-sizeでスケールするため、要素は自然に広がる
   * 追加マージンは視覚的な余白として少量のみ設定
   */
  wrapper.style.setProperty('--magnifier-margin', '0.08em');
  wrapper.style.setProperty('--magnifier-scale', `${config.scaleFactor}em`);

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
  const range = findRange(text, offset);

  if (!range) {
    removeMagnification();
    return;
  }

  const targetText = extractText(text, range);

  // 同じテキストへの不要なDOM操作を避け、パフォーマンスを維持する
  if (state.wrapper?.textContent === targetText) return;

  removeMagnification();
  state.wrapper = applyMagnification(node, range);
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

(async () => {
  await loadConfig();
  listenForConfigChanges();

  // passiveオプションでスクロールパフォーマンスへの影響を防ぐ
  document.addEventListener('mousemove', handleMouseMove, { passive: true });
  document.addEventListener('mouseleave', handleMouseLeave);
})();
