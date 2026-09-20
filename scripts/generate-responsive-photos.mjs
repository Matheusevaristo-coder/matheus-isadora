import fs from 'node:fs/promises';
import sharp from 'sharp';

await fs.mkdir('public/photos/640', { recursive: true });
const files = (await fs.readdir('public/photos')).filter(file => file.endsWith('.webp'));
await Promise.all(files.map(file => sharp(`public/photos/${file}`).resize({ width: 640, withoutEnlargement: true }).webp({ quality: 78 }).toFile(`public/photos/640/${file}`)));
console.log(`Geradas ${files.length} imagens responsivas.`);
