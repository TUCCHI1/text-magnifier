(function() {
  'use strict';

  let currentWrapper = null;
  let lastProcessedTime = 0;
  const THROTTLE_INTERVAL = 16; // ~60fps

  // Restore the original text node from wrapper
  function unwrap() {
    if (currentWrapper && currentWrapper.parentNode) {
      const textNode = document.createTextNode(currentWrapper.textContent);
      currentWrapper.parentNode.replaceChild(textNode, currentWrapper);
      currentWrapper = null;
    }
  }

  // Check if element should be excluded
  function shouldExclude(element) {
    if (!element) return true;
    const tagName = element.tagName?.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'script' || tagName === 'style') {
      return true;
    }
    if (element.isContentEditable) return true;
    if (element.closest('.text-magnifier-word')) return true;
    return false;
  }

  // Find word boundaries in text
  function getWordBoundaries(text, offset) {
    // Pattern for word characters (includes Japanese, Chinese, Korean, and common letters)
    const wordPattern = /[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/;

    let start = offset;
    let end = offset;

    // Find start of word
    while (start > 0 && wordPattern.test(text[start - 1])) {
      start--;
    }

    // Find end of word
    while (end < text.length && wordPattern.test(text[end])) {
      end++;
    }

    // If no word found at position, return null
    if (start === end) return null;

    return { start, end };
  }

  // Main handler for mouse movement
  function handleMouseMove(e) {
    const now = Date.now();
    if (now - lastProcessedTime < THROTTLE_INTERVAL) return;
    lastProcessedTime = now;

    // Get the element and text node at cursor position
    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (!range) {
      unwrap();
      return;
    }

    const textNode = range.startContainer;
    const offset = range.startOffset;

    // Only process text nodes
    if (textNode.nodeType !== Node.TEXT_NODE) {
      unwrap();
      return;
    }

    // Check if parent should be excluded
    if (shouldExclude(textNode.parentElement)) {
      unwrap();
      return;
    }

    const text = textNode.textContent;
    const boundaries = getWordBoundaries(text, offset);

    if (!boundaries) {
      unwrap();
      return;
    }

    const word = text.substring(boundaries.start, boundaries.end);

    // If already wrapping the same word, do nothing
    if (currentWrapper && currentWrapper.textContent === word) {
      return;
    }

    // Unwrap previous word
    unwrap();

    // Split text node and wrap the word
    const beforeText = text.substring(0, boundaries.start);
    const afterText = text.substring(boundaries.end);

    const wrapper = document.createElement('span');
    wrapper.className = 'text-magnifier-word';
    wrapper.textContent = word;

    const fragment = document.createDocumentFragment();
    if (beforeText) fragment.appendChild(document.createTextNode(beforeText));
    fragment.appendChild(wrapper);
    if (afterText) fragment.appendChild(document.createTextNode(afterText));

    textNode.parentNode.replaceChild(fragment, textNode);
    currentWrapper = wrapper;
  }

  // Handle mouse leaving the document
  function handleMouseLeave() {
    unwrap();
  }

  // Initialize
  document.addEventListener('mousemove', handleMouseMove, { passive: true });
  document.addEventListener('mouseleave', handleMouseLeave);
})();
