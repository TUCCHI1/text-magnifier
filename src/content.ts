/**
 * Reading Spotlight - Chrome Extension
 *
 * マウス位置にスポットライトを当て、周囲をディムすることで
 * 読んでいる行に集中させる。CHI 2023研究で最も好まれた「Lightbox」デザイン。
 *
 * @see https://dl.acm.org/doi/10.1145/3544548.3581367
 */

// =============================================================================
// Types
// =============================================================================

interface SpotlightConfig {
  readonly width: number;
  readonly height: number;
  readonly dimOpacity: number;
  readonly enabled: boolean;
}

interface Position {
  readonly x: number;
  readonly y: number;
}

// =============================================================================
// Constants
// =============================================================================

const SPOTLIGHT_ID = 'reading-spotlight-element' as const;
const CSS_ID = 'reading-spotlight-styles' as const;

const DEFAULT_CONFIG: SpotlightConfig = {
  width: 600,
  height: 32,
  dimOpacity: 0.25,
  enabled: true,
} as const;

const SPOTLIGHT_CSS = `
  #${SPOTLIGHT_ID} {
    position: fixed;
    pointer-events: none;
    z-index: 2147483647;
    border-radius: 4px;
    box-shadow: 0 0 0 200vmax rgba(0, 0, 0, var(--dim-opacity, 0.25));
    background: transparent;
    transition:
      top 0.04s cubic-bezier(0.33, 1, 0.68, 1),
      left 0.04s cubic-bezier(0.33, 1, 0.68, 1);
    will-change: top, left;
  }
` as const;

// =============================================================================
// State
// =============================================================================

let config: SpotlightConfig = { ...DEFAULT_CONFIG };
let spotlightElement: HTMLDivElement | null = null;
let rafId: number | null = null;

// =============================================================================
// Storage
// =============================================================================

const loadConfig = async (): Promise<void> => {
  if (typeof chrome === 'undefined' || !chrome.storage?.sync) return;

  try {
    const stored = await chrome.storage.sync.get(Object.keys(DEFAULT_CONFIG));
    config = { ...DEFAULT_CONFIG, ...stored };
  } catch {
    // Fallback to defaults on error
  }
};

const subscribeToConfigChanges = (): void => {
  if (typeof chrome === 'undefined' || !chrome.storage?.sync) return;

  chrome.storage.sync.onChanged.addListener((changes) => {
    let hasUpdates = false;
    const newConfig = { ...config };

    for (const [key, change] of Object.entries(changes)) {
      if (key in DEFAULT_CONFIG && change.newValue !== undefined) {
        (newConfig as Record<string, unknown>)[key] = change.newValue;
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      const wasEnabled = config.enabled;
      config = newConfig;

      if (wasEnabled && !config.enabled) {
        destroySpotlight();
      } else if (spotlightElement) {
        applyConfigToElement(spotlightElement);
      }
    }
  });
};

// =============================================================================
// DOM
// =============================================================================

const injectStyles = (): void => {
  if (document.getElementById(CSS_ID)) return;

  const style = document.createElement('style');
  style.id = CSS_ID;
  style.textContent = SPOTLIGHT_CSS;
  document.head.appendChild(style);
};

const createSpotlight = (): HTMLDivElement => {
  const el = document.createElement('div');
  el.id = SPOTLIGHT_ID;
  applyConfigToElement(el);
  document.body.appendChild(el);
  return el;
};

const applyConfigToElement = (el: HTMLDivElement): void => {
  el.style.width = `${config.width}px`;
  el.style.height = `${config.height}px`;
  el.style.setProperty('--dim-opacity', String(config.dimOpacity));
};

const destroySpotlight = (): void => {
  spotlightElement?.remove();
  spotlightElement = null;
};

const ensureSpotlight = (): HTMLDivElement => {
  if (!spotlightElement) {
    spotlightElement = createSpotlight();
  }
  return spotlightElement;
};

// =============================================================================
// Position
// =============================================================================

const updatePosition = ({ x, y }: Position): void => {
  if (!config.enabled) return;

  const el = ensureSpotlight();

  // Center the spotlight on cursor position
  const left = x - config.width / 2;
  const top = y - config.height / 2;

  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
};

// =============================================================================
// Event Handlers
// =============================================================================

const handleMouseMove = (event: MouseEvent): void => {
  if (rafId !== null) return;

  rafId = requestAnimationFrame(() => {
    rafId = null;
    updatePosition({ x: event.clientX, y: event.clientY });
  });
};

const handleMouseLeave = (): void => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  destroySpotlight();
};

const handleVisibilityChange = (): void => {
  if (document.hidden) {
    destroySpotlight();
  }
};

// =============================================================================
// Initialization
// =============================================================================

const bootstrap = async (): Promise<void> => {
  await loadConfig();
  subscribeToConfigChanges();
  injectStyles();

  document.addEventListener('mousemove', handleMouseMove, { passive: true });
  document.addEventListener('mouseleave', handleMouseLeave);
  document.addEventListener('visibilitychange', handleVisibilityChange);
};

bootstrap();
