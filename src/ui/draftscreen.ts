/**
 * The draft screen — two phases, with a reveal between them.
 *
 * Phase 1: you commit an opening of three, blind.
 * Reveal:  both openings turn face up.
 * Phase 2: you lock in six reinforcements knowing what they opened with, and they lock in theirs
 *          knowing what you opened with.
 *
 * This is the fix for a real flaw. Because relations resolve only within a pantheon, whether combat
 * modifiers fire at all is a joint outcome of both decks — neither side decides it alone. Drafting
 * blind made that a coin toss and left mixed decks strictly worse than pure ones. Revealing turns it
 * into a read, and makes what you choose to show first a decision in its own right.
 */

import {
  OPENING_SIZE,
  REINFORCEMENT_SIZE,
  draftOpening,
  draftReinforcements,
  pantheonsOf,
} from '../sim/draft';
import { MODIFIER_COLORS } from '../sim/constants';
import { resolveAuras, resolveCombat } from '../sim/relations';
import { createRng } from '../sim/rng';
import type { Deity, DeityId, Pantheon, RelationGraph, Tier } from '../sim/types';
import { getSettings, setSetting } from './settings';

const TIER_ORDER: readonly Tier[] = ['chaff', 'demigod', 'god', 'titan'];

const PANTHEON_LABEL: Readonly<Record<Pantheon, string>> = {
  greek: 'Greek',
  norse: 'Norse',
  egyptian: 'Egyptian',
};

type Phase = 'opening' | 'reinforce';

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className !== undefined) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function styles(): string {
  return `
  #draft-open {
    position: fixed; top: 16px; left: 150px; z-index: 40;
    height: 40px; padding: 0 14px; border-radius: 20px;
    background: #1a1616; color: #a99c85; border: 2px solid #4a4038;
    font: 700 12px ui-sans-serif, system-ui, sans-serif; cursor: pointer;
  }
  #draft-open:hover { border-color: #c9a227; color: #c9a227; }
  #draft-overlay {
    position: fixed; inset: 0; z-index: 55; display: none;
    background: rgba(10,8,8,.9); overflow-y: auto; padding: 22px 16px 60px;
  }
  #draft-overlay.open { display: block; }
  .df-sheet {
    max-width: 1020px; margin: 0 auto; background: #17141a; border: 1px solid #3a3229;
    border-radius: 12px; padding: 22px 26px 26px; color: #e8dcc4;
    font-family: ui-sans-serif, system-ui, sans-serif;
  }
  .df-head { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; flex-wrap: wrap; }
  .df-head h1 { margin: 0; font-size: 24px; }
  .df-step { font-size: 11px; text-transform: uppercase; letter-spacing: .8px; color: #c9a227; font-weight: 700; }
  .df-instruction { margin: 6px 0 0; font-size: 13.5px; color: #a99c85; line-height: 1.55; max-width: 70ch; }
  .df-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .df-btn {
    background: none; border: 1px solid #4a4038; color: #e8dcc4; cursor: pointer;
    border-radius: 6px; padding: 7px 13px; font-size: 12.5px; font-weight: 700; font-family: inherit;
  }
  .df-btn:hover:not(:disabled) { border-color: #c9a227; color: #c9a227; }
  .df-btn:disabled { opacity: .35; cursor: not-allowed; }
  .df-btn.primary { background: #c9a227; color: #17141a; border-color: #c9a227; }
  .df-btn.primary:hover:not(:disabled) { background: #dcb433; color: #17141a; }
  .df-reveal { display: flex; gap: 14px; margin: 16px 0 4px; flex-wrap: wrap; }
  .df-side {
    flex: 1 1 300px; border-radius: 10px; padding: 12px 14px; border: 1px solid #2b2620; background: #1b1720;
  }
  .df-side h3 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: .7px; color: #a99c85; }
  .df-side.enemy { border-color: #4a2620; background: #1e1516; }
  .df-side.enemy h3 { color: #c4442e; }
  .df-openers { display: flex; gap: 7px; flex-wrap: wrap; }
  .df-opener {
    padding: 5px 10px; border-radius: 6px; background: #17141a; border: 1px solid #3a3229; font-size: 12.5px;
  }
  .df-opener b { display: block; font-size: 9.5px; color: #857a68; text-transform: uppercase; letter-spacing: .6px; font-weight: 700; }
  .df-empty { color: #6d6355; font-style: italic; font-size: 12.5px; }
  .df-analysis {
    margin: 14px 0 4px; padding: 12px 15px; border-radius: 10px;
    background: #1b1720; border: 1px solid #2b2620; font-size: 13px; line-height: 1.55; color: #cabfa9;
  }
  .df-verdict { display: block; margin-top: 6px; color: #c9a227; font-weight: 700; }
  .df-bonds { margin: 8px 0 0; padding: 0; list-style: none; }
  .df-bonds li { font-size: 12.5px; padding: 2px 0 2px 10px; border-left: 2px solid #3a3229; margin-top: 3px; }
  .df-group h2 { margin: 20px 0 4px; font-size: 14px; color: #c9a227; border-bottom: 1px solid #3a3229; padding-bottom: 5px; }
  .df-tier { margin: 11px 0 5px; font-size: 10.5px; text-transform: uppercase; letter-spacing: .6px; color: #a99c85; }
  .df-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 7px; }
  .df-card {
    border: 2px solid #3a3229; background: #1a1616; border-radius: 8px; padding: 8px 10px;
    cursor: pointer; transition: border-color .12s, background .12s, transform .12s;
  }
  .df-card:hover:not(.disabled) { transform: translateY(-2px); border-color: #6d6355; }
  .df-card.picked { border-color: #c9a227; background: #241d10; }
  .df-card.opening { border-color: #4fe3e0; background: #10262a; }
  .df-card.disabled { opacity: .35; cursor: not-allowed; transform: none; }
  .df-name { font-weight: 700; font-size: 13px; }
  .df-meta { font-size: 10.5px; color: #a99c85; margin-top: 2px; }
  .df-counter { font-size: 10.5px; margin-top: 3px; color: #c9a227; font-weight: 700; }
  `;
}

