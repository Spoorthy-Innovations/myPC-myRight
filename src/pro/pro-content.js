/**
 * Advanced features for myPC myRight Pro
 * This file is injected after the core content script.
 */

var fpasteProOptions = {
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

var proObserver = null;
var fpasteGlobalEnabled = true;

// Helper to check if extension is globally enabled
function isGlobalEnabled() {
    return fpasteGlobalEnabled;
}

// --- Feature 1: Visibility Bypass ---
// Prevents sites from detecting tab switches (Page Visibility API and blur/focus events)
function applyVisibilityBypass(enabled) {
    if (!enabled) return;
    
    // Override Document properties
    Object.defineProperty(document, 'visibilityState', {
        get: function () { return 'visible'; },
        configurable: true
    });
    Object.defineProperty(document, 'hidden', {
        get: function () { return false; },
        configurable: true
    });

    // Block visibility events
    const blockVisibilityEvent = function(e) {
        if (!isGlobalEnabled()) return true;
        e.stopImmediatePropagation();
        return true;
    };
    
    window.addEventListener('visibilitychange', blockVisibilityEvent, true);
    window.addEventListener('webkitvisibilitychange', blockVisibilityEvent, true);
    document.addEventListener('visibilitychange', blockVisibilityEvent, true);
    document.addEventListener('webkitvisibilitychange', blockVisibilityEvent, true);
    
    // Block blur/focus out events that pages use to tell if you left the tab
    window.addEventListener('blur', function(e) {
        if (!isGlobalEnabled()) return true;
        // Only block window blur, not input element blur
        if (e.target === window || e.target === document) {
            e.stopImmediatePropagation();
        }
    }, true);
    window.addEventListener('focusout', function(e) {
         if (!isGlobalEnabled()) return true;
         if (e.target === window || e.target === document) {
            e.stopImmediatePropagation();
        }
    }, true);
}


// --- Feature 2: Keyboard Unblock ---
// Unlocks F12, Ctrl+U, Ctrl+S, Ctrl+P, Ctrl+Shift+I, etc.
function applyKeyboardUnblock(enabled) {
    if (!enabled) return;

    window.addEventListener('keydown', function(e) {
        if (!isGlobalEnabled()) return true;
        
        // e.keyCode is deprecated but still widely used by blocking scripts
        const key = e.key || e.keyCode;
        const code = e.code;
        
        let shouldUnblock = false;

        // F12 (DevTools)
        if (key === 'F12' || key === 123) shouldUnblock = true;
        
        // Ctrl+Shift+I / Cmd+Option+I (DevTools)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'I' || key === 'i' || key === 73)) shouldUnblock = true;
        
        // Ctrl+Shift+J / Cmd+Option+J (Console)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'J' || key === 'j' || key === 74)) shouldUnblock = true;
        
        // Ctrl+Shift+C / Cmd+Shift+C (Element Inspector)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'C' || key === 'c' || key === 67)) shouldUnblock = true;
        
        // Ctrl+U / Cmd+U (View Source)
        if ((e.ctrlKey || e.metaKey) && (key === 'U' || key === 'u' || key === 85)) shouldUnblock = true;
        
        // Ctrl+S / Cmd+S (Save)
        if ((e.ctrlKey || e.metaKey) && (key === 'S' || key === 's' || key === 83)) shouldUnblock = true;
        
        // Ctrl+P / Cmd+P (Print)
        if ((e.ctrlKey || e.metaKey) && (key === 'P' || key === 'p' || key === 80)) shouldUnblock = true;

        if (shouldUnblock) {
            e.stopImmediatePropagation();
            // Do NOT prevent default, we want the browser to actually do the action
        }
    }, true);
}


// --- Feature 3: Overlay Removal ---
// Removes invisible DIVs placed over text to stop you from clicking/selecting.
// Optimized: run on load + when DOM adds nodes (MutationObserver), not every 3s. Pre-filter to likely overlays and cap work.
function applyOverlayRemoval(enabled) {
    if (!enabled) return;

    var overlayDebounceTimer = null;
    var OVERLAY_DEBOUNCE_MS = 500;
    var MAX_OVERLAY_CHECKS = 150;

    function cleanOverlays() {
        if (!isGlobalEnabled()) return;
        // Only check elements that might be overlays (inline position/z-index) to avoid getComputedStyle on thousands
        var candidates = document.querySelectorAll('div[style*="position"], div[style*="z-index"], span[style*="position"], span[style*="z-index"]');
        var count = 0;
        for (var i = 0; i < candidates.length && count < MAX_OVERLAY_CHECKS; i++) {
            var el = candidates[i];
            var style = window.getComputedStyle(el);
            count++;
            var isTransparent = style.opacity === '0' || style.backgroundColor === 'rgba(0, 0, 0, 0)' || style.background === 'transparent';
            var isAbsoluteOrFixed = style.position === 'absolute' || style.position === 'fixed';
            var isCovering = (parseInt(style.width, 10) > window.innerWidth * 0.8) && (parseInt(style.height, 10) > window.innerHeight * 0.8);
            var highZIndex = parseInt(style.zIndex, 10) > 100;
            if (isAbsoluteOrFixed && highZIndex && isTransparent && isCovering) {
                el.style.setProperty('z-index', '-999999', 'important');
                el.style.setProperty('pointer-events', 'none', 'important');
            }
        }
        // Separate pass for pointer-events: none on text (fewer elements, no getComputedStyle)
        var pointerCandidates = document.querySelectorAll('[style*="pointer-events"]');
        for (var j = 0; j < pointerCandidates.length && j < 80; j++) {
            var pel = pointerCandidates[j];
            if (pel.tagName !== 'DIV' && pel.tagName !== 'SPAN') continue;
            var pstyle = window.getComputedStyle(pel);
            if (pstyle.pointerEvents === 'none' && pstyle.position !== 'absolute' && pstyle.position !== 'fixed') {
                pel.style.setProperty('pointer-events', 'auto', 'important');
            }
        }
    }

    function scheduleOverlayClean() {
        if (overlayDebounceTimer) clearTimeout(overlayDebounceTimer);
        overlayDebounceTimer = setTimeout(function () {
            overlayDebounceTimer = null;
            if (isGlobalEnabled()) cleanOverlays();
        }, OVERLAY_DEBOUNCE_MS);
    }

    cleanOverlays();
    var overlayObserver = new MutationObserver(function (mutations) {
        for (var m = 0; m < mutations.length; m++) {
            if (mutations[m].addedNodes.length > 0) {
                scheduleOverlayClean();
                break;
            }
        }
    });
    if (document.body) {
        overlayObserver.observe(document.documentElement, { childList: true, subtree: true });
    }
}


// --- Feature 4: Drag & Drop Unlock ---
// Unlocks ability to drag images and text
function applyDragDropUnlock(enabled) {
    if (!enabled) return;

    const allowDrag = function(e) {
        if (!isGlobalEnabled()) return true;
        e.stopImmediatePropagation();
        return true;
    };

    window.addEventListener('dragstart', allowDrag, true);
    window.addEventListener('drop', allowDrag, true);
    
    // Remove pointer-events: none from images (set always to avoid getComputedStyle on every img = less CPU)
    function cleanImages() {
        if (!isGlobalEnabled()) return;
        var imgs = document.querySelectorAll('img');
        for (var i = 0; i < imgs.length; i++) {
            var img = imgs[i];
            img.removeAttribute('ondragstart');
            img.style.setProperty('pointer-events', 'auto', 'important');
            img.style.setProperty('-webkit-user-drag', 'auto', 'important');
        }
    }
    
    cleanImages();
    setInterval(cleanImages, 8000);
}


// --- Feature 5: Print Unlock ---
// Removes CSS @media print { display: none !important } tricks
function applyPrintUnlock(enabled) {
    if (!enabled) return;
    
    const styleId = 'fpaste-pro-print-unlock';
    let styleEl = document.getElementById(styleId);
    
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        // Inject extreme specificity print rules that override site hiding
        styleEl.textContent = `
            @media print {
                body, div, p, span, h1, h2, h3, h4, h5, h6, article, section, main {
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
                /* Sites usually hide specific anti-cheat or UI elements, we rely on the above to force text visible */
            }
        `;
        
        const target = document.head || document.documentElement;
        if (target) {
            target.appendChild(styleEl);
        }
    }
}


