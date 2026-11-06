import { localDate, formatDiscoveryDate } from './discovery.js';
import { BADGE_DESIGN, landscapeSources, containImage } from './badge-design.js';
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
async function drawLandscape(ctx, sources, imageLoader, design) {
  for (const source of sources) {
    try {
      const image = await imageLoader(source);
      const layer = document.createElement('canvas');
      layer.width = design.size; layer.height = design.size;
      const paint = layer.getContext('2d');
      if (!paint) continue;
      const box = containImage(image.naturalWidth, image.naturalHeight, design.landscape);
      // Filter on a separate layer so the bird and lettering retain their colors.
      paint.filter = 'grayscale(1)';
      paint.drawImage(image, box.x, box.y, box.width, box.height);
      paint.filter = 'none';
      const { x, y, width, height, fadeStart, fadeStrength, opacity } = design.landscape;
      paint.save();
      paint.translate(x + width / 2, y + height / 2);
      paint.scale(width / 2, height / 2);
      const mask = paint.createRadialGradient(0, 0, 0, 0, 0, 1);
      mask.addColorStop(Math.max(0, Math.min(0.99, fadeStart)), '#000');
      mask.addColorStop(1, `rgba(0,0,0,${1 - Math.max(0, Math.min(1, fadeStrength))})`);
      paint.globalCompositeOperation = 'destination-in';
      paint.fillStyle = mask; paint.fillRect(-1, -1, 2, 2);
      paint.restore();
      ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
      ctx.drawImage(layer, 0, 0); ctx.restore();
      return source;
    } catch { /* Try the local default, then retain plain paper. */ }
  }
  return null;
}
export async function renderBadge(canvas, bird, imageLoader = loadImage, discovery = {}) {
  if (typeof document !== 'undefined' && document.fonts) await document.fonts.ready;
  const date = formatDiscoveryDate(discovery.date ?? localDate());
  if (!date) throw new Error('Invalid discovery date.');
  const location = (discovery.location || '').trim().slice(0, 100);
  const design = BADGE_DESIGN;
  canvas.width = design.size; canvas.height = design.size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser does not support canvas.');
  ctx.fillStyle = design.paper; ctx.fillRect(0, 0, design.size, design.size);
  const landscapeSource = await drawLandscape(ctx, landscapeSources(discovery.area), imageLoader, design);
  ctx.textAlign = 'center';
  function text(value, position, { color = design.ink, family = design.bodyFont, italic = false } = {}) {
    ctx.fillStyle = color;
    fittedText(ctx, value, design.text.centerX, position.y, design.text.maxWidth, position.size, family, 18, italic);
  }
  text('BIRD EXPLORER', design.text.brand);
  let imageMissing = false;
  try {
    const image = await imageLoader(bird.image);
    const box = containImage(image.naturalWidth, image.naturalHeight, design.bird);
    ctx.drawImage(image, box.x, box.y, box.width, box.height);
  } catch {
    imageMissing = true;
    text('Illustration unavailable', design.text.missingTitle);
    text('The discovery details can still be saved.', design.text.missingNote, { color: design.muted });
  }
  text(imageMissing ? 'IMAGE UNAVAILABLE' : bird.imagePlaceholder ? 'TEMPORARY ILLUSTRATION · NOT A PHOTOGRAPH' : `${bird.imageCredit} · ${bird.imageLicense}`, design.text.credit, { color: design.muted });
  text('What bird did you see?', design.text.prompt, { family: design.headingFont });
  text(bird.commonName, design.text.common, { family: design.headingFont });
  text(bird.scientificName, design.text.scientific, { family: design.headingFont, italic: true });
  text(`Discovered: ${date}`, design.text.date, { color: design.muted });
  if (location) text(`Location: ${location}`, design.text.location, { color: design.muted });
  text('Possible identification • Not verified', design.text.disclaimer, { color: design.muted });
  // Preview and download use the exact same composed pixels.
  const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG export failed.')), 'image/png'));
  return { blob, imageMissing, landscapeSource };
}
