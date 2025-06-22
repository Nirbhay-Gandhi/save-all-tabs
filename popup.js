document.addEventListener('DOMContentLoaded', () => {
  const saveAllBtn = document.getElementById('saveAllTabs');
  const saveCurrentBtn = document.getElementById('saveCurrentWindowTabs');
  const statusElement = document.getElementById('status');

  // Shared function to download tabs as BAT file
  const downloadTabsAsBat = (urls, source) => {
    // Create BAT file content
    const batHeader = '@echo off\n';
    const batCommands = urls.map(url => `start "" "${url}"`).join('\n');
    const fileContent = batHeader + batCommands;
    
    const blob = new Blob([fileContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    
    chrome.downloads.download({
      url: url,
      filename: `open-tabs-${source}-${date}.bat`,
      saveAs: true
    });

    statusElement.textContent = `Saved ${urls.length} tabs as BAT file!`;
  };

  // Current Window Tabs
  saveCurrentBtn.addEventListener('click', async () => {
    statusElement.textContent = "Collecting current window tabs...";
    statusElement.style.color = "inherit";

    try {
      const currentWindow = await chrome.windows.getCurrent({ populate: true });
      const urls = currentWindow.tabs
        .map(tab => tab.url)
        .filter(url => url && !url.startsWith('chrome://'));

      if (urls.length === 0) {
        statusElement.textContent = "No tabs in current window!";
        return;
      }

      downloadTabsAsBat(urls, "current-window");
    } catch (error) {
      statusElement.textContent = "Error: " + error.message;
      statusElement.style.color = "red";
    }
  });

  // All Windows Tabs
  saveAllBtn.addEventListener('click', async () => {
    statusElement.textContent = "Collecting all tabs...";
    statusElement.style.color = "inherit";

    try {
      const windows = await chrome.windows.getAll({ populate: true });
      const urls = windows
        .flatMap(win => win.tabs || [])
        .map(tab => tab.url)
        .filter(url => url && !url.startsWith('chrome://'));

      if (urls.length === 0) {
        statusElement.textContent = "No tabs found in any window!";
        return;
      }

      downloadTabsAsBat(urls, "all-windows");
    } catch (error) {
      statusElement.textContent = "Error: " + error.message;
      statusElement.style.color = "red";
    }
  });
});