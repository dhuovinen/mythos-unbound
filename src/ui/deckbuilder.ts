/**
 * Deck builder.
 *
 * Until now the stage handed the player a fixed nine, which meant the stage was choosing their
 * relationships for them — the opposite of the point. This is where the strategic layer lives:
 * which units you bring decides which relationships are available to you at all.
 *
 * The analysis panel is the important part. It counts the bonds inside your own deck and reports
 * how many pantheons you have mixed, because that is the actual trade the game is built around —
 * kin give you synergy and hand the enemy something to exploit, strangers give you numbers that
 * behave exactly as advertised.
 */

import { MODIFIER_COLORS } from '../sim/constants';
import { resolveAuras, resolveCombat } from '../sim/relations';
import type { Deity, DeityId, Edge, Pantheon, RelationGraph, Tier } from '../sim/types';
import { DECK_SIZE, getSettings, setSetting } from './settings';

const TIER_ORDER: readonly Tier[] = ['chaff', 'demigod', 'god', 'titan'];

const PANTHEON_LABEL: Readonly<Record<Pantheon, string>> = {
  greek: 'Greek',
  norse: 'Norse',
  egyptian: 'Egyptian',
};

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className !== undefined) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function styles(): string {
  return `
  #deck-open {
    position: fixed; top: 16px; left: 150px; z-index: 40;
    height: 40px; padding: 0 14px; border-radius: 20px;
    background: #1a1616; color: #a99c85; border: 2px solid #4a4038;
    font: 700 12px ui-sans-serif, system-ui, sans-serif; cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,.5); transition: border-color .15s ease, color .15s ease;
  }
  #deck-open:hover { border-color: #c9a227; color: #c9a227; }
  #deck-overlay {
    position: fixed; inset: 0; z-index: 55; display: none;
    background: rgba(10,8,8,.88); overflow-y: auto; padding: 24px 16px 64px;
  }
  #deck-overlay.open { display: block; }
  .dk-sheet {
    max-width: 1000px; margin: 0 auto; background: #17141a; border: 1px solid #3a3229;
    border-radius: 12px; padding: 24px 28px 28px; color: #e8dcc4;
    font-family: ui-sans-serif, system-ui, sans-serif;
  }
  .dk-head { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; flex-wrap: wrap; }
  .dk-head h1 { margin: 0; font-size: 26px; }
  .dk-count { font-size: 14px; font-weight: 700; color: #c9a227; }
  .dk-count.full { color: #7BB661; }
  .dk-actions { display: flex; gap: 8px; }
  .dk-btn {
    background: none; border: 1px solid #4a4038; color: #e8dcc4; cursor: pointer;
    border-radius: 6px; padding: 7px 13px; font-size: 12.5px; font-weight: 700; font-family: inherit;
  }
  .dk-btn:hover { border-color: #c9a227; color: #c9a227; }
  .dk-btn.primary { background: #c9a227; color: #17141a; border-color: #c9a227; }
  .dk-btn.primary:hover { background: #dcb433; color: #17141a; }
  .dk-quick { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
  .dk-quick-label { font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: #a99c85; }
  .dk-analysis {
    margin: 16px 0 6px; padding: 13px 16px; border-radius: 10px;
    background: #1b1720; border: 1px solid #2b2620; font-size: 13px; line-height: 1.55; color: #cabfa9;
  }
  .dk-analysis b { color: #e8dcc4; }
  .dk-verdict { display: block; margin-top: 7px; color: #c9a227; font-weight: 700; }
  .dk-bonds { margin: 9px 0 0; padding: 0; list-style: none; }
  .dk-bonds li { font-size: 12.5px; padding: 2px 0 2px 10px; border-left: 2px solid #3a3229; margin-top: 4px; }
  .dk-group h2 {
    margin: 22px 0 4px; font-size: 15px; color: #c9a227;
    border-bottom: 1px solid #3a3229; padding-bottom: 5px;
  }
  .dk-tier { margin: 12px 0 5px; font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: #a99c85; }
  .dk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); gap: 8px; }
  .dk-card {
    border: 2px solid #3a3229; background: #1a1616; border-radius: 8px; padding: 9px 11px;
    cursor: pointer; transition: border-color .12s ease, background .12s ease, transform .12s ease;
  }
  .dk-card:hover { transform: translateY(-2px); border-color: #6d6355; }
  .dk-card.picked { border-color: #c9a227; background: #241d10; }
  .dk-card.disabled { opacity: .4; cursor: not-allowed; transform: none; }
  .dk-name { font-weight: 700; font-size: 13.5px; }
  .dk-meta { font-size: 11px; color: #a99c85; margin-top: 2px; }
  .dk-rel { font-size: 11px; color: #857a68; margin-top: 4px; }
  `;
}

