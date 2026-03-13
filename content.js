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
  strongSelection: false,
};
var fpasteSelectionStyleEl = null;
var fpasteDomRelaxed = false;
var fpasteRelaxIntervalId = null;

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
      '* { -webkit-user-select: text !important; -moz-user-select: text !important; -ms-user-select: text !important; user-select: text !important; } ' +
      'input, textarea { -webkit-user-select: text !important; -moz-user-select: text !important; -ms-user-select: text !important; user-select: text !important; }';
    fpasteSelectionStyleEl = style;
  }
  if (!fpasteSelectionStyleEl.parentNode || !document.contains(fpasteSelectionStyleEl)) {
    var target = document.head || document.documentElement;
    if (target) {
      target.appendChild(fpasteSelectionStyleEl);
    }
  }
}

function relaxDOMForSelectionAndContext() {
  if (fpasteDomRelaxed) return;
  var body = document.body;
  if (!body) return;

  try {
    if (fpasteOptions.strongSelection) {
      body.style.setProperty('-webkit-user-select', 'text', 'important');
      body.style.setProperty('user-select', 'text', 'important');
    } else {
      body.style.webkitUserSelect = 'text';
      body.style.userSelect = 'text';
    }
  } catch (e) {}

  try {
    var nodes = document.querySelectorAll('[unselectable],[onselectstart],[oncontextmenu]');
    nodes.forEach(function (el) {
      el.removeAttribute('unselectable');
      el.removeAttribute('onselectstart');
      el.removeAttribute('oncontextmenu');
      if (fpasteOptions.selection && el.style) {
        if (fpasteOptions.strongSelection) {
          el.style.setProperty('-webkit-user-select', 'text', 'important');
          el.style.setProperty('-moz-user-select', 'text', 'important');
          el.style.setProperty('-ms-user-select', 'text', 'important');
          el.style.setProperty('user-select', 'text', 'important');
        } else {
          el.style.webkitUserSelect = 'text';
          el.style.MozUserSelect = 'text';
          el.style.msUserSelect = 'text';
          el.style.userSelect = 'text';
        }
      }
    });
  } catch (e) {}

  fpasteDomRelaxed = true;
}

function ensureRelaxTimer() {
  if (fpasteRelaxIntervalId) return;
  // Periodically re-apply DOM relax in case the page mutates after load.
  fpasteRelaxIntervalId = setInterval(function () {
    if (fpasteOptions.selection || fpasteOptions.rightClick) {
      applySelectionStyle(fpasteOptions.selection);
      fpasteDomRelaxed = false;
      relaxDOMForSelectionAndContext();
    }
  }, 3000);
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
    ensureRelaxTimer();
  }
}

function applyOptions(opts) {
  fpasteOptions.copy = !!opts.copy;
  fpasteOptions.paste = !!opts.paste;
  fpasteOptions.selection = !!opts.selection;
  fpasteOptions.rightClick = opts.rightClick !== false;
  fpasteOptions.showPwd = !!opts.showPwd;
  fpasteOptions.strongSelection = !!opts.strongSelection;
  applySelectionStyle(fpasteOptions.selection);
  if (fpasteOptions.selection || fpasteOptions.rightClick) {
    relaxDOMForSelectionAndContext();
    ensureRelaxTimer();
  }
}

// Load current setting (default: all features ON)
// Start with everything enabled immediately, then override from storage if needed.
setFpasteEnabled(true);
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
  chrome.storage.sync.get({ fpasteOptions: null, fpasteEnabled: true }, function (data) {
    if (data && data.fpasteOptions) {
      applyOptions(data.fpasteOptions);
    } else if (data && typeof data.fpasteEnabled !== 'undefined') {
      setFpasteEnabled(data.fpasteEnabled);
    }
  });
}

// Once DOM is ready, clean up inline blockers for selection/right-click
document.addEventListener('DOMContentLoaded', function () {
  if (fpasteOptions.selection || fpasteOptions.rightClick) {
    applySelectionStyle(fpasteOptions.selection);
    relaxDOMForSelectionAndContext();
  }
});

// Re-apply EVERYTHING once the entire page (including external scripts/frames) has fully loaded.
window.addEventListener('load', function () {
  if (fpasteOptions.selection || fpasteOptions.rightClick) {
    applySelectionStyle(fpasteOptions.selection);
    relaxDOMForSelectionAndContext();
    
    // Setup a MutationObserver as a last resort against highly aggressive sites
    setupMutationObserver();

    // The manual toggle OFF -> ON works because it runs entirely after the page's scripts 
    // have established their blockers. Let's explicitly simulate that toggle 2 seconds 
    // and 4 seconds after window.load.
    setTimeout(function() {
      if (fpasteOptions.selection) {
        setFpasteEnabled(false);
        setTimeout(function() {
          setFpasteEnabled(true);
        }, 100);
      }
    }, 2000);
    
    setTimeout(function() {
      if (fpasteOptions.selection) {
        setFpasteEnabled(false);
        setTimeout(function() {
          setFpasteEnabled(true);
        }, 100);
      }
    }, 4500);
  }
});

function setupMutationObserver() {
  if (!fpasteOptions.selection) return;
  var observer = new MutationObserver(function(mutations) {
    var needsRelax = false;
    for (var i = 0; i < mutations.length; i++) {
        var mutation = mutations[i];
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            needsRelax = true;
            break;
        } else if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
           needsRelax = true;
           break;
        }
    }
    
    if (needsRelax) {
        // Debounce the relax call slightly to avoid freezing the browser on heavy mutations
        fpasteDomRelaxed = false;
        applySelectionStyle(fpasteOptions.selection);
        relaxDOMForSelectionAndContext();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class']
  });
}

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
// Attach to window so it runs before document listeners
window.addEventListener('paste', allowPaste, true);
window.addEventListener('copy', allowCopy, true);
window.addEventListener('cut', allowCut, true);

// Improve text selection: stop page handlers from blocking selection,
// but do NOT interfere with click handlers on buttons/controls.
window.addEventListener(
  'selectstart',
  function (e) {
    if (!fpasteOptions.selection) return true;
    // On first real selection attempt, aggressively relax DOM again
    // in case the page changed after initial load.
    relaxDOMForSelectionAndContext();
    // Let selection proceed; just prevent page's own selectstart handlers
    e.stopImmediatePropagation();
    return true;
  },
  true
);

// Some sites block selection via mousedown/mouseup handlers instead of selectstart.
// We stop their handlers in capture phase, but try to avoid breaking real controls.
function fpasteIsInteractiveTarget(target) {
  if (!target || !target.closest) return false;
  return !!target.closest(
    'a, button, input, textarea, select, [contenteditable="true"], [role="button"], [role="link"]'
  );
}

['mousedown', 'mouseup'].forEach(function (type) {
  window.addEventListener(
    type,
    function (e) {
      if (!fpasteOptions.selection) return true;
      if (fpasteIsInteractiveTarget(e.target)) return true;
      // Allow default behavior (so clicks still work), but stop page handlers
      // that try to cancel selection on regular text.
      e.stopImmediatePropagation();
      return true;
    },
    true
  );
});

// Force-enable right click (context menu)
window.addEventListener(
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
