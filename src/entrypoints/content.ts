import {
  type SpotlightConfig,
  PRESET_COLORS,
  DEFAULT_CONFIG,
  isColorKey,
  isNumber,
  isBoolean,
} from '../lib/spotlight';

const SPOTLIGHT_ID = 'reading-spotlight';
const STYLE_ID = 'reading-spotlight-css';
const CENTER_DIVISOR = 2;

const state = {
  config: { ...DEFAULT_CONFIG } as SpotlightConfig,
  element: null as HTMLDivElement | null,
  animationFrameId: null as number | null,
};

const buildCSS = () => {
  return `
    #${SPOTLIGHT_ID} {
      position: fixed;
      pointer-events: none;
      z-index: 2147483647;
      border-radius: 4px;
      box-shadow: 0 0 0 200vmax rgba(0, 0, 0, var(--dim, 0.25));
      background: var(--color, ${PRESET_COLORS.yellow});
      transition: top 0.04s ease-out, left 0.04s ease-out;
      will-change: top, left;
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
  if (isBoolean(data.enabled)) {
    parts.push({ enabled: data.enabled });
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
    state.config = { ...state.config, ...updates };

    if (wasEnabled && !state.config.enabled) {
      removeSpotlight();
    } else if (state.element) {
      applyStyle(state.element);
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

const applyStyle = (element: HTMLDivElement) => {
  const { width, height, dimOpacity, color } = state.config;

  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
  element.style.setProperty('--dim', String(dimOpacity));
  element.style.setProperty('--color', PRESET_COLORS[color]);
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

const updateSpotlightPosition = (mouseX: number, mouseY: number) => {
  if (!state.config.enabled) {
    return;
  }

  const element = getOrCreateSpotlight();
  const left = mouseX - state.config.width / CENTER_DIVISOR;
  const top = mouseY - state.config.height / CENTER_DIVISOR;

  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
};

const onMouseMove = (event: MouseEvent) => {
  if (state.animationFrameId !== null) {
    return;
  }

  state.animationFrameId = requestAnimationFrame(() => {
    state.animationFrameId = null;
    updateSpotlightPosition(event.clientX, event.clientY);
  });
};

const onMouseLeave = () => {
  if (state.animationFrameId !== null) {
    cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }
  removeSpotlight();
};

const onVisibilityChange = () => {
  if (document.hidden) {
    removeSpotlight();
  }
};

const initialize = async () => {
  await loadConfigFromStorage();
  subscribeToStorageChanges();
  injectStylesheet();

  document.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('mouseleave', onMouseLeave);
  document.addEventListener('visibilitychange', onVisibilityChange);
};

initialize();
