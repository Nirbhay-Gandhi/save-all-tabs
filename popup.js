document.addEventListener('DOMContentLoaded', () => {
  const saveAllBtn = document.getElementById('saveAllTabs');
  const saveCurrentBtn = document.getElementById('saveCurrentWindowTabs');
  const statusElement = document.getElementById('status');

  // Shared function to download tabs
  const downloadTabs = (urls, source) => {
    const blob = new Blob([urls.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    
    chrome.downloads.download({
      url: url,
      filename: `saved-tabs-${source}-${date}.txt`,
      saveAs: true
    });

    statusElement.textContent = `Saved ${urls.length} tabs from ${source}!`;
  };

  // Current Window Tabs (Existing functionality)
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

      downloadTabs(urls, "current-window");
    } catch (error) {
      statusElement.textContent = "Error: " + error.message;
      statusElement.style.color = "red";
    }
  });

  // All Windows Tabs (New functionality)
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

      downloadTabs(urls, "all-windows");
    } catch (error) {
      statusElement.textContent = "Error: " + error.message;
      statusElement.style.color = "red";
    }
  });
});