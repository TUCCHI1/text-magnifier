import {
  type SpotlightConfig,
  type ProState,
  DEFAULT_CONFIG,
  DEFAULT_PRO_STATE,
  LIMITS,
  isColorKey,
  isSpotlightMode,
  clamp,
  validateLicenseKey,
  isValidHexColor,
} from '../../lib/spotlight';

// Size presets (research-backed defaults)
const SIZE_PRESETS = {
  small: { width: 400, height: 24 },
  medium: { width: 600, height: 32 },
  large: { width: 800, height: 44 },
} as const;

const INTENSITY_PRESETS = {
  light: 0.15,
  medium: 0.25,
  strong: 0.4,
} as const;

type SizePreset = keyof typeof SIZE_PRESETS;
type IntensityPreset = keyof typeof INTENSITY_PRESETS;

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

const getDivElement = (id: string) => {
  const element = document.getElementById(id);

  if (!(element instanceof HTMLDivElement)) {
    throw new Error(`Element "${id}" is not a div element`);
  }

  return element;
};

const getButtonElement = (id: string) => {
  const element = document.getElementById(id);

  if (!(element instanceof HTMLButtonElement)) {
    throw new Error(`Element "${id}" is not a button element`);
  }

  return element;
};

const elements = {
  enabled: getInputElement('enabled'),
  width: getInputElement('width'),
  widthValue: getSpanElement('width-value'),
  height: getInputElement('height'),
  heightValue: getSpanElement('height-value'),
  fixedYPercent: getInputElement('fixedYPercent'),
  fixedYValue: getSpanElement('fixedY-value'),
  readingModeSettings: getDivElement('readingModeSettings'),
  customColor: getInputElement('customColor'),
  softEdge: getInputElement('softEdge'),
  hideCursor: getInputElement('hideCursor'),
  proSection: getDivElement('proSection'),
  proStatus: getSpanElement('proStatus'),
  licenseForm: getDivElement('licenseForm'),
  licenseKey: getInputElement('licenseKey'),
  licenseMessage: getDivElement('licenseMessage'),
  activateBtn: getButtonElement('activateBtn'),
  advancedToggle: getButtonElement('advancedToggle'),
  advancedSection: getDivElement('advancedSection'),
};

const colorButtons = document.querySelectorAll<HTMLButtonElement>('.color-btn');
const modeButtons = document.querySelectorAll<HTMLButtonElement>('.mode-btn');
const sizeButtons = document.querySelectorAll<HTMLButtonElement>('.preset-btn[data-size]');
const intensityButtons = document.querySelectorAll<HTMLButtonElement>(
  '.preset-btn[data-intensity]',
);

const state = {
  pro: { ...DEFAULT_PRO_STATE } as ProState,
};

const loadConfig = async () => {
  const stored = await chrome.storage.sync.get(Object.keys(DEFAULT_CONFIG));
  return { ...DEFAULT_CONFIG, ...stored };
};

const loadProState = async () => {
  const stored = await chrome.storage.sync.get(['isPro', 'licenseKey']);
  return { ...DEFAULT_PRO_STATE, ...stored };
};

const saveConfig = (updates: Partial<SpotlightConfig>) => {
  return chrome.storage.sync.set(updates);
};

const saveProState = (updates: Partial<ProState>) => {
  return chrome.storage.sync.set(updates);
};

const findSizePreset = (width: number, height: number): SizePreset | null => {
  for (const [key, preset] of Object.entries(SIZE_PRESETS)) {
    if (preset.width === width && preset.height === height) {
      return key as SizePreset;
    }
  }
  return null;
};

const findIntensityPreset = (dimOpacity: number): IntensityPreset | null => {
  for (const [key, value] of Object.entries(INTENSITY_PRESETS)) {
    if (Math.abs(value - dimOpacity) < 0.01) {
      return key as IntensityPreset;
    }
  }
  return null;
};

const updateUI = (config: SpotlightConfig) => {
  elements.enabled.checked = config.enabled;

  elements.width.value = String(config.width);
  elements.widthValue.textContent = `${config.width}px`;

  elements.height.value = String(config.height);
  elements.heightValue.textContent = `${config.height}px`;

  elements.fixedYPercent.value = String(config.fixedYPercent);
  elements.fixedYValue.textContent = `${config.fixedYPercent}%`;

  modeButtons.forEach((button) => {
    const isSelected = button.dataset.mode === config.mode;
    button.classList.toggle('active', isSelected);
  });

  const isReadingMode = config.mode === 'reading';
  elements.readingModeSettings.classList.toggle('hidden', !isReadingMode);

  const hasCustomColor = config.customColor !== null;
  colorButtons.forEach((button) => {
    const isSelected = !hasCustomColor && button.dataset.color === config.color;
    button.classList.toggle('active', isSelected);
  });

  elements.customColor.classList.toggle('active', hasCustomColor);
  if (config.customColor) {
    elements.customColor.value = config.customColor;
  }

  const sizePreset = findSizePreset(config.width, config.height);
  sizeButtons.forEach((button) => {
    const isSelected = button.dataset.size === sizePreset;
    button.classList.toggle('active', isSelected);
  });

  const intensityPreset = findIntensityPreset(config.dimOpacity);
  intensityButtons.forEach((button) => {
    const isSelected = button.dataset.intensity === intensityPreset;
    button.classList.toggle('active', isSelected);
  });

  elements.softEdge.checked = config.softEdge;
  elements.hideCursor.checked = config.hideCursor;
};

const updateProUI = () => {
  const isPro = state.pro.isPro;

  elements.customColor.disabled = !isPro;

  if (isPro) {
    elements.proStatus.textContent = '有効';
    elements.licenseForm.classList.add('hidden');
  } else {
    elements.proStatus.textContent = 'カスタム色';
    elements.licenseForm.classList.remove('hidden');
  }
};

