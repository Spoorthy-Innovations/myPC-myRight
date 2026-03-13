/**
 * Pro-specific popup logic
 * Accompanies popup.js on the Pro version only.
 */

function readProOptionsFromUI() {
  return {
    visibilityBypass: document.getElementById('toggleVisibilityBypass')?.classList.contains('on'),
    keyboardUnblock: document.getElementById('toggleKeyboardUnblock')?.classList.contains('on'),
    overlayRemoval: document.getElementById('toggleOverlayRemoval')?.classList.contains('on'),
    dragDropUnlock: document.getElementById('toggleDragDropUnlock')?.classList.contains('on'),
    printUnlock: document.getElementById('togglePrintUnlock')?.classList.contains('on'),
    
    // Power Tools
    scrollUnlock: document.getElementById('toggleScrollUnlock')?.classList.contains('on'),
    videoUnlock: document.getElementById('toggleVideoUnlock')?.classList.contains('on'),
    autocompleteUnlock: document.getElementById('toggleAutocompleteUnlock')?.classList.contains('on'),
    beforeUnloadBypass: document.getElementById('toggleBeforeUnloadBypass')?.classList.contains('on'),
    zapperUnlock: document.getElementById('toggleZapperUnlock')?.classList.contains('on'),
  };
}

function applyProOptionsToUI(opts) {
  setToggle(document.getElementById('toggleVisibilityBypass'), opts.visibilityBypass);
  setToggle(document.getElementById('toggleKeyboardUnblock'), opts.keyboardUnblock);
  setToggle(document.getElementById('toggleOverlayRemoval'), opts.overlayRemoval);
  setToggle(document.getElementById('toggleDragDropUnlock'), opts.dragDropUnlock);
  setToggle(document.getElementById('togglePrintUnlock'), opts.printUnlock);

  setToggle(document.getElementById('toggleScrollUnlock'), opts.scrollUnlock);
  setToggle(document.getElementById('toggleVideoUnlock'), opts.videoUnlock);
  setToggle(document.getElementById('toggleAutocompleteUnlock'), opts.autocompleteUnlock);
  setToggle(document.getElementById('toggleBeforeUnloadBypass'), opts.beforeUnloadBypass);
  setToggle(document.getElementById('toggleZapperUnlock'), opts.zapperUnlock);
}

function saveAndSendProOptions(opts) {
  if (!chrome || !chrome.storage || !chrome.tabs) return;
  chrome.storage.sync.set(
    {
      fpasteProOptions: opts
    },
    function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            {
              type: 'fpaste:setProOptions',
              options: opts,
            },
            function () {
              if (chrome.runtime && chrome.runtime.lastError) {
                // Ignore error: content script not loaded in this tab (e.g., chrome:// pages)
              }
            }
          );
        }
      });
    }
  );
}

document.addEventListener('DOMContentLoaded', function () {
  const defaultProOptions = {
    visibilityBypass: true,
    keyboardUnblock: true,
    overlayRemoval: true,
    dragDropUnlock: true,
    printUnlock: true,
    scrollUnlock: false,
    videoUnlock: false,
    autocompleteUnlock: false,
    beforeUnloadBypass: false,
    zapperUnlock: false,
  };

  if (!chrome || !chrome.storage) {
    applyProOptionsToUI(defaultProOptions);
    return;
  }

  // Load Pro options
  chrome.storage.sync.get({ fpasteProOptions: null }, function (data) {
    let opts = data.fpasteProOptions;
    if (!opts) {
      opts = defaultProOptions;
    } else {
      opts = Object.assign({}, defaultProOptions, opts);
    }
    applyProOptionsToUI(opts);
    saveAndSendProOptions(readProOptionsFromUI());
  });

  function attachProToggle(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', function () {
      el.classList.toggle('on');
      const opts = readProOptionsFromUI();
      saveAndSendProOptions(opts);
    });
  }

  // Attach listeners to Pro toggles
  [
    'toggleVisibilityBypass', 'toggleKeyboardUnblock', 'toggleOverlayRemoval', 
    'toggleDragDropUnlock', 'togglePrintUnlock',
    'toggleScrollUnlock', 'toggleVideoUnlock', 'toggleAutocompleteUnlock', 
    'toggleBeforeUnloadBypass', 'toggleZapperUnlock'
  ].forEach(id => {
    attachProToggle(id);
  });
});
