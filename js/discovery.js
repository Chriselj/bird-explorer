// The URL values are stable links; add new discovery areas here.
export const AREAS = Object.freeze({
  'limestone-canyon': 'Limestone Canyon',
  'weir-canyon': 'Weir Canyon',
  'agua-chinon': 'Agua Chinon',
  'red-rock': 'Red Rock Wilderness',
  'gypsum-canyon': 'Gypsum Canyon',
  saddleback: 'Saddleback Wilderness'
});
export function areaFromSearch(search) {
  const area = new URLSearchParams(search).get('area');
  return Object.hasOwn(AREAS, area) ? area : '';
}
export function locationName(area, other = '') {
  return area === 'other' ? other.trim().slice(0, 100) : (Object.hasOwn(AREAS, area) ? AREAS[area] : '');
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function formatDiscoveryDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day); date.setHours(12, 0, 0, 0);
  if (year < 1 || localDate(date) !== value) return '';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
