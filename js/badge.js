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
function fittedText(ctx, text, x, y, maxWidth, size, family = 'Georgia', minimum = 18, italic = false) {
  do { ctx.font = `${italic ? "italic " : ""}${size}px ${family}`; if (ctx.measureText(text).width <= maxWidth) break; size -= 1; } while (size > minimum);
  ctx.fillText(text, x, y, maxWidth);
}
export async function renderBadge(canvas, bird, imageLoader = loadImage) {
  canvas.width = 1080; canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser does not support canvas.');
  ctx.fillStyle = '#f7f5ed'; ctx.fillRect(0, 0, 1080, 1080);
  ctx.fillStyle = '#244b40'; ctx.textAlign = 'center';
  ctx.font = 'bold 31px Arial'; ctx.fillText('BIRD EXPLORER', 540, 74);
  ctx.strokeStyle = '#c9cfba'; ctx.lineWidth = 2; ctx.strokeRect(30, 30, 1020, 1020);
  let imageMissing = false;
  try {
    const image = await imageLoader(bird.image);
    const crop = coverCrop(image.naturalWidth, image.naturalHeight, 964, 565, bird.focalX, bird.focalY);
    ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 58, 105, 964, 565);
  } catch {
    imageMissing = true;
    ctx.fillStyle = '#e5e8d9'; ctx.fillRect(58, 105, 964, 565);
    ctx.fillStyle = '#244b40'; ctx.font = '38px Georgia'; ctx.fillText('A discovery beyond the picture', 540, 370);
    ctx.font = '24px Arial'; ctx.fillText('Bird image unavailable', 540, 417);
  }
  ctx.fillStyle = '#4f604f';
  fittedText(ctx, imageMissing ? 'IMAGE UNAVAILABLE' : bird.imagePlaceholder ? 'TEMPORARY ILLUSTRATION · NOT A PHOTOGRAPH' : `${bird.imageCredit} · ${bird.imageLicense}`, 540, 704, 940, 19, 'Arial');
  ctx.fillStyle = '#244b40'; ctx.font = '32px Georgia'; ctx.fillText('I think I found a…', 540, 766);
  fittedText(ctx, bird.commonName, 540, 842, 930, 65);
  fittedText(ctx, bird.scientificName, 540, 892, 930, 31, 'Georgia', 18, true);
  ctx.fillStyle = '#e7eadc'; ctx.fillRect(155, 944, 770, 57);
  ctx.fillStyle = '#244b40'; ctx.font = '26px Arial'; ctx.fillText('Possible identification • Not verified', 540, 982);
  // Export the same canvas used for the preview so both remain identical.
  const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG export failed.')), 'image/png'));
  return { blob, imageMissing };
}
