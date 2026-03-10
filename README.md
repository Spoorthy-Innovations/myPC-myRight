# Fpaste by Spoorthy

A Chrome extension that **forces paste and copy** from the clipboard on any website, even when the site tries to block paste or copy.

## How it works

The extension injects a script that runs before the page’s scripts. It listens for `paste`, `copy`, and `cut` in the **capture phase**, so it runs first and calls `stopImmediatePropagation()`. That prevents the page’s handlers from blocking the default browser behavior, so paste and copy work as normal.

## Install in Chrome

1. Open Chrome and go to `chrome://extensions/`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select this folder: `Chrome` (the one containing `manifest.json`).
5. The extension will appear in your toolbar. You can pin it to see “Fpaste by Spoorthy”.

## Usage

- After installing, **no extra steps** are needed.
- On any tab, use **Ctrl+V** (Windows/Linux) or **Cmd+V** (Mac) to paste, and **Ctrl+C** / **Cmd+C** to copy, even on sites that normally block it.
- Click the extension icon to open the popup and confirm it’s active.

## Optional: custom icons

To add your own icons:

1. Create an `icons` folder in this directory.
2. Add PNG files: `icon16.png`, `icon48.png`, `icon128.png`.
3. In `manifest.json`, add under `"action"`:
   ```json
   "default_icon": {
     "16": "icons/icon16.png",
     "48": "icons/icon48.png",
     "128": "icons/icon128.png"
   }
   ```
   And add an `"icons"` key with the same paths.

## Publishing to the Chrome Web Store

The extension is **not** ready to submit until you:

1. **Create the 3 icons** (required): open **icons/generate.html** in Chrome and download `icon16.png`, `icon48.png`, `icon128.png` into the **icons** folder. Or run `npm install` and `npm run generate-icons` if you use Node.js.
2. **Follow the full checklist** in **STORE_SUBMISSION.md** (developer account, ZIP, screenshots, promo image, privacy fields).

See **STORE_SUBMISSION.md** for the complete Chrome Web Store submission checklist.

## Files

- **manifest.json** – Extension config (Manifest V3).
- **content.js** – Injected on all pages; allows paste/copy/cut.
- **popup.html** – Popup shown when you click the extension icon.
- **icons/generate.html** – Open in browser to generate and download extension icons.
- **STORE_SUBMISSION.md** – Checklist for publishing on the Chrome Web Store.
