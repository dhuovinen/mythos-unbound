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
};

/** Backstory for a specific pairing, falling back to the relation kind. */
export function pairLore(from: DeityId, to: DeityId, kind: RelationKind): string {
  return PAIR_LORE[`${from}|${to}`] ?? PAIR_LORE[`${to}|${from}`] ?? KIND_LORE[kind];
}

/** A one-line characterisation of a unit. */
export function unitLore(id: DeityId): string {
  return UNIT_LORE[id] ?? 'An unknown quantity.';
}
