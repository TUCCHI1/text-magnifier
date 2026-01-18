/**
 * Text Magnifier - ポップアップUI
 *
 * 設定をchrome.storage.syncに保存し、
 * 全デバイスで同期される
 */

interface PopupSettings {
  mode: 'word' | 'character';
  characterCount: number;
  scaleFactor: number;
}

const DEFAULT_SETTINGS: PopupSettings = {
  mode: 'character',
  characterCount: 3,
  scaleFactor: 1.35,
};

// =============================================================================
// DOM要素
// =============================================================================

const modeButtons = document.querySelectorAll<HTMLButtonElement>('.mode-btn');
const characterCountInput = document.getElementById('character-count') as HTMLInputElement;
const characterCountValue = document.getElementById('character-count-value') as HTMLSpanElement;
const characterCountGroup = document.querySelector('.character-count-group') as HTMLDivElement;
const scaleInput = document.getElementById('scale') as HTMLInputElement;
const scaleValue = document.getElementById('scale-value') as HTMLSpanElement;

// =============================================================================
// 設定の読み込み・保存
// =============================================================================

const loadSettings = async (): Promise<PopupSettings> => {
  const keys = Object.keys(DEFAULT_SETTINGS);
  const result = await chrome.storage.sync.get(keys);
  return { ...DEFAULT_SETTINGS, ...result } as PopupSettings;
};

const saveSettings = async (settings: Partial<PopupSettings>) => {
  await chrome.storage.sync.set(settings);
};

// =============================================================================
// UIの更新
// =============================================================================

const updateModeUI = (mode: PopupSettings['mode']) => {
  modeButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset['mode'] === mode);
  });

  // 文字数モードでない場合は文字数設定を無効化
  characterCountGroup.classList.toggle('disabled', mode !== 'character');
};

const updateCharacterCountUI = (count: number) => {
  characterCountInput.value = String(count);
  characterCountValue.textContent = String(count);
};

const updateScaleUI = (scale: number) => {
  scaleInput.value = String(scale);
  scaleValue.textContent = `${scale}x`;
};

// =============================================================================
// イベントハンドラ
// =============================================================================

const handleModeChange = (mode: PopupSettings['mode']) => {
  updateModeUI(mode);
  saveSettings({ mode });
};

const handleCharacterCountChange = () => {
  const count = Number(characterCountInput.value);
  updateCharacterCountUI(count);
  saveSettings({ characterCount: count });
};

const handleScaleChange = () => {
  const scale = Number(scaleInput.value);
  updateScaleUI(scale);
  saveSettings({ scaleFactor: scale });
};

// =============================================================================
// 初期化
// =============================================================================

(async () => {
  const settings = await loadSettings();

  updateModeUI(settings.mode);
  updateCharacterCountUI(settings.characterCount);
  updateScaleUI(settings.scaleFactor);

  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset['mode'] as PopupSettings['mode'];
      handleModeChange(mode);
    });
  });

  characterCountInput.addEventListener('input', handleCharacterCountChange);
  scaleInput.addEventListener('input', handleScaleChange);
})();
