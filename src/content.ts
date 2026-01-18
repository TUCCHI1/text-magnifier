/**
 * Reading Spotlight - Chrome Extension
 *
 * マウス位置にスポットライトを当て、周囲をディムすることで
 * 読んでいる行に集中させる。
 *
 * 研究ベース:
 * - CHI 2023: Lightboxデザインが最も好まれた
 * - Visual Stress研究: 色の個人差が重要
 * - Helperbird/Focus Ex: カスタマイズ可能な色が必須機能
 *
 * @see https://dl.acm.org/doi/10.1145/3544548.3581367
 * @see https://www.tandfonline.com/doi/full/10.1080/08164622.2024.2302822
 */

// =============================================================================
// Types
// =============================================================================

interface SpotlightConfig {
  readonly width: number;
  readonly height: number;
  readonly dimOpacity: number;
  readonly color: string;
  readonly enabled: boolean;
}

interface Position {
  readonly x: number;
  readonly y: number;
}

// =============================================================================
// Constants
// =============================================================================

const SPOTLIGHT_ID = 'reading-spotlight' as const;
const CSS_ID = 'reading-spotlight-css' as const;

const PRESET_COLORS = {
  yellow: 'rgba(255,255,0,.22)',
  blue: 'rgba(135,206,250,.25)',
  green: 'rgba(144,238,144,.22)',
  peach: 'rgba(255,218,185,.25)',
  gray: 'rgba(128,128,128,.2)',
  aqua: 'rgba(127,255,212,.22)',
} as const;

const DEFAULT_CONFIG: SpotlightConfig = {
  width: 600,
  height: 32,
  dimOpacity: 0.25,
  color: 'yellow',
  enabled: true,
} as const;

// =============================================================================
// State
// =============================================================================

let config: SpotlightConfig = { ...DEFAULT_CONFIG };
let spotlightElement: HTMLDivElement | null = null;
let rafId: number | null = null;

// =============================================================================
// CSS Generation
// =============================================================================

const getSpotlightColor = (): string => {
  return PRESET_COLORS[config.color as keyof typeof PRESET_COLORS] ?? PRESET_COLORS.yellow;
};

const generateCSS = (): string => `
#${SPOTLIGHT_ID}{
  position:fixed;
  pointer-events:none;
  z-index:2147483647;
  border-radius:4px;
  box-shadow:0 0 0 200vmax rgba(0,0,0,var(--dim,.25));
  background:var(--color,${PRESET_COLORS.yellow});
  transition:top .04s ease-out,left .04s ease-out;
  will-change:top,left
}`;

// =============================================================================
// Storage
// =============================================================================

const loadConfig = async (): Promise<void> => {
  if (typeof chrome === 'undefined' || !chrome.storage?.sync) return;

  try {
    const stored = await chrome.storage.sync.get(Object.keys(DEFAULT_CONFIG));
    config = { ...DEFAULT_CONFIG, ...stored };
  } catch {
    // Fallback to defaults
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
  let styleEl = document.getElementById(CSS_ID) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = CSS_ID;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = generateCSS();
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
  el.style.setProperty('--dim', String(config.dimOpacity));
  el.style.setProperty('--color', getSpotlightColor());
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
