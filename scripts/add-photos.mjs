import sharp from 'sharp';
const ids = ['f6c2ad07-23bd-4840-837b-3a73d8ab834f', '2498d5b4-5355-4762-820a-da8cfd47a10d', 'ab3eb0e1-99ad-48ff-b3de-f4a992439842', 'b056d5c6-3b0d-4a4e-a772-1d2cc1e30a48', '04629882-afa6-4a32-b9ff-8cf007dad6d9', 'df262c43-7386-4944-ad0f-1008c0701350'];
for (const [index, id] of ids.entries()) {
  await sharp(`C:/Users/math_/AppData/Local/Temp/codex-clipboard-${id}.png`).rotate().resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 85 }).toFile(`public/photos/${index + 12}.webp`);
}
