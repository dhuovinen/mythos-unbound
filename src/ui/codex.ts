/**
 * In-game codex — the "?" panel.
 *
 * Everything here is DERIVED, never hand-written. The roster and relationship listings come from
 * the real data files, and the modifier tables are produced by calling the actual resolver with
 * synthetic pairs and reading back what it returns. That means the documentation cannot drift from
 * the engine: if a multiplier changes in relations.ts, this panel changes with it.
 */

import { MODIFIER_COLORS } from '../sim/constants';
import { buildGraph, resolveAuras, resolveCombat } from '../sim/relations';
import type { Deity, DeityId, Edge, Modifier, RelationKind, Tier } from '../sim/types';

const TIER_LABEL: Readonly<Record<Tier, string>> = {
  chaff: 'Mortals & Monsters',
  demigod: 'Demigods & Heroes',
  god: 'Gods',
  titan: 'Titans',
};

const TIER_ORDER: readonly Tier[] = ['chaff', 'demigod', 'god', 'titan'];

/** Builds a throwaway deity for probing the engine. */
function probe(id: string, over: Partial<Deity> = {}): Deity {
  return {
    id,
    name: id,
    pantheon: 'greek',
    tier: 'god',
    cost: 0,
    hp: 1,
    damage: 1,
    attackInterval: 1,
    range: 1,
    speed: 1,
    armor: 0,
    traits: [],
    ...over,
  };
}

/** Human-readable summary of what a modifier actually does, read off the modifier itself. */
function effectText(mod: Modifier): string {
  if (mod.suppress) return 'Will not attack — both units halt';
  const parts: string[] = [];
  if (mod.damageMult !== 1) parts.push(`${mod.damageMult}× damage`);
  if (mod.attackSpeedMult !== 1) parts.push(`${mod.attackSpeedMult}× attack speed`);
  if (mod.armorMult !== 1) parts.push(`${mod.armorMult}× armour`);
  if (mod.armorPen) parts.push('ignores armour');
  return parts.length > 0 ? parts.join(', ') : 'no stat change';
}

interface DocRow {
  readonly when: string;
  readonly mod: Modifier;
}

/** Probes resolveCombat with one edge of each kind and reads back the real modifiers. */
function combatRows(): DocRow[] {
  const rows: DocRow[] = [];
  const add = (when: string, mods: readonly Modifier[]): void => {
    for (const mod of mods) rows.push({ when, mod });
  };

  const parentGraph = buildGraph([{ from: 'a', to: 'b', kind: 'parent' }]);
  add('You are the parent of your target', resolveCombat(probe('a'), probe('b'), parentGraph));
  add(
    'You are the parent of your target, and a Devourer',
    resolveCombat(probe('a', { traits: ['devourer'] }), probe('b'), parentGraph),
  );
  add('You are the child of your target', resolveCombat(probe('b'), probe('a'), parentGraph));

  const kinds: readonly { kind: RelationKind; forward: string; back?: string }[] = [
    { kind: 'sibling', forward: 'You and your target are siblings' },
    { kind: 'rival', forward: 'You and your target are rivals' },
    { kind: 'spouse', forward: 'You and your target are married' },
    { kind: 'lover', forward: 'You and your target are lovers' },
    { kind: 'slain_by', forward: 'Your target killed you in myth' },
    { kind: 'persecutes', forward: 'You persecute your target', back: 'Your target persecutes you' },
  ];

  for (const entry of kinds) {
    const graph = buildGraph([{ from: 'a', to: 'b', kind: entry.kind }]);
    add(entry.forward, resolveCombat(probe('a'), probe('b'), graph));
    if (entry.back !== undefined) add(entry.back, resolveCombat(probe('b'), probe('a'), graph));
  }
  return rows;
}

/** Probes resolveAuras the same way, for effects between allies. */
function auraRows(): DocRow[] {
  const rows: DocRow[] = [];
  const add = (when: string, mods: readonly Modifier[]): void => {
    for (const mod of mods) rows.push({ when, mod });
  };

  const parent = buildGraph([{ from: 'a', to: 'b', kind: 'parent' }]);
  add('A parent of yours is fighting beside you', resolveAuras(probe('b'), [probe('a')], [probe('a')], parent));

  const sibling = buildGraph([{ from: 'a', to: 'b', kind: 'sibling' }]);
  add('A sibling is fighting beside you', resolveAuras(probe('b'), [probe('a')], [probe('a')], sibling));

  const spouse = buildGraph([{ from: 'a', to: 'b', kind: 'spouse' }]);
  add('Your spouse is fighting beside you', resolveAuras(probe('b'), [probe('a')], [probe('a')], spouse));

  const persecutes = buildGraph([{ from: 'a', to: 'b', kind: 'persecutes' }]);
  add(
    'Your persecutor is fighting beside you',
    resolveAuras(probe('b'), [probe('a')], [probe('a')], persecutes),
  );

  const jealousy = buildGraph([
    { from: 'a', to: 'b', kind: 'spouse' },
    { from: 'a', to: 'c', kind: 'lover' },
  ]);
  add(
    'Your spouse AND your lover are both on the field',
    resolveAuras(probe('a'), [], [probe('b'), probe('c')], jealousy),
  );
  return rows;
}