/** Every relationship that exists between two members of a chosen deck. */
function internalBonds(
  deck: readonly Deity[],
  graph: RelationGraph,
): { text: string; color: string }[] {
  const bonds: { text: string; color: string }[] = [];
  const seen = new Set<string>();

  for (const a of deck) {
    for (const b of deck) {
      if (a.id === b.id) continue;
      const key = [a.id, b.id].sort().join('|');
      const mods = [
        ...resolveCombat(a, b, graph),
        ...resolveAuras(a, [b], [b], graph),
        ...resolveAuras(b, [a], [a], graph),
      ];
      for (const mod of mods) {
        const tag = `${key}|${mod.name}`;
        if (seen.has(tag)) continue;
        seen.add(tag);
        bonds.push({ text: `${a.name} & ${b.name} — ${mod.name}`, color: MODIFIER_COLORS[mod.name] });
      }
    }
  }
  return bonds;
}

/** Builds the deck-builder button and overlay. `onApply` receives the new deck. */
export function mountDeckBuilder(
  roster: readonly Deity[],
  graph: RelationGraph,
  defaultDeck: readonly DeityId[],
  onApply: (deck: DeityId[]) => void,
): void {
  if (document.getElementById('deck-open') !== null) return;

  const style = el('style');
  style.textContent = styles();
  document.head.append(style);

  const button = el('button', undefined, '☰  Deck');
  button.id = 'deck-open';

  const overlay = el('div');
  overlay.id = 'deck-overlay';
  const sheet = el('div', 'dk-sheet');
  overlay.append(sheet);

  let chosen: DeityId[] = [...(getSettings().deck ?? defaultDeck)];

  const head = el('div', 'dk-head');
  const headText = el('div');
  headText.append(el('h1', undefined, 'Build your deck'));
  const count = el('div', 'dk-count');
  headText.append(count);
  const actions = el('div', 'dk-actions');
  const reset = el('button', 'dk-btn', 'Reset to stage default');
  const apply = el('button', 'dk-btn primary', 'Apply & restart battle');
  const close = el('button', 'dk-btn', 'Close');
  actions.append(reset, apply, close);
  head.append(headText, actions);
  sheet.append(head);

  // Quick-pick: commit to a single pantheon, or clear and mix by hand. The whole strategic axis is
  // this decision, so it should take one click rather than nine.
  const quick = el('div', 'dk-quick');
  quick.append(el('span', 'dk-quick-label', 'Fill with'));
  const allPantheons: Pantheon[] = [...new Set(roster.map((d) => d.pantheon))];
  for (const pantheon of allPantheons) {
    const pick = el('button', 'dk-btn', PANTHEON_LABEL[pantheon]);
    pick.addEventListener('click', () => {
      // Spread across tiers rather than taking the cheapest nine, so a one-click deck is playable.
      const pool = roster.filter((d) => d.pantheon === pantheon);
      const byTier = TIER_ORDER.map((tier) => pool.filter((d) => d.tier === tier));
      const picked: DeityId[] = [];
      let round = 0;
      while (picked.length < DECK_SIZE && round < 12) {
        for (const group of byTier) {
          const next = group[round];
          if (next !== undefined && picked.length < DECK_SIZE) picked.push(next.id);
        }
        round++;
      }
      chosen = picked;
      refresh();
    });
    quick.append(pick);
  }
  const clear = el('button', 'dk-btn', 'Clear');
  clear.addEventListener('click', () => {
    chosen = [];
    refresh();
  });
  quick.append(clear);
  sheet.append(quick);

  const analysis = el('div', 'dk-analysis');
  sheet.append(analysis);

  const gridHost = el('div');
  sheet.append(gridHost);

  const cards = new Map<DeityId, HTMLElement>();

  const refresh = (): void => {
    count.textContent = `${chosen.length} of ${DECK_SIZE} chosen`;
    count.classList.toggle('full', chosen.length === DECK_SIZE);

    for (const [id, card] of cards) {
      const picked = chosen.includes(id);
      card.classList.toggle('picked', picked);
      card.classList.toggle('disabled', !picked && chosen.length >= DECK_SIZE);
    }

    const deck = chosen
      .map((id) => roster.find((d) => d.id === id))
      .filter((d): d is Deity => d !== undefined);

    const pantheons = new Set(deck.map((d) => d.pantheon));
    const bonds = internalBonds(deck, graph);

    analysis.replaceChildren();
    const summary = el('div');
    summary.append(document.createTextNode('Your deck holds '));
    summary.append(el('b', undefined, `${bonds.length} bond${bonds.length === 1 ? '' : 's'}`));
    summary.append(document.createTextNode(' between its own members, drawn from '));
    summary.append(
      el('b', undefined, [...pantheons].map((p) => PANTHEON_LABEL[p]).join(' and ') || 'nothing yet'),
    );
    summary.append(document.createTextNode('.'));
    analysis.append(summary);

    const verdict = el('span', 'dk-verdict');
    if (deck.length === 0) {
      verdict.textContent = 'Pick some units.';
    } else if (pantheons.size > 1) {
      verdict.textContent =
        'Mixed pantheons. Your foreign units cannot be counter-picked by blood — and cannot be helped by it either. Predictable, and nobody’s leverage.';
    } else if (bonds.length >= 6) {
      verdict.textContent =
        'Densely related. Strong together, but every one of those ties is something the enemy can turn against you.';
    } else {
      verdict.textContent =
        'One pantheon, loosely tied. Few relationships to exploit, and few for the enemy to exploit back.';
    }
    analysis.append(verdict);

    if (bonds.length > 0) {
      const list = el('ul', 'dk-bonds');
      for (const bond of bonds.slice(0, 8)) {
        const li = el('li', undefined, bond.text);
        li.style.borderLeftColor = bond.color;
        list.append(li);
      }
      analysis.append(list);
    }
  };

  const toggle = (id: DeityId): void => {
    const index = chosen.indexOf(id);
    if (index >= 0) chosen.splice(index, 1);
    else if (chosen.length < DECK_SIZE) chosen.push(id);
    refresh();
  };

  // Build the roster grid, grouped by pantheon then tier.
  const pantheons: Pantheon[] = [...new Set(roster.map((d) => d.pantheon))];
  for (const pantheon of pantheons) {
    const group = el('div', 'dk-group');
    group.append(el('h2', undefined, `${PANTHEON_LABEL[pantheon]} pantheon`));

    for (const tier of TIER_ORDER) {
      const units = roster.filter((d) => d.pantheon === pantheon && d.tier === tier);
      if (units.length === 0) continue;
      group.append(el('div', 'dk-tier', tier));

      const grid = el('div', 'dk-grid');
      for (const deity of units) {
        const card = el('div', 'dk-card');
        card.append(el('div', 'dk-name', deity.name));
        card.append(el('div', 'dk-meta', `${deity.cost} faith · ${deity.hp} hp · ${deity.damage} dmg`));

        const relCount = graph.edges.filter((e: Edge) => e.from === deity.id || e.to === deity.id).length;
        card.append(
          el('div', 'dk-rel', relCount === 0 ? 'no relationships' : `${relCount} relationships`),
        );

        card.addEventListener('click', () => toggle(deity.id));
        grid.append(card);
        cards.set(deity.id, card);
      }
      group.append(grid);
    }
    gridHost.append(group);
  }

  const setOpen = (open: boolean): void => {
    overlay.classList.toggle('open', open);
    if (open) {
      chosen = [...(getSettings().deck ?? defaultDeck)];
      refresh();
    }
  };

  button.addEventListener('click', () => setOpen(true));
  close.addEventListener('click', () => setOpen(false));
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) setOpen(false);
  });
  reset.addEventListener('click', () => {
    chosen = [...defaultDeck];
    refresh();
  });
  apply.addEventListener('click', () => {
    setSetting('deck', [...chosen]);
    onApply([...chosen]);
    setOpen(false);
  });

  refresh();
  document.body.append(button, overlay);
}
