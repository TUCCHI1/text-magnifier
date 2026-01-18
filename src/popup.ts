/**
 * Reading Spotlight - Popup UI
 */

// =============================================================================
// Types
// =============================================================================

interface Config {
  width: number;
  height: number;
  dimOpacity: number;
  enabled: boolean;
}

const DEFAULTS: Config = {
  width: 600,
  height: 32,
  dimOpacity: 0.25,
  enabled: true,
};

// =============================================================================
// Elements
// =============================================================================

const $ = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

const elements = {
  enabled: $<HTMLInputElement>('enabled'),
  width: $<HTMLInputElement>('width'),
  widthValue: $<HTMLSpanElement>('width-value'),
  height: $<HTMLInputElement>('height'),
  heightValue: $<HTMLSpanElement>('height-value'),
  dimOpacity: $<HTMLInputElement>('dimOpacity'),
  dimValue: $<HTMLSpanElement>('dim-value'),
};

// =============================================================================
// Storage
// =============================================================================

const load = async (): Promise<Config> => {
  const stored = await chrome.storage.sync.get(Object.keys(DEFAULTS));
  return { ...DEFAULTS, ...stored };
};

const save = (updates: Partial<Config>): Promise<void> =>
  chrome.storage.sync.set(updates);

// =============================================================================
// UI
// =============================================================================

const updateUI = (config: Config): void => {
  elements.enabled.checked = config.enabled;

  elements.width.value = String(config.width);
  elements.widthValue.textContent = `${config.width}px`;

  elements.height.value = String(config.height);
  elements.heightValue.textContent = `${config.height}px`;

  elements.dimOpacity.value = String(config.dimOpacity);
  elements.dimValue.textContent = `${Math.round(config.dimOpacity * 100)}%`;
};

// =============================================================================
// Event Handlers
// =============================================================================

const handleEnabledChange = (): void => {
  save({ enabled: elements.enabled.checked });
};

const handleWidthChange = (): void => {
  const width = Number(elements.width.value);
  elements.widthValue.textContent = `${width}px`;
  save({ width });
};

const handleHeightChange = (): void => {
  const height = Number(elements.height.value);
  elements.heightValue.textContent = `${height}px`;
  save({ height });
};

const handleDimChange = (): void => {
  const dimOpacity = Number(elements.dimOpacity.value);
  elements.dimValue.textContent = `${Math.round(dimOpacity * 100)}%`;
  save({ dimOpacity });
};

// =============================================================================
// Initialize
// =============================================================================

const init = async (): Promise<void> => {
  const config = await load();
  updateUI(config);

  elements.enabled.addEventListener('change', handleEnabledChange);
  elements.width.addEventListener('input', handleWidthChange);
  elements.height.addEventListener('input', handleHeightChange);
  elements.dimOpacity.addEventListener('input', handleDimChange);
};

init();
