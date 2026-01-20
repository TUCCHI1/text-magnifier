import {
  type SpotlightConfig,
  PRESET_COLORS,
  DEFAULT_CONFIG,
  isColorKey,
  isNumber,
  isBoolean,
  isStringOrNull,
  isSpotlightMode,
  hexToRgba,
} from '../lib/spotlight';

const SPOTLIGHT_ID = 'reading-spotlight';
const STYLE_ID = 'reading-spotlight-css';
const CURSOR_HIDE_CLASS = 'reading-spotlight-cursor-hidden';
const RAINBOW_CLASS = 'reading-spotlight-rainbow';
const CENTER_DIVISOR = 2;
const PERCENT_DIVISOR = 100;
const state = {
  config: { ...DEFAULT_CONFIG } as SpotlightConfig,
  element: null as HTMLDivElement | null,
  animationFrameId: null as number | null,
  lastMouseX: 0,
  lastMouseY: 0,
  hasMousePosition: false,
};

const SOFT_EDGE_CLASS = 'reading-spotlight-soft';
const SOFT_EDGE_BLUR_PX = 24;

const buildCSS = () => {
  return `
    #${SPOTLIGHT_ID} {
      position: fixed;
      pointer-events: none;
      z-index: 2147483647;
      border-radius: 4px;
      box-shadow: 0 0 0 200vmax rgba(0, 0, 0, var(--dim, 0.25));
      background: var(--color, ${PRESET_COLORS.yellow});
    }
    #${SPOTLIGHT_ID}.${SOFT_EDGE_CLASS} {
      box-shadow: 0 0 ${SOFT_EDGE_BLUR_PX}px 200vmax rgba(0, 0, 0, var(--dim, 0.25));
    }
    #${SPOTLIGHT_ID}.${RAINBOW_CLASS} {
      background: hsla(var(--hue, 180), 80%, 70%, 0.22);
    }
    .${CURSOR_HIDE_CLASS}, .${CURSOR_HIDE_CLASS} * {
      cursor: none !important;
    }
  `;
};

const parseConfig = (data: Record<string, unknown>) => {
  const parts: Partial<SpotlightConfig>[] = [];

  if (isNumber(data.width)) {
    parts.push({ width: data.width });
  }
  if (isNumber(data.height)) {
    parts.push({ height: data.height });
  }
  if (isNumber(data.dimOpacity)) {
    parts.push({ dimOpacity: data.dimOpacity });
  }
  if (isColorKey(data.color)) {
    parts.push({ color: data.color });
  }
  if (isStringOrNull(data.customColor)) {
    parts.push({ customColor: data.customColor });
  }
  if (isBoolean(data.enabled)) {
    parts.push({ enabled: data.enabled });
  }
  if (isSpotlightMode(data.mode)) {
    parts.push({ mode: data.mode });
  }
  if (isNumber(data.fixedYPercent)) {
    parts.push({ fixedYPercent: data.fixedYPercent });
  }
  if (isBoolean(data.softEdge)) {
    parts.push({ softEdge: data.softEdge });
  }
  if (isBoolean(data.hideCursor)) {
    parts.push({ hideCursor: data.hideCursor });
  }

  return Object.assign({}, ...parts);
};

const extractNewValues = (changes: Record<string, chrome.storage.StorageChange>) => {
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(changes)) {
    const change = changes[key];
    if (change) {
      result[key] = change.newValue;
    }
  }

  return result;
};

const parseStorageChanges = (changes: Record<string, chrome.storage.StorageChange>) => {
  return parseConfig(extractNewValues(changes));
};

const isChromeStorageAvailable = () => {
  return typeof chrome !== 'undefined' && chrome.storage?.sync !== undefined;
};

