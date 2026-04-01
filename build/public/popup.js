function setToggle(el, on) {
  if (!el) return;
  el.classList.toggle('on', !!on);
}

function setFeatureTogglesEnabled(enabled) {
  var master = document.getElementById('toggleMaster');
  var toggles = document.querySelectorAll('.toggle:not(.master-toggle)');
  toggles.forEach(function (el) {
    el.classList.toggle('disabled', !enabled);
    el.setAttribute('aria-disabled', enabled ? 'false' : 'true');
  });
}

function readOptionsFromUI() {
  var combined = document.getElementById('toggleSelCopyPaste')?.classList.contains('on');
  return {
    copy: combined,
    paste: combined,
    selection: combined,
    rightClick: document.getElementById('toggleRightClick')?.classList.contains('on'),
    showPwd: document.getElementById('togglePwd')?.classList.contains('on'),
    strongSelection: document.getElementById('toggleStrongSelection')?.classList.contains('on'),
  };
}

function applyOptionsToUI(opts) {
  var combinedOn = !!opts.copy && !!opts.paste && !!opts.selection;
  setToggle(document.getElementById('toggleSelCopyPaste'), combinedOn);
  setToggle(document.getElementById('toggleRightClick'), opts.rightClick);
  setToggle(document.getElementById('togglePwd'), opts.showPwd);
  setToggle(document.getElementById('toggleStrongSelection'), opts.strongSelection);
}

function saveAndSendOptions(opts) {
  if (!chrome || !chrome.storage || !chrome.tabs) return;
  chrome.storage.sync.set(
    { fpasteOptions: opts },
    function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            {
              type: 'fpaste:setOptions',
              options: opts,
            },
            function () {
              if (chrome.runtime && chrome.runtime.lastError) {
                // ignore pages where content script can't run
              }
            }
          );
        }
      });
    }
  );
}

function clearUpdateBadge() {
  if (!chrome || !chrome.action) return;
  chrome.action.setBadgeText({ text: '' });
}

function markUpdateNoticeRead(currentVersion) {
  if (!chrome || !chrome.storage || !chrome.storage.local) return;
  chrome.storage.local.get({ fpasteUpdateNotice: null }, function (data) {
    var notice = data.fpasteUpdateNotice;
    if (!notice || notice.version !== currentVersion || !notice.unread) {
      clearUpdateBadge();
      return;
    }
    notice.unread = false;
    chrome.storage.local.set({ fpasteUpdateNotice: notice }, function () {
      clearUpdateBadge();
    });
  });
}

function initUpdateNotice(currentVersion) {
  if (!chrome || !chrome.storage || !chrome.storage.local) return;
  var box = document.getElementById('updateNotice');
  var text = document.getElementById('updateNoticeText');
  var dismiss = document.getElementById('dismissUpdateNotice');
  if (!box || !text || !dismiss) return;

  chrome.storage.local.get({ fpasteUpdateNotice: null }, function (data) {
    var notice = data.fpasteUpdateNotice;
    if (!notice || notice.version !== currentVersion || !notice.unread) {
      clearUpdateBadge();
      return;
    }
    text.textContent =
      'Updated to v' +
      notice.version +
      (notice.previousVersion ? ' (from v' + notice.previousVersion + ')' : '');
    box.classList.add('show');
  });

  dismiss.addEventListener('click', function () {
    box.classList.remove('show');
    markUpdateNoticeRead(currentVersion);
  });
}

function initStoreUpdateVersion(currentVersion) {
  if (!chrome || !chrome.runtime || typeof chrome.runtime.requestUpdateCheck !== 'function') return;
  var el = document.getElementById('storeUpdateVersion');
  if (!el) return;

  try {
    chrome.runtime.requestUpdateCheck(function (status, details) {
      if (status !== 'update_available') return;
      var nextVersion = details && details.version ? details.version : '';
      if (!nextVersion || nextVersion === currentVersion) return;
      el.textContent = 'New version available in Web Store: v' + nextVersion;
      el.classList.add('show');
    });
  } catch (e) {}
}

