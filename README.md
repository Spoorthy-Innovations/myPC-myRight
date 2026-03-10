# myPC myWish

myPC myWish is a Chrome extension that **forces paste and copy**, unlocks **text selection**, **right click**, and can **temporarily show password fields on hover/focus**, even on websites that try to block them.

## Features

- **Force paste**: lets you paste text into fields on sites that block `Ctrl+V` / `Cmd+V`.
- **Force copy & cut**: blocks page handlers that try to stop `Ctrl+C` / `Cmd+X`.
- **Unlock selection**: overrides `user-select: none` and similar tricks so you can select text.
- **Right click**: re‑enables the browser context menu when sites try to disable it.
- **Show password on hover/focus**: when enabled, password fields temporarily show as plain text while you hover or edit, then hide again when you move away or blur.

Technically, myPC myWish injects a content script that runs at `document_start` and registers its own listeners in the **capture phase**, calling `stopImmediatePropagation()` to prevent the page from blocking normal browser behavior, without calling `preventDefault()` so the default copy/paste/select actions still occur.

## Install in Chrome

1. Open Chrome and go to `chrome://extensions/`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select this folder: `myPC-myWish` (the one containing `manifest.json`).
5. The extension will appear in your toolbar. You can pin it to see “myPC myWish by Spoorthy”.

## Usage

- On any tab, use **Ctrl+V** (Windows/Linux) or **Cmd+V** (Mac) to paste, and **Ctrl+C** / **Cmd+C** to copy, even on sites that normally block it.
- Click the extension icon to open the popup.
- Use the toggles to enable/disable:
  - **Copy**
  - **Paste**
  - **Selection**
  - **Right click**
  - **Show password on hover/focus**

## Why it’s generally OK

- **No remote code**: Everything runs locally; all JavaScript is packaged inside the extension. This follows Chrome Manifest V3 security requirements.
- **Minimal permissions**:
  - `content_scripts` on `<all_urls>` (needed so myPC myWIsh can work on any page).
  - `activeTab`, `storage`. No host-permission abuse, no network access, no external APIs.
- **No data collection**: The code never reads or sends passwords, cookies, browsing history, or any other personal data. It only adjusts browser behavior (events and CSS) to stop sites from blocking standard copy/paste/selection/right-click/password visibility.

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

## Privacy statement

- **Single purpose**  
  myPC myWIsh *“allows users to force copy, paste, text selection, right click, and temporary password visibility on webpages that try to block them.”*

- **No data collection**  
  myPC myWIsh *“does not collect, store, or transmit any personal or usage data. All processing happens locally in the browser.”*

- **Password behavior**  
  When the password feature is enabled, it can **temporarily show password fields on hover/focus** so the user can see what they typed. Passwords are never sent anywhere; this behavior is intentional, user‑visible, and fully controlled by the user via the popup toggle.

## Files & credits

- **manifest.json** – Extension config (Manifest V3).
- **content.js** – Injected on all pages; allows paste/copy/cut.
- **popup.html** – Popup shown when you click the extension icon.
- **icons/generate.html** – Open in browser to generate and download extension icons.
- **STORE_SUBMISSION.md** – Checklist for publishing on the Chrome Web Store.

Built by **Vasavya Yagati** at **Spoorthy Innovations**.

## Contact

- **Name**: Vasavya Yagati  
- **Email**: [vasavya@yagati.com](mailto:vasavya@yagati.com)
