// Editorial content for the trail prototype; review with local naturalists before release.
export const DEFAULT_PROMPT = 'Pause safely on the trail. Look toward nearby shrubs or trees. Can you hear a bird before you see it?';
export const TRAIL_AREAS = {
  'limestone-canyon': { prompt: 'Pause on the trail and listen across the canyon. Is a call coming from nearby vegetation or farther away?', stewardship: 'Observe from the trail. Give birds in shrubs room to shelter and move freely.' },
  'weir-canyon': { prompt: 'Stand quietly on the trail. Watch the edge of nearby vegetation for movement, then listen for a reply.', stewardship: 'Keep to the trail and leave cover undisturbed for wildlife.' },
  'agua-chinon': { prompt: 'Pause safely and listen. Can you pick out two different bird sounds without moving closer?', stewardship: 'Let wildlife use sheltered places undisturbed. Watch and listen from the trail.' },
  'red-rock': { prompt: 'Look across the landscape from the trail. Do you notice a bird perched above the vegetation or moving low through it?', stewardship: 'Enjoy the view from the trail and give perched birds space.' },
  'gypsum-canyon': { prompt: 'Take a quiet moment on the trail. Look for a small movement against the still landscape.', stewardship: 'Stay on the trail and avoid approaching birds for a closer photograph.' },
  saddleback: { prompt: 'Pause safely on the trail. Scan from nearby shrubs to the open sky. Where do you notice movement first?', stewardship: 'Watch from a distance and allow birds to continue feeding or resting.' }
};
export const CLUES = {
  all: 'Show all birds', ground: 'On the ground', vegetation: 'In shrubs or trees',
  air: 'Flying or hovering', heard: 'I heard it'
};
export const FIELD_GUIDE = {
  WREN: { clues:['vegetation','heard'], look:'A small, long-tailed bird moving through dense shrubs.', notice:'Listen for a series of notes that speeds up like a bouncing ball.', habitat:'Dense scrub gives this often-hidden bird cover.', page:'Wrentit' },
  CALT: { clues:['ground','vegetation','heard'], look:'Warm brown plumage with a cinnamon patch beneath the tail.', notice:'Watch for hopping and scratching through leaf litter.', habitat:'Leaf litter beneath shrubs provides places to forage.', page:'California_Towhee' },
  SPTO: { clues:['ground','vegetation','heard'], look:'Spotted wings and rusty sides.', notice:'Watch for a two-footed backward hop that flicks leaves aside.', habitat:'The sheltered ground beneath shrubs is a feeding place.', page:'Spotted_Towhee' },
  CASJ: { clues:['ground','vegetation','air','heard'], look:'A blue-and-gray jay perched in the open or moving between trees.', notice:'Watch where it carries food; scrub-jays store food for later.', habitat:'Oak woodlands offer acorns to collect and cache.', page:'California_Scrub-Jay' },
  ANHU: { clues:['vegetation','air','heard'], look:'A tiny bird hovering or perched; a male’s head can flash rosy pink.', notice:'Watch for hovering near flowers without approaching.', habitat:'Flowers provide nectar for this hummingbird.', page:'Annas_Hummingbird' }
};
export const DEFAULT_STEWARDSHIP = 'Watch from the trail. Let birds approach or move away freely, and leave sheltered vegetation undisturbed.';
export function fieldNote(value = '') { return value.replace(/\s+/g, ' ').trim().slice(0, 80); }
export function encounterLabel(value) { return ({seen:'Seen',heard:'Heard',both:'Seen and heard'})[value] || ''; }
export function matchesClue(bird, clue) { return clue === 'all' || (FIELD_GUIDE[bird.code]?.clues || []).includes(clue); }