function initAddCurrentSiteButton() {
  var defaultExcludedHosts = [
    'docs.google.com',
    'drive.google.com',
    'docs.microsoft.com',
    '*.officeapps.live.com'
  ];
  var btn = document.getElementById('addCurrentSiteToExclusions');
  var storeMsg = document.getElementById('storeUpdateVersion');
  if (!btn || !chrome || !chrome.tabs || !chrome.storage || !chrome.storage.sync) return;

  btn.addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var url = tabs && tabs[0] ? tabs[0].url || '' : '';
      var hostname = '';
      try {
        hostname = new URL(url).hostname.toLowerCase();
      } catch (e) {
        return;
      }
      if (!hostname) return;

      chrome.storage.sync.get({ fpasteExcludedHosts: defaultExcludedHosts }, function (data) {
        var base = Array.isArray(data.fpasteExcludedHosts) && data.fpasteExcludedHosts.length
          ? data.fpasteExcludedHosts
          : defaultExcludedHosts;
        var list = base
          .map(function (x) { return String(x || '').trim().toLowerCase(); })
          .filter(Boolean);
        if (list.indexOf(hostname) === -1) list.push(hostname);
        list = Array.from(new Set(list));
        chrome.storage.sync.set({ fpasteExcludedHosts: list }, function () {
          if (storeMsg) {
            storeMsg.textContent = 'Added to exclusions: ' + hostname + ' (reload tab)';
            storeMsg.classList.add('show');
          }
        });
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var exclusionsLink = document.getElementById('openExclusions');
  if (
    exclusionsLink &&
    typeof chrome !== 'undefined' &&
    chrome.runtime &&
    typeof chrome.runtime.openOptionsPage === 'function'
  ) {
    exclusionsLink.addEventListener('click', function (e) {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
      window.close();
    });
  }

  var verEl = document.getElementById('appVersion');
  var currentVersion = '';
  if (
    verEl &&
    typeof chrome !== 'undefined' &&
    chrome.runtime &&
    typeof chrome.runtime.getManifest === 'function'
  ) {
    try {
      currentVersion = chrome.runtime.getManifest().version;
      verEl.textContent = 'v' + currentVersion;
    } catch (e) {}
  }
  if (currentVersion) initUpdateNotice(currentVersion);
  if (currentVersion) initStoreUpdateVersion(currentVersion);
  initAddCurrentSiteButton();

  const defaultOptions = {
    copy: true,
    paste: true,
    selection: true,
    rightClick: true,
    showPwd: true,
    strongSelection: false,
  };

  if (!chrome || !chrome.storage) {
    applyOptionsToUI(defaultOptions);
    setFeatureTogglesEnabled(true);
    return;
  }

  chrome.storage.sync.get({ fpasteOptions: null, fpasteEnabled: true }, function (data) {
    let opts = data.fpasteOptions;
    if (!opts) {
      const en = !!data.fpasteEnabled;
      opts = {
        copy: en,
        paste: en,
        selection: en,
        rightClick: en,
        showPwd: en,
        strongSelection: false,
      };
    } else {
      opts = Object.assign({}, defaultOptions, opts);
    }
    if (typeof data.fpasteEnabled !== 'undefined') {
      setToggle(document.getElementById('toggleMaster'), data.fpasteEnabled);
    } else {
      setToggle(document.getElementById('toggleMaster'), true); // default ON
    }

    applyOptionsToUI(opts);
    setFeatureTogglesEnabled(!!data.fpasteEnabled);
    // Ensure current tab gets the effective defaults/options even
    // if the user hasn't toggled anything yet.
    saveAndSendOptions(readOptionsFromUI());
  });

  function attachToggle(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', function () {
      var master = document.getElementById('toggleMaster');
      if (master && !master.classList.contains('on')) return; // master OFF => feature toggles readonly
      el.classList.toggle('on');
      var opts = readOptionsFromUI();
      saveAndSendOptions(opts);
    });
  }

  attachToggle('toggleSelCopyPaste');
  attachToggle('toggleRightClick');
  attachToggle('togglePwd');
  attachToggle('toggleStrongSelection');

  var masterToggle = document.getElementById('toggleMaster');
  if (masterToggle) {
    masterToggle.addEventListener('click', function () {
      var isNowOn = !masterToggle.classList.contains('on');
      setToggle(masterToggle, isNowOn);
      setFeatureTogglesEnabled(isNowOn);
      if (!chrome || !chrome.storage || !chrome.tabs) return;
      chrome.storage.sync.set({ fpasteEnabled: isNowOn }, function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          if (tabs && tabs[0]) {
            chrome.tabs.sendMessage(
              tabs[0].id,
              { type: 'fpaste:setEnabled', enabled: isNowOn },
              function () {
                if (chrome.runtime && chrome.runtime.lastError) {}
              }
            );
          }
        });
      });
    });
  }
});

