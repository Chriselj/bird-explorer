import { loadCatalog, searchSpecies } from './catalog.js';
import { renderBadge } from './badge.js';
import { TRAIL_AREAS, DEFAULT_PROMPT, DEFAULT_STEWARDSHIP, CLUES, FIELD_GUIDE, matchesClue, fieldNote, encounterLabel } from './trail.js';
import { AREAS, areaFromSearch, locationName, localDate, formatDiscoveryDate } from './discovery.js';
const $ = id => document.getElementById(id);
let birds = [], selected = null, badgeBlob = null, generation = 0, activeClue = 'all';
for (const [value, label] of [...Object.entries(AREAS), ['other', 'Other location']]) {
  const option = document.createElement('option'); option.value = value; option.textContent = label;
  $('discovery-area').append(option);
  $('welcome-area').append(option.cloneNode(true));
}
// Read the URL once; navigation and species changes preserve visitor edits.
$('discovery-area').value = areaFromSearch(window.location.search);
$('discovery-date').value = localDate();
updateTrail();
function discoveryDetails() {
  return { encounter: $('encounter').value, note: fieldNote($('field-note').value), area: $('discovery-area').value, date: $('discovery-date').value, location: locationName($('discovery-area').value, $('other-location').value) };
}
function updateTrail() {
  const area = $('discovery-area').value;
  const name = locationName(area, $('other-location').value);
  $('welcome-area').value = area;
  $('welcome-other-field').hidden = area !== 'other';
  $('welcome-other').value = $('other-location').value;
  $('welcome-title').textContent = name ? `Explore birds at ${name}.` : 'Explore birds around you.';
  $('trail-prompt').textContent = TRAIL_AREAS[area]?.prompt || DEFAULT_PROMPT;
  $('welcome-area-name').textContent = name || 'Look closer. Listen longer.';
  const artwork = `./assets/areas/${Object.hasOwn(AREAS, area) ? area : 'default'}.webp`;
  if ($('welcome-landscape').getAttribute('src') !== artwork) $('welcome-landscape').src = artwork;
  $('stewardship-text').textContent = TRAIL_AREAS[area]?.stewardship || DEFAULT_STEWARDSHIP;
}
$('welcome-landscape').addEventListener('error', () => { $('welcome-landscape').hidden = true; });
$('welcome-landscape').addEventListener('load', () => { $('welcome-landscape').hidden = false; });
$('welcome-area').addEventListener('change', () => {
  $('discovery-area').value = $('welcome-area').value;
  updateDiscovery();
  if ($('welcome-area').value === 'other') $('welcome-other').focus();
});
$('welcome-other').addEventListener('input', () => {
  $('other-location').value = $('welcome-other').value; updateDiscovery();
});
function updateDiscovery() {
  updateTrail();
  $('other-location-field').hidden = $('discovery-area').value !== 'other';
  if (selected && !$('badge').hidden) createBadge(true);
}
$('discovery-area').addEventListener('change', updateDiscovery);
$('other-location').addEventListener('input', updateDiscovery);
$('discovery-date').addEventListener('input', updateDiscovery);
$('encounter').addEventListener('change', () => { if (selected && !$('badge').hidden) createBadge(true); });
$('field-note').addEventListener('input', () => { if (selected && !$('badge').hidden) createBadge(true); });
const screens = ['welcome', 'observe', 'catalog', 'detail', 'badge'];
function show(screen) {
  for (const id of screens) $(id).hidden = id !== screen;
  document.querySelector('.how').hidden = screen !== 'welcome';
  const title = $(screen).querySelector('h1');
  if (title) { title.tabIndex = -1; title.focus({ preventScroll: true }); }
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function showCatalog() { show('catalog'); }
$('get-started').addEventListener('click', () => show('observe'));
$('ready-observe').addEventListener('click', showCatalog);
$('find-bird').addEventListener('click', showCatalog);
document.querySelectorAll('[data-home]').forEach(button => button.addEventListener('click', () => show('welcome')));
document.querySelectorAll('[data-catalog]').forEach(button => button.addEventListener('click', showCatalog));
$('merlin-open').addEventListener('click', () => $('merlin-dialog').showModal());
document.querySelectorAll('[data-merlin]').forEach(button => button.addEventListener('click', () => $('merlin-dialog').showModal()));
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
  const matches = searchSpecies(birds, $('search').value).filter(bird => matchesClue(bird, activeClue));
  $('species-list').replaceChildren();
  $('catalog-status').textContent = matches.length ? `${matches.length} ${matches.length === 1 ? 'species' : 'species'} to explore · ${birds.length} in this field guide` : 'No matches in this small collection. Try Show all birds, another name, or Merlin.';
  for (const bird of matches) {
    const card = element('button', '', 'species-card'); card.type = 'button';
    card.append(imageElement(bird));
    const names = element('span', '', 'names');
    names.append(element('strong', bird.commonName), element('i', bird.scientificName), element('small', bird.imagePlaceholder ? 'TEMPORARY ILLUSTRATION' : `${bird.imageCredit} · ${bird.imageLicense}`));
    names.append(element('span', FIELD_GUIDE[bird.code]?.look || bird.description, 'clue-description'));
    card.append(names); card.addEventListener('click', () => selectBird(bird));
    $('species-list').append(card);
  }
}
for (const [key, label] of Object.entries(CLUES)) {
  const button = element('button', label); button.type = 'button'; button.dataset.clue = key;
  button.setAttribute('aria-pressed', String(key === activeClue));
  button.addEventListener('click', () => {
    activeClue = key;
    for (const other of $('clue-filters').children) other.setAttribute('aria-pressed', String(other === button));
    if (key === 'heard') $('encounter').value = 'heard';
    renderCatalog();
  });
  $('clue-filters').append(button);
}
$('notice-another').addEventListener('click', () => {
  generation += 1; selected = null; badgeBlob = null;
  $('field-note').value = ''; $('encounter').value = ''; $('search').value = ''; activeClue = 'all';
  for (const button of $('clue-filters').children) button.setAttribute('aria-pressed', String(button.dataset.clue === 'all'));
  renderCatalog(); showCatalog();
});
async function initCatalog() {
  $('retry').hidden = true; $('catalog-status').textContent = 'Loading the field guide…';
  try { birds = await loadCatalog(); renderCatalog(); }
  catch { $('catalog-status').textContent = 'The field guide could not load. Check your connection and try again.'; $('retry').hidden = false; }
}
$('retry').addEventListener('click', initCatalog);
$('search').addEventListener('input', () => { if (birds.length) renderCatalog(); });
function selectBird(bird) {
  generation += 1; badgeBlob = null;
  selected = bird;
  const content = $('detail-content'); content.replaceChildren();
  const visual = document.createElement('div'); visual.append(imageElement(bird), element('p', `${bird.imagePlaceholder ? 'Temporary illustration — not an identification reference. ' : ''}${bird.imageCredit} · ${bird.imageLicense}`, 'image-note'));
  const info = document.createElement('div');
  const title = element('h1', bird.commonName); title.id = 'detail-title';
  const create = element('button', 'Create My Badge →', 'primary'); create.addEventListener('click', createBadge);
  info.append(element('p', 'A POSSIBLE MATCH', 'eyebrow'), title, element('p', bird.scientificName, 'scientific'), element('p', bird.description), element('p', 'Record the bird you observed by sight or sound. This selection is a possible identification.', 'small'), create);
  const field = FIELD_GUIDE[bird.code];
  if (field) {
    const tips = element('dl', '', 'field-tips');
    for (const [label, value] of [['Look for', field.look], ['Notice', field.notice], ['Its habitat connection', field.habitat]]) tips.append(element('dt', label), element('dd', value));
    info.insertBefore(tips, create);
    $('learn-bird').href = `https://www.allaboutbirds.org/guide/${field.page}/overview`;
    $('learn-bird').hidden = false;
  } else $('learn-bird').hidden = true;
  const compare = element('button', 'Compare other birds', 'secondary'); compare.addEventListener('click', showCatalog);
  const actions = element('div', '', 'actions'); create.replaceWith(actions); actions.append(create, compare);
  info.insertBefore(element('p', 'Does this seem like your bird?'), actions);
  content.append(visual, info); show('detail');
}
async function createBadge(refresh = false) {
  if (!selected) return;
  const currentGeneration = ++generation;
  const bird = selected;
  badgeBlob = null; $('share').disabled = true; $('download').disabled = true; $('retry-badge').hidden = true;
  if (refresh !== true) show('badge');
  const discovery = discoveryDetails();
  if (!formatDiscoveryDate(discovery.date)) {
    $('badge-status').textContent = 'Enter a valid discovery date to save or share your badge.'; return;
  }
  $('badge-status').textContent = 'Preparing your discovery badge…';
  $('badge-canvas').setAttribute('aria-label', `Bird Explorer. What bird did you see? ${selected.commonName}. ${selected.scientificName}. Discovered: ${formatDiscoveryDate(discovery.date)}.${discovery.location ? ` Location: ${discovery.location}.` : ''} ${encounterLabel(discovery.encounter)}. ${discovery.note} Possible identification. Not verified.`);
  try {
    const buffer = document.createElement('canvas');
    const result = await renderBadge(buffer, bird, undefined, discovery);
    if (currentGeneration !== generation) return;
    $('badge-canvas').getContext('2d').drawImage(buffer, 0, 0);
    badgeBlob = result.blob;
    $('badge-status').textContent = result.imageMissing ? 'The bird image could not load. Your badge is ready with a labeled image placeholder.' : 'Your badge is ready to save or share.';
    $('share').disabled = false; $('download').disabled = false;
  } catch { if (currentGeneration !== generation) return; $('badge-status').textContent = 'The badge could not be created. Please try again.'; $('retry-badge').hidden = false; }
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
      await navigator.share({ files: [file], title: 'My Bird Explorer discovery', text: `Bird observed: ${selected.commonName}. Possible identification • Not verified.` });
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
