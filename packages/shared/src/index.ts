export type ColorKey = 'yellow' | 'blue' | 'green' | 'peach' | 'gray' | 'aqua' | 'rainbow';
export type SpotlightMode = 'follow' | 'reading';

export interface SpotlightConfig {
  readonly width: number;
  readonly height: number;
  readonly dimOpacity: number;
  readonly color: ColorKey;
  readonly customColor: string | null;
  readonly enabled: boolean;
  readonly mode: SpotlightMode;
  readonly fixedYPercent: number;
  readonly softEdge: boolean;
  readonly hideCursor: boolean;
}

export interface ProState {
  readonly isPro: boolean;
  readonly licenseKey: string;
}

export const PRESET_COLORS = {
  yellow: 'rgba(255,255,0,.22)',
  blue: 'rgba(135,206,250,.25)',
  green: 'rgba(144,238,144,.22)',
  peach: 'rgba(255,218,185,.25)',
  gray: 'rgba(128,128,128,.2)',
  aqua: 'rgba(127,255,212,.22)',
  rainbow: 'dynamic',
} as const satisfies Record<ColorKey, string>;

export const DEFAULT_CONFIG: SpotlightConfig = {
  width: 600,
  height: 32,
  dimOpacity: 0.25,
  color: 'yellow',
  customColor: null,
  enabled: true,
  mode: 'follow',
  fixedYPercent: 40,
  softEdge: true,
  hideCursor: true,
};

export const DEFAULT_PRO_STATE: ProState = {
  isPro: false,
  licenseKey: '',
};

const LICENSE_PREFIX = 'RS-PRO-';

export const validateLicenseKey = (key: string): boolean => {
  if (!key.startsWith(LICENSE_PREFIX)) {
    return false;
  }
  const suffix = key.slice(LICENSE_PREFIX.length);
  return suffix.length === 16 && /^[A-Z0-9]+$/.test(suffix);
};

export const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
};

export const LIMITS = {
  width: { min: 200, max: 1200 },
  height: { min: 20, max: 80 },
  dimOpacity: { min: 0.1, max: 0.5 },
  fixedYPercent: { min: 10, max: 90 },
} as const;

const VALID_MODES: readonly SpotlightMode[] = ['follow', 'reading'];

export const isSpotlightMode = (value: unknown): value is SpotlightMode => {
  return typeof value === 'string' && VALID_MODES.includes(value as SpotlightMode);
};

export const isColorKey = (value: unknown): value is ColorKey => {
  return typeof value === 'string' && Object.hasOwn(PRESET_COLORS, value);
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number';
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isStringOrNull = (value: unknown): value is string | null => {
  return value === null || typeof value === 'string';
};

export const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

const CUSTOM_COLOR_OPACITY = 0.22;
const RAINBOW_SATURATION = 100;
const RAINBOW_LIGHTNESS = 70;

export const hexToRgba = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${CUSTOM_COLOR_OPACITY})`;
};

export const positionToRainbowColor = (xPercent: number): string => {
  const hue = Math.round(xPercent * 360);
  return `hsla(${hue},${RAINBOW_SATURATION}%,${RAINBOW_LIGHTNESS}%,${CUSTOM_COLOR_OPACITY})`;
};
