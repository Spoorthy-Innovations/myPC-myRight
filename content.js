/**
 * Fpaste by Spoorthy - Force paste & copy on any website
 * Runs in capture phase so we get the event before the page can block it.
 */

var allowPaste = function (e) {
  e.stopImmediatePropagation();
  return true;
};

var allowCopy = function (e) {
  e.stopImmediatePropagation();
  return true;
};

var allowCut = function (e) {
  e.stopImmediatePropagation();
  return true;
};

// Capture phase (true) = we run first, before the page's listeners
document.addEventListener('paste', allowPaste, true);
document.addEventListener('copy', allowCopy, true);
document.addEventListener('cut', allowCut, true);
