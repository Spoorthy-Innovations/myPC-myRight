var FPASTE_EXCLUDED_HOSTS_DEFAULT = [
  'docs.google.com',
  'drive.google.com',
  'docs.microsoft.com',
  '*.officeapps.live.com'
];

function normalizePattern(p) {
  return String(p || '').trim().toLowerCase();
}

function readTextareaLines() {
  var ta = document.getElementById('excludedHosts');
  if (!ta) return [];
  return ta.value
    .split(/\r?\n/)
    .map(normalizePattern)
    .filter(Boolean);
}

function renderPatterns(patterns) {
  var ta = document.getElementById('excludedHosts');
  if (!ta) return;
  ta.value = patterns.join('\n');
}

function setStatus(msg) {
  var el = document.getElementById('status');
  if (!el) return;
  el.textContent = msg || '';
}

document.addEventListener('DOMContentLoaded', function () {
  if (!chrome || !chrome.storage || !chrome.storage.sync) return;

  chrome.storage.sync.get(
    { fpasteExcludedHosts: FPASTE_EXCLUDED_HOSTS_DEFAULT },
    function (data) {
      var patterns = Array.isArray(data.fpasteExcludedHosts)
        ? data.fpasteExcludedHosts.map(normalizePattern).filter(Boolean)
        : FPASTE_EXCLUDED_HOSTS_DEFAULT.slice();
      if (!patterns.length) patterns = FPASTE_EXCLUDED_HOSTS_DEFAULT.slice();
      renderPatterns(patterns);
    }
  );

  var saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      var patterns = readTextareaLines();
      chrome.storage.sync.set({ fpasteExcludedHosts: patterns }, function () {
        setStatus('Saved. Reload affected tabs.');
      });
    });
  }

  var resetBtn = document.getElementById('resetDefault');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      renderPatterns(FPASTE_EXCLUDED_HOSTS_DEFAULT);
      setStatus('Defaults restored in editor. Click Save exclusions.');
    });
  }
});
