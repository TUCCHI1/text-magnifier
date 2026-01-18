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
  dimOpacity: getInputElement('dimOpacity'),
  dimValue: getSpanElement('dim-value'),
  fixedYPercent: getInputElement('fixedYPercent'),
  fixedYValue: getSpanElement('fixedY-value'),
  readingModeSettings: getDivElement('readingModeSettings'),
  customColor: getInputElement('customColor'),
  proSection: getDivElement('proSection'),
  proStatus: getSpanElement('proStatus'),
  licenseForm: getDivElement('licenseForm'),
  licenseKey: getInputElement('licenseKey'),
  licenseMessage: getDivElement('licenseMessage'),
  activateBtn: getButtonElement('activateBtn'),
};

const colorButtons = document.querySelectorAll<HTMLButtonElement>('.color-option');
const modeButtons = document.querySelectorAll<HTMLButtonElement>('.mode-btn');

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

const updateUI = (config: SpotlightConfig) => {
  elements.enabled.checked = config.enabled;

  elements.width.value = String(config.width);
  elements.widthValue.textContent = `${config.width}px`;

  elements.height.value = String(config.height);
  elements.heightValue.textContent = `${config.height}px`;

  elements.dimOpacity.value = String(config.dimOpacity);
  const dimPercentage = Math.round(config.dimOpacity * PERCENTAGE_MULTIPLIER);
  elements.dimValue.textContent = `${dimPercentage}%`;

  modeButtons.forEach((button) => {
    const isSelected = button.dataset.mode === config.mode;
    button.classList.toggle('active', isSelected);
  });

  elements.fixedYPercent.value = String(config.fixedYPercent);
  elements.fixedYValue.textContent = `${config.fixedYPercent}%`;

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
};

const updateProUI = () => {
  const isPro = state.pro.isPro;

  elements.customColor.disabled = !isPro;
  elements.proSection.classList.toggle('unlocked', isPro);

  if (isPro) {
    elements.proStatus.textContent = '登録済み';
    elements.licenseForm.classList.add('hidden');
  } else {
    elements.proStatus.textContent = '未登録';
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

const onActivateLicense = async () => {
  const key = elements.licenseKey.value.trim().toUpperCase();

  elements.licenseMessage.textContent = '';
  elements.licenseMessage.className = '';

  if (!key) {
    elements.licenseMessage.textContent = 'ライセンスキーを入力してください';
    elements.licenseMessage.className = 'license-error';
    return;
  }

  if (!validateLicenseKey(key)) {
    elements.licenseMessage.textContent = '無効なライセンスキーです';
    elements.licenseMessage.className = 'license-error';
    return;
  }

  state.pro = { isPro: true, licenseKey: key };
  await saveProState(state.pro);
  updateProUI();

  elements.licenseMessage.textContent = 'Pro版が有効になりました';
  elements.licenseMessage.className = 'license-success';
};

const initialize = async () => {
  const [config, loadedProState] = await Promise.all([loadConfig(), loadProState()]);

  state.pro = loadedProState;

  updateUI(config);
  updateProUI();

  elements.enabled.addEventListener('change', onEnabledChange);
  elements.width.addEventListener('input', onWidthChange);
  elements.height.addEventListener('input', onHeightChange);
  elements.dimOpacity.addEventListener('input', onDimOpacityChange);
  elements.fixedYPercent.addEventListener('input', onFixedYPercentChange);
  elements.customColor.addEventListener('input', onCustomColorChange);
  elements.activateBtn.addEventListener('click', onActivateLicense);

  colorButtons.forEach((button) => {
    button.addEventListener('click', onColorChange);
  });

  modeButtons.forEach((button) => {
    button.addEventListener('click', onModeChange);
  });
};

initialize();
