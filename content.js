(() => {
  'use strict';

  const EXCLUDED_TAGS = new Set(['input', 'textarea', 'script', 'style', 'noscript', 'svg']);
  const WORD_PATTERN = /[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/;

  let currentWrapper = null;
  let rafId = null;

  const unwrap = () => {
    if (!currentWrapper?.parentNode) return;

    const text = currentWrapper.textContent;
    currentWrapper.replaceWith(document.createTextNode(text));
    currentWrapper = null;
  };

  const shouldExclude = (element) => {
    if (!element) return true;
    if (EXCLUDED_TAGS.has(element.tagName?.toLowerCase())) return true;
    if (element.isContentEditable) return true;
    if (element.closest('.text-magnifier-word')) return true;
    return false;
  };

  const getWordBoundaries = (text, offset) => {
    let start = offset;
    let end = offset;

    while (start > 0 && WORD_PATTERN.test(text[start - 1])) start--;
    while (end < text.length && WORD_PATTERN.test(text[end])) end++;

    return start === end ? null : { start, end };
  };

  const wrapWord = (textNode, boundaries) => {
    const text = textNode.textContent;
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

    textNode.replaceWith(fragment);

    // Trigger reflow then add magnified class for animation
    wrapper.offsetHeight;
    wrapper.classList.add('magnified');

    return wrapper;
  };

  const processMousePosition = (x, y) => {
    const range = document.caretRangeFromPoint(x, y);

    if (!range) {
      unwrap();
      return;
    }

    const { startContainer: textNode, startOffset: offset } = range;

    if (textNode.nodeType !== Node.TEXT_NODE || shouldExclude(textNode.parentElement)) {
      unwrap();
      return;
    }

    const boundaries = getWordBoundaries(textNode.textContent, offset);

    if (!boundaries) {
      unwrap();
      return;
    }

    const word = textNode.textContent.substring(boundaries.start, boundaries.end);

    // Skip if same word is already wrapped
    if (currentWrapper?.textContent === word) return;

    unwrap();
    currentWrapper = wrapWord(textNode, boundaries);
  };

  const handleMouseMove = (e) => {
    if (rafId) return;

    rafId = requestAnimationFrame(() => {
      rafId = null;
      processMousePosition(e.clientX, e.clientY);
    });
  };

  const handleMouseLeave = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    unwrap();
  };

  document.addEventListener('mousemove', handleMouseMove, { passive: true });
  document.addEventListener('mouseleave', handleMouseLeave);
})();
