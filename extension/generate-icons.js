const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const createSVG = (size) => `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <g transform="translate(${size * 0.2}, ${size * 0.2})">
    <rect x="0" y="${size * 0.3}" width="${size * 0.15}" height="${size * 0.3}" fill="white"/>
    <rect x="${size * 0.25}" y="${size * 0.1}" width="${size * 0.15}" height="${size * 0.5}" fill="white"/>
    <rect x="${size * 0.5}" y="0" width="${size * 0.15}" height="${size * 0.6}" fill="white"/>
  </g>
</svg>`;

// Create a simple PNG-like placeholder (actually a text file for now)
const createPlaceholder = (size) => {
  return `PNG PLACEHOLDER ${size}x${size} - This is a placeholder for the actual icon. To generate real icons, open extension/icons/generate-icons.html in a browser and save each canvas.`;
};

// Icon sizes
const sizes = [16, 32, 48, 128];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// Generate placeholder files
sizes.forEach(size => {
  const filename = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(filename, createPlaceholder(size));
  console.log(`Created placeholder: ${filename}`);
});

console.log('\nPlaceholder icons created!');
console.log('To generate real icons, open extension/icons/generate-icons.html in a browser.');