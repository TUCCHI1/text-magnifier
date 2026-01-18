import {
  type SpotlightConfig,
  DEFAULT_CONFIG,
  LIMITS,
  isColorKey,
  clamp,
} from '../../lib/spotlight';

const PERCENTAGE_MULTIPLIER = 100;

const getInputElement = (id: string) => {
  const element = document.getElementById(id);

  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`Element "${id}" is not an input element`);
  }

  return element;
};

const getSpanElement = (id: string) => {
  const element = document.getElementById(id);

  if (!(element instanceof HTMLSpanElement)) {
    throw new Error(`Element "${id}" is not a span element`);
  }

  return element;
};

const elements = {
  enabled: getInputElement('enabled'),
  width: getInputElement('width'),
  widthValue: getSpanElement('width-value'),
  height: getInputElement('height'),
  heightValue: getSpanElement('height-value'),
  dimOpacity: getInputElement('dimOpacity'),
  dimValue: getSpanElement('dim-value'),
};

const colorButtons = document.querySelectorAll<HTMLButtonElement>('.color-option');

const loadConfig = async () => {
  const stored = await chrome.storage.sync.get(Object.keys(DEFAULT_CONFIG));
  return { ...DEFAULT_CONFIG, ...stored };
};

const saveConfig = (updates: Partial<SpotlightConfig>) => {
  return chrome.storage.sync.set(updates);
};

const updateUI = (config: SpotlightConfig) => {
  elements.enabled.checked = config.enabled;

  elements.width.value = String(config.width);
  elements.widthValue.textContent = `${config.width}px`;

  elements.height.value = String(config.height);
  elements.heightValue.textContent = `${config.height}px`;

  elements.dimOpacity.value = String(config.dimOpacity);
  const dimPercentage = Math.round(config.dimOpacity * PERCENTAGE_MULTIPLIER);
  elements.dimValue.textContent = `${dimPercentage}%`;

  colorButtons.forEach((button) => {
    const isSelected = button.dataset.color === config.color;
    button.classList.toggle('active', isSelected);
  });
};

const onEnabledChange = () => {
  saveConfig({ enabled: elements.enabled.checked });
};

const onWidthChange = () => {
  const inputValue = Number(elements.width.value) || DEFAULT_CONFIG.width;
  const width = clamp(inputValue, LIMITS.width.min, LIMITS.width.max);

  elements.widthValue.textContent = `${width}px`;
  saveConfig({ width });
};

const onHeightChange = () => {
  const inputValue = Number(elements.height.value) || DEFAULT_CONFIG.height;
  const height = clamp(inputValue, LIMITS.height.min, LIMITS.height.max);

  elements.heightValue.textContent = `${height}px`;
  saveConfig({ height });
};

const onDimOpacityChange = () => {
  const inputValue = Number(elements.dimOpacity.value) || DEFAULT_CONFIG.dimOpacity;
  const dimOpacity = clamp(inputValue, LIMITS.dimOpacity.min, LIMITS.dimOpacity.max);

  const dimPercentage = Math.round(dimOpacity * PERCENTAGE_MULTIPLIER);
  elements.dimValue.textContent = `${dimPercentage}%`;
  saveConfig({ dimOpacity });
};

const onColorChange = (event: Event) => {
  const target = event.currentTarget;

  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const color = target.dataset.color;

  if (!isColorKey(color)) {
    return;
  }

  colorButtons.forEach((button) => {
    const isSelected = button === target;
    button.classList.toggle('active', isSelected);
  });

  saveConfig({ color });
};

const initialize = async () => {
  const config = await loadConfig();
  updateUI(config);

  elements.enabled.addEventListener('change', onEnabledChange);
  elements.width.addEventListener('input', onWidthChange);
  elements.height.addEventListener('input', onHeightChange);
  elements.dimOpacity.addEventListener('input', onDimOpacityChange);

  colorButtons.forEach((button) => {
    button.addEventListener('click', onColorChange);
  });
};

initialize();
