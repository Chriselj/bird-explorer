import { AREAS } from './discovery.js';

// Local, Pages-subpath-safe URLs. No artwork files are bundled yet.
export const AREA_ARTWORK = Object.freeze(Object.fromEntries(
  Object.keys(AREAS).map(area => [area, `./assets/areas/${area}.webp`])
));
export const DEFAULT_ARTWORK = './assets/areas/default.webp';
export function landscapeSources(area) {
  return Object.hasOwn(AREA_ARTWORK, area)
    ? [AREA_ARTWORK[area], DEFAULT_ARTWORK] : [DEFAULT_ARTWORK];
}

// All positions and sizes are in pixels on the 1080 × 1080 exported page.
export const BADGE_DESIGN = {
  size: 1080,
  paper: '#f7f5ed', ink: '#443e34', muted: '#676257',
  headingFont: '"Cronos Pro", "Trebuchet MS", sans-serif',
  bodyFont: 'Lato, Arial, sans-serif',
  landscape: { x: 40, y: 100, width: 1000, height: 590, opacity: 0.12, fadeStrength: 1, fadeStart: 0.45 },
  bird: { x: 90, y: 110, width: 900, height: 550 },
  text: {
    centerX: 540, maxWidth: 930,
    brand: { y: 74, size: 26 }, credit: { y: 698, size: 18 },
    prompt: { y: 746, size: 27 }, common: { y: 805, size: 56 },
    scientific: { y: 849, size: 29 }, date: { y: 894, size: 25 },
    location: { y: 930, size: 25 }, disclaimer: { y: 995, size: 22 },
    missingTitle: { y: 370, size: 32 }, missingNote: { y: 415, size: 23 }
  }
};

// Contain instead of cropping so future transparent bird illustrations stay intact.
export function containImage(imageWidth, imageHeight, box) {
  const scale = Math.min(box.width / imageWidth, box.height / imageHeight);
  const width = imageWidth * scale, height = imageHeight * scale;
  return { x: box.x + (box.width - width) / 2, y: box.y + (box.height - height) / 2, width, height };
}
