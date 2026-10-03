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
    var nodes = document.querySelectorAll('[unselectable],[onselectstart],[oncontextmenu],[onmousedown],[onmouseup]');
    nodes.forEach(function (el) {
      el.removeAttribute('unselectable');
      el.removeAttribute('onselectstart');
      el.removeAttribute('oncontextmenu');
      el.removeAttribute('onmousedown');
      el.removeAttribute('onmouseup');
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
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(
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

  // Cursor:pointer is a signal for custom clickable controls. Kept shallow (target + 1
  // ancestor) so large text wrappers that merely sit inside a clickable region (common on
  // anti-copy sites) don't get treated as "interactive" and skip force-selection entirely.
  var node = target;
  var depth = 0;
  while (node && depth < 2) {
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
  if (!fpasteGlobalEnabled) return true;
  var isRightButton = e.button === 2 || e.which === 3;
  var selectionActive = !!fpasteOptions.selection;
  // Some restricted sites block the context menu via mousedown/mouseup (checking for the
  // right button) instead of a 'contextmenu' handler. Unblock that path whenever rightClick
  // is on, even if selection forcing is off, and even on targets that look "interactive"
  // (the whole point is restoring the native menu everywhere).
  var rightClickActive = !!fpasteOptions.rightClick && isRightButton;
  if (!selectionActive && !rightClickActive) return true;
  if (!rightClickActive && fpasteIsInteractiveTarget(e.target)) return true;
  if (selectionActive) fpasteForceSelectablePath(e.target);
  // Allow browser default behavior, but block page handlers that cancel/clear selection
  // or preventDefault() a right-button mousedown/mouseup to suppress the context menu.
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
    // Block site handlers that cancel the native context menu.
    e.stopImmediatePropagation();
    return true;
  },
  true
);

function fpasteShowPassword() {
  if (!fpasteGlobalEnabled || !fpasteOptions.showPwd) return;
  var inputs = document.querySelectorAll('input');
  inputs.forEach(function (el) {
    if (!el || el.dataset.fpastePwd === 'visible') return;
    var type = (el.getAttribute('type') || '').toLowerCase();
    var style = window.getComputedStyle(el);
    var hasTextSecurity =
      style.webkitTextSecurity && style.webkitTextSecurity !== 'none';
    var ac = (el.getAttribute('autocomplete') || '').toLowerCase();
    var isPasswordLike =
      type === 'password' ||
      hasTextSecurity ||
      ac.indexOf('password') !== -1 ||
      el.classList.contains('password');
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

var fpastePwdForceTimer = null;
var fpasteActivePwdEl = null;

function fpasteIsPasswordLikeInput(el) {
  if (!el || el.tagName !== 'INPUT') return false;
  var type = (el.getAttribute('type') || '').toLowerCase();
  var ac = (el.getAttribute('autocomplete') || '').toLowerCase();
  var hint = (
    (el.name || '') +
    ' ' +
    (el.id || '') +
    ' ' +
    (el.placeholder || '') +
    ' ' +
    (el.className || '')
  ).toLowerCase();
  if (type === 'password') return true;
  if (ac.indexOf('password') !== -1) return true;
  if (hint.indexOf('password') !== -1 || hint.indexOf('passwd') !== -1 || hint.indexOf('pwd') !== -1) return true;
  if (hint.indexOf('mpin') !== -1 || hint.indexOf('pin') !== -1) return true;
  return false;
}

function fpasteForceRevealActivePassword() {
  if (!fpasteGlobalEnabled || !fpasteOptions.showPwd) return;
  var targets = [];
  if (fpasteActivePwdEl && document.contains(fpasteActivePwdEl)) {
    targets.push(fpasteActivePwdEl);
  }
  var ae = document.activeElement;
  if (ae && ae.tagName === 'INPUT') {
    targets.push(ae);
  }
  var extra = document.querySelectorAll(
    'input[type=\"password\"], input[autocomplete*=\"password\" i], input[name*=\"pass\" i], input[id*=\"pass\" i], ' +
    'input[placeholder*=\"pass\" i], input[name*=\"pin\" i], input[id*=\"pin\" i], input[placeholder*=\"pin\" i]'
  );
  for (var i = 0; i < extra.length && i < 10; i++) targets.push(extra[i]);

  var seen = new Set();
  targets.forEach(function (el) {
    if (!el || seen.has(el)) return;
    seen.add(el);
    if (!fpasteIsPasswordLikeInput(el)) return;
    try {
      if (el.dataset.fpastePwd !== 'visible') {
        var currentType = (el.getAttribute('type') || '').toLowerCase();
        var style = window.getComputedStyle(el);
        el.dataset.fpastePwd = 'visible';
        el.dataset.fpasteOriginalType = currentType || '';
        el.dataset.fpasteOriginalWebkitTextSecurity =
          (style && style.webkitTextSecurity) ? style.webkitTextSecurity : '';
      }
      var type = (el.getAttribute('type') || '').toLowerCase();
      if (type === 'password') el.setAttribute('type', 'text');
      el.style.setProperty('-webkit-text-security', 'none', 'important');
    } catch (e) {}
  });
}

function fpasteStartPasswordForce(el) {
  if (!fpasteIsPasswordLikeInput(el)) return;
  fpasteActivePwdEl = el;
  fpasteForceRevealActivePassword();
  if (fpastePwdForceTimer) clearInterval(fpastePwdForceTimer);
  fpastePwdForceTimer = setInterval(fpasteForceRevealActivePassword, 120);
}

function fpasteStopPasswordForce(el) {
  if (fpasteActivePwdEl && el && fpasteActivePwdEl !== el) return;
  fpasteActivePwdEl = null;
  if (fpastePwdForceTimer) {
    clearInterval(fpastePwdForceTimer);
    fpastePwdForceTimer = null;
  }
}

function fpasteRevealInputIfSelectedAll(el) {
  if (!fpasteGlobalEnabled || !fpasteOptions.showPwd) return;
  if (!fpasteIsPasswordLikeInput(el)) return;
  try {
    var valueLen = (el.value || '').length;
    if (!valueLen) return;
    var ss = typeof el.selectionStart === 'number' ? el.selectionStart : -1;
    var se = typeof el.selectionEnd === 'number' ? el.selectionEnd : -1;
    // Alternative trigger: reveal only when user selected full field text.
    if (ss === 0 && se === valueLen) {
      fpasteStartPasswordForce(el);
      fpasteForceRevealActivePassword();
    }
  } catch (e) {}
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
    var t = e.target && e.target.closest ? e.target.closest('input') : null;
    if (t) fpasteStartPasswordForce(t);
    fpasteShowPassword(e.target);
    return true;
  },
  true
);

document.addEventListener(
  'focus',
  function (e) {
    if (!fpasteGlobalEnabled || !fpasteOptions.showPwd) return true;
    var t = e.target && e.target.closest ? e.target.closest('input') : null;
    if (t) fpasteStartPasswordForce(t);
    fpasteShowPassword(e.target);
    return true;
  },
  true
);

document.addEventListener(
  'mouseout',
  function (e) {
    if (!fpasteGlobalEnabled || !fpasteOptions.showPwd) return true;
    var t = e.target && e.target.closest ? e.target.closest('input') : null;
    if (t) fpasteStopPasswordForce(t);
    fpasteHidePassword(e.target);
    return true;
  },
  true
);

document.addEventListener(
  'blur',
  function (e) {
    if (!fpasteGlobalEnabled || !fpasteOptions.showPwd) return true;
    var t = e.target && e.target.closest ? e.target.closest('input') : null;
    if (t) fpasteStopPasswordForce(t);
    fpasteHidePassword(e.target);
    return true;
  },
  true
);

// Alternative reveal flow for stubborn sites:
// if user selects all characters in a password-like field, reveal that field.
['select', 'keyup', 'mouseup'].forEach(function (evt) {
  document.addEventListener(
    evt,
    function (e) {
      if (!fpasteGlobalEnabled || !fpasteOptions.showPwd) return true;
      var t = e.target && e.target.closest ? e.target.closest('input') : null;
      if (!t) return true;
      fpasteRevealInputIfSelectedAll(t);
      return true;
    },
    true
  );
});

// Listen for enable/disable toggle from the popup
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message) return;

    if (message.type === 'fpaste:setEnabled') {
      setFpasteEnabled(message.enabled);
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ fpasteEnabled: !!message.enabled });
      }
      sendResponse({ ok: true });
    } else if (message.type === 'fpaste:setOptions' && message.options) {
      applyOptions(message.options);
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          fpasteOptions: fpasteOptions
        });
      }
      sendResponse({ ok: true });
    }
  });
}
