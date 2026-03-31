# myPC myRight Public - Release Notes (1.0.2 -> 2.0.0)

## Highlights
- Unified core control: `Selection + Copy/Paste` is now a single toggle for simpler usage.
- Added user-managed website exclusions with defaults for rich editors:
  - `docs.google.com`
  - `drive.google.com`
  - `docs.microsoft.com`
  - `*.officeapps.live.com`
- Added in-extension update UX:
  - version shown in popup
  - optional Web Store update availability message
  - update notice banner and changelog page flow

## Behavior and Compatibility
- Restored strong text-selection handling for restrictive sites.
- Improved compatibility by allowing exclusions where forced behavior should not run.
- Clipboard forcing remains available on restrictive sites while excluded hosts stay untouched.

## UI Changes
- Popup now shows version and "Manage site exclusions" on one line.
- Cleaner wording in popup header text.

## Operational Changes
- Added options/settings page for exclusions.
- Added service worker update hooks and changelog page support.
