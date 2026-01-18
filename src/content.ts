/**
 * Text Magnifier - Chrome Extension
 * Magnifies words on hover with smooth animation
 */

// =============================================================================
// Types
// =============================================================================

/** Application state for tracking the magnified word */
interface MagnifierState {
  /** Currently wrapped word element, null if none */
  wrapper: HTMLSpanElement | null;
  /** Pending animation frame ID, null if none */
  animationFrameId: number | null;
}

/** Start and end positions of a word within text */
interface WordRange {
  start: number;
  end: number;
}

/** Position information from caret detection */
interface CaretInfo {
  node: Node;
  offset: number;
}

// =============================================================================
// Constants
// =============================================================================

/** HTML tags that should never be processed */
const EXCLUDED_TAGS = new Set([
  'input',
  'textarea',
  'script',
  'style',
  'noscript',
  'svg',
]);

/** CSS class applied to magnified words */
const MAGNIFIER_CLASS = 'text-magnifier-word';

/** CSS class applied when magnification animation starts */
const MAGNIFIED_CLASS = 'magnified';

/**
 * Pattern matching word characters
 * Includes: ASCII letters/numbers, Japanese (Hiragana, Katakana, Kanji), Korean
 */
const WORD_CHARACTER_PATTERN = /[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/;

// =============================================================================
// State
// =============================================================================

const state: MagnifierState = {
  wrapper: null,
  animationFrameId: null,
};

// =============================================================================
// DOM Utilities
// =============================================================================

/**
 * Creates a text node with the given content
 */
const createTextNode = (text: string): Text => document.createTextNode(text);

/**
 * Checks if a character is a word character
 */
const isWordCharacter = (char: string | undefined): boolean =>
  char !== undefined && WORD_CHARACTER_PATTERN.test(char);

/**
 * Gets the caret position at given coordinates
 * Uses W3C standard API with fallback for Chrome/Safari
 */
const getCaretInfoAtPoint = (x: number, y: number): CaretInfo | null => {
  // W3C Standard API (Firefox, future browsers)
  if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(x, y);
    if (!position) return null;

    return {
      node: position.offsetNode,
      offset: position.offset,
    };
  }

  // Chrome/Safari proprietary API (type declared above)
  const range = document.caretRangeFromPoint(x, y);
  if (!range) return null;

  return {
    node: range.startContainer,
    offset: range.startOffset,
  };
};

// =============================================================================
// Element Validation
// =============================================================================

/**
 * Determines if an element should be excluded from magnification
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
 * Validates that a node is a processable text node
 */
const isValidTextNode = (node: Node): boolean =>
  node.nodeType === Node.TEXT_NODE && !isExcludedElement(node.parentElement);

// =============================================================================
// Word Detection
// =============================================================================

/**
 * Finds the boundaries of a word at the given offset position
 * Returns null if no word is found at that position
 */
const findWordRange = (text: string, offset: number): WordRange | null => {
  let start = offset;
  let end = offset;

  // Expand backwards to find word start
  while (start > 0 && isWordCharacter(text[start - 1])) {
    start--;
  }

  // Expand forwards to find word end
  while (end < text.length && isWordCharacter(text[end])) {
    end++;
  }

  // No word found if boundaries didn't expand
  if (start === end) return null;

  return { start, end };
};

/**
 * Extracts a word from text using the given range
 */
const extractWord = (text: string, range: WordRange): string =>
  text.substring(range.start, range.end);

// =============================================================================
// DOM Manipulation
// =============================================================================

/**
 * Removes the current magnification wrapper and restores original text
 */
const removeMagnification = (): void => {
  const { wrapper } = state;
  if (!wrapper?.parentNode) return;

  const originalText = wrapper.textContent ?? '';
  wrapper.replaceWith(createTextNode(originalText));
  state.wrapper = null;
};

/**
 * Wraps a word in a magnification span and triggers animation
 */
const applyMagnification = (textNode: Node, range: WordRange): HTMLSpanElement => {
  const fullText = textNode.textContent ?? '';
  const word = extractWord(fullText, range);

  // Create wrapper element
  const wrapper = document.createElement('span');
  wrapper.className = MAGNIFIER_CLASS;
  wrapper.textContent = word;

  // Build fragment: [before text] + [wrapper] + [after text]
  const fragment = document.createDocumentFragment();

  const textBefore = fullText.substring(0, range.start);
  const textAfter = fullText.substring(range.end);

  if (textBefore) fragment.appendChild(createTextNode(textBefore));
  fragment.appendChild(wrapper);
  if (textAfter) fragment.appendChild(createTextNode(textAfter));

  // Replace original text node with fragment
  (textNode as ChildNode).replaceWith(fragment);

  // Trigger reflow to enable CSS transition, then start animation
  void wrapper.offsetHeight;
  wrapper.classList.add(MAGNIFIED_CLASS);

  return wrapper;
};

// =============================================================================
// Core Logic
// =============================================================================

/**
 * Processes the current mouse position and applies magnification if appropriate
 */
const processPosition = (x: number, y: number): void => {
  const caretInfo = getCaretInfoAtPoint(x, y);

  // No caret found at position
  if (!caretInfo) {
    removeMagnification();
    return;
  }

  const { node, offset } = caretInfo;

  // Not a valid text node
  if (!isValidTextNode(node)) {
    removeMagnification();
    return;
  }

  const text = node.textContent ?? '';
  const wordRange = findWordRange(text, offset);

  // No word at cursor position
  if (!wordRange) {
    removeMagnification();
    return;
  }

  const word = extractWord(text, wordRange);

  // Same word already magnified - skip
  if (state.wrapper?.textContent === word) return;

  // Apply new magnification
  removeMagnification();
  state.wrapper = applyMagnification(node, wordRange);
};

// =============================================================================
// Event Handlers
// =============================================================================

/**
 * Handles mouse movement with animation frame throttling
 */
const handleMouseMove = (event: MouseEvent): void => {
  // Skip if already processing
  if (state.animationFrameId !== null) return;

  state.animationFrameId = requestAnimationFrame(() => {
    state.animationFrameId = null;
    processPosition(event.clientX, event.clientY);
  });
};

/**
 * Handles mouse leaving the document
 */
const handleMouseLeave = (): void => {
  // Cancel pending animation frame
  if (state.animationFrameId !== null) {
    cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }

  removeMagnification();
};

// =============================================================================
// Initialization
// =============================================================================

document.addEventListener('mousemove', handleMouseMove, { passive: true });
document.addEventListener('mouseleave', handleMouseLeave);
