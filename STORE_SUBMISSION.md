# Chrome Web Store – Submission Checklist

Use this checklist before submitting **myPC myWish** to the Chrome Web Store.

---

## 1. Developer account

- [ ] **Register** at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
- [ ] Pay the **one-time $5 developer registration fee** (if not already registered).

---

## 2. Extension package (ZIP)

Your upload must be a **ZIP file** with the manifest at the **root** (not inside a subfolder).

### Required in the ZIP

- [ ] **manifest.json** (name, version, description, **icons**)
- [ ] **content.js**
- [ ] **popup.html**
- [ ] **icons/icon16.png**, **icons/icon48.png**, **icons/icon128.png**

### Create the icons (do this first)

**Option A – Browser (no Node):**

1. Open **icons/generate.html** in Chrome.
2. Click “Download icon16.png”, “Download icon48.png”, “Download icon128.png”.
3. Save each file into the **icons** folder (overwrite if asked).

**Option B – Node.js:**

```bash
npm install
npm run generate-icons
```

### What to exclude from the ZIP

- `node_modules/`
- `package.json`, `package-lock.json`, `generate-icons.js`
- `icons/generate.html`
- `README.md`, `STORE_SUBMISSION.md` (optional to exclude; they are not required by the store)

### Create the ZIP

- Select: `manifest.json`, `content.js`, `popup.html`, and the **icons** folder (with the 3 PNGs inside).
- Zip so that **manifest.json** is in the **root** of the ZIP (not in a folder like `Chrome/`).

---

## 3. Store listing (Dashboard)

After uploading the ZIP, fill in:

- [ ] **Short description** (e.g. from your manifest description).
- [ ] **Detailed description** – what the extension does and why it’s useful.
- [ ] **Category** – e.g. “Productivity”.
- [ ] **Language** – primary language.

### Images (required)

- [ ] **Screenshot**: at least **1** image, **1280×800** or **640×400** px, showing the extension in use (e.g. popup or a site where copy/paste/selection/right-click were blocked and now work).
- [ ] **Small promotional tile**: **440×280** px (required). Can be a simple graphic with the name “myPC myWish” and a short tagline.

---

## 4. Privacy practices (Dashboard → Privacy)

- [ ] **Single purpose**: Describe the extension in one sentence, e.g.  
  **“Allows users to force copy, paste, text selection, right click, and temporary password visibility on webpages that try to block them.”**
- [ ] **Data usage**: Declare that the extension **does not collect, store, or transmit any user data** (it only runs locally to allow copy/paste/selection/right click/password visibility).
- [ ] **Privacy policy**: If the store asks for a URL, use a page that states:  
  **“myPC myWish does not collect, store, or share any personal or usage data. All processing is done locally in the browser.”**  
  You can host this on GitHub Pages, your company site, or a simple static page.

---

## 5. Distribution (optional)

- [ ] Choose **regions** where the extension will be available (or leave default).
- [ ] Leave as **free** unless you plan to monetize.

---

## 6. Submit for review

- [ ] In the Developer Dashboard, open your item and click **Submit for review**.
- [ ] Review can take from a few days to a couple of weeks.

---

## Quick “ready to submit?” check

| Requirement              | Status |
|--------------------------|--------|
| Manifest V3              | Yes    |
| name, version, description | Yes    |
| Icons (16, 48, 128)      | After you run the icon generator |
| ZIP with manifest at root | You create this |
| At least 1 screenshot     | You add in Dashboard |
| Small promo image 440×280 | You add in Dashboard |
| Single purpose + no data  | You fill in Privacy tab |
| Privacy policy URL (if asked) | You host and add URL |

Once the icons are in place, the ZIP is built correctly, and the listing + privacy sections are filled, the extension is **ready to submit** to the Chrome Web Store.
