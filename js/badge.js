import { localDate, formatDiscoveryDate } from './discovery.js';
/** Cover an image while centering its focal point, clamped to the image edges. */
export function coverCrop(imageWidth, imageHeight, width, height, focalX = .5, focalY = .5) {
  const scale = Math.max(width / imageWidth, height / imageHeight);
  const sw = width / scale, sh = height / scale;
  return { sx: Math.max(0, Math.min(imageWidth - sw, focalX * imageWidth - sw / 2)), sy: Math.max(0, Math.min(imageHeight - sh, focalY * imageHeight - sh / 2)), sw, sh };
}
export function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timer = setTimeout(() => { image.src = ''; reject(new Error('Image timed out.')); }, 12000);
    image.onload = () => { clearTimeout(timer); resolve(image); };
    image.onerror = () => { clearTimeout(timer); reject(new Error('Image could not load.')); };
    image.src = source;
  });
}
function fittedText(ctx, text, x, y, maxWidth, size, family = '"Cronos Pro", "Trebuchet MS", sans-serif', minimum = 18, italic = false) {
  do { ctx.font = `${italic ? "italic " : ""}${size}px ${family}`; if (ctx.measureText(text).width <= maxWidth) break; size -= 1; } while (size > minimum);
  ctx.fillText(text, x, y, maxWidth);
}
export async function renderBadge(canvas, bird, imageLoader = loadImage, discovery = {}) {
  if (typeof document !== 'undefined' && document.fonts) await document.fonts.ready;
  const date = formatDiscoveryDate(discovery.date ?? localDate());
  if (!date) throw new Error('Invalid discovery date.');
  const location = (discovery.location || '').trim().slice(0, 100);
  canvas.width = 1080; canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser does not support canvas.');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 1080, 1080);
  ctx.fillStyle = '#1f772d'; ctx.textAlign = 'center';
  ctx.font = 'bold 31px Lato, Arial'; ctx.fillText('BIRD EXPLORER', 540, 74);
  ctx.strokeStyle = '#8fb387'; ctx.lineWidth = 2; ctx.strokeRect(30, 30, 1020, 1020);
  let imageMissing = false;
  try {
    const image = await imageLoader(bird.image);
    const crop = coverCrop(image.naturalWidth, image.naturalHeight, 964, 565, bird.focalX, bird.focalY);
    ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 58, 105, 964, 565);
  } catch {
    imageMissing = true;
    ctx.fillStyle = '#edf3eb'; ctx.fillRect(58, 105, 964, 565);
    ctx.fillStyle = '#1f772d'; ctx.font = '38px "Cronos Pro", "Trebuchet MS", sans-serif'; ctx.fillText('A discovery beyond the picture', 540, 370);
    ctx.font = '24px Lato, Arial'; ctx.fillText('Bird image unavailable', 540, 417);
  }
  ctx.fillStyle = '#51575e';
  fittedText(ctx, imageMissing ? 'IMAGE UNAVAILABLE' : bird.imagePlaceholder ? 'TEMPORARY ILLUSTRATION · NOT A PHOTOGRAPH' : `${bird.imageCredit} · ${bird.imageLicense}`, 540, 704, 940, 19, 'Lato, Arial');
  ctx.fillStyle = '#1f772d'; ctx.font = '32px "Cronos Pro", "Trebuchet MS", sans-serif'; ctx.fillText('I think I found a…', 540, 748);
  fittedText(ctx, bird.commonName, 540, 805, 930, 58);
  fittedText(ctx, bird.scientificName, 540, 849, 930, 29, '"Cronos Pro", "Trebuchet MS", sans-serif', 18, true);
  ctx.fillStyle = '#51575e';
  fittedText(ctx, `Discovered: ${date}`, 540, 891, 930, 26, 'Lato, Arial');
  if (location) fittedText(ctx, `Location: ${location}`, 540, 925, 930, 26, 'Lato, Arial');
  ctx.fillStyle = '#edf3eb'; ctx.fillRect(155, 944, 770, 57);
  ctx.fillStyle = '#1f772d'; ctx.font = '26px Lato, Arial'; ctx.fillText('Possible identification • Not verified', 540, 982);
  // Export the same canvas used for the preview so both remain identical.
  const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG export failed.')), 'image/png'));
  return { blob, imageMissing };
}
