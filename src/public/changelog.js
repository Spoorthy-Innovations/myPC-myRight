(function () {
  var verEl = document.getElementById('changelogVersion');
  var metaEl = document.getElementById('changelogMeta');
  if (!verEl || !metaEl || typeof chrome === 'undefined') return;

  try {
    chrome.storage.local.get({ fpasteUpdateNotice: null }, function (data) {
      var n = data && data.fpasteUpdateNotice ? data.fpasteUpdateNotice : null;
      var version = n && n.version ? n.version : '';
      var prev = n && n.previousVersion ? n.previousVersion : '';

      if (version) verEl.textContent = 'Version ' + version;
      if (version && prev) metaEl.textContent = 'Updated from v' + prev + ' to v' + version + '.';
      else if (version) metaEl.textContent = 'Latest update: v' + version + '.';
    });
  } catch (e) {}
})();
