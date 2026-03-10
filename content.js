/**
 * Fpaste by Spoorthy - Force paste & copy on any website
 * Runs in capture phase so we get the event before the page can block it.
 * Can be configured per feature via popup (stored in chrome.storage).
 */

var fpasteOptions = {
  copy: true,
  paste: true,
  selection: true,
  rightClick: true,
  showPwd: true,
};
var fpasteSelectionStyleEl = null;
var fpasteDomRelaxed = false;

function applySelectionStyle(enabled) {
  if (!enabled) {
    if (fpasteSelectionStyleEl && fpasteSelectionStyleEl.parentNode) {
      fpasteSelectionStyleEl.parentNode.removeChild(fpasteSelectionStyleEl);
    }
    return;
  }
  if (!fpasteSelectionStyleEl) {
    var style = document.createElement('style');
    style.id = 'fpaste-selection-style';
    style.textContent =
      '* { -webkit-user-select: text !important; user-select: text !important; } ' +
      'input, textarea { -webkit-user-select: text !important; user-select: text !important; }';
    fpasteSelectionStyleEl = style;
  }
  if (!fpasteSelectionStyleEl.parentNode) {
    (document.head || document.documentElement).appendChild(fpasteSelectionStyleEl);
  }
}

function relaxDOMForSelectionAndContext() {
  if (fpasteDomRelaxed) return;
  var body = document.body;
  if (!body) return;

  try {
    body.style.webkitUserSelect = 'text';
    body.style.userSelect = 'text';
  } catch (e) {}

  try {
    var nodes = document.querySelectorAll('[unselectable],[onselectstart],[oncontextmenu]');
    nodes.forEach(function (el) {
      el.removeAttribute('unselectable');
      el.removeAttribute('onselectstart');
      el.removeAttribute('oncontextmenu');
      if (fpasteOptions.selection) {
        el.style && (el.style.userSelect = 'text');
      }
    });
  } catch (e) {}

  fpasteDomRelaxed = true;
}

function setFpasteEnabled(enabled) {
  var on = !!enabled;
  fpasteOptions.copy = on;
  fpasteOptions.paste = on;
  fpasteOptions.selection = on;
  fpasteOptions.rightClick = on;
  fpasteOptions.showPwd = on;
  applySelectionStyle(fpasteOptions.selection);
  if (on) {
    relaxDOMForSelectionAndContext();
  }
}

function applyOptions(opts) {
  fpasteOptions.copy = !!opts.copy;
  fpasteOptions.paste = !!opts.paste;
  fpasteOptions.selection = !!opts.selection;
  fpasteOptions.rightClick = opts.rightClick !== false;
  fpasteOptions.showPwd = !!opts.showPwd;
  applySelectionStyle(fpasteOptions.selection);
  if (fpasteOptions.selection || fpasteOptions.rightClick) {
    relaxDOMForSelectionAndContext();
  }
}

// Load current setting (default: true)
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
  chrome.storage.sync.get({ fpasteOptions: null, fpasteEnabled: true }, function (data) {
    if (data.fpasteOptions) {
      applyOptions(data.fpasteOptions);
    } else {
      setFpasteEnabled(data.fpasteEnabled);
    }
  });
} else {
  applySelectionStyle(true);
}

// Once DOM is ready, clean up inline blockers for selection/right-click
document.addEventListener('DOMContentLoaded', function () {
  if (fpasteOptions.selection || fpasteOptions.rightClick) {
    relaxDOMForSelectionAndContext();
  }
});

var allowPaste = function (e) {
  if (!fpasteOptions.paste) {
    return true;
  }
  e.stopImmediatePropagation();
  return true;
};

var allowCopy = function (e) {
  if (!fpasteOptions.copy) {
    return true;
  }
  e.stopImmediatePropagation();
  return true;
};

var allowCut = function (e) {
  if (!fpasteOptions.copy) {
    return true;
  }
  e.stopImmediatePropagation();
  return true;
};

// Capture phase (true) = we run first, before the page's listeners
document.addEventListener('paste', allowPaste, true);
document.addEventListener('copy', allowCopy, true);
document.addEventListener('cut', allowCut, true);

// Improve text selection: stop page handlers from blocking selection,
// but do NOT interfere with click handlers on buttons/controls.
document.addEventListener(
  'selectstart',
  function (e) {
    if (!fpasteOptions.selection) return true;
    // Let selection proceed; just prevent page's own selectstart handlers
    e.stopImmediatePropagation();
    return true;
  },
  true
);

// Force-enable right click (context menu)
document.addEventListener(
  'contextmenu',
  function (e) {
    if (!fpasteOptions.rightClick) return true;
    // Stop page handlers from blocking the context menu, but don't prevent default
    e.stopImmediatePropagation();
    return true;
  },
  true
);

function fpasteShowPassword(el) {
  if (!fpasteOptions.showPwd) return;
  if (!el || el.tagName !== 'INPUT') return;
  var type = (el.getAttribute('type') || '').toLowerCase();
  if (type !== 'password' && el.dataset.fpastePwd !== 'visible') return;
  if (el.dataset.fpastePwd === 'visible') return;
  el.setAttribute('type', 'text');
  el.dataset.fpastePwd = 'visible';
}

function fpasteHidePassword(el) {
  if (!el || el.tagName !== 'INPUT') return;
  if (el.dataset.fpastePwd !== 'visible') return;
  el.setAttribute('type', 'password');
  delete el.dataset.fpastePwd;
}

// Show password when hovering or editing, hide when leaving/blur
document.addEventListener(
  'mouseover',
  function (e) {
    if (!fpasteOptions.showPwd) return true;
    fpasteShowPassword(e.target);
    return true;
  },
  true
);

document.addEventListener(
  'focus',
  function (e) {
    if (!fpasteOptions.showPwd) return true;
    fpasteShowPassword(e.target);
    return true;
  },
  true
);

document.addEventListener(
  'mouseout',
  function (e) {
    if (!fpasteOptions.showPwd) return true;
    fpasteHidePassword(e.target);
    return true;
  },
  true
);

document.addEventListener(
  'blur',
  function (e) {
    if (!fpasteOptions.showPwd) return true;
    fpasteHidePassword(e.target);
    return true;
  },
  true
);

// Listen for enable/disable toggle from the popup
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message) return;

    if (message.type === 'fpaste:setEnabled') {
      setFpasteEnabled(message.enabled);
      if (chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ fpasteEnabled: !!message.enabled });
      }
      sendResponse({ ok: true });
    } else if (message.type === 'fpaste:setOptions' && message.options) {
      applyOptions(message.options);
      if (chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({
          fpasteOptions: fpasteOptions,
          fpasteEnabled:
            !!fpasteOptions.copy &&
            !!fpasteOptions.paste &&
            !!fpasteOptions.selection &&
            !!fpasteOptions.rightClick &&
            !!fpasteOptions.showPwd,
        });
      }
      sendResponse({ ok: true });
    }
  });
}
