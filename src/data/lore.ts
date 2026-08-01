/**
 * Mythological flavour for the strategy consultant.
 *
 * Pure content — no logic, no numbers. The consultant speaks qualitatively by default, and the
 * quantification toggle appends figures the rules layer supplies separately. Keeping the two apart
 * is deliberate: the prose should read the same whether or not the player wants the arithmetic.
 */

import type { DeityId, RelationKind } from '../sim/types';

/** Lore for a specific pairing, keyed `${from}|${to}` in the direction the edge is stored. */
const PAIR_LORE: Readonly<Record<string, string>> = {
  'cronus|zeus':
    'Cronus swallowed each of his children at birth to outrun a prophecy that one would unseat him. Zeus was hidden away, grew up, and cut the others free. He does not hesitate against them the way a father would — he never saw them as children, only as the prophecy.',
  'cronus|hera':
    'She was swallowed at birth like the rest, and came back out of him full-grown. Whatever he feels for her, it is not tenderness.',
  'cronus|poseidon':
    'Another child devoured, another returned. Poseidon fights the Titan who ate him with the particular clarity that gives a man.',
  'cronus|hades':
    'The eldest swallowed, the last disgorged. Hades has had a long time to think about it.',
  'hera|heracles':
    'She sent serpents to his cradle and madness to his hall, and named his labours after herself out of spite. He survived every one of it. Neither has forgotten.',
  'hera|dionysus':
    'She drove him mad and scattered him across the world for the crime of being born. He came back wearing vines and laughing.',
  'ares|aphrodite':
    'Hephaestus caught them in a net of chains too fine to see and called the gods in to look. They were humiliated in front of all Olympus and it changed nothing.',
  'aphrodite|hephaestus':
    'The most beautiful of the gods, married off to the one they threw from the mountain. He forged her jewellery. She was not faithful.',
  'asclepius|zeus':
    'He got so good at medicine that he started raising the dead, and the dead are not supposed to come back. Zeus killed him with a thunderbolt to close the loophole.',
  'achilles|apollo':
    'The arrow was in Paris’s hand, but the god guided it to the one part of him the river had not touched.',
  'apollo|artemis':
    'Twins, born on the same floating island to the same hunted mother. The sun and the moon, and neither will be second.',
  'zeus|typhon':
    'The last thing Gaia made, to unmake Olympus. A hundred serpent heads and a voice like every animal at once. Zeus buried it under a volcano and it is still moving.',
  'zeus|athena':
    'She came out of his skull fully armoured, and she is the only one of his children he has never once been wary of.',
  'zeus|hera':
    'Brother and sister, husband and wife, and neither arrangement has ever been peaceful.',
  'hera|hephaestus':
    'She bore him alone and threw him off the mountain for being imperfect. He landed badly. He has been building things ever since.',
  'aphrodite|aeneas':
    'A goddess’s son by a mortal shepherd. She pulled him out of Troy by the wrist while it burned.',
  'apollo|orpheus':
    'His father gave him the lyre. He played it well enough that stones followed him and Death agreed to negotiate.',
  'zeus|perseus':
    'Fathered in a shower of gold through the roof of a locked bronze room, because a prophecy said the son would kill the grandfather.',
  'athena|ares':
    'Both of them are war. She is the plan and the shield wall; he is the noise and the red mist. They have never once agreed.',
  'apollo|dionysus':
    'The clear line and the blurred one. Order against ecstasy, at the same shrine, in alternating seasons.',

  // ---- Norse ----
  'odin|thor':
    'The All-Father spent his life reading the prophecy of the end and trying to bargain with it. His son simply intended to hit it. Neither approach worked.',
  'odin|loki':
    'They swore blood-brotherhood, and Odin will not drink unless Loki is served too. It did not stop Loki engineering the death of everything Odin loved.',
  'odin|fenrir':
    'He raised the wolf inside the gods’ own hall and watched it grow, knowing exactly what it was going to do to him. He fed it anyway.',
  'fenrir|vidar':
    'When the wolf swallows Odin, the silent son steps forward with a boot made of every scrap of leather ever discarded, and tears its jaws apart.',
  'baldr|hodr':
    'Everything in the world swore not to harm Baldr except one small plant nobody thought to ask. Loki put it in his blind brother’s hand and told him where to aim.',
  'hodr|vali':
    'Váli was conceived, born and full-grown inside a single day, for one purpose: to kill the brother who threw the mistletoe. He never washed or combed his hair until it was done.',
  'thor|jormungandr':
    'The serpent circles the world with its own tail in its mouth. Thor kills it at Ragnarök, walks nine paces, and drops dead of its venom.',
  'heimdall|loki':
    'The watchman who can hear grass growing, and the one thing he was always watching for. At the end they kill each other, exactly as everyone knew they would.',
  'loki|baldr':
    'He found the one weakness, aimed the one blind hand, and then blocked the one bargain that would have brought Baldr back. Thoroughness is the only thing Loki is consistent about.',
  'sigurd|brynhildr':
    'He rode through fire to wake her, swore himself to her, and was tricked into forgetting it. When she learned the truth she had him killed and then followed him onto the pyre.',
  'loki|jormungandr':
    'One of three monstrous children he fathered on a giantess. Odin threw this one into the sea, where it did not stop growing.',
  'loki|fenrir':
    'His firstborn by the giantess. The gods raised it themselves rather than let it run loose, which turned out to be the same mistake either way.',
  'njord|skadi':
    'She came to Asgard demanding a husband in weregild for her father, and had to choose one by looking at their feet. She picked the finest pair and got the sea god. She wanted the mountains.',
  'freyja|freyr':
    'Vanir twins given to the Æsir as hostages after the first war between gods. They kept their own magic and never quite became Æsir.',
  'thor|loki':
    'They travel together constantly, and it always ends with Loki causing a catastrophe and Thor solving it with a hammer.',
  'tyr|fenrir':
    'Someone had to put a hand in the wolf’s mouth as surety while the gods bound it, knowing the binding was a trick. Týr volunteered, and paid.',
};

