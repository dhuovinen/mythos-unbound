/**
 * The strategy consultant panel.
 *
 * Renders the same rule engine the opponent uses (src/sim/advisor.ts), so the counsel you read is
 * literally the reasoning you are playing against.
 *
 * It speaks qualitatively: the prose never contains a number. The figures behind every claim are
 * carried separately on each advice line and appended only when quantification is switched on in
 * the admin panel, so turning it on annotates the same sentences rather than rewriting them.
 */

import { pairLore, unitLore } from '../data/lore';
import { MODIFIER_COLORS } from '../sim/constants';
import type { AdviceLine, BoardRead } from '../sim/advisor';
import { readBoard } from '../sim/advisor';
import { resolveCombat } from '../sim/relations';
import type { Deity, DeityId, DeityIndex, RelationGraph, World } from '../sim/types';
import { getSettings } from './settings';

/** How often the counsel is recomputed. Fast enough to feel live, slow enough to be readable. */
const REFRESH_SECONDS = 1.6;

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className !== undefined) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function styles(): string {
  return `
  #consult-open {
    position: fixed; top: 16px; left: 16px; z-index: 40;
    height: 40px; padding: 0 14px; border-radius: 20px;
    background: #1a1616; color: #a99c85; border: 2px solid #4a4038;
    font: 700 12px ui-sans-serif, system-ui, sans-serif; cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,.5); transition: border-color .15s ease, color .15s ease;
  }
  #consult-open:hover { border-color: #c9a227; color: #c9a227; }
  #consult-panel {
    position: fixed; top: 66px; left: 16px; z-index: 44; width: 310px;
    max-width: calc(100vw - 32px); max-height: calc(100vh - 96px); overflow-y: auto;
    display: none; background: #17141a; border: 1px solid #3a3229; border-radius: 12px;
    padding: 16px 18px 18px; color: #e8dcc4; font-family: ui-sans-serif, system-ui, sans-serif;
    box-shadow: 0 16px 40px rgba(0,0,0,.6);
  }
  #consult-panel.open { display: block; }
  .cs-head { display: flex; justify-content: space-between; align-items: baseline; }
  .cs-head h2 { margin: 0; font-size: 15px; color: #c9a227; letter-spacing: .4px; }
  .cs-head button { background: none; border: none; color: #6d6355; cursor: pointer; font-size: 15px; }
  .cs-head button:hover { color: #e8dcc4; }
  .cs-sub { margin: 3px 0 12px; font-size: 11.5px; color: #6d6355; }
  .cs-label {
    font-size: 10.5px; text-transform: uppercase; letter-spacing: .7px;
    color: #a99c85; margin: 14px 0 6px;
  }
  .cs-pick {
    border: 1px solid #3d3216; background: #1d1913; border-radius: 9px; padding: 10px 12px;
  }
  .cs-pick strong { font-size: 15px; color: #c9a227; }
  .cs-pick .cs-afford { font-size: 11px; color: #6d6355; margin-left: 6px; }
  .cs-pick .cs-afford.no { color: #c98a27; }
  .cs-line { font-size: 12.5px; line-height: 1.5; color: #cabfa9; margin: 7px 0 0; padding-left: 10px; border-left: 2px solid #3a3229; }
  .cs-detail { display: block; margin-top: 3px; font-size: 11px; color: #857a68; font-variant-numeric: tabular-nums; }
  .cs-threat { font-size: 12.5px; color: #cabfa9; padding: 3px 0; }
  .cs-lore {
    font-size: 12.5px; line-height: 1.6; color: #a99c85; font-style: italic;
    border-top: 1px solid #2b2620; padding-top: 10px; margin-top: 14px;
  }
  .cs-lore .cs-who { display: block; font-style: normal; font-weight: 700; color: #c9a227; font-size: 11px;
    text-transform: uppercase; letter-spacing: .6px; margin-bottom: 5px; }
  .cs-quiet { font-size: 12.5px; color: #6d6355; font-style: italic; }
  `;
}

/** Builds one advice line, appending its figures only when quantification is enabled. */
function renderLine(line: AdviceLine, quantify: boolean): HTMLElement {
  const node = el('p', 'cs-line', line.text);
  if (line.modifier !== undefined) {
    node.style.borderLeftColor = MODIFIER_COLORS[line.modifier];
  }
  if (quantify && line.detail !== undefined) {
    node.append(el('span', 'cs-detail', line.detail));
  }
  return node;
}

