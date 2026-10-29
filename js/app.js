import { loadCatalog, searchSpecies } from './catalog.js';
import { renderBadge } from './badge.js';
const $ = id => document.getElementById(id);
let birds = [], selected = null, badgeBlob = null, generating = false, generation = 0;
const screens = ['welcome', 'catalog', 'detail', 'badge'];
function show(screen) {
  for (const id of screens) $(id).hidden = id !== screen;
  document.querySelector('.how').hidden = screen !== 'welcome';
  const title = $(screen).querySelector('h1');
  if (title) { title.tabIndex = -1; title.focus({ preventScroll: true }); }
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function showCatalog() { show('catalog'); }
$('find-bird').addEventListener('click', showCatalog);
document.querySelectorAll('[data-home]').forEach(button => button.addEventListener('click', () => show('welcome')));
document.querySelectorAll('[data-catalog]').forEach(button => button.addEventListener('click', showCatalog));
$('merlin-open').addEventListener('click', () => $('merlin-dialog').showModal());
$('merlin-close').addEventListener('click', () => $('merlin-dialog').close());
function imageElement(bird) {
  const image = document.createElement('img');
  image.src = bird.image;
  image.alt = `${bird.imagePlaceholder ? 'Temporary illustration' : 'Photograph'} of ${bird.commonName}`;
  image.style.objectPosition = `${bird.focalX * 100}% ${bird.focalY * 100}%`;
  image.addEventListener('error', () => {
    image.removeAttribute('src'); image.alt = `${bird.commonName} — image unavailable`;
  }, { once: true });
  return image;
}
function element(tag, text, className) {
  const node = document.createElement(tag); node.textContent = text;
  if (className) node.className = className;
  return node;
}
function renderCatalog() {
  const matches = searchSpecies(birds, $('search').value);
  $('species-list').replaceChildren();
  $('catalog-status').textContent = matches.length ? `${matches.length} ${matches.length === 1 ? 'species' : 'species'} to explore · ${birds.length} in this field guide` : 'No birds found. Try another common or scientific name.';
  for (const bird of matches) {
    const card = element('button', '', 'species-card'); card.type = 'button';
    card.append(imageElement(bird));
    const names = element('span', '', 'names');
    names.append(element('strong', bird.commonName), element('i', bird.scientificName), element('small', bird.imagePlaceholder ? 'TEMPORARY ILLUSTRATION' : `${bird.imageCredit} · ${bird.imageLicense}`));
    card.append(names); card.addEventListener('click', () => selectBird(bird));
    $('species-list').append(card);
  }
}
async function initCatalog() {
  $('retry').hidden = true; $('catalog-status').textContent = 'Loading the field guide…';
  try { birds = await loadCatalog(); renderCatalog(); }
  catch { $('catalog-status').textContent = 'The field guide could not load. Check your connection and try again.'; $('retry').hidden = false; }
}
$('retry').addEventListener('click', initCatalog);
$('search').addEventListener('input', () => { if (birds.length) renderCatalog(); });
function selectBird(bird) {
  generation += 1; generating = false; badgeBlob = null;
  selected = bird;
  const content = $('detail-content'); content.replaceChildren();
  const visual = document.createElement('div'); visual.append(imageElement(bird), element('p', `${bird.imagePlaceholder ? 'Temporary illustration — not an identification reference. ' : ''}${bird.imageCredit} · ${bird.imageLicense}`, 'image-note'));
  const info = document.createElement('div');
  const title = element('h1', bird.commonName); title.id = 'detail-title';
  const create = element('button', 'Create My Badge →', 'primary'); create.addEventListener('click', createBadge);
  info.append(element('p', 'A POSSIBLE MATCH', 'eyebrow'), title, element('p', bird.scientificName, 'scientific'), element('p', bird.description), element('p', 'Spotted it or heard it? Either way, keep exploring. This selection is not a verified identification.', 'small'), create);
  content.append(visual, info); show('detail');
}
async function createBadge() {
  if (generating || !selected) return;
  const currentGeneration = ++generation;
  const bird = selected;
  generating = true; badgeBlob = null; $('share').disabled = true; $('download').disabled = true; $('retry-badge').hidden = true;
  show('badge'); $('badge-status').textContent = 'Preparing your discovery badge…';
  $('badge-canvas').setAttribute('aria-label', `Bird Explorer. I think I found a ${selected.commonName}. ${selected.scientificName}. Possible identification. Not verified.`);
  try {
    const buffer = document.createElement('canvas');
    const result = await renderBadge(buffer, bird);
    if (currentGeneration !== generation) return;
    $('badge-canvas').getContext('2d').drawImage(buffer, 0, 0);
    badgeBlob = result.blob;
    $('badge-status').textContent = result.imageMissing ? 'The bird image could not load. Your badge is ready with a labeled image placeholder.' : 'Your badge is ready to save or share.';
    $('share').disabled = false; $('download').disabled = false;
  } catch { if (currentGeneration !== generation) return; $('badge-status').textContent = 'The badge could not be created. Please try again.'; $('retry-badge').hidden = false; }
  finally { if (currentGeneration === generation) generating = false; }
}
$('retry-badge').addEventListener('click', createBadge);
function downloadBadge() {
  if (!badgeBlob) return;
  const url = URL.createObjectURL(badgeBlob), link = document.createElement('a');
  link.href = url; link.download = `bird-explorer-${selected.code.toLowerCase()}.png`;
  document.body.append(link); link.click(); link.remove();
  // Safari may still be consuming the object URL after the click returns.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  $('badge-status').textContent = 'Download started. If your browser opens the image, touch and hold it to save, or use its Share menu.';
}
$('download').addEventListener('click', downloadBadge);
$('share').addEventListener('click', async () => {
  if (!badgeBlob) return;
  try {
    const file = new File([badgeBlob], `bird-explorer-${selected.code.toLowerCase()}.png`, { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'My Bird Explorer discovery', text: `I think I found a ${selected.commonName}! Possible identification • Not verified.` });
      $('badge-status').textContent = 'Sharing finished.';
    } else {
      $('badge-status').textContent = 'Your browser does not support image sharing. Use Download Badge, then attach the PNG in your preferred app.';
      $('download').focus();
    }
  } catch (error) {
    $('badge-status').textContent = error.name === 'AbortError' ? 'Sharing canceled. Your badge is still ready.' : 'Sharing is unavailable right now. Use Download Badge to save the image instead.';
  }
});
initCatalog();
