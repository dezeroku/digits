import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

const svgBuffer = readFileSync(join(publicDir, 'icon.svg'));

const sizes = [
  { name: 'favicon.ico', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
];

async function generateIcons() {
  for (const { name, size } of sizes) {
    const outputPath = join(publicDir, name);

    if (name.endsWith('.ico')) {
      // For favicon, just create a small PNG (browsers handle it)
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath.replace('.ico', '.png'));
      console.log(`Generated ${name.replace('.ico', '.png')} (${size}x${size})`);
    } else {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`Generated ${name} (${size}x${size})`);
    }
  }
  console.log('Done!');
}

generateIcons().catch(console.error);
