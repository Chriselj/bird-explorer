import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { validateCatalog, searchSpecies, loadCatalog } from '../js/catalog.js';
import { coverCrop } from '../js/badge.js';
const birds = JSON.parse(await readFile(new URL('../data/species.json', import.meta.url)));
test('sample catalog validates and each local image exists', async () => {
  assert.equal(validateCatalog(birds).length, 5);
  for (const bird of birds) await access(new URL(`../${bird.image}`, import.meta.url));
});
test('search matches common/scientific names and normalized apostrophes', () => {
  assert.equal(searchSpecies(birds, 'towhee').length, 2);
  assert.equal(searchSpecies(birds, ' CALYPTE ANNA ')[0].code, 'ANHU');
  assert.equal(searchSpecies(birds, "Anna's")[0].code, 'ANHU');
  assert.equal(searchSpecies(birds, 'penguin').length, 0);
});
test('loader handles successful, HTTP, and malformed catalog responses', async () => {
  assert.equal((await loadCatalog('test', async () => ({ok:true,json:async()=>birds}))).length, 5);
  await assert.rejects(loadCatalog('test', async () => ({ok:false,status:404})), /404/);
  await assert.rejects(loadCatalog('test', async () => ({ok:true,json:async()=>[]})), /empty/);
  assert.throws(() => validateCatalog([...birds, birds[0]]), /Duplicate/);
  assert.throws(() => validateCatalog([{...birds[0], image:'https://example.com/a.jpg'}]), /local/);
});
test('crop uses focal coordinates and never draws outside source bounds', () => {
  assert.deepEqual(coverCrop(2000,1000,1000,1000,1,.5), {sx:1000,sy:0,sw:1000,sh:1000});
  assert.equal(coverCrop(1000,2000,1000,1000,.5,0).sy, 0);
  assert.equal(coverCrop(1000,2000,1000,1000,.5,1).sy, 1000);
});

const { AREAS, areaFromSearch, locationName, localDate, formatDiscoveryDate } = await import('../js/discovery.js');
test('URL defaults recognize only supported area keys', () => {
  for (const key of Object.keys(AREAS)) assert.equal(areaFromSearch(`?area=${key}`), key);
  for (const search of ['', '?area=unknown', '?area=other', '?area=constructor', '?area=__proto__']) assert.equal(areaFromSearch(search), '');
  assert.equal(locationName('weir-canyon'), 'Weir Canyon');
  assert.equal(locationName('other', '  My park  '), 'My park');
  assert.equal(locationName('', 'My park'), '');
  assert.equal(locationName('other', 'x'.repeat(120)).length, 100);
});
test('discovery dates use local components and validate calendar dates', () => {
  assert.equal(localDate(new Date(2026, 10, 5, 23, 59)), '2026-11-05');
  assert.equal(formatDiscoveryDate('2026-11-05'), 'November 5, 2026');
  assert.equal(formatDiscoveryDate('2024-02-29'), 'February 29, 2024');
  for (const value of ['', '2026-02-29', '2026-13-01', '2026-04-31', '0000-01-01']) assert.equal(formatDiscoveryDate(value), '');
});