// --- Feature 6: Scroll Unlock ---
// Forces scrollbars on pages that lock them (e.g. behind paywalls or modals)
function applyScrollUnlock(enabled) {
    if (!enabled) return;

    function enforceScroll() {
        if (!isGlobalEnabled()) return;
        const docEl = document.documentElement;
        const body = document.body;
        
        if (docEl && window.getComputedStyle(docEl).overflow === 'hidden') {
            docEl.style.setProperty('overflow', 'auto', 'important');
        }
        if (body && window.getComputedStyle(body).overflow === 'hidden') {
            body.style.setProperty('overflow', 'auto', 'important');
        }
        
        // Also check if they locked position to fixed
        if (body && window.getComputedStyle(body).position === 'fixed') {
            body.style.setProperty('position', 'static', 'important');
        }
    }

    enforceScroll();
    setInterval(enforceScroll, 6000);
}


// --- Feature 7: Video Controls ---
// Forces native HTML5 video controls to appear
function applyVideoUnlock(enabled) {
    if (!enabled) return;

    function enforceVideoControls() {
        if (!isGlobalEnabled()) return;
        const videos = document.querySelectorAll('video');
        videos.forEach(vid => {
            if (!vid.controls) {
                vid.controls = true;
                // Force it to stay on top
                vid.style.setProperty('z-index', '999999', 'important');
            }
        });
    }

    enforceVideoControls();
    setInterval(enforceVideoControls, 8000);
}


