document.addEventListener('DOMContentLoaded', () => {
  const saveButton = document.getElementById('saveTabs');
  const statusElement = document.getElementById('status');

  saveButton.addEventListener('click', async () => {
    statusElement.textContent = "Collecting tabs...";
    statusElement.style.color = "inherit";

    try {
      // Get the CURRENT window only
      const currentWindow = await chrome.windows.getCurrent({ populate: true });
      
      // Extract URLs only from current window
      const urls = currentWindow.tabs
        .map(tab => tab.url)
        .filter(url => url && !url.startsWith('chrome://'));

      if (urls.length === 0) {
        statusElement.textContent = "No tabs found in this window!";
        return;
      }

      // Create and download the file
      const blob = new Blob([urls.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      await chrome.downloads.download({
        url: url,
        filename: `saved-tabs-${new Date().toISOString().slice(0, 10)}.txt`,
        saveAs: true
      });

      statusElement.textContent = `Saved ${urls.length} tabs from this window!`;
      // Let user close the popup manually
      
    } catch (error) {
      console.error("Failed to save tabs:", error);
      statusElement.textContent = "Error: " + error.message;
      statusElement.style.color = "red";
    }
  });
});