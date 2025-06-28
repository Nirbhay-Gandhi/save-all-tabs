document.addEventListener('DOMContentLoaded', () => {
  const saveAllBtn = document.getElementById('saveAllTabs');
  const saveCurrentBtn = document.getElementById('saveCurrentWindowTabs');
  const statusElement = document.getElementById('status');

  const isWindows = () => {
    // Primary method: Chrome's platform API (most reliable)
    if (chrome.runtime?.getPlatformInfo) {
      return new Promise(resolve => {
        chrome.runtime.getPlatformInfo(info => {
          resolve(info.os === 'win');
        });
      });
    }
    
    // Modern fallback: User agent data (available in Chrome 89+)
    if (navigator.userAgentData?.platform) {
      return Promise.resolve(
        navigator.userAgentData.platform.toLowerCase() === 'windows'
      );
    }
    
    // Last resort: Check userAgent string (not deprecated, but less reliable)
    return Promise.resolve(
      navigator.userAgent.toLowerCase().includes('win')
    );
  };

  // Shared download function
  const downloadTabs = async (urls, source) => {
    const windowsOS = await isWindows();
    const date = new Date().toISOString().slice(0, 10);
    
    if (windowsOS) {
      // Windows: Generate BAT file
      const batHeader = '@echo off\n';
      const batCommands = urls.map(url => `start "" "${url}"`).join('\n');
      const fileContent = batHeader + batCommands;
      
      chrome.downloads.download({
        url: URL.createObjectURL(new Blob([fileContent], { type: 'application/bat' })),
        filename: `open-tabs-${source}-${date}.bat`,
        saveAs: true
      });
      statusElement.textContent = `Saved ${urls.length} tabs as BAT file!`;
    } else {
      // Non-Windows: Generate TXT file
      const fileContent = urls.join('\n');
      
      chrome.downloads.download({
        url: URL.createObjectURL(new Blob([fileContent], { type: 'text/plain' })),
        filename: `open-tabs-${source}-${date}.txt`,
        saveAs: true
      });
      statusElement.textContent = `Saved ${urls.length} tabs as TXT file!`;
    }
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

      await downloadTabs(urls, "current-window");
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

      await downloadTabs(urls, "all-windows");
    } catch (error) {
      statusElement.textContent = "Error: " + error.message;
      statusElement.style.color = "red";
    }
  });
});