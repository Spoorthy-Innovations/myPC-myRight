/**
 * Fpaste by Spoorthy — force copy/paste (optional), selection, right-click, password visibility.
 * Clipboard: window capture + stopImmediatePropagation helps bank/restricted sites; skipped on
 * known rich editors (Google Docs/Sheets, Office Online) so their JS clipboard still works.
 * User can turn Copy/Paste off in the popup. Options: chrome.storage.
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
var fpasteGlobalEnabled = true;
var fpasteExcludedHostsDefault = [
  'docs.google.com',
  'drive.google.com',
  'docs.microsoft.com',
  '*.officeapps.live.com'
];
var fpasteExcludedHosts = fpasteExcludedHostsDefault.slice();
var fpasteSiteExcluded = false;

// Rich editors implement their own clipboard/selection; same interception that helps banks
// would break them. Banks and typical restricted sites are not matched here.
function fpasteIsRichEditorHost() {
  return fpasteSiteExcluded;
}

function fpasteNormalizeHostPattern(pattern) {
  if (!pattern) return '';
  return String(pattern).trim().toLowerCase();
}

function fpasteMatchesHostPattern(hostname, pattern) {
  if (!hostname || !pattern) return false;
  if (pattern.indexOf('*.') === 0) {
    var suffix = pattern.slice(2);
    return hostname === suffix || hostname.endsWith('.' + suffix);
  }
  return hostname === pattern;
}

function fpasteComputeSiteExcluded() {
  try {
    var host = (location.hostname || '').toLowerCase();
    for (var i = 0; i < fpasteExcludedHosts.length; i++) {
      var p = fpasteNormalizeHostPattern(fpasteExcludedHosts[i]);
      if (!p) continue;
      if (fpasteMatchesHostPattern(host, p)) return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

function fpasteForceClipboardEvents() {
  return fpasteGlobalEnabled && !fpasteIsRichEditorHost();
}

function applySelectionStyle(enabled) {
  if (!enabled) {
    if (fpasteSelectionStyleEl && fpasteSelectionStyleEl.parentNode) {
      fpasteSelectionStyleEl.parentNode.removeChild(fpasteSelectionStyleEl);
    }
    return;
  }
  if (fpasteIsRichEditorHost()) return;
  if (!fpasteSelectionStyleEl) {
    var style = document.createElement('style');
    style.id = 'fpaste-selection-style';
    style.textContent =
      '* { -webkit-user-select: text !important; -moz-user-select: text !important; -ms-user-select: text !important; user-select: text !important; } ' +
      'input, textarea { -webkit-user-select: text !important; -moz-user-select: text !important; -ms-user-select: text !important; user-select: text !important; }';
    fpasteSelectionStyleEl = style;
  }
  var target = document.head || document.documentElement;
  if (target) {
    // If it's not the very last child, append it again to move it to the end.
    // This ensures our !important rules override any newly injected !important rules.
    if (target.lastElementChild !== fpasteSelectionStyleEl) {
      target.appendChild(fpasteSelectionStyleEl);
    }
  }
}

function relaxDOMForSelectionAndContext() {
  if (fpasteIsRichEditorHost()) return;
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
  // Periodically re-apply DOM relax in case the page mutates after load. 10s to save CPU/battery.
  fpasteRelaxIntervalId = setInterval(function () {
    if (fpasteOptions.selection || fpasteOptions.rightClick) {
      applySelectionStyle(fpasteOptions.selection);
      fpasteDomRelaxed = false;
      relaxDOMForSelectionAndContext();
    }
  }, 10000);
}

function setFpasteEnabled(enabled) {
  fpasteGlobalEnabled = !!enabled && !fpasteSiteExcluded;
  if (!fpasteGlobalEnabled) {
    applySelectionStyle(false);
    return;
  }
  
  // Re-apply current specific states if globally enabled
  applySelectionStyle(fpasteOptions.selection);
  if (fpasteOptions.selection || fpasteOptions.rightClick) {
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
  
  if (!fpasteGlobalEnabled) return;
  
  applySelectionStyle(fpasteOptions.selection);
  if (fpasteOptions.selection || fpasteOptions.rightClick) {
    relaxDOMForSelectionAndContext();
    ensureRelaxTimer();
  }
}

// Load current setting (default: all features ON)
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
  chrome.storage.sync.get(
    {
      fpasteOptions: null,
      fpasteEnabled: true,
      fpasteExcludedHosts: fpasteExcludedHostsDefault
    },
    function (data) {
      if (data && Array.isArray(data.fpasteExcludedHosts)) {
        fpasteExcludedHosts = data.fpasteExcludedHosts.map(fpasteNormalizeHostPattern).filter(Boolean);
      }
      if (!fpasteExcludedHosts.length) {
        fpasteExcludedHosts = fpasteExcludedHostsDefault.slice();
      }
      fpasteSiteExcluded = fpasteComputeSiteExcluded();
    if (data && typeof data.fpasteEnabled !== 'undefined') {
      fpasteGlobalEnabled = !!data.fpasteEnabled && !fpasteSiteExcluded;
    }
    if (data && data.fpasteOptions) {
      applyOptions(data.fpasteOptions);
    } else {
       // initialize properly
       setFpasteEnabled(fpasteGlobalEnabled);
    }
    }
  );
} else {
  fpasteExcludedHosts = fpasteExcludedHostsDefault.slice();
  fpasteSiteExcluded = fpasteComputeSiteExcluded();
  setFpasteEnabled(true);
}

// Once DOM is ready, clean up inline blockers for selection/right-click
document.addEventListener('DOMContentLoaded', function () {
  if (!fpasteGlobalEnabled) return;
  if (fpasteOptions.selection || fpasteOptions.rightClick) {
    applySelectionStyle(fpasteOptions.selection);
    relaxDOMForSelectionAndContext();
  }
});

// Re-apply EVERYTHING once the entire page (including external scripts/frames) has fully loaded.
window.addEventListener('load', function () {
  if (!fpasteGlobalEnabled) return;
  if (fpasteOptions.selection || fpasteOptions.rightClick) {
    applySelectionStyle(fpasteOptions.selection);
    relaxDOMForSelectionAndContext();
    
    // Setup a MutationObserver as a last resort against highly aggressive sites
    setupMutationObserver();
  }
});

function setupMutationObserver() {
  if (!fpasteOptions.selection || !fpasteGlobalEnabled) return;
  if (fpasteIsRichEditorHost()) return;
  var relaxDebounceTimer = null;
  var DEBOUNCE_MS = 120;

  var scheduleRelax = function () {
    if (relaxDebounceTimer) clearTimeout(relaxDebounceTimer);
    relaxDebounceTimer = setTimeout(function () {
      relaxDebounceTimer = null;
      if (!fpasteOptions.selection || !fpasteGlobalEnabled) return;
      fpasteDomRelaxed = false;
      applySelectionStyle(fpasteOptions.selection);
      relaxDOMForSelectionAndContext();
    }, DEBOUNCE_MS);
  };

  var observer = new MutationObserver(function (mutations) {
    var needsRelax = false;
    for (var i = 0; i < mutations.length; i++) {
      var mutation = mutations[i];
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (var j = 0; j < mutation.addedNodes.length; j++) {
          if (mutation.addedNodes[j] !== fpasteSelectionStyleEl) {
            needsRelax = true;
            break;
          }
        }
      } else if (mutation.type === 'attributes' && (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
        needsRelax = true;
        break;
      }
      if (needsRelax) break;
    }
    if (needsRelax) scheduleRelax();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class']
  });
}

function fpasteForceSelectablePath(target) {
  if (!target || !target.nodeType || target.nodeType !== 1) return;
  var node = target;
  var depth = 0;
  while (node && depth < 24) {
    if (node.style) {
      node.style.setProperty('-webkit-user-select', 'text', 'important');
      node.style.setProperty('-moz-user-select', 'text', 'important');
      node.style.setProperty('-ms-user-select', 'text', 'important');
      node.style.setProperty('user-select', 'text', 'important');
      node.style.setProperty('pointer-events', 'auto', 'important');
      node.style.setProperty('-webkit-touch-callout', 'default', 'important');
    }
    if (node.removeAttribute) {
      node.removeAttribute('unselectable');
      node.removeAttribute('onselectstart');
      node.removeAttribute('oncontextmenu');
      node.removeAttribute('onmousedown');
      node.removeAttribute('onmouseup');
      node.removeAttribute('onmousemove');
    }
    node = node.parentElement;
    depth++;
  }
}

var allowPaste = function (e) {
  if (!fpasteForceClipboardEvents() || !fpasteOptions.paste) return true;
  e.stopImmediatePropagation();
  return true;
};

var allowCopy = function (e) {
  if (!fpasteForceClipboardEvents() || !fpasteOptions.copy) return true;
  e.stopImmediatePropagation();
  return true;
};

var allowCut = function (e) {
  if (!fpasteForceClipboardEvents() || !fpasteOptions.copy) return true;
  e.stopImmediatePropagation();
  return true;
};

window.addEventListener('paste', allowPaste, true);
window.addEventListener('copy', allowCopy, true);
window.addEventListener('cut', allowCut, true);

// Improve text selection: re-relax DOM on select attempts (no stopPropagation — same issue
// as clipboard for rich editors with custom selection).
window.addEventListener(
  'selectstart',
  function (e) {
    if (!fpasteGlobalEnabled || !fpasteOptions.selection) return true;
    relaxDOMForSelectionAndContext();
    fpasteForceSelectablePath(e.target);
    if (!fpasteIsRichEditorHost() && !fpasteIsInteractiveTarget(e.target)) {
      // Many anti-copy sites cancel selection in selectstart handlers.
      // Stop their handlers while preserving browser default selection behavior.
      e.stopImmediatePropagation();
    }
    return true;
  },
  true
);

// Some sites block selection via mousedown/mouseup handlers instead of selectstart.
// We stop their handlers in capture phase only when the click is in main content,
// so we never break app chrome (Gmail right panel: Contacts, Calendar, Tasks, etc.).
function fpasteIsInteractiveTarget(target) {
  if (!target || !target.closest) return false;
  if (
    target.closest(
    'a, button, input, textarea, select, [contenteditable="true"], ' +
    '[role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="option"], [role="treeitem"], ' +
    '[draggable="true"]'
    )
  ) {
    return true;
  }

  // Many banking sites use custom dropdowns built with div/span + ARIA/state attrs.
  var controlLike = target.closest(
    '[role="combobox"], [role="listbox"], [role="menu"], [role="dialog"], ' +
    '[aria-haspopup], [aria-expanded], [aria-controls], [data-toggle], [data-target]'
  );
  if (controlLike) return true;

  // Cursor:pointer is a strong signal for custom clickable controls.
  var node = target;
  var depth = 0;
  while (node && depth < 6) {
    if (node.nodeType === 1) {
      try {
        var style = window.getComputedStyle(node);
        if (style && style.cursor === 'pointer') return true;
      } catch (e) {}
    }
    node = node.parentElement;
    depth++;
  }
  return false;
}

// Only stop mousedown/mouseup when click is inside main content. Never stop in nav/sidebar/toolbar
// (Gmail right panel and similar UIs use plain divs with JS handlers - not detectable by role).
function fpasteIsMainContent(target) {
  if (!target || !target.closest) return false;
  if (target.closest('main, [role="main"], article')) return true;

  // Some sites (including many news portals) do not use semantic main/article wrappers.
  // In that case, allow body content but still avoid obvious app chrome regions.
  if (!document.querySelector('main, [role="main"], article')) {
    if (target.closest('header, nav, aside, footer, [role="navigation"], [role="banner"], [role="complementary"]')) {
      return false;
    }
    return !!target.closest('body');
  }

  return false;
}

function fpasteAllowSelectionEvent(e) {
  if (!fpasteGlobalEnabled || !fpasteOptions.selection) return true;
  if (fpasteIsInteractiveTarget(e.target)) return true;
  fpasteForceSelectablePath(e.target);
  // Allow browser default behavior, but block page handlers that cancel/clear selection.
  e.stopImmediatePropagation();
  return true;
}

[
  'mousedown',
  'mouseup',
  'mousemove',
  'pointerdown',
  'pointerup',
  'pointermove',
  'touchstart',
  'touchend',
  'touchmove',
  'dragstart'
].forEach(function (type) {
  window.addEventListener(type, fpasteAllowSelectionEvent, true);
});

// Some sites clear selected text on selectionchange. Stop those handlers globally while
// keeping browser-native selection behavior.
document.addEventListener(
  'selectionchange',
  function (e) {
    if (!fpasteGlobalEnabled || !fpasteOptions.selection) return true;
    e.stopImmediatePropagation();
    return true;
  },
  true
);

// Force-enable right click: do not stopImmediatePropagation on window — that blocks the
// event from reaching the focused element (e.g. Sheets cells). Rely on relaxDOM + styles.
window.addEventListener(
  'contextmenu',
  function (e) {
    if (!fpasteGlobalEnabled || !fpasteOptions.rightClick) return true;
    relaxDOMForSelectionAndContext();
    return true;
  },
  true
);

function fpasteShowPassword() {
  if (!fpasteGlobalEnabled || !fpasteOptions.showPwd) return;
  var inputs = document.querySelectorAll('input');
  inputs.forEach(function (el) {
    if (!el || !el.value || el.dataset.fpastePwd === 'visible') return;
    var type = (el.getAttribute('type') || '').toLowerCase();
    var style = window.getComputedStyle(el);
    var hasTextSecurity =
      style.webkitTextSecurity && style.webkitTextSecurity !== 'none';
    var isPasswordLike = type === 'password' || hasTextSecurity;
    if (!isPasswordLike) return;

    el.dataset.fpastePwd = 'visible';
    el.dataset.fpasteOriginalType = type || '';
    el.dataset.fpasteOriginalWebkitTextSecurity =
      style.webkitTextSecurity || '';

    if (type === 'password') {
      el.setAttribute('type', 'text');
    }
    if (hasTextSecurity) {
      el.style.setProperty('-webkit-text-security', 'none', 'important');
    }
  });
}

function fpasteHidePassword() {
  var inputs = document.querySelectorAll('input[data-fpaste-pwd="visible"]');
  inputs.forEach(function (el) {
    if (!el) return;
    var origType = el.dataset.fpasteOriginalType || '';
    var origWebkitTextSecurity =
      el.dataset.fpasteOriginalWebkitTextSecurity || '';

    if (origType === 'password') {
      el.setAttribute('type', 'password');
    }
    if (origWebkitTextSecurity) {
      el.style.setProperty(
        '-webkit-text-security',
        origWebkitTextSecurity,
        'important'
      );
    }

    delete el.dataset.fpastePwd;
    delete el.dataset.fpasteOriginalType;
    delete el.dataset.fpasteOriginalWebkitTextSecurity;
  });
}

// Show password when hovering or editing, hide when leaving/blur
document.addEventListener(
  'mouseover',
  function (e) {
    if (!fpasteGlobalEnabled || !fpasteOptions.showPwd) return true;
    fpasteShowPassword(e.target);
    return true;
  },
  true
);

document.addEventListener(
  'focus',
  function (e) {
    if (!fpasteGlobalEnabled || !fpasteOptions.showPwd) return true;
    fpasteShowPassword(e.target);
    return true;
  },
  true
);

document.addEventListener(
  'mouseout',
  function (e) {
    if (!fpasteGlobalEnabled || !fpasteOptions.showPwd) return true;
    fpasteHidePassword(e.target);
    return true;
  },
  true
);

document.addEventListener(
  'blur',
  function (e) {
    if (!fpasteGlobalEnabled || !fpasteOptions.showPwd) return true;
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
          fpasteOptions: fpasteOptions
        });
      }
      sendResponse({ ok: true });
    }
  });
}
