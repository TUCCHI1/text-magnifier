const COMMAND_TOGGLE = 'toggle-spotlight';

const toggleSpotlight = async () => {
  const { enabled } = await chrome.storage.sync.get({ enabled: true });
  await chrome.storage.sync.set({ enabled: !enabled });
};

chrome.commands.onCommand.addListener((command) => {
  if (command === COMMAND_TOGGLE) {
    toggleSpotlight();
  }
});
