import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
const ids = ['8b92523c-8a9e-412c-b2e4-326674288a2d','9f9d7936-0503-492b-8e41-d91dd741ceb2','746e3420-4465-4552-8f9f-bb6a4d5f3744','28e33a50-071f-4657-ad5a-5b3938ed6094','13494139-77b3-4ccd-8d02-bea43abade36','84c9e5f5-3ce3-4980-9a02-8f17bdb833fe','9299df5b-d741-4a9e-ba46-4848673d38c3','656a7794-057d-4569-b60c-b822d3daf285','059b1ce2-8ac3-45d7-a12b-b63e15423597','1ad3ef34-34f4-447b-8339-623d36c42abb','d44a4deb-3887-48a2-a679-31da117145e6'];
await mkdir('public/photos', { recursive: true });
for (const [index,id] of ids.entries()) await sharp(`C:/Users/math_/AppData/Local/Temp/codex-clipboard-${id}.png`).rotate().resize({ width: 1000, withoutEnlargement: true }).webp({ quality: 83 }).toFile(`public/photos/${String(index+1).padStart(2,'0')}.webp`);
console.log('11 fotos otimizadas em public/photos.');