const loadConfigFromStorage = async () => {
  if (!isChromeStorageAvailable()) {
    return;
  }

  try {
    const stored = await chrome.storage.sync.get(Object.keys(DEFAULT_CONFIG));
    const parsed = parseConfig(stored);
    state.config = { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    /* empty */
  }
};

const subscribeToStorageChanges = () => {
  if (!isChromeStorageAvailable()) {
    return;
  }

  chrome.storage.sync.onChanged.addListener((changes) => {
    const updates = parseStorageChanges(changes);
    const hasUpdates = Object.keys(updates).length > 0;

    if (!hasUpdates) {
      return;
    }

    const wasEnabled = state.config.enabled;
    const previousMode = state.config.mode;
    state.config = { ...state.config, ...updates };

    if (wasEnabled && !state.config.enabled) {
      removeSpotlight();
      showCursor();
      return;
    }

    if (!wasEnabled && state.config.enabled && state.hasMousePosition) {
      updateSpotlightPosition(state.lastMouseX, state.lastMouseY);
      updateCursorVisibility();
      return;
    }

    if (updates.hideCursor !== undefined && state.config.enabled) {
      updateCursorVisibility();
    }

    const modeChanged = previousMode !== state.config.mode;
    const fixedYChanged = updates.fixedYPercent !== undefined;

    if (modeChanged && state.hasMousePosition) {
      updateSpotlightPosition(state.lastMouseX, state.lastMouseY);
    }

    if (state.element) {
      applyStyle(state.element);
      if (modeChanged || fixedYChanged) {
        updateSpotlightPosition(state.lastMouseX, state.lastMouseY);
      }
    }
  });
};

const injectStylesheet = () => {
  const existingStyle = document.getElementById(STYLE_ID);

  if (existingStyle instanceof HTMLStyleElement) {
    existingStyle.textContent = buildCSS();
    return;
  }

  const styleElement = document.createElement('style');
  styleElement.id = STYLE_ID;
  styleElement.textContent = buildCSS();
  document.head.appendChild(styleElement);
};

const createSpotlightElement = () => {
  const element = document.createElement('div');
  element.id = SPOTLIGHT_ID;
  applyStyle(element);
  document.body.appendChild(element);
  return element;
};

const getColorValue = (color: string, customColor: string | null): string => {
  if (customColor) {
    return hexToRgba(customColor);
  }
  if (color === 'rainbow') {
    return 'transparent';
  }
  return PRESET_COLORS[color as keyof typeof PRESET_COLORS];
};

const applyStyle = (element: HTMLDivElement) => {
  const { width, height, dimOpacity, color, customColor, softEdge } = state.config;

  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
  element.style.setProperty('--dim', String(dimOpacity));
  element.style.setProperty('--color', getColorValue(color, customColor));
  element.classList.toggle(SOFT_EDGE_CLASS, softEdge);
};

const getOrCreateSpotlight = () => {
  if (state.element === null) {
    state.element = createSpotlightElement();
  }
  return state.element;
};

const removeSpotlight = () => {
  if (state.element) {
    state.element.remove();
    state.element = null;
  }
};

const showCursor = () => {
  document.body.classList.remove(CURSOR_HIDE_CLASS);
};

const hideCursor = () => {
  if (state.config.hideCursor) {
    document.body.classList.add(CURSOR_HIDE_CLASS);
  }
};

const updateCursorVisibility = () => {
  if (state.config.enabled && state.config.hideCursor) {
    document.body.classList.add(CURSOR_HIDE_CLASS);
  } else {
    document.body.classList.remove(CURSOR_HIDE_CLASS);
  }
};

const calculateReadingModeY = (): number => {
  const viewportHeight = window.innerHeight;
  const targetY = (viewportHeight * state.config.fixedYPercent) / PERCENT_DIVISOR;
  return targetY - state.config.height / CENTER_DIVISOR;
};

const updateRainbowEffect = (element: HTMLDivElement, mouseX: number) => {
  const isRainbow = state.config.color === 'rainbow' && !state.config.customColor;

  if (isRainbow) {
    element.classList.add(RAINBOW_CLASS);
    const hue = Math.round((mouseX / window.innerWidth) * 360);
    element.style.setProperty('--hue', String(hue));
  } else {
    element.classList.remove(RAINBOW_CLASS);
  }
};

const updateSpotlightPosition = (mouseX: number, mouseY: number) => {
  if (!state.config.enabled) {
    return;
  }

  const element = getOrCreateSpotlight();
  const left = mouseX - state.config.width / CENTER_DIVISOR;

  updateRainbowEffect(element, mouseX);

  if (state.config.mode === 'reading') {
    element.style.left = `${left}px`;
    element.style.top = `${calculateReadingModeY()}px`;
  } else {
    const top = mouseY - state.config.height / CENTER_DIVISOR;
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
  }
};

const onMouseMove = (event: MouseEvent) => {
  state.lastMouseX = event.clientX;
  state.lastMouseY = event.clientY;
  state.hasMousePosition = true;

  if (state.config.enabled) {
    hideCursor();
  }

  if (state.animationFrameId !== null) {
    return;
  }

  state.animationFrameId = requestAnimationFrame(() => {
    state.animationFrameId = null;
    updateSpotlightPosition(state.lastMouseX, state.lastMouseY);
  });
};

const onMouseLeave = () => {
  if (state.animationFrameId !== null) {
    cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }
  showCursor();
  if (state.config.mode !== 'reading') {
    removeSpotlight();
  }
};

const onWindowResize = () => {
  if (state.config.mode === 'reading' && state.element && state.config.enabled) {
    state.element.style.top = `${calculateReadingModeY()}px`;
  }
};

const onVisibilityChange = () => {
  if (document.hidden) {
    removeSpotlight();
    showCursor();
  }
};

const initialize = async () => {
  await loadConfigFromStorage();
  subscribeToStorageChanges();
  injectStylesheet();

  document.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('mouseleave', onMouseLeave);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('resize', onWindowResize, { passive: true });
};

initialize();
