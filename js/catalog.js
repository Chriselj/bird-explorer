/** Catalog entries are data, never HTML. Paths resolve against the document base. */
export function validateCatalog(data) {
  if (!Array.isArray(data) || !data.length) throw new Error('The species catalog is empty.');
  const codes = new Set();
  for (const bird of data) {
    for (const field of ['code', 'commonName', 'scientificName', 'description', 'image', 'imageCredit', 'imageLicense']) {
      if (typeof bird[field] !== 'string' || !bird[field].trim()) throw new Error(`Invalid species field: ${field}`);
    }
    if (codes.has(bird.code)) throw new Error('Duplicate species code.');
    codes.add(bird.code);
    // Keep all catalog images local, including when deployed under a Pages subpath.
    if (!/^assets\/birds\/[a-z0-9/_-]+\.(?:svg|png|jpe?g|webp)$/i.test(bird.image) || bird.image.includes('..')) throw new Error('Image must be a local bird asset.');
    for (const field of ['focalX', 'focalY']) {
      if (!Number.isFinite(bird[field]) || bird[field] < 0 || bird[field] > 1) throw new Error('Invalid focal point.');
    }
  }
  return data;
}
export async function loadCatalog(url = './data/species.json', fetcher = fetch) {
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`Catalog request failed (${response.status}).`);
  return validateCatalog(await response.json());
}
const normalize = text => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[’‘]/g, "'").toLowerCase();
export function searchSpecies(birds, query) {
  const term = normalize(query.trim());
  return birds.filter(bird => normalize(`${bird.commonName} ${bird.scientificName}`).includes(term));
}
