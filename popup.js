document.getElementById('save').addEventListener('click', () => {
  const pages = parseInt(document.getElementById('pages').value);

  chrome.storage.sync.set({ pagesToApply: pages }, () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];

      chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: () => {
          alert("🦾 Auto Apply initialized from popup!");
        }
      });
    });
  });
});
