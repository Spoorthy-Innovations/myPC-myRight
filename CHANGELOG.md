# Changelog

All notable changes to this project are documented in this file.

## 2.3 (Pro and Public) - 2026-10-14

### Fixed
- Pro: site exclusions were ignored because `pro-content.js` redeclared `fpasteGlobalEnabled` / `fpasteSiteExcluded` in the shared content-script scope and re-enabled core features on excluded sites. Pro now uses its own variables.
- Exclusion patterns now accept a scheme and/or path (`https://docs.google.com/`, `www.google.com/maps`); previously anything other than a bare host never matched.
- Google Sheets cell selection, Google Docs clicks and Google Maps panning: mouse/pointer interception is skipped on `*.google.com`, and on `canvas`, `video`, `[role="application"]`, `[role="slider"]`, `[role="scrollbar"]` and `[aria-roledescription="map"]` targets on every site.

### Changed
- Public edition jumps from `2.1` to `2.3` and picks up the 2.2 core fixes (right-click via mousedown, selection in pointer containers, local storage settings).

## 2.2 (Pro) - 2026-10-04

### Fixed
- Right-click no longer stays blocked on sites that suppress it via `mousedown`/`mouseup` handlers instead of the `contextmenu` event.
- Pro's Advanced features (Visibility Bypass, Keyboard Unblock, Overlay Removal, Drag & Drop Unlock, Print Unlock) now respect the site exclusions list, so banking sites added to exclusions no longer get the most fraud-detection-triggering DOM tampering applied.
- Forced text selection/copy no longer backs off on ordinary text inside large `cursor: pointer` containers, which was breaking selection on some sites.
- Settings and toggles (popup options, Pro options, site exclusions) moved from `chrome.storage.sync` to `chrome.storage.local`, fixing silent save failures on machines with Chrome Sync disabled. Existing settings are migrated automatically on update.

Public edition remains on `2.1` for this release.

## 2.0.0 - 2026-03-31

### Added
- Options page to manage excluded website host patterns.
- Default exclusion patterns for rich editors (`docs.google.com`, `drive.google.com`, `docs.microsoft.com`, `*.officeapps.live.com`).
- Popup shortcut to open exclusions settings.
- Update notice workflow (service worker + popup banner + changelog page).
- Web Store update availability message in popup.

### Changed
- Bumped extension/package version from `1.0.4` to `2.0.0`.
- Combined `Selection`, `Copy`, and `Paste` into one popup toggle.
- Popup layout updated to show version and exclusions link on one line.
- Pro defaults adjusted so "Advanced" toggles are OFF by default.
- Author link in popup updated to `https://spoorthy.org/`.

### Fixed
- CSP issue in changelog page by moving inline script to external `changelog.js`.
- Multiple text-selection regressions on restrictive websites while preserving rich-editor compatibility through exclusions.

## 1.0.2
- Previous baseline release.
