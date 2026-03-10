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
  };
}

function applyOptionsToUI(opts) {
  setToggle(document.getElementById('toggleCopy'), opts.copy);
  setToggle(document.getElementById('togglePaste'), opts.paste);
  setToggle(document.getElementById('toggleSelection'), opts.selection);
  setToggle(document.getElementById('toggleRightClick'), opts.rightClick);
  setToggle(document.getElementById('togglePwd'), opts.showPwd);
}

function saveAndSendOptions(opts) {
  if (!chrome || !chrome.storage || !chrome.tabs) return;
  chrome.storage.sync.set(
    {
      fpasteOptions: opts,
      // keep legacy single flag roughly in sync (all true/false)
      fpasteEnabled: !!(
        opts.copy &&
        opts.paste &&
        opts.selection &&
        opts.rightClick &&
        opts.showPwd
      ),
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
      };
    } else {
      opts = Object.assign({}, defaultOptions, opts);
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
});

