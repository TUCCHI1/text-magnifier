/**
 * Text Magnifier - Chrome拡張機能
 * ホバーした単語をアニメーションで拡大表示する
 */

// =============================================================================
// 型定義
// =============================================================================

/** 拡大状態を管理するアプリケーション状態 */
interface MagnifierState {
  /** 現在ラップ中の単語要素（なければnull） */
  wrapper: HTMLSpanElement | null;
  /** 保留中のアニメーションフレームID（なければnull） */
  animationFrameId: number | null;
}

/** テキスト内の単語の開始・終了位置 */
interface WordRange {
  start: number;
  end: number;
}

/** キャレット位置の情報 */
interface CaretInfo {
  node: Node;
  offset: number;
}

// =============================================================================
// 定数
// =============================================================================

/** 処理対象外のHTMLタグ */
const EXCLUDED_TAGS = new Set([
  'input',
  'textarea',
  'script',
  'style',
  'noscript',
  'svg',
]);

/** 拡大対象の単語に適用するCSSクラス */
const MAGNIFIER_CLASS = 'text-magnifier-word';

/** 拡大アニメーション開始時に追加するCSSクラス */
const MAGNIFIED_CLASS = 'magnified';

/**
 * 単語を構成する文字のパターン
 * 対象: ASCII英数字、ひらがな、カタカナ、漢字、ハングル
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

/**
 * テキストノードを作成する
 */
const createTextNode = (text: string): Text => document.createTextNode(text);

/**
 * 文字が単語を構成する文字かどうかを判定する
 */
const isWordCharacter = (char: string | undefined): boolean =>
  char !== undefined && WORD_CHARACTER_PATTERN.test(char);

/**
 * 指定座標のキャレット位置を取得する
 * W3C標準APIを優先し、Chrome/Safari用にフォールバック
 */
const getCaretInfoAtPoint = (x: number, y: number): CaretInfo | null => {
  // W3C標準API（Firefox、将来のブラウザ）
  if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(x, y);
    if (!position) return null;

    return {
      node: position.offsetNode,
      offset: position.offset,
    };
  }

  // Chrome/Safari独自API（types.d.tsで型定義済み）
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

/**
 * 要素が拡大対象外かどうかを判定する
 */
const isExcludedElement = (element: Element | null): boolean => {
  if (!element) return true;

  const tagName = element.tagName.toLowerCase();
  if (EXCLUDED_TAGS.has(tagName)) return true;

  if (element instanceof HTMLElement && element.isContentEditable) return true;

  if (element.closest(`.${MAGNIFIER_CLASS}`)) return true;

  return false;
};

/**
 * ノードが処理可能なテキストノードかどうかを検証する
 */
const isValidTextNode = (node: Node): boolean =>
  node.nodeType === Node.TEXT_NODE && !isExcludedElement(node.parentElement);

// =============================================================================
// 単語検出
// =============================================================================

/**
 * 指定オフセット位置の単語の範囲を検出する
 * 単語が見つからない場合はnullを返す
 */
const findWordRange = (text: string, offset: number): WordRange | null => {
  let start = offset;
  let end = offset;

  // 前方に拡張して単語の開始位置を探す
  while (start > 0 && isWordCharacter(text[start - 1])) {
    start--;
  }

  // 後方に拡張して単語の終了位置を探す
  while (end < text.length && isWordCharacter(text[end])) {
    end++;
  }

  // 範囲が拡張されなければ単語なし
  if (start === end) return null;

  return { start, end };
};

/**
 * テキストから指定範囲の単語を抽出する
 */
const extractWord = (text: string, range: WordRange): string =>
  text.substring(range.start, range.end);

// =============================================================================
// DOM操作
// =============================================================================

/**
 * 現在の拡大ラッパーを削除し、元のテキストに戻す
 */
const removeMagnification = (): void => {
  const { wrapper } = state;
  if (!wrapper?.parentNode) return;

  const originalText = wrapper.textContent ?? '';
  wrapper.replaceWith(createTextNode(originalText));
  state.wrapper = null;
};

/**
 * 単語を拡大用spanでラップし、アニメーションを開始する
 */
const applyMagnification = (textNode: Node, range: WordRange): HTMLSpanElement => {
  const fullText = textNode.textContent ?? '';
  const word = extractWord(fullText, range);

  // ラッパー要素を作成
  const wrapper = document.createElement('span');
  wrapper.className = MAGNIFIER_CLASS;
  wrapper.textContent = word;

  // フラグメントを構築: [前のテキスト] + [ラッパー] + [後のテキスト]
  const fragment = document.createDocumentFragment();

  const textBefore = fullText.substring(0, range.start);
  const textAfter = fullText.substring(range.end);

  if (textBefore) fragment.appendChild(createTextNode(textBefore));
  fragment.appendChild(wrapper);
  if (textAfter) fragment.appendChild(createTextNode(textAfter));

  // 元のテキストノードをフラグメントで置換
  (textNode as ChildNode).replaceWith(fragment);

  // リフローを発生させてからアニメーションを開始
  void wrapper.offsetHeight;
  wrapper.classList.add(MAGNIFIED_CLASS);

  return wrapper;
};

// =============================================================================
// コアロジック
// =============================================================================

/**
 * 現在のマウス位置を処理し、適切な場合に拡大を適用する
 */
const processPosition = (x: number, y: number): void => {
  const caretInfo = getCaretInfoAtPoint(x, y);

  // 位置にキャレットが見つからない
  if (!caretInfo) {
    removeMagnification();
    return;
  }

  const { node, offset } = caretInfo;

  // 有効なテキストノードではない
  if (!isValidTextNode(node)) {
    removeMagnification();
    return;
  }

  const text = node.textContent ?? '';
  const wordRange = findWordRange(text, offset);

  // カーソル位置に単語がない
  if (!wordRange) {
    removeMagnification();
    return;
  }

  const word = extractWord(text, wordRange);

  // 同じ単語が既に拡大中ならスキップ
  if (state.wrapper?.textContent === word) return;

  // 新しい拡大を適用
  removeMagnification();
  state.wrapper = applyMagnification(node, wordRange);
};

// =============================================================================
// イベントハンドラ
// =============================================================================

/**
 * マウス移動を処理する（アニメーションフレームでスロットリング）
 */
const handleMouseMove = (event: MouseEvent): void => {
  // 処理中ならスキップ
  if (state.animationFrameId !== null) return;

  state.animationFrameId = requestAnimationFrame(() => {
    state.animationFrameId = null;
    processPosition(event.clientX, event.clientY);
  });
};

/**
 * マウスがドキュメントから離れた時の処理
 */
const handleMouseLeave = (): void => {
  // 保留中のアニメーションフレームをキャンセル
  if (state.animationFrameId !== null) {
    cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }

  removeMagnification();
};

// =============================================================================
// 初期化
// =============================================================================

document.addEventListener('mousemove', handleMouseMove, { passive: true });
document.addEventListener('mouseleave', handleMouseLeave);
