/**
 * Generates icon16.png, icon48.png, icon128.png in ./icons/
 * Run: npm install && npm run generate-icons
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const dir = path.join(__dirname, 'icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function drawIcon(size) {
  const png = new PNG({ width: size, height: size });
  const pad = Math.max(1, Math.floor(size / 8));
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - pad * 2) / 2;
  const r2 = r * r;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const inCircle = dx * dx + dy * dy <= r2;
      const idx = (size * y + x) << 2;
      if (inCircle) {
        png.data[idx] = 33;
        png.data[idx + 1] = 150;
        png.data[idx + 2] = 243;
        png.data[idx + 3] = 255;
      } else {
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
      }
    }
  }
  return png;
}

[16, 48, 128].forEach((size) => {
  const png = drawIcon(size);
  const out = path.join(dir, `icon${size}.png`);
  fs.writeFileSync(out, PNG.sync.write(png));
  console.log('Written', out);
});
