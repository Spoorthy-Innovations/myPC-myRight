const fs = require('fs');
const path = require('path');

// Helper to copy directory contents
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  if (!fs.existsSync(src)) {
    console.warn(`Source directory not found: ${src}`);
    return;
  }

  let entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Ensure the build directory exists
fs.mkdirSync('./build', { recursive: true });

// Build Free Version
console.log('Building Free version...');
fs.mkdirSync('./build/free/icons', { recursive: true });
copyDir('./src/core', './build/free');
copyDir('./src/free', './build/free');

// Build Pro Version
console.log('Building Pro version...');
fs.mkdirSync('./build/pro/icons', { recursive: true });
copyDir('./src/core', './build/pro');
copyDir('./src/pro', './build/pro');

console.log('Build complete!');
console.log('Free version located at: ./build/free');
console.log('Pro version located at: ./build/pro');