// --- Feature 8: Autocomplete Enforcer ---
// Forces inputs and forms to allow browser password saving
function applyAutocompleteUnlock(enabled) {
    if (!enabled) return;

    function enforceAutocomplete() {
        if (!isGlobalEnabled()) return;
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            if (form.getAttribute('autocomplete') === 'off') {
                form.removeAttribute('autocomplete');
            }
        });

        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            if (input.getAttribute('autocomplete') === 'off' || input.getAttribute('autocomplete') === 'new-password') {
                input.removeAttribute('autocomplete');
            }
        });
    }

    enforceAutocomplete();
    setInterval(enforceAutocomplete, 10000);
}


// --- Feature 9: Exit Dialog Bypass ---
// Kills "Are you sure you want to leave?" popups
function applyBeforeUnloadBypass(enabled) {
    if (!enabled) return;
    
    // The only way to stop beforeunload reliably from a content script is to nullify the handler
    window.onbeforeunload = null;
    
    const blockUnload = function(e) {
        if (!isGlobalEnabled()) return true;
        e.stopImmediatePropagation();
        // Do NOT set e.returnValue, that's what triggers the dialog
    };

    window.addEventListener('beforeunload', blockUnload, true);
}


// --- Feature 10: Element Zapper ---
// Alt+Shift+Click deletes any element
function applyZapperUnlock(enabled) {
    // We attach it once, but check the toggle state inside the listener
    // so it can be turned on/off without reloading.
    window.addEventListener('click', function(e) {
        if (!isGlobalEnabled() || !fpasteProOptions.zapperUnlock) return;
        
        if (e.altKey && e.shiftKey) {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (e.target && e.target.parentNode) {
                e.target.parentNode.removeChild(e.target);
            }
        }
    }, true);
    
    // Add hover effect when holding keys
    window.addEventListener('mousemove', function(e) {
         if (!isGlobalEnabled() || !fpasteProOptions.zapperUnlock) return;
         
         if (e.altKey && e.shiftKey && e.target) {
             // Basic implementation: we could add a red outline
             // But modifying DOM on mousemove can be heavy. Let's keep it simple.
             e.target.style.outline = '2px solid red';
         }
    }, true);
    
    window.addEventListener('mouseout', function(e) {
        if (!isGlobalEnabled() || !fpasteProOptions.zapperUnlock) return;
        if (e.target) {
            e.target.style.outline = '';
        }
    }, true);
}

// Attach zapper listener immediately (it checks the boolean flag internally)
applyZapperUnlock(true);


// --- Initialization & Listener ---

function applyAllProFeatures(opts) {
    if (opts.visibilityBypass) applyVisibilityBypass(true);
    if (opts.keyboardUnblock) applyKeyboardUnblock(true);
    if (opts.overlayRemoval) applyOverlayRemoval(true);
    if (opts.dragDropUnlock) applyDragDropUnlock(true);
    if (opts.printUnlock) applyPrintUnlock(true);
    
    if (opts.scrollUnlock) applyScrollUnlock(true);
    if (opts.videoUnlock) applyVideoUnlock(true);
    if (opts.autocompleteUnlock) applyAutocompleteUnlock(true);
    if (opts.beforeUnloadBypass) applyBeforeUnloadBypass(true);
}

// Load current settings from storage
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get({ fpasteProOptions: null, fpasteEnabled: true }, function (data) {
        if (data && typeof data.fpasteEnabled !== 'undefined') {
            fpasteGlobalEnabled = !!data.fpasteEnabled;
        }
        if (data && data.fpasteProOptions) {
            fpasteProOptions = data.fpasteProOptions;
        }
        applyAllProFeatures(fpasteProOptions);
    });
} else {
    // Default to true if storage is unavailable
    applyAllProFeatures(fpasteProOptions);
}

// Listen for updates from popup-pro.js or popup.js
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (!message) return;

        if (message.type === 'fpaste:setEnabled') {
            fpasteGlobalEnabled = !!message.enabled;
            if (fpasteGlobalEnabled) {
                // re-apply
                applyAllProFeatures(fpasteProOptions);
            } else {
                // If Print Unlock is active, we can remove the injected style
                const printStyle = document.getElementById('fpaste-pro-print-unlock');
                if (printStyle && printStyle.parentNode) {
                    printStyle.parentNode.removeChild(printStyle);
                }
            }
            sendResponse({ ok: true });
        } else if (message.type === 'fpaste:setProOptions' && message.options) {
            fpasteProOptions = message.options;
            // Note: Some features (like Object.defineProperty) can't easily be undone once applied, 
            // but for a smooth experience we force them ON if toggled. A full page reload is needed to fully disable some bypasses.
            applyAllProFeatures(fpasteProOptions);
            sendResponse({ ok: true });
        }
    });
}
