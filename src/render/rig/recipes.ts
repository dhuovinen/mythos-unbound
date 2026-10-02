/** Full biped roster, authored over the shared parts library. Creature bodies live in figures.ts. */
import { EGYPTIAN_DEITIES } from '../../data/egyptian';
import { GREEK_DEITIES } from '../../data/greek';
import { NORSE_DEITIES } from '../../data/norse';
import { makeBiped } from './compose';
import type { BipedSpec } from './compose';
import { RIG_THEMES } from './themes';

type Look = Partial<Omit<BipedSpec, 'id' | 'name' | 'tier'>>;
const slender = { bulk: 0.86, legs: 1.08, hunch: 0.02, head: 0.96 };
const heavy = { bulk: 1.5, legs: 0.9, hunch: 0.07, head: 1.08 };
const regal = { bulk: 1.12, legs: 1.04, hunch: 0.015, head: 1.05 };

/** Explicit entries keep missing roster art visible in the coverage test. */
export const BIPED_LOOKS: Readonly<Record<string, Look>> = {
  hoplite: { gear: ['corinthian'], body: ['tunic', 'cuirass', 'greaves'], weapon: 'spear', offhand: 'shieldRound', attack: 'thrust' },
  satyr: { gear: ['horns'], body: ['pelt', 'belt'], weapon: 'club', beard: 'pointed', build: { bulk: 0.85, legs: 0.87, hunch: 0.12, head: 1 }, tones: { skin: '#ad9581', hair: '#51423b' } },
  heracles: { build: heavy, gear: ['lionPelt'], body: ['pelt', 'belt'], weapon: 'club', beard: 'short', attack: 'overhead' },
  perseus: { gear: ['helmWinged'], body: ['tunic', 'cuirass'], weapon: 'harpe', offhand: 'mirror', behind: ['cape'] },
  achilles: { gear: ['crestedHelm'], body: ['cuirass', 'greaves'], weapon: 'spear', offhand: 'shieldRound', attack: 'thrust', build: regal },
  asclepius: { body: ['robe'], weapon: 'serpentStaff', beard: 'long', hair: 'long', attack: 'cast', build: slender },
  orpheus: { gear: ['laurel'], body: ['chiton'], weapon: 'lyre', hair: 'long', attack: 'cast', build: slender },
  dionysus: { gear: ['laurel'], body: ['chiton', 'pelt'], weapon: 'thyrsus', hair: 'long', attack: 'cast', tones: { cloth2: '#74425d' } },
  aeneas: { gear: ['crestedHelm'], body: ['cuirass', 'greaves'], behind: ['cape'], weapon: 'sword', offhand: 'shieldKite' },
  zeus: { build: { bulk: 1.3, legs: 0.96, hunch: 0.03, head: 1.12 }, body: ['chiton', 'aegis'], beard: 'swept', hair: 'long', weapon: 'bolt', attack: 'overhead', rest: 0.5, tones: { hair: '#d3cab4' } },
  hera: { build: regal, gear: ['crown'], hair: 'long', body: ['robe'], behind: ['cape'], weapon: 'staff', attack: 'cast' },
  poseidon: { build: heavy, beard: 'long', hair: 'long', body: ['chiton'], weapon: 'trident', attack: 'thrust', tones: { cloth2: '#566979', hair: '#8b9ca3' } },
  hades: { gear: ['crown'], beard: 'pointed', body: ['robe'], behind: ['hoodCloak'], weapon: 'bident', attack: 'thrust', tones: { cloth: '#34313d', hair: '#393541' } },
  athena: { gear: ['corinthian'], body: ['chiton', 'aegis', 'greaves'], weapon: 'spear', offhand: 'aegisShield', attack: 'thrust' },
  ares: { build: heavy, gear: ['crestedHelm'], body: ['cuirass', 'greaves'], behind: ['cape'], weapon: 'sword', offhand: 'shieldRound', tones: { cloth: '#633b41' } },
  aphrodite: { build: slender, hair: 'long', gear: ['laurel'], body: ['chiton'], weapon: 'rose', offhand: 'mirror', attack: 'cast', tones: { cloth: '#c5a9b0', hair: '#8f645f' } },
  hephaestus: { build: { bulk: 1.45, legs: 0.83, hunch: 0.2, head: 1 }, body: ['tunic', 'apron'], beard: 'short', gear: ['cap'], weapon: 'forgeHammer', attack: 'overhead', tones: { cloth: '#66524d' } },
  apollo: { build: slender, gear: ['laurel'], hair: 'short', body: ['chiton'], weapon: 'bow', offhand: 'quiver', attack: 'shoot', tones: { hair: '#b9aa8d' } },
  artemis: { build: slender, gear: ['crescent'], hair: 'braid', body: ['tunic', 'belt'], weapon: 'bow', offhand: 'quiver', attack: 'shoot', tones: { cloth: '#6e7b71' } },
  cronus: { build: { bulk: 1.75, legs: 0.92, hunch: 0.32, head: 1 }, gear: ['hood'], behind: ['hoodCloak'], body: ['rags'], weapon: 'sickle', eyes: '#c4442e', tones: { skin: '#b9b09c', cloth: '#26242c' }, rest: 0.3 },

  einherjar: { gear: ['helmViking'], body: ['tunic', 'bandolier'], weapon: 'axe', offhand: 'shieldViking', beard: 'short', attack: 'overhead' },
  draugr: { head: 'skull', gear: ['helmViking'], body: ['rags', 'pauldron'], weapon: 'axe', eyes: '#90b5b6', build: { bulk: 1.1, legs: 0.96, hunch: 0.22, head: 1 } },
  valkyrie: { build: slender, gear: ['helmWinged'], hair: 'braid', behind: ['wings'], body: ['cuirass', 'tunic'], weapon: 'spear', offhand: 'shieldKite', attack: 'thrust' },
  sigurd: { gear: ['helmViking'], body: ['cuirass', 'bandolier'], behind: ['cape'], weapon: 'longsword', hair: 'short', attack: 'overhead' },
  vidar: { build: heavy, body: ['tunic', 'pelt', 'greaves'], weapon: 'longsword', beard: 'short' },
  brynhildr: { gear: ['helmWinged'], hair: 'braid', body: ['cuirass', 'greaves'], weapon: 'spear', offhand: 'shieldKite', attack: 'thrust' },
  hodr: { gear: ['hood'], body: ['tunic'], weapon: 'bow', attack: 'shoot', behind: ['hoodCloak'] },
  vali: { build: slender, hair: 'short', body: ['tunic', 'bandolier'], weapon: 'bow', offhand: 'quiver', attack: 'shoot' },
  magni: { build: { ...heavy, bulk: 1.7 }, body: ['tunic', 'pauldron'], weapon: 'hammer', beard: 'short', attack: 'overhead' },
  skadi: { build: slender, gear: ['hood'], hair: 'braid', body: ['pelt', 'tunic'], behind: ['hoodCloak'], weapon: 'bow', offhand: 'quiver', attack: 'shoot', tones: { cloth: '#a8b2b3' } },
  odin: { gear: ['hat'], beard: 'long', hair: 'long', body: ['robe'], behind: ['cloak'], weapon: 'spear', attack: 'thrust', tones: { hair: '#c6c6bf' } },
  thor: { build: heavy, gear: ['helmWinged'], beard: 'braided', body: ['tunic', 'pauldron'], behind: ['cloak'], weapon: 'hammer', attack: 'overhead', rest: 0.75, tones: { hair: '#8c4436' } },
  loki: { build: slender, gear: ['helmHorned'], body: ['tunic', 'belt'], behind: ['cape'], weapon: 'dagger', hair: 'long', tones: { cloth: '#52655c', cloth2: '#3e414c' } },
  baldr: { build: regal, gear: ['laurel'], body: ['tunic', 'cuirass'], weapon: 'sword', hair: 'long', tones: { cloth: '#c4cecd', hair: '#c9bca3' } },
  frigg: { build: regal, gear: ['crown'], hair: 'braid', body: ['robe'], behind: ['cloak'], weapon: 'spindle', attack: 'cast' },
  freyja: { build: slender, gear: ['crown'], hair: 'long', body: ['robe', 'collar'], behind: ['cloak'], weapon: 'staff', attack: 'cast', tones: { cloth: '#735460', hair: '#baa48c' } },
  freyr: { build: regal, hair: 'short', body: ['tunic', 'belt'], behind: ['cape'], weapon: 'sword', tones: { cloth: '#637464' } },
  tyr: { build: heavy, gear: ['helmViking'], body: ['cuirass', 'tunic'], weapon: 'longsword', beard: 'short', offhand: undefined },
  heimdall: { build: regal, gear: ['helmWinged'], beard: 'braided', body: ['cuirass', 'bandolier'], weapon: 'horn', attack: 'cast', tones: { cloth: '#b8c0bb' } },
  njord: { build: regal, beard: 'long', hair: 'long', body: ['robe', 'belt'], weapon: 'trident', attack: 'thrust', tones: { cloth: '#49646e' } },

  medjay: { gear: ['nemes'], body: ['shendyt', 'collar'], weapon: 'spear', attack: 'thrust', offhand: 'shieldKite' },
  shabti: { head: 'human', gear: ['nemes'], body: ['wraps'], weapon: 'crook', attack: 'overhead', tones: { skin: '#a1a3a1', cloth: '#b6b1a4' }, build: { bulk: 0.9, legs: 0.92, hunch: 0.02, head: 1 } },
  anubis: { build: slender, head: 'jackal', body: ['kilt', 'collar'], weapon: 'was', attack: 'thrust', view: { x: -26, y: -125, w: 78, h: 80 } },
  wepwawet: { head: 'wolf', body: ['shendyt', 'collar'], weapon: 'spear', attack: 'thrust', tones: { fur: '#93969b' } },
  imhotep: { build: slender, gear: ['cap'], body: ['robe'], weapon: 'scroll', attack: 'cast' },
  nefertem: { build: regal, gear: ['lotus'], body: ['shendyt', 'collar'], weapon: 'staff', attack: 'cast' },
  maahes: { build: heavy, head: 'lion', gear: ['sundisc'], body: ['kilt', 'collar'], weapon: 'khopesh', tones: { fur: '#a48d78' } },
  bes: { build: { bulk: 1.6, legs: 0.65, hunch: 0.06, head: 1.28 }, head: 'lion', gear: ['feathers'], body: ['kilt', 'belt'], weapon: 'dagger', offhand: 'shieldRound', tones: { fur: '#8c7669' } },
  khonsu: { build: slender, gear: ['crescent'], body: ['wraps', 'collar'], weapon: 'crook', attack: 'cast' },
  ra: { build: regal, head: 'falcon', gear: ['sundisc'], body: ['shendyt', 'collar'], weapon: 'was', attack: 'cast' },
  osiris: { build: regal, gear: ['atef'], body: ['wraps', 'collar'], weapon: 'crook', attack: 'cast', tones: { skin: '#829d95' }, view: { x: -32, y: -139, w: 64, h: 89 } },
  isis: { build: slender, gear: ['throne'], hair: 'long', body: ['robe', 'collar'], behind: ['wings'], weapon: 'ankh', attack: 'cast' },
  set: { build: heavy, head: 'setbeast', body: ['shendyt', 'collar'], weapon: 'was', attack: 'overhead', tones: { fur: '#725051' } },
  horus: { build: regal, head: 'falcon', gear: ['nemes'], body: ['kilt', 'collar', 'cuirass'], weapon: 'khopesh', behind: ['wings'] },
  nephthys: { build: slender, gear: ['temple'], hair: 'long', body: ['robe', 'collar'], behind: ['cape'], weapon: 'ankh', attack: 'cast', tones: { cloth: '#8c8292' } },
  thoth: { build: slender, head: 'ibis', body: ['shendyt', 'collar'], weapon: 'scroll', attack: 'cast' },
  hathor: { build: regal, gear: ['cowhorns'], hair: 'long', body: ['robe', 'collar'], weapon: 'sistrum', attack: 'cast' },
  sekhmet: { build: heavy, head: 'lion', gear: ['sundisc'], body: ['robe', 'collar'], weapon: 'khopesh', tones: { fur: '#ae8d77', cloth2: '#884b4f' } },
  ptah: { build: { bulk: 1.25, legs: 0.88, hunch: 0.015, head: 1 }, gear: ['cap'], body: ['wraps', 'collar'], weapon: 'was', beard: 'pointed', attack: 'cast', tones: { cloth: '#b7c0bc' } },
};

const built = [...GREEK_DEITIES, ...NORSE_DEITIES, ...EGYPTIAN_DEITIES]
  .filter((deity) => Object.hasOwn(BIPED_LOOKS, deity.id))
  .map((deity) => {
    const theme = RIG_THEMES[deity.pantheon];
    const look = BIPED_LOOKS[deity.id];
    return makeBiped({
      id: deity.id, name: deity.name, tier: deity.tier,
      build: { bulk: 1, legs: 1, hunch: 0.03, head: 1 },
      limb: theme.tones.skin ?? '#d2c6b4', skin: theme.tones.cloth ?? '#4a4850',
      head: 'human', attack: 'sweep', rest: 0.1,
      ...look, tones: { ...theme.tones, ...look.tones }, motion: theme.motion,
    });
  });

export const RECIPES = built.map((b) => b.recipe);
export const BIPED_FIGURES = built.map((b) => b.figure);
