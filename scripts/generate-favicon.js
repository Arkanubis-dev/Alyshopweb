const fs = require("fs");
const path = require("path");

// 1. Create crisp, beautiful SVG Favicon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="alyBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#845EC2" />
      <stop offset="50%" stop-color="#6D4BB8" />
      <stop offset="100%" stop-color="#512E9E" />
    </linearGradient>
    <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF75AC" />
      <stop offset="100%" stop-color="#F43F5E" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#301560" flood-opacity="0.4" />
    </filter>
    <filter id="heartShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Squircle Base with Alyshop Signature Violet -->
  <rect width="64" height="64" rx="16" fill="url(#alyBg)" />

  <!-- Subtle inner border highlight -->
  <rect x="1" y="1" width="62" height="62" rx="15" fill="none" stroke="#FFFFFF" stroke-opacity="0.2" stroke-width="1.5" />

  <!-- Shopping Bag Handles -->
  <path d="M24 23 V17.5 C24 13.2 27.5 9.5 32 9.5 C36.5 9.5 40 13.2 40 17.5 V23" 
        fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" />

  <!-- Shopping Bag Body -->
  <path d="M17 23 C17 21.5 18.2 20.5 19.7 20.5 L44.3 20.5 C45.8 20.5 47 21.5 47 23 L49 48 C49 50.5 47 52.5 44.5 52.5 L19.5 52.5 C17 52.5 15 50.5 15 48 Z" 
        fill="#FFFFFF" filter="url(#glow)" />

  <!-- Bag Fold Accent line -->
  <path d="M16 23 L48 23" stroke="#F0E8F2" stroke-width="1.5" />

  <!-- Cute Heart Accent (Bottom Right of Bag) -->
  <path d="M42.5 35 C39.5 31.8 35 34.2 35 37.8 C35 42 42.5 47.5 42.5 47.5 C42.5 47.5 50 42 50 37.8 C50 34.2 45.5 31.8 42.5 35 Z" 
        fill="url(#heartGrad)" filter="url(#heartShadow)" />