/** Fallback lore per relation kind, used for pairings without a bespoke line. */
const KIND_LORE: Readonly<Record<RelationKind, string>> = {
  parent:
    'Blood runs the wrong way on a battlefield. A parent raising a hand against their own child tends to find the blow lands softer than they meant it to.',
  sibling:
    'They were raised together, which means they know exactly where to hit, and have wanted to for a very long time.',
  spouse:
    'Married. They will fight, because they are on opposite sides, but neither is really trying to finish it.',
  lover:
    'Whatever is between them survives being pointed at each other. They will not fight. They simply stop.',
  slain_by:
    'One of them has already killed the other once. The dead one remembers the details.',
  persecutes:
    'A grudge held from above, and returned from below. Neither is fighting fair, and neither ever has.',
  rival:
    'An old antagonism with nothing familial about it — just two powers that have never fit in the same sky.',
};

/** A short characterisation of each unit, for when the consultant introduces one. */
const UNIT_LORE: Readonly<Record<DeityId, string>> = {
  hoplite: 'A citizen with a shield and a spear and no divine parentage whatsoever. Utterly unbothered by the family drama around him.',
  satyr: 'Cheap, fast, drunk, and entirely expendable. Arrives in numbers.',
  harpy: 'Snatches and runs. Fragile, quick, and irritating to catch.',
  heracles: 'Twelve labours, a lion’s hide, and a lifetime of Hera trying to end him. Very hard to kill.',
  perseus: 'Killed the gorgon by refusing to look at her. Practical, fast, well-equipped.',
  achilles: 'The best fighter on any field he has ever stood on, and the easiest to kill if you know where to aim.',
  asclepius: 'A physician good enough to be executed for it. Mends allies, and carries a grudge against the god who struck him down.',
  orpheus: 'The musician who talked Death into a refund. Fights badly, but stops fights.',
  dionysus: 'Wine, madness, and a god who was born twice. Unpredictable in a way opponents find expensive.',
  aeneas: 'Carried his father out of a burning city on his back. Built to hold a line, not break one.',
  zeus: 'The one who won the war against the Titans and has been holding the sky ever since. Hits like weather.',
  hera: 'Queen of the gods, and the most patient enemy in the pantheon. Her grudges outlive most heroes.',
  poseidon: 'Earth-shaker. Slow, enormous, and difficult to move once he has decided where to stand.',
  hades: 'Rules the dead and is in no hurry. Grinds down anything that stays in front of him.',
  athena: 'War as a discipline rather than an appetite. Armoured, measured, hard to get through.',
  ares: 'War as an appetite. Fast, vicious, and not especially interested in surviving.',
  aphrodite: 'Does not fight so much as make fighting stop happening. Expensive, fragile, and disproportionately dangerous to the right target.',
  hephaestus: 'The smith they threw off the mountain. Slow, armoured, and builds a wall wherever he stands.',
  apollo: 'Strikes from further away than anything else on the field, and heals what he chooses to.',
  artemis: 'The hunt. Long range, quick draw, and nothing to spare if she is caught.',
  cronus: 'The Titan who ate his own children to keep his throne. Nothing about him hesitates.',
  typhon: 'The last thing the earth made to kill the gods. It is not related to anyone, and nothing about it can be reasoned with.',

  // ---- Norse ----
  einherjar: 'A warrior who died well enough to be collected. Fights all day in Valhalla, dies, and gets up for dinner.',
  draugr: 'A corpse that stayed in its barrow and got territorial about it. Slow, heavy, and difficult to put down twice.',
  valkyrie: 'Chooses who dies. Arrives fast, leaves faster, and is not built to be hit.',
  sigurd: 'Killed a dragon, ate its heart, and learned to understand birds. Everything after that went badly.',
  vidar: 'The silent one. Says nothing for the entire mythology and then tears a wolf in half.',
  brynhildr: 'A valkyrie punished with mortality for choosing the wrong man to let win. Still choosing.',
  hodr: 'Blind, and given a weapon by someone who told him exactly where to throw it. He is not the villain of that story, though he pays like one.',
  vali: 'Born, grown and armed inside one day for the sole purpose of revenge. There is nothing else in him.',
  magni: 'Thor’s son, and stronger than Thor at three days old. One of the few things scheduled to survive the end of the world.',
  skadi: 'A giantess who walked into Asgard alone demanding compensation for her father, and got it.',
  odin: 'Traded an eye for one drink of wisdom and hanged himself on the world-tree for the runes. Knows precisely how he dies and does nothing to avoid it.',
  thor: 'The thing standing between everything else and the giants. Enormously strong, not remotely subtle, and entirely reliable.',
  loki: 'Charming, useful, and the direct cause of every disaster in the pantheon including the last one. The gods keep him around anyway.',
  baldr: 'The best of them, invulnerable to everything in the world but one, and killed by exactly that. His death starts the countdown.',
  frigg: 'She extracted a promise from every object in creation not to harm her son, and missed one. She also knows every fate and says nothing.',
  freyja: 'War, gold and desire in one figure. She takes first pick of the slain — before Odin.',
  freyr: 'Gave away his own sword for a giantess he saw once from a distance, and will face the end of the world unarmed because of it.',
  tyr: 'The god of oaths, who gave his sword hand to seal one he knew was a lie. Nobody else would.',
  heimdall: 'Needs less sleep than a bird, sees a hundred leagues, and hears wool growing on a sheep. Waiting for one specific sound.',
  njord: 'God of the sea and of wealth, married into the mountains and could not stand the wolves.',
  fenrir: 'The wolf the gods raised in their own hall because they were afraid to let it out of sight. It is bound with a ribbon made of impossible things, and it will not hold.',
  jormungandr: 'A serpent long enough to encircle the world and bite its own tail. When it lets go, the world ends.',
};

/** Backstory for a specific pairing, falling back to the relation kind. */
export function pairLore(from: DeityId, to: DeityId, kind: RelationKind): string {
  return PAIR_LORE[`${from}|${to}`] ?? PAIR_LORE[`${to}|${from}`] ?? KIND_LORE[kind];
}

/** A one-line characterisation of a unit. */
export function unitLore(id: DeityId): string {
  return UNIT_LORE[id] ?? 'An unknown quantity.';
}
