# Building and releasing myPC myRight

Quick reference for building the extensions and bumping the version.

## Build and generate ZIPs

### Windows (PowerShell) — recommended (build + ZIPs)

From the repo root:

```powershell
.\build.ps1
```

**Output:**

- `build\public\` — Public extension, ready for Load unpacked or distribution
- `build\pro\` — Pro extension, ready for Load unpacked or distribution
- `build\myPC-myRight-public.zip` — ZIP for Public
- `build\myPC-myRight-pro.zip` — ZIP for Pro

### Node (any OS) — build only

```bash
npm run build
```

or:

```bash
node build.js
```

Produces only `build/public` and `build/pro`. No ZIPs; create them manually if needed (or use `build.ps1` on Windows).

---

## Bump the version

Set the same version in **three** files (e.g. `1.0.2`):

1. **src/public/manifest.json** — `"version": "1.0.2"`
2. **src/pro/manifest.json** — `"version": "1.0.2"`
3. **package.json** — `"version": "1.0.2"`

Then run the build so `build/` (and ZIPs) contain the new version.

---

## Release checklist

1. Bump version in the three files above.
2. Run `.\build.ps1` (or `node build.js` + manual ZIPs).
3. Commit and push (including `build/` and ZIPs if you track them in Git).
