var FPASTE_UPDATE_NOTICE_KEY = 'fpasteUpdateNotice';

chrome.runtime.onInstalled.addListener(function (details) {
  if (!details || details.reason !== 'update') return;

  var manifest = chrome.runtime.getManifest();
  var currentVersion = manifest && manifest.version ? manifest.version : '';
  if (!currentVersion) return;

  var notice = {
    version: currentVersion,
    previousVersion: details.previousVersion || '',
    ts: Date.now(),
    unread: true
  };

  chrome.storage.local.set(
    {
      fpasteUpdateNotice: notice
    },
    function () {
      if (chrome.runtime && chrome.runtime.lastError) {
        return;
      }
      chrome.action.setBadgeBackgroundColor({ color: '#d93025' });
      chrome.action.setBadgeText({ text: 'NEW' });
      chrome.tabs.create({ url: chrome.runtime.getURL('changelog.html') });
    }
  );
});