/** One relationship of a given deity, phrased from that deity's point of view. */
interface RelationLine {
  readonly text: string;
  readonly trigger: string;
}

/**
 * Turns an edge into a sentence from `subject`'s side. Asymmetric kinds are stored one way only,
 * so which end the subject occupies decides both the wording and the modifier it triggers.
 */
function relationLine(edge: Edge, subject: DeityId, nameOf: (id: DeityId) => string): RelationLine | null {
  const isFrom = edge.from === subject;
  const other = nameOf(isFrom ? edge.to : edge.from);

  switch (edge.kind) {
    case 'parent':
      return isFrom
        ? { text: `Parent of ${other}`, trigger: 'Reluctance (Filicide if a Devourer)' }
        : { text: `Child of ${other}`, trigger: 'Usurpation' };
    case 'sibling':
      return { text: `Sibling of ${other}`, trigger: 'Rivalry / Kinship' };
    case 'rival':
      return { text: `Rival of ${other}`, trigger: 'Rivalry' };
    case 'spouse':
      return { text: `Married to ${other}`, trigger: 'Bound / Devoted' };
    case 'lover':
      return { text: `Lover of ${other}`, trigger: 'Entranced / Jealousy' };
    case 'slain_by':
      return isFrom
        ? { text: `Slain by ${other}`, trigger: 'Vengeance' }
        : { text: `Slew ${other}`, trigger: '—' };
    case 'persecutes':
      return isFrom
        ? { text: `Persecutes ${other}`, trigger: 'Wrath' }
        : { text: `Persecuted by ${other}`, trigger: 'Defiance / Resented' };
    default:
      return null;
  }
}

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className !== undefined) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function styles(): string {
  return `
  #codex-open {
    position: fixed; top: 16px; right: 16px; z-index: 40;
    width: 40px; height: 40px; border-radius: 50%;
    background: #1a1616; color: #c9a227; border: 2px solid #c9a227;
    font: 800 20px ui-sans-serif, system-ui, sans-serif; cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,.5); transition: transform .15s ease, background .15s ease;
  }
  #codex-open:hover { transform: scale(1.08); background: #241d10; }
  #codex-overlay {
    position: fixed; inset: 0; z-index: 50; display: none;
    background: rgba(10,8,8,.86); backdrop-filter: blur(3px);
    overflow-y: auto; padding: 24px 16px 64px;
  }
  #codex-overlay.open { display: block; }
  .cx-sheet {
    max-width: 940px; margin: 0 auto; background: #17141a;
    border: 1px solid #3a3229; border-radius: 12px; padding: 28px 30px;
    color: #e8dcc4; font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.55;
  }
  .cx-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .cx-head h1 { margin: 0; font-size: 30px; letter-spacing: .5px; }
  .cx-head p { margin: 4px 0 0; color: #a99c85; font-size: 14px; }
  .cx-close {
    background: none; border: 1px solid #4a4038; color: #e8dcc4; cursor: pointer;
    border-radius: 6px; padding: 6px 12px; font-size: 13px; font-weight: 700;
  }
  .cx-close:hover { border-color: #c9a227; color: #c9a227; }
  .cx-sheet h2 {
    margin: 34px 0 12px; font-size: 19px; color: #c9a227;
    border-bottom: 1px solid #3a3229; padding-bottom: 6px; letter-spacing: .4px;
  }
  .cx-sheet h3 { margin: 22px 0 8px; font-size: 15px; color: #e8dcc4; }
  .cx-sheet p { margin: 8px 0; font-size: 14px; color: #cabfa9; }
  .cx-scroll { overflow-x: auto; }
  .cx-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 460px; }
  .cx-table th, .cx-table td { text-align: left; padding: 7px 10px; border-bottom: 1px solid #2b2620; vertical-align: top; }
  .cx-table th { color: #a99c85; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: .5px; }
  .cx-chip { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 800; font-size: 12px; color: #17141a; }
  .cx-filter {
    width: 100%; margin: 10px 0 4px; padding: 9px 12px; border-radius: 8px;
    background: #0f0d0d; border: 1px solid #3a3229; color: #e8dcc4; font-size: 14px;
  }
  .cx-filter::placeholder { color: #6d6355; }
  .cx-unit { border: 1px solid #2b2620; border-radius: 10px; padding: 14px 16px; margin: 10px 0; background: #1b1720; }
  .cx-unit-head { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
  .cx-unit-head strong { font-size: 16px; }
  .cx-tier { font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: #a99c85; }
  .cx-stats { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 8px 0 0; font-size: 12.5px; color: #a99c85; }
  .cx-stats b { color: #e8dcc4; font-weight: 700; }
  .cx-rel { margin: 10px 0 0; padding: 0; list-style: none; }
  .cx-rel li { font-size: 13px; padding: 3px 0; color: #cabfa9; }
  .cx-rel .t { color: #c9a227; font-weight: 700; }
  .cx-none { color: #6d6355; font-style: italic; font-size: 13px; margin-top: 8px; }
  @media (max-width: 640px) {
    .cx-sheet { padding: 20px 16px; }
    .cx-head h1 { font-size: 24px; }
  }
  `;
}