/** Bonds between two sets of deities, described for the analysis panel. */
function bondsBetween(
  ours: readonly Deity[],
  theirs: readonly Deity[],
  graph: RelationGraph,
): { text: string; color: string }[] {
  const found: { text: string; color: string }[] = [];
  const seen = new Set<string>();
  for (const a of ours) {
    for (const b of theirs) {
      if (a.id === b.id) continue;
      for (const mod of resolveCombat(a, b, graph)) {
        const key = `${a.id}|${b.id}|${mod.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        found.push({ text: `${a.name} vs ${b.name} — ${mod.name}`, color: MODIFIER_COLORS[mod.name] });
      }
    }
  }
  return found;
}

/** Bonds inside one deck. */
function bondsWithin(deck: readonly Deity[], graph: RelationGraph): { text: string; color: string }[] {
  const found: { text: string; color: string }[] = [];
  const seen = new Set<string>();
  for (const a of deck) {
    for (const b of deck) {
      if (a.id === b.id) continue;
      const mods = [
        ...resolveAuras(a, [b], [b], graph),
        ...resolveCombat(a, b, graph),
      ];
      for (const mod of mods) {
        const key = [a.id, b.id].sort().join('|') + mod.name;
        if (seen.has(key)) continue;
        seen.add(key);
        found.push({ text: `${a.name} & ${b.name} — ${mod.name}`, color: MODIFIER_COLORS[mod.name] });
      }
    }
  }
  return found;
}

/** Builds the draft button and the two-phase draft overlay. */
export function mountDraftScreen(
  roster: readonly Deity[],
  graph: RelationGraph,
  onApply: () => void,
): void {
  if (document.getElementById('draft-open') !== null) return;

  const style = el('style');
  style.textContent = styles();
  document.head.append(style);

  const byId = new Map(roster.map((d) => [d.id, d]));
  const resolve = (ids: readonly DeityId[]): Deity[] =>
    ids.map((id) => byId.get(id)).filter((d): d is Deity => d !== undefined);

  const button = el('button', undefined, '⚔  Draft');
  button.id = 'draft-open';

  const overlay = el('div');
  overlay.id = 'draft-overlay';
  const sheet = el('div', 'df-sheet');
  overlay.append(sheet);

  let phase: Phase = 'opening';
  let opening: DeityId[] = [];
  let reinforcements: DeityId[] = [];
  let enemyOpening: DeityId[] = [];

  const head = el('div', 'df-head');
  const headText = el('div');
  const step = el('div', 'df-step');
  headText.append(el('h1', undefined, 'Draft'), step);
  const instruction = el('p', 'df-instruction');
  const actions = el('div', 'df-actions');
  const advance = document.createElement('button');
  advance.className = 'df-btn primary';
  const restart = el('button', 'df-btn', 'Start over');
  const close = el('button', 'df-btn', 'Close');
  actions.append(restart, advance, close);
  head.append(headText, actions);
  sheet.append(head, instruction);

  const reveal = el('div', 'df-reveal');
  sheet.append(reveal);

  const analysis = el('div', 'df-analysis');
  sheet.append(analysis);

  const gridHost = el('div');
  sheet.append(gridHost);

  const cards = new Map<DeityId, HTMLElement>();

  const picked = (): DeityId[] => (phase === 'opening' ? opening : reinforcements);
  const limit = (): number => (phase === 'opening' ? OPENING_SIZE : REINFORCEMENT_SIZE);

  const refresh = (): void => {
    step.textContent =
      phase === 'opening'
        ? `Step 1 of 2 — your opening (${opening.length}/${OPENING_SIZE})`
        : `Step 2 of 2 — reinforcements (${reinforcements.length}/${REINFORCEMENT_SIZE})`;

    instruction.textContent =
      phase === 'opening'
        ? 'Choose three to open with. These are revealed to your opponent and become your starting hand — so this is also what you are telling them about which family you intend to fight as. They are choosing theirs blind, at the same time.'
        : 'Their opening is face up. Lock in six reinforcements knowing it. Share their pantheon and the relationships cut both ways; go foreign and neither side can use blood against the other, leaving a fight decided by raw statistics.';

    advance.textContent = phase === 'opening' ? 'Reveal openings' : 'Begin battle';
    advance.disabled = picked().length !== limit();

    // ---- reveal panels ----
    reveal.replaceChildren();
    const mine = el('div', 'df-side');
    mine.append(el('h3', undefined, 'Your opening'));
    const mineRow = el('div', 'df-openers');
    if (opening.length === 0) mineRow.append(el('span', 'df-empty', 'nothing committed yet'));
    for (const deity of resolve(opening)) {
      const chip = el('div', 'df-opener');
      chip.append(el('b', undefined, PANTHEON_LABEL[deity.pantheon]));
      chip.append(document.createTextNode(deity.name));
      mineRow.append(chip);
    }
    mine.append(mineRow);

    const theirs = el('div', 'df-side enemy');
    theirs.append(el('h3', undefined, 'Their opening'));
    const theirsRow = el('div', 'df-openers');
    if (phase === 'opening') {
      theirsRow.append(el('span', 'df-empty', 'face down until you commit'));
    } else {
      for (const deity of resolve(enemyOpening)) {
        const chip = el('div', 'df-opener');
        chip.append(el('b', undefined, PANTHEON_LABEL[deity.pantheon]));
        chip.append(document.createTextNode(deity.name));
        theirsRow.append(chip);
      }
    }
    theirs.append(theirsRow);
    reveal.append(mine, theirs);

    // ---- analysis ----
    const deck = resolve([...opening, ...reinforcements]);
    const enemyDeities = resolve(enemyOpening);
    const pantheons = new Set(deck.map((d) => d.pantheon));
    analysis.replaceChildren();

    if (phase === 'opening') {
      const within = bondsWithin(deck, graph);
      analysis.append(
        document.createTextNode(
          `Your opening holds ${within.length} bond${within.length === 1 ? '' : 's'}.`,
        ),
      );
      const verdict = el('span', 'df-verdict');
      verdict.textContent =
        pantheons.size > 1
          ? 'A split opening reveals less about your intentions — and gives you less to build on.'
          : 'A committed opening. Strong, and it tells them exactly where to aim.';
      if (deck.length > 0) analysis.append(verdict);
    } else {
      const against = bondsBetween(deck, enemyDeities, graph);
      const shared = pantheonsOf([...opening, ...reinforcements], roster).filter((p) =>
        pantheonsOf(enemyOpening, roster).includes(p),
      );
      analysis.append(
        document.createTextNode(
          `${against.length} relationship${against.length === 1 ? '' : 's'} would be live between your deck and their opening.`,
        ),
      );
      const verdict = el('span', 'df-verdict');
      verdict.textContent =
        shared.length === 0
          ? 'No shared pantheon. Nothing either of you brings can be turned by blood — this will be settled on statistics alone.'
          : 'You share a pantheon. The graph is live, and it cuts in both directions.';
      analysis.append(verdict);
      if (against.length > 0) {
        const list = el('ul', 'df-bonds');
        for (const bond of against.slice(0, 8)) {
          const li = el('li', undefined, bond.text);
          li.style.borderLeftColor = bond.color;
          list.append(li);
        }
        analysis.append(list);
      }
    }

    // ---- cards ----
    const chosen = picked();
    for (const [id, card] of cards) {
      const inOpening = opening.includes(id);
      const inReinforcements = reinforcements.includes(id);
      card.classList.toggle('opening', inOpening);
      card.classList.toggle('picked', inReinforcements);
      const selectable =
        phase === 'opening' ? !inOpening && chosen.length < limit() : !inOpening && !inReinforcements && chosen.length < limit();
      card.classList.toggle('disabled', !selectable && !inOpening && !inReinforcements);

      // In phase two, mark what each candidate would do against the revealed opening.
      const counter = card.querySelector('.df-counter');
      if (counter instanceof HTMLElement) {
        const deity = byId.get(id);
        if (phase === 'reinforce' && deity !== undefined && enemyDeities.length > 0) {
          const names = new Set<string>();
          for (const enemy of enemyDeities) {
            for (const mod of resolveCombat(deity, enemy, graph)) names.add(mod.name);
          }
          counter.textContent = names.size === 0 ? '' : [...names].join(', ');
        } else {
          counter.textContent = '';
        }
      }
    }
  };

  const toggle = (id: DeityId): void => {
    if (phase === 'opening') {
      const index = opening.indexOf(id);
      if (index >= 0) opening.splice(index, 1);
      else if (opening.length < OPENING_SIZE) opening.push(id);
    } else {
      if (opening.includes(id)) return;
      const index = reinforcements.indexOf(id);
      if (index >= 0) reinforcements.splice(index, 1);
      else if (reinforcements.length < REINFORCEMENT_SIZE) reinforcements.push(id);
    }
    refresh();
  };

  // Build the roster grid once.
  const pantheonList: Pantheon[] = [...new Set(roster.map((d) => d.pantheon))];
  for (const pantheon of pantheonList) {
    const group = el('div', 'df-group');
    group.append(el('h2', undefined, `${PANTHEON_LABEL[pantheon]} pantheon`));
    for (const tier of TIER_ORDER) {
      const units = roster.filter((d) => d.pantheon === pantheon && d.tier === tier);
      if (units.length === 0) continue;
      group.append(el('div', 'df-tier', tier));
      const grid = el('div', 'df-grid');
      for (const deity of units) {
        const card = el('div', 'df-card');
        card.append(el('div', 'df-name', deity.name));
        card.append(el('div', 'df-meta', `${deity.cost} faith · ${deity.hp} hp · ${deity.damage} dmg`));
        card.append(el('div', 'df-counter'));
        card.addEventListener('click', () => toggle(deity.id));
        grid.append(card);
        cards.set(deity.id, card);
      }
      group.append(grid);
    }
    gridHost.append(group);
  }

  const reset = (): void => {
    phase = 'opening';
    opening = [];
    reinforcements = [];
    enemyOpening = [];
    refresh();
  };

  advance.addEventListener('click', () => {
    if (phase === 'opening') {
      // They chose blind, at the same time as you. Seeded so a given session is reproducible.
      enemyOpening = draftOpening(roster, graph, createRng(Date.now() & 0xffff));
      phase = 'reinforce';
      refresh();
      overlay.scrollTo({ top: 0 });
      return;
    }

    const playerDeck = [...opening, ...reinforcements];
    // They answer your opening the same way you answered theirs.
    const enemyReinforcements = draftReinforcements(roster, graph, enemyOpening, opening);
    setSetting('deck', playerDeck);
    setSetting('opponentDeck', [...enemyOpening, ...enemyReinforcements]);
    onApply();
  });

  restart.addEventListener('click', reset);
  close.addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) overlay.classList.remove('open');
  });
  button.addEventListener('click', () => {
    const saved = getSettings().deck;
    if (saved !== null && saved.length > 0) {
      opening = saved.slice(0, OPENING_SIZE);
      reinforcements = saved.slice(OPENING_SIZE);
      enemyOpening = (getSettings().opponentDeck ?? []).slice(0, OPENING_SIZE);
      phase = enemyOpening.length > 0 ? 'reinforce' : 'opening';
    } else {
      reset();
    }
    refresh();
    overlay.classList.add('open');
  });

  refresh();
  document.body.append(button, overlay);
}
