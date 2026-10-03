var FPASTE_UPDATE_NOTICE_KEY = 'fpasteUpdateNotice';

// Settings used to live in chrome.storage.sync, which silently fails to save on machines
// where Chrome Sync is disabled (common on managed/corporate devices - exactly where this
// extension is most needed for bank sites). Moved to chrome.storage.local for reliability;
// this one-time copy keeps existing users' settings instead of resetting them to defaults.
function migrateSyncSettingsToLocal() {
  if (!chrome.storage || !chrome.storage.sync || !chrome.storage.local) return;
  var keys = ['fpasteOptions', 'fpasteEnabled', 'fpasteProOptions', 'fpasteExcludedHosts'];
  chrome.storage.local.get(keys, function (localData) {
    if (chrome.runtime.lastError) return;
    var missing = keys.filter(function (k) { return typeof localData[k] === 'undefined'; });
    if (!missing.length) return;
    chrome.storage.sync.get(missing, function (syncData) {
      if (chrome.runtime.lastError || !syncData) return;
      var toCopy = {};
      missing.forEach(function (k) {
        if (typeof syncData[k] !== 'undefined') toCopy[k] = syncData[k];
      });
      if (Object.keys(toCopy).length) chrome.storage.local.set(toCopy);
    });
  });
}

chrome.runtime.onInstalled.addListener(function (details) {
  if (details && details.reason === 'update') migrateSyncSettingsToLocal();
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