const onEnabledChange = () => {
  saveConfig({ enabled: elements.enabled.checked });
};

const onWidthChange = () => {
  const inputValue = Number(elements.width.value) || DEFAULT_CONFIG.width;
  const width = clamp(inputValue, LIMITS.width.min, LIMITS.width.max);

  elements.widthValue.textContent = `${width}px`;
  saveConfig({ width });

  const config = { width, height: Number(elements.height.value) };
  const sizePreset = findSizePreset(config.width, config.height);
  sizeButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.size === sizePreset);
  });
};

const onHeightChange = () => {
  const inputValue = Number(elements.height.value) || DEFAULT_CONFIG.height;
  const height = clamp(inputValue, LIMITS.height.min, LIMITS.height.max);

  elements.heightValue.textContent = `${height}px`;
  saveConfig({ height });

  const config = { width: Number(elements.width.value), height };
  const sizePreset = findSizePreset(config.width, config.height);
  sizeButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.size === sizePreset);
  });
};

const onModeChange = (event: Event) => {
  const target = event.currentTarget;

  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const mode = target.dataset.mode;

  if (!isSpotlightMode(mode)) {
    return;
  }

  modeButtons.forEach((button) => {
    const isSelected = button === target;
    button.classList.toggle('active', isSelected);
  });

  const isReadingMode = mode === 'reading';
  elements.readingModeSettings.classList.toggle('hidden', !isReadingMode);

  saveConfig({ mode });
};

const onFixedYPercentChange = () => {
  const inputValue = Number(elements.fixedYPercent.value) || DEFAULT_CONFIG.fixedYPercent;
  const fixedYPercent = clamp(inputValue, LIMITS.fixedYPercent.min, LIMITS.fixedYPercent.max);

  elements.fixedYValue.textContent = `${fixedYPercent}%`;
  saveConfig({ fixedYPercent });
};

const onSoftEdgeChange = () => {
  saveConfig({ softEdge: elements.softEdge.checked });
};

const onHideCursorChange = () => {
  saveConfig({ hideCursor: elements.hideCursor.checked });
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

  elements.customColor.classList.remove('active');
  saveConfig({ color, customColor: null });
};

const onCustomColorChange = () => {
  if (!state.pro.isPro) {
    return;
  }

  const customColor = elements.customColor.value;

  if (!isValidHexColor(customColor)) {
    return;
  }

  colorButtons.forEach((button) => {
    button.classList.remove('active');
  });

  elements.customColor.classList.add('active');
  saveConfig({ customColor });
};

const onSizePresetChange = (event: Event) => {
  const target = event.currentTarget;

  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const size = target.dataset.size as SizePreset;
  const preset = SIZE_PRESETS[size];

  if (!preset) {
    return;
  }

  sizeButtons.forEach((button) => {
    button.classList.toggle('active', button === target);
  });

  elements.width.value = String(preset.width);
  elements.widthValue.textContent = `${preset.width}px`;
  elements.height.value = String(preset.height);
  elements.heightValue.textContent = `${preset.height}px`;

  saveConfig({ width: preset.width, height: preset.height });
};

const onIntensityPresetChange = (event: Event) => {
  const target = event.currentTarget;

  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const intensity = target.dataset.intensity as IntensityPreset;
  const dimOpacity = INTENSITY_PRESETS[intensity];

  if (dimOpacity === undefined) {
    return;
  }

  intensityButtons.forEach((button) => {
    button.classList.toggle('active', button === target);
  });

  saveConfig({ dimOpacity });
};

const onAdvancedToggle = () => {
  elements.advancedToggle.classList.toggle('open');
  elements.advancedSection.classList.toggle('open');
};

const onActivateLicense = async () => {
  const key = elements.licenseKey.value.trim().toUpperCase();

  elements.licenseMessage.textContent = '';
  elements.licenseMessage.className = 'license-message';

  if (!key) {
    elements.licenseMessage.textContent = 'キーを入力してください';
    elements.licenseMessage.classList.add('error');
    return;
  }

  if (!validateLicenseKey(key)) {
    elements.licenseMessage.textContent = '無効なキーです';
    elements.licenseMessage.classList.add('error');
    return;
  }

  state.pro = { isPro: true, licenseKey: key };
  await saveProState(state.pro);
  updateProUI();

  elements.licenseMessage.textContent = '有効になりました';
  elements.licenseMessage.classList.add('success');
};

const initialize = async () => {
  const [config, loadedProState] = await Promise.all([loadConfig(), loadProState()]);

  state.pro = loadedProState;

  updateUI(config);
  updateProUI();

  elements.enabled.addEventListener('change', onEnabledChange);
  elements.width.addEventListener('input', onWidthChange);
  elements.height.addEventListener('input', onHeightChange);
  elements.fixedYPercent.addEventListener('input', onFixedYPercentChange);
  elements.softEdge.addEventListener('change', onSoftEdgeChange);
  elements.hideCursor.addEventListener('change', onHideCursorChange);
  elements.customColor.addEventListener('input', onCustomColorChange);
  elements.activateBtn.addEventListener('click', onActivateLicense);
  elements.advancedToggle.addEventListener('click', onAdvancedToggle);

  colorButtons.forEach((button) => {
    button.addEventListener('click', onColorChange);
  });

  modeButtons.forEach((button) => {
    button.addEventListener('click', onModeChange);
  });

  sizeButtons.forEach((button) => {
    button.addEventListener('click', onSizePresetChange);
  });

  intensityButtons.forEach((button) => {
    button.addEventListener('click', onIntensityPresetChange);
  });
};

initialize();