/** The most narratively interesting pairing currently facing each other, for the lore slot. */
function notablePairing(
  world: World,
  deities: DeityIndex,
  graph: RelationGraph,
): { a: Deity; b: Deity; kind: string } | null {
  const side = (s: 'player' | 'enemy'): Deity[] => {
    const found = new Map<DeityId, Deity>();
    for (const unit of world.units) {
      if (unit.isBase || unit.hp <= 0 || unit.side !== s) continue;
      const deity = deities.get(unit.deityId);
      if (deity !== undefined) found.set(deity.id, deity);
    }
    return [...found.values()].sort((x, y) => x.id.localeCompare(y.id));
  };

  let best: { a: Deity; b: Deity; kind: string; weight: number } | null = null;
  for (const a of side('player')) {
    for (const b of side('enemy')) {
      const mods = [...resolveCombat(a, b, graph), ...resolveCombat(b, a, graph)];
      if (mods.length === 0) continue;
      const edges = graph.byPair.get(`${a.id}|${b.id}`);
      const edge = edges?.[0];
      if (edge === undefined) continue;
      const weight = mods.reduce((sum, m) => sum + Math.abs(m.damageMult - 1) + (m.suppress ? 2 : 0), 0);
      if (best === null || weight > best.weight) {
        best = { a: edge.from === a.id ? a : b, b: edge.from === a.id ? b : a, kind: edge.kind, weight };
      }
    }
  }
  return best === null ? null : { a: best.a, b: best.b, kind: best.kind };
}

export interface ConsultantHandle {
  /** Call once per frame; the panel throttles its own recomputation. */
  update(world: World, faith: number, dt: number): void;
}

/** Builds the consultant button and panel. */
export function mountConsultant(
  deities: DeityIndex,
  graph: RelationGraph,
  deck: readonly DeityId[],
): ConsultantHandle {
  const style = el('style');
  style.textContent = styles();
  document.head.append(style);

  const button = el('button', undefined, '⚑  Consultant');
  button.id = 'consult-open';

  const panel = el('div');
  panel.id = 'consult-panel';

  const head = el('div', 'cs-head');
  head.append(el('h2', undefined, 'Strategy consultant'));
  const close = el('button', undefined, '✕');
  close.setAttribute('aria-label', 'Close consultant');
  head.append(close);
  panel.append(head);
  panel.append(el('p', 'cs-sub', 'The same reasoning your opponent is using.'));

  const body = el('div');
  panel.append(body);

  let elapsed = REFRESH_SECONDS;

  const render = (world: World, faith: number): void => {
    const quantify = getSettings().quantifyAdvice;
    const read: BoardRead = readBoard(world, deities, graph, deck, 'player', faith);
    body.replaceChildren();

    // ---- what is out there ----
    body.append(el('div', 'cs-label', 'The field'));
    if (read.threats.length === 0) {
      body.append(el('p', 'cs-quiet', 'Nothing opposing you yet. Build while it is quiet.'));
    } else {
      for (const threat of read.threats) body.append(el('div', 'cs-threat', `— ${threat.text}`));
    }

    // ---- the recommendation ----
    const pick = read.recommendations[0];
    body.append(el('div', 'cs-label', 'Counsel'));
    if (pick === undefined) {
      body.append(el('p', 'cs-quiet', 'No deck to advise on.'));
    } else {
      const card = el('div', 'cs-pick');
      const title = el('div');
      title.append(el('strong', undefined, pick.name));
      title.append(
        el('span', `cs-afford${pick.affordable ? '' : ' no'}`, pick.affordable ? 'ready' : 'not yet affordable'),
      );
      card.append(title);

      if (pick.lines.length === 0) {
        card.append(
          el(
            'p',
            'cs-line',
            `No blood ties in play here. ${pick.name} will fight on nothing but their own merits — which is sometimes exactly what you want.`,
          ),
        );
      } else {
        for (const line of pick.lines.slice(0, 4)) card.append(renderLine(line, quantify));
      }
      body.append(card);
    }

    // ---- warnings ----
    if (read.warnings.length > 0) {
      body.append(el('div', 'cs-label', 'Take care'));
      for (const warning of read.warnings.slice(0, 2)) body.append(renderLine(warning, quantify));
    }

    // ---- lore ----
    const pairing = notablePairing(world, deities, graph);
    const lore = el('div', 'cs-lore');
    if (pairing === null) {
      const subject = pick?.deityId;
      lore.append(el('span', 'cs-who', subject === undefined ? 'Background' : pick?.name ?? ''));
      lore.append(document.createTextNode(subject === undefined ? '—' : unitLore(subject)));
    } else {
      lore.append(el('span', 'cs-who', `${pairing.a.name} & ${pairing.b.name}`));
      lore.append(document.createTextNode(pairLore(pairing.a.id, pairing.b.id, pairing.kind as never)));
    }
    body.append(lore);
  };

  const setOpen = (open: boolean): void => {
    panel.classList.toggle('open', open);
    if (open) elapsed = REFRESH_SECONDS; // force a refresh on the next frame
  };
  button.addEventListener('click', () => setOpen(!panel.classList.contains('open')));
  close.addEventListener('click', () => setOpen(false));

  document.body.append(button, panel);

  return {
    update(world, faith, dt): void {
      if (!panel.classList.contains('open')) return;
      elapsed += dt;
      if (elapsed < REFRESH_SECONDS) return;
      elapsed = 0;
      render(world, faith);
    },
  };
}