/** Builds the "?" button and the codex overlay, and wires up open/close. */
export function mountCodex(deities: readonly Deity[], edges: readonly Edge[]): void {
  if (document.getElementById('codex-open') !== null) return;

  const style = el('style');
  style.textContent = styles();
  document.head.append(style);

  const nameOf = (id: DeityId): string => deities.find((d) => d.id === id)?.name ?? id;

  const button = el('button', undefined, '?');
  button.id = 'codex-open';
  button.setAttribute('aria-label', 'Open the codex');

  const overlay = el('div');
  overlay.id = 'codex-overlay';
  const sheet = el('div', 'cx-sheet');
  overlay.append(sheet);

  // ---- header -------------------------------------------------------------
  const head = el('div', 'cx-head');
  const headText = el('div');
  headText.append(el('h1', undefined, 'Mythos Unbound — Codex'));
  headText.append(
    el('p', undefined, 'Every table below is generated from the live game data, not written by hand.'),
  );
  const close = el('button', 'cx-close', 'Close  ✕');
  head.append(headText, close);
  sheet.append(head);

  // ---- how to play --------------------------------------------------------
  sheet.append(el('h2', undefined, 'How to play'));
  sheet.append(
    el(
      'p',
      undefined,
      'Faith accrues automatically. Spend it to summon units from your deck — click a card or press its number key, 1 through 9. Units march down the single lane, stop when an enemy comes into range, and fight. Destroy the enemy base to win; lose yours and the battle is over.',
    ),
  );
  sheet.append(
    el(
      'p',
      undefined,
      'Cost tracks power, and size on the battlefield tracks cost: the smallest silhouettes are cheap mortals, the largest are Titans. Your units are bone-white and advance rightward; the enemy is blood-red and advances left.',
    ),
  );

  // ---- the hook -----------------------------------------------------------
  sheet.append(el('h2', undefined, 'The relational engine'));
  sheet.append(
    el(
      'p',
      undefined,
      'This is what makes Mythos Unbound different from other lane battlers. Units do not simply trade damage — they react to who they are fighting. A father hesitates against his own son. That son strikes back harder than he ever would against a stranger. Lovers refuse to fight at all, and simply stand there. Cronus, who devoured his children, feels no hesitation whatsoever.',
    ),
  );
  sheet.append(
    el(
      'p',
      undefined,
      'Relationships only exist within a pantheon. Fighting across pantheons switches the entire system off and reduces the battle to raw statistics — which is itself a strategic option: bring kin for explosive synergy and exploitable weaknesses, or bring strangers for predictable, un-counterable numbers.',
    ),
  );
  sheet.append(el('h3', undefined, 'Reading the battlefield'));
  sheet.append(
    el(
      'p',
      undefined,
      'Three things tell you the engine is working, and they answer different questions. A coloured tether between two units means a relationship is live between them right now. A floating tag rising off a unit means a modifier just fired on that blow, and the damage number is tinted to match.',
    ),
  );
  sheet.append(
    el(
      'p',
      undefined,
      'Underneath every unit is a row of coloured pips — one per effect currently acting on it, whether from the enemy it is facing or from allies standing close enough to matter. Beneath the pips sits a small caret: pointing up means the unit is currently stronger than its base statistics, pointing down means weaker, and a pause mark means it has stopped fighting altogether. Pip colours match the tables above, so you can read what is happening to any unit at a glance without waiting for it to swing.',
    ),
  );

  const table = (rows: DocRow[], firstHeader: string): HTMLElement => {
    const wrap = el('div', 'cx-scroll');
    const t = el('table', 'cx-table');
    const thead = el('thead');
    const hr = el('tr');
    for (const h of [firstHeader, 'Name', 'Effect']) hr.append(el('th', undefined, h));
    thead.append(hr);
    const tbody = el('tbody');
    for (const row of rows) {
      const tr = el('tr');
      tr.append(el('td', undefined, row.when));
      const nameCell = el('td');
      const chip = el('span', 'cx-chip', row.mod.name);
      chip.style.background = MODIFIER_COLORS[row.mod.name];
      nameCell.append(chip);
      tr.append(nameCell);
      tr.append(el('td', undefined, effectText(row.mod)));
      tbody.append(tr);
    }
    t.append(thead, tbody);
    wrap.append(t);
    return wrap;
  };

  sheet.append(el('h3', undefined, 'Fighting an enemy'));
  sheet.append(table(combatRows(), 'When'));
  sheet.append(el('h3', undefined, 'Standing beside an ally'));
  sheet.append(table(auraRows(), 'When'));
  sheet.append(
    el(
      'p',
      undefined,
      'Effects stack multiplicatively, but total damage is capped so no combination of relationships can run away with a battle.',
    ),
  );

  // ---- roster -------------------------------------------------------------
  sheet.append(el('h2', undefined, `The roster — ${deities.length} units`));
  const filter = el('input', 'cx-filter') as HTMLInputElement;
  filter.type = 'search';
  filter.placeholder = 'Filter by name, tier, trait or relationship…';
  sheet.append(filter);

  const rosterHost = el('div');
  sheet.append(rosterHost);

  const cards: { node: HTMLElement; haystack: string; group: HTMLElement }[] = [];
  const groups: HTMLElement[] = [];

  for (const tier of TIER_ORDER) {
    const group = deities.filter((d) => d.tier === tier);
    if (group.length === 0) continue;

    const groupHost = el('div');
    groupHost.append(el('h3', undefined, TIER_LABEL[tier]));

    for (const deity of group) {
      const card = el('div', 'cx-unit');
      const cardHead = el('div', 'cx-unit-head');
      cardHead.append(el('strong', undefined, deity.name));
      cardHead.append(el('span', 'cx-tier', `${TIER_LABEL[deity.tier]} · ${deity.cost} faith`));
      card.append(cardHead);

      const stats = el('div', 'cx-stats');
      const statPairs: [string, string][] = [
        ['HP', `${deity.hp}`],
        ['Damage', `${deity.damage}`],
        ['Every', `${deity.attackInterval}s`],
        ['Range', `${deity.range}`],
        ['Speed', `${deity.speed}`],
        ['Armour', `${deity.armor}`],
      ];
      if (deity.traits.length > 0) statPairs.push(['Traits', deity.traits.join(', ')]);
      for (const [label, value] of statPairs) {
        const s = el('span');
        s.append(document.createTextNode(`${label} `));
        s.append(el('b', undefined, value));
        stats.append(s);
      }
      card.append(stats);

      const lines: RelationLine[] = [];
      for (const edge of edges) {
        if (edge.from !== deity.id && edge.to !== deity.id) continue;
        const line = relationLine(edge, deity.id, nameOf);
        if (line !== null) lines.push(line);
      }

      if (lines.length === 0) {
        card.append(
          el('div', 'cx-none', 'No relationships — fights on raw statistics alone, and is fought the same way.'),
        );
      } else {
        const list = el('ul', 'cx-rel');
        for (const line of lines) {
          const li = el('li');
          li.append(document.createTextNode(`${line.text} — `));
          li.append(el('span', 't', line.trigger));
          list.append(li);
        }
        card.append(list);
      }

      groupHost.append(card);
      cards.push({
        node: card,
        group: groupHost,
        haystack: `${deity.name} ${deity.tier} ${deity.traits.join(' ')} ${lines
          .map((l) => `${l.text} ${l.trigger}`)
          .join(' ')}`.toLowerCase(),
      });
    }
    groups.push(groupHost);
    rosterHost.append(groupHost);
  }

  filter.addEventListener('input', () => {
    const query = filter.value.trim().toLowerCase();
    const visible = new Set<HTMLElement>();
    for (const card of cards) {
      const shown = query === '' || card.haystack.includes(query);
      card.node.style.display = shown ? '' : 'none';
      if (shown) visible.add(card.group);
    }
    // A tier heading with every card filtered out is just noise.
    for (const group of groups) group.style.display = visible.has(group) ? '' : 'none';
  });

  // ---- wiring -------------------------------------------------------------
  const setOpen = (open: boolean): void => {
    overlay.classList.toggle('open', open);
    if (open) filter.focus();
  };
  button.addEventListener('click', () => setOpen(true));
  close.addEventListener('click', () => setOpen(false));
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) setOpen(false);
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
    // "?" opens the codex, but never while the user is typing into the filter.
    if (event.key === '?' && document.activeElement !== filter) setOpen(true);
  });

  document.body.append(button, overlay);
}
