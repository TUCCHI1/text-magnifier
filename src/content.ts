interface State {
  currentWrapper: HTMLSpanElement | null;
  rafId: number | null;
}

interface WordBoundaries {
  start: number;
  end: number;
}

interface TextCaretPosition {
  node: Node;
  offset: number;
}

(() => {
  const EXCLUDED_TAGS = new Set(['input', 'textarea', 'script', 'style', 'noscript', 'svg']);
  const WORD_PATTERN = /[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/;

  const state: State = {
    currentWrapper: null,
    rafId: null
  };

  const unwrap = (): void => {
    if (!state.currentWrapper?.parentNode) return;

    const text = state.currentWrapper.textContent ?? '';
    state.currentWrapper.replaceWith(document.createTextNode(text));
    state.currentWrapper = null;
  };

  const shouldExclude = (element: Element | null): boolean => {
    if (!element) return true;
    if (EXCLUDED_TAGS.has(element.tagName.toLowerCase())) return true;
    if (element instanceof HTMLElement && element.isContentEditable) return true;
    if (element.closest('.text-magnifier-word')) return true;
    return false;
  };

  const getWordBoundaries = (text: string, offset: number): WordBoundaries | null => {
    const boundaries: WordBoundaries = { start: offset, end: offset };

    while (boundaries.start > 0 && WORD_PATTERN.test(text[boundaries.start - 1])) {
      boundaries.start--;
    }
    while (boundaries.end < text.length && WORD_PATTERN.test(text[boundaries.end])) {
      boundaries.end++;
    }

    return boundaries.start === boundaries.end ? null : boundaries;
  };

  const getCaretPosition = (x: number, y: number): TextCaretPosition | null => {
    // W3C standard (Firefox, future Chrome)
    if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(x, y);
      if (!pos) return null;
      return { node: pos.offsetNode, offset: pos.offset };
    }
    // Chrome/Safari proprietary API
    const range = document.caretRangeFromPoint(x, y);
    if (!range) return null;
    return { node: range.startContainer, offset: range.startOffset };
  };

  const wrapWord = (textNode: Node, boundaries: WordBoundaries): HTMLSpanElement => {
    const text = textNode.textContent ?? '';
    const word = text.substring(boundaries.start, boundaries.end);

    const wrapper = document.createElement('span');
    wrapper.className = 'text-magnifier-word';
    wrapper.textContent = word;

    const fragment = document.createDocumentFragment();

    if (boundaries.start > 0) {
      fragment.appendChild(document.createTextNode(text.substring(0, boundaries.start)));
    }
    fragment.appendChild(wrapper);
    if (boundaries.end < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(boundaries.end)));
    }

    (textNode as ChildNode).replaceWith(fragment);

    // Trigger reflow then add magnified class for animation
    void wrapper.offsetHeight;
    wrapper.classList.add('magnified');

    return wrapper;
  };

  const processMousePosition = (x: number, y: number): void => {
    const caret = getCaretPosition(x, y);

    if (!caret) {
      unwrap();
      return;
    }

    const { node: textNode, offset } = caret;

    if (textNode.nodeType !== Node.TEXT_NODE || shouldExclude(textNode.parentElement)) {
      unwrap();
      return;
    }

    const boundaries = getWordBoundaries(textNode.textContent ?? '', offset);

    if (!boundaries) {
      unwrap();
      return;
    }

    const word = (textNode.textContent ?? '').substring(boundaries.start, boundaries.end);

    // Skip if same word is already wrapped
    if (state.currentWrapper?.textContent === word) return;

    unwrap();
    state.currentWrapper = wrapWord(textNode, boundaries);
  };

  const handleMouseMove = (e: MouseEvent): void => {
    if (state.rafId) return;

    state.rafId = requestAnimationFrame(() => {
      state.rafId = null;
      processMousePosition(e.clientX, e.clientY);
    });
  };

  const handleMouseLeave = (): void => {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    unwrap();
  };

  document.addEventListener('mousemove', handleMouseMove, { passive: true });
  document.addEventListener('mouseleave', handleMouseLeave);
})();
