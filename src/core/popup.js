function setToggle(el, on) {
  if (!el) return;
  el.classList.toggle('on', !!on);
}

function readOptionsFromUI() {
  return {
    copy: document.getElementById('toggleCopy')?.classList.contains('on'),
    paste: document.getElementById('togglePaste')?.classList.contains('on'),
    selection: document.getElementById('toggleSelection')?.classList.contains('on'),
    rightClick: document.getElementById('toggleRightClick')?.classList.contains('on'),
    showPwd: document.getElementById('togglePwd')?.classList.contains('on'),
    strongSelection: document.getElementById('toggleStrongSelection')?.classList.contains('on'),
function applyOptionsToUI(opts) {
  setToggle(document.getElementById('toggleCopy'), opts.copy);
  setToggle(document.getElementById('togglePaste'), opts.paste);
  setToggle(document.getElementById('toggleSelection'), opts.selection);
  setToggle(document.getElementById('toggleRightClick'), opts.rightClick);
  setToggle(document.getElementById('togglePwd'), opts.showPwd);
  setToggle(document.getElementById('toggleStrongSelection'), opts.strongSelection);
}

function saveAndSendOptions(opts) {
  if (!chrome || !chrome.storage || !chrome.tabs) return;
  chrome.storage.sync.set(
    {
      fpasteOptions: opts,
      fpasteOptions: opts
    },
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

document.addEventListener('DOMContentLoaded', function () {
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
    // Ensure current tab gets the effective defaults/options even
    // if the user hasn't toggled anything yet.
    saveAndSendOptions(readOptionsFromUI());
  });

  function attachToggle(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', function () {
      el.classList.toggle('on');
      const opts = readOptionsFromUI();
      saveAndSendOptions(opts);
    });
  }

  attachToggle('toggleCopy');
  attachToggle('togglePaste');
  attachToggle('toggleSelection');
  attachToggle('toggleRightClick');
  attachToggle('togglePwd');
  attachToggle('toggleStrongSelection');

  const masterToggle = document.getElementById('toggleMaster');
  if (masterToggle) {
    masterToggle.addEventListener('click', function () {
      const isNowOn = !masterToggle.classList.contains('on');
      setToggle(masterToggle, isNowOn);
      
      if (!chrome || !chrome.storage || !chrome.tabs) return;
      
      chrome.storage.sync.set({ fpasteEnabled: isNowOn }, function() {
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

