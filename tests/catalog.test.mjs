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
