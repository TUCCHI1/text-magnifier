export type ColorKey = 'yellow' | 'blue' | 'green' | 'peach' | 'gray' | 'aqua';

export interface SpotlightConfig {
  readonly width: number;
  readonly height: number;
  readonly dimOpacity: number;
  readonly color: ColorKey;
  readonly enabled: boolean;
}

export const PRESET_COLORS = {
  yellow: 'rgba(255,255,0,.22)',
  blue: 'rgba(135,206,250,.25)',
  green: 'rgba(144,238,144,.22)',
  peach: 'rgba(255,218,185,.25)',
  gray: 'rgba(128,128,128,.2)',
  aqua: 'rgba(127,255,212,.22)',
} as const satisfies Record<ColorKey, string>;

export const DEFAULT_CONFIG = {
  width: 600,
  height: 32,
  dimOpacity: 0.25,
  color: 'yellow',
  enabled: true,
} as const satisfies SpotlightConfig;

export const LIMITS = {
  width: { min: 200, max: 1200 },
  height: { min: 20, max: 80 },
  dimOpacity: { min: 0.1, max: 0.5 },
} as const;

export const isColorKey = (value: unknown): value is ColorKey => {
  return typeof value === 'string' && Object.hasOwn(PRESET_COLORS, value);
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number';
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

export const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};