</svg>`;

// 2. Generate multi-resolution Windows ICO (32x32 32-bit RGBA BMP inside ICO)
function create32x32IcoBuffer() {
  const width = 32;
  const height = 32;

  // Render a 32x32 pixel buffer in memory
  // Canvas coordinate system (0,0 is top-left)
  const pixels = new Uint8Array(width * height * 4); // RGBA

  function setPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = (y * width + x) * 4;
    // Alpha blending
    const srcA = a / 255;
    const dstA = pixels[idx + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);
    if (outA > 0) {
      pixels[idx] = Math.round((r * srcA + pixels[idx] * dstA * (1 - srcA)) / outA);
      pixels[idx + 1] = Math.round((g * srcA + pixels[idx + 1] * dstA * (1 - srcA)) / outA);
      pixels[idx + 2] = Math.round((b * srcA + pixels[idx + 2] * dstA * (1 - srcA)) / outA);
      pixels[idx + 3] = Math.round(outA * 255);
    }
  }

  // Draw rounded rect background
  const radius = 7;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Check rounded corners
      let inside = true;
      let dist = 0;
      if (x < radius && y < radius) {
        dist = Math.hypot(x - radius, y - radius);
        if (dist > radius) inside = false;
      } else if (x >= width - radius && y < radius) {
        dist = Math.hypot(x - (width - radius - 1), y - radius);
        if (dist > radius) inside = false;
      } else if (x < radius && y >= height - radius) {
        dist = Math.hypot(x - radius, y - (height - radius - 1));
        if (dist > radius) inside = false;
      } else if (x >= width - radius && y >= height - radius) {
        dist = Math.hypot(x - (width - radius - 1), y - (height - radius - 1));
        if (dist > radius) inside = false;
      }

      if (inside) {
        // Gradient from #845EC2 (top) to #512E9E (bottom)
        const t = y / height;
        const r = Math.round(132 * (1 - t) + 81 * t);
        const g = Math.round(94 * (1 - t) + 46 * t);
        const b = Math.round(194 * (1 - t) + 158 * t);
        setPixel(x, y, r, g, b, 255);
      }
    }
  }

  // Draw bag handles (y: 5 to 11, x: 12 to 19)
  for (let angle = 0; angle <= Math.PI; angle += 0.05) {
    const cx = 15.5 + Math.cos(angle) * 4.5;
    const cy = 10 - Math.sin(angle) * 4.5;
    for (let dx = -0.8; dx <= 0.8; dx += 0.5) {
      for (let dy = -0.8; dy <= 0.8; dy += 0.5) {
        setPixel(Math.round(cx + dx), Math.round(cy + dy), 255, 255, 255, 255);
      }
    }
  }
  // Handle vertical stems
  for (let y = 10; y <= 12; y++) {
    setPixel(11, y, 255, 255, 255, 255);
    setPixel(12, y, 255, 255, 255, 255);
    setPixel(19, y, 255, 255, 255, 255);
    setPixel(20, y, 255, 255, 255, 255);
  }

  // Draw shopping bag body (y: 11 to 26, x: 8 to 23)
  for (let y = 11; y <= 26; y++) {
    const minX = 8 + (26 - y) * 0.05;
    const maxX = 23 - (26 - y) * 0.05;
    for (let x = Math.round(minX); x <= Math.round(maxX); x++) {
      setPixel(x, y, 255, 255, 255, 255);
    }
  }

  // Draw Heart (around x: 21, y: 21)
  const heartPoints = [
    [21, 18], [20, 17], [22, 17], [19, 18], [23, 18],
    [19, 19], [20, 19], [21, 19], [22, 19], [23, 19],
    [19, 20], [20, 20], [21, 20], [22, 20], [23, 20],
    [20, 21], [21, 21], [22, 21],
    [20, 22], [21, 22], [22, 22],
    [21, 23], [21, 24]
  ];

  for (const [hx, hy] of heartPoints) {
    setPixel(hx, hy, 244, 63, 94, 255); // vibrant pink-rose #F43F5E
  }

  // Pack into BMP 32-bit (bottom to top, BGRA)
  const imageSize = width * height * 4;
  const maskSize = (width * height) / 8; // 128 bytes
  const bmpHeaderSize = 40;
  const dataSize = bmpHeaderSize + imageSize + maskSize;

  const icoBuf = Buffer.alloc(6 + 16 + dataSize);

  // ICO Header
  icoBuf.writeUInt16LE(0, 0); // Reserved
  icoBuf.writeUInt16LE(1, 2); // Type 1 = Icon
  icoBuf.writeUInt16LE(1, 4); // Count = 1

  // Entry 1 (32x32)
  icoBuf.writeUInt8(width, 6);
  icoBuf.writeUInt8(height, 7);
  icoBuf.writeUInt8(0, 8); // Colors (0 = 256+)
  icoBuf.writeUInt8(0, 9); // Reserved
  icoBuf.writeUInt16LE(1, 10); // Color planes
  icoBuf.writeUInt16LE(32, 12); // Bits per pixel
  icoBuf.writeUInt32LE(dataSize, 14); // Image data size
  icoBuf.writeUInt32LE(22, 18); // Offset to image data

  // BMP Header (offset 22)
  let offset = 22;
  icoBuf.writeUInt32LE(bmpHeaderSize, offset); // biSize
  icoBuf.writeInt32LE(width, offset + 4); // biWidth
  icoBuf.writeInt32LE(height * 2, offset + 8); // biHeight (double for ICO)
  icoBuf.writeUInt16LE(1, offset + 12); // biPlanes
  icoBuf.writeUInt16LE(32, offset + 14); // biBitCount (32-bit BGRA)
  icoBuf.writeUInt32LE(0, offset + 16); // biCompression (BI_RGB)
  icoBuf.writeUInt32LE(imageSize, offset + 20); // biSizeImage
  icoBuf.writeInt32LE(0, offset + 24); // biXPelsPerMeter
  icoBuf.writeInt32LE(0, offset + 28); // biYPelsPerMeter
  icoBuf.writeUInt32LE(0, offset + 32); // biClrUsed
  icoBuf.writeUInt32LE(0, offset + 36); // biClrImportant

  offset += bmpHeaderSize;

  // BMP Pixels (Bottom to top, BGRA)
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      icoBuf.writeUInt8(pixels[idx + 2], offset++); // Blue
      icoBuf.writeUInt8(pixels[idx + 1], offset++); // Green
      icoBuf.writeUInt8(pixels[idx], offset++);     // Red
      icoBuf.writeUInt8(pixels[idx + 3], offset++); // Alpha
    }
  }

  // 1-bit AND Mask (all 0s because alpha channel handles transparency)
  for (let i = 0; i < maskSize; i++) {
    icoBuf.writeUInt8(0, offset++);
  }

  return icoBuf;
}

const rootDir = path.resolve(__dirname, "..");
const appDir = path.join(rootDir, "app");
const publicDir = path.join(rootDir, "public");

// 1. Write SVG icons
fs.writeFileSync(path.join(appDir, "icon.svg"), svgContent, "utf8");
fs.writeFileSync(path.join(publicDir, "favicon.svg"), svgContent, "utf8");
fs.writeFileSync(path.join(publicDir, "icon.svg"), svgContent, "utf8");

// 2. Generate and write ICO file to app/favicon.ico and public/favicon.ico
const icoBuffer = create32x32IcoBuffer();
fs.writeFileSync(path.join(appDir, "favicon.ico"), icoBuffer);
fs.writeFileSync(path.join(publicDir, "favicon.ico"), icoBuffer);

console.log("Favicons generated successfully!");
