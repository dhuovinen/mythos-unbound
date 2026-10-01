/**
 * The team picker — a realm, a family tree, and a two-phase draft with a reveal between.
 *
 * Phase 1: you commit an opening of three, blind.
 * Reveal:  both openings turn face up.
 * Phase 2: you lock in six reinforcements knowing what they opened with, and they lock in theirs
 *          knowing what you opened with.
 *
 * That structure is the fix for a real flaw. Because relations resolve only within a pantheon,
 * whether combat modifiers fire at all is a joint outcome of both decks — neither side decides it
 * alone. Drafting blind made that a coin toss and left mixed decks strictly worse than pure ones.
 * Revealing turns it into a read, and makes what you choose to show first a decision in its own right.
 *
 * What you pick from is a family tree, one per pantheon: parents above children, spouses side by
 * side, feuds and killings drawn as lines between the cards. The tree is the game's central idea made
 * visible — you can see, before you commit, who will hesitate against whom. Each realm tab shows only
 * its own pantheon against its own battlefield; the Open World tab shows all three together.
 *
 * No gold anywhere on this screen: gold in this game means a relationship is firing in battle, so the
 * picker takes its accent from the realm instead.
 */

import { pairLore, unitLore } from '../data/lore';
import { drawBackdropScene } from '../render/backdrops';
import type { BackdropId } from '../render/backdrops';
import {
  OPENING_SIZE,
  REINFORCEMENT_SIZE,
  draftOpening,
  draftReinforcements,
  pantheonsOf,
} from '../sim/draft';
import { resolveAuras, resolveCombat } from '../sim/relations';
import { createRng } from '../sim/rng';
import type { Deity, DeityId, Edge, Pantheon, RelationGraph, RelationKind } from '../sim/types';
import { CARD_H, CARD_W, COL, layoutTree } from './familytree';
import type { TreeLayout } from './familytree';
import { REALM_ACCENT, portraitFor } from './portraits';
import { getSettings, setSetting } from './settings';

type RealmId = Pantheon | 'openworld';
type Phase = 'opening' | 'reinforce';

const PANTHEON_ORDER: readonly Pantheon[] = ['greek', 'norse', 'egyptian'];

const REALMS: readonly { id: RealmId; label: string; blurb: string }[] = [
  { id: 'greek', label: 'Greek', blurb: 'Olympus. Titans, gods and heroes — the family that devoured its own children.' },
  { id: 'norse', label: 'Norse', blurb: 'Asgard and the fjords. Gods who know exactly how they die, and fight anyway.' },
  { id: 'egyptian', label: 'Egyptian', blurb: 'The Nile. A murdered king, a vengeful son and the brother who did it.' },
  {
    id: 'openworld',
    label: 'Open World',
    blurb: 'The city. Any deity from any mythology — but blood does not cross pantheons, so each family only binds its own.',
  },
];

const REALM_LABEL: Readonly<Record<RealmId, string>> = {
  greek: 'Greek',
  norse: 'Norse',
  egyptian: 'Egyptian',
  openworld: 'Open World',
};

const TIER_RANK: Readonly<Record<string, number>> = { chaff: 1, demigod: 2, god: 3, titan: 4 };

/** Line colours per relationship. Deliberately no gold — that colour belongs to relations firing. */
const KIND_STYLE: Readonly<Record<RelationKind, { color: string; label: string; dash: string }>> = {
  parent: { color: '#a99c85', label: 'Parent and child', dash: '' },
  spouse: { color: '#e58fb0', label: 'Spouses', dash: '' },
  lover: { color: '#e05fa0', label: 'Lovers', dash: '3 4' },
  sibling: { color: '#7bb661', label: 'Siblings', dash: '' },
  rival: { color: '#e8873f', label: 'Rivals', dash: '' },
  slain_by: { color: '#e0443a', label: 'Slain by', dash: '6 4' },
  persecutes: { color: '#a98be0', label: 'Persecutes', dash: '6 4' },
};

const SVG_NS = 'http://www.w3.org/2000/svg';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className !== undefined) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string> = {}): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
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
  #draft-open:hover { border-color: #e8dcc4; color: #e8dcc4; }
  #draft-overlay {
    --accent: #8fb4e8;
    position: fixed; inset: 0; z-index: 55; display: none; color: #e8dcc4;
    font-family: ui-sans-serif, system-ui, sans-serif; background: #0b0a0e;
  }
  #draft-overlay.open { display: block; }
  .df-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .df-scrim { position: absolute; inset: 0; background: linear-gradient(rgba(10,8,12,.15), rgba(10,8,12,.45) 55%, rgba(10,8,12,.8)); }
  .df-shell { position: relative; height: 100%; display: flex; flex-direction: column; padding: 14px 18px 12px; gap: 10px; }

  .df-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
  .df-top h1 { margin: 0; font-size: 22px; letter-spacing: .3px; }
  .df-step { font-size: 11px; text-transform: uppercase; letter-spacing: .8px; color: var(--accent); font-weight: 700; margin-top: 2px; }
  .df-instruction { margin: 5px 0 0; font-size: 12.5px; color: #b8ac95; line-height: 1.5; max-width: 76ch; }
  .df-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .df-btn {
    background: rgba(20,17,24,.8); border: 1px solid #4a4038; color: #e8dcc4; cursor: pointer;
    border-radius: 7px; padding: 8px 14px; font-size: 12.5px; font-weight: 700; font-family: inherit;
  }
  .df-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
  .df-btn:disabled { opacity: .35; cursor: not-allowed; }
  .df-btn.primary { background: var(--accent); color: #101018; border-color: var(--accent); }
  .df-btn.primary:hover:not(:disabled) { filter: brightness(1.12); color: #101018; }

  .df-realms { display: flex; gap: 8px; align-items: stretch; flex-wrap: wrap; }
  .df-tab {
    background: rgba(20,17,24,.72); border: 1px solid #3a3229; border-radius: 9px; color: #b8ac95;
    padding: 7px 14px; cursor: pointer; font: 700 13px inherit; display: flex; align-items: center; gap: 8px;
  }
  .df-tab i { width: 9px; height: 9px; border-radius: 50%; display: inline-block; background: var(--c); }
  .df-tab b { font-size: 10.5px; padding: 1px 6px; border-radius: 9px; background: rgba(255,255,255,.12); color: #e8dcc4; }
  .df-tab:hover { color: #e8dcc4; border-color: var(--c); }
  .df-tab.on { color: #101018; background: var(--c); border-color: var(--c); }
  .df-tab.on b { background: rgba(0,0,0,.22); color: #101018; }
  .df-blurb { align-self: center; font-size: 12px; color: #b8ac95; margin-left: 6px; max-width: 70ch; line-height: 1.45; }

  .df-gateway {
    position: absolute; inset: 0; display: none; flex-direction: column; align-items: center; justify-content: flex-start;
    gap: 16px; padding: 24px; overflow-y: auto;
  }
  #draft-overlay.gateway .df-gateway { display: flex; }
  .df-gateway > :first-child { margin-top: auto; }
  .df-gateway > :last-child { margin-bottom: auto; }
  #draft-overlay.gateway .df-shell { display: none; }
  .df-gateway h1 { margin: 0; font-size: 28px; text-align: center; letter-spacing: .4px; }
  .df-gateway p.lead { margin: 0; max-width: 64ch; text-align: center; font-size: 14px; line-height: 1.55; color: #cabfa9; }
  .df-realmcards { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; }
  .df-realmcard {
    width: 222px; text-align: left; cursor: pointer; border-radius: 14px; overflow: hidden; padding: 0;
    background: rgba(14,11,18,.88); border: 2px solid rgba(255,255,255,.14); color: #e8dcc4; font-family: inherit;
    transition: transform .15s, border-color .15s, box-shadow .15s;
  }
  .df-realmcard:hover, .df-realmcard:focus-visible { transform: translateY(-4px); border-color: var(--c); box-shadow: 0 12px 30px -8px var(--c); outline: none; }
  .df-realmcard canvas { display: block; width: 100%; height: 112px; object-fit: cover; }
  .df-realmcard .body { padding: 11px 14px 14px; }
  .df-realmcard h2 { margin: 0 0 4px; font-size: 19px; color: var(--c); }
  .df-realmcard p { margin: 0; font-size: 12px; line-height: 1.5; color: #b8ac95; }
  .df-realmcard .count { display: inline-block; margin-top: 8px; font-size: 11px; font-weight: 700; color: #e8dcc4; }
  .df-realmcard .go { display: block; margin-top: 10px; font-size: 12px; font-weight: 800; color: var(--c); text-transform: uppercase; letter-spacing: .8px; }
  .df-realmlabel { align-self: center; font-size: 11px; text-transform: uppercase; letter-spacing: .9px; color: #a99c85; font-weight: 700; margin-right: 2px; }
  .df-change { border-color: #6d6355; }
  .df-main { flex: 1; min-height: 0; display: flex; gap: 12px; }
  .df-viewport {
    flex: 1; min-width: 0; overflow: auto; border-radius: 12px; padding: 12px 10px 16px;
    background: rgba(10,8,14,.28); border: 1px solid rgba(255,255,255,.1);
  }
  .df-section h3 {
    margin: 4px 0 2px 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--c);
  }
  .df-box { position: relative; margin: 0 auto; }
  .df-tree { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
  .df-lines { position: absolute; left: 0; top: 0; overflow: visible; pointer-events: none; }
  .df-lines path { fill: none; stroke-width: 2; transition: opacity .15s, stroke-width .15s; }
  .df-lines path.parent { opacity: .5; }
  .df-lines path.lateral { opacity: .3; }
  .df-tree.focusing .df-lines path { opacity: .08; }
  .df-tree.focusing .df-lines path.hot { opacity: 1; stroke-width: 3.2; }
  .df-rowlabel { position: absolute; left: 0; width: 100%; text-align: center; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: rgba(232,220,196,.55); }

  .df-card {
    position: absolute; width: ${CARD_W}px; height: ${CARD_H}px; border-radius: 9px; overflow: hidden;
    background: #17141a; border: 2px solid rgba(255,255,255,.16); cursor: pointer; outline: none;
    transition: transform .12s, border-color .12s, opacity .15s, box-shadow .12s;
    display: flex; flex-direction: column;
  }
  .df-card canvas { display: block; flex: none; }
  .df-card .df-name { font-weight: 700; font-size: 12px; text-align: center; padding: 4px 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .df-card .df-meta { font-size: 10px; color: #a99c85; text-align: center; display: flex; justify-content: center; gap: 6px; align-items: center; margin-top: 2px; }
  .df-pips { display: inline-flex; gap: 2px; }
  .df-pips i { width: 5px; height: 5px; border-radius: 50%; background: var(--c); }
  .df-pips i.off { background: rgba(255,255,255,.14); }
  .df-card .df-badge {
    position: absolute; left: 0; right: 0; bottom: 0; font-size: 9px; font-weight: 700; text-align: center;
    color: #101018; background: var(--c); padding: 1px 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: none;
  }
  .df-card .df-badge.on { display: block; }
  .df-card .df-mark {
    position: absolute; top: 4px; right: 4px; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 9px;
    font-size: 10px; font-weight: 800; line-height: 18px; text-align: center; display: none;
    background: var(--c); color: #101018; box-shadow: 0 1px 4px rgba(0,0,0,.6);
  }
  .df-card .df-mark.on { display: block; }
  .df-card:hover:not(.disabled), .df-card:focus-visible { border-color: rgba(255,255,255,.5); }
  .df-card.focus { transform: scale(1.07); z-index: 5; box-shadow: 0 8px 22px rgba(0,0,0,.7); border-color: #e8dcc4; }
  .df-card.kin { border-color: var(--c); }
  .df-tree.focusing .df-card:not(.focus):not(.kin) { opacity: .3; }
  .df-card.picked { border-color: var(--c); box-shadow: 0 0 0 1px var(--c), 0 0 16px -2px var(--c); }
  .df-card.opening { border-color: #e8dcc4; box-shadow: 0 0 0 1px #e8dcc4; }
  .df-card.disabled { opacity: .35; cursor: not-allowed; }
  .df-card.opening .df-mark { background: #e8dcc4; }

  .df-side { width: 300px; flex: none; display: flex; flex-direction: column; gap: 10px; min-height: 0; overflow-y: auto; }
  .df-panel { background: rgba(14,11,18,.82); border: 1px solid rgba(255,255,255,.1); border-radius: 12px; padding: 12px 14px; backdrop-filter: blur(4px); }
  .df-panel h4 { margin: 0 0 8px; font-size: 10.5px; text-transform: uppercase; letter-spacing: .9px; color: #a99c85; }
  .df-panel.enemy { border-color: rgba(196,68,46,.5); }
  .df-panel.enemy h4 { color: #e0614a; }
  .df-chips { display: flex; gap: 8px; flex-wrap: wrap; }
  .df-chip { width: 76px; font-size: 11px; text-align: center; }
  .df-chip canvas { border-radius: 7px; border: 1px solid rgba(255,255,255,.18); display: block; margin: 0 auto 3px; }
  .df-chip.down canvas { background: repeating-linear-gradient(45deg,#2a1d22,#2a1d22 6px,#1e1418 6px,#1e1418 12px); }
  .df-empty { color: #7d7263; font-style: italic; font-size: 12px; }

  .df-dossier h2 { margin: 0; font-size: 18px; }
  .df-dossier .df-sub { font-size: 11px; color: var(--accent); text-transform: uppercase; letter-spacing: .7px; font-weight: 700; margin: 2px 0 8px; }
  .df-dossier .df-lore { font-size: 12.5px; line-height: 1.5; color: #cabfa9; margin-bottom: 9px; }
  .df-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 10px; }
  .df-stat { background: rgba(255,255,255,.05); border-radius: 7px; padding: 5px 4px; text-align: center; }
  .df-stat b { display: block; font-size: 13px; }
  .df-stat span { font-size: 9.5px; text-transform: uppercase; letter-spacing: .5px; color: #8d8272; }
  .df-rel { margin: 0; padding: 0; list-style: none; }
  .df-rel li { font-size: 12px; padding: 3px 0 3px 9px; border-left: 3px solid var(--c); margin-top: 4px; cursor: pointer; }
  .df-rel li:hover { background: rgba(255,255,255,.05); }
  .df-rel details summary { cursor: pointer; list-style: none; }
  .df-rel details p { margin: 4px 0 2px; font-size: 11.5px; line-height: 1.5; color: #a99c85; }
  .df-deal { font-size: 12px; margin-top: 10px; line-height: 1.5; color: #cabfa9; }
  .df-deal b { color: var(--accent); }

  .df-analysis { font-size: 12.5px; line-height: 1.5; color: #cabfa9; }
  .df-verdict { display: block; margin-top: 5px; color: var(--accent); font-weight: 700; }
  .df-bonds { margin: 7px 0 0; padding: 0; list-style: none; }
  .df-bonds li { font-size: 12px; padding: 1px 0 1px 8px; border-left: 2px solid #4a4038; margin-top: 3px; }
  .df-legend { display: flex; flex-wrap: wrap; gap: 4px 12px; }
  .df-legend span { font-size: 11px; display: inline-flex; align-items: center; gap: 5px; color: #b8ac95; }
  .df-legend i { width: 18px; height: 0; border-top: 3px solid var(--c); display: inline-block; }
  .df-legend i.dash { border-top-style: dashed; }

  .df-tray { display: flex; gap: 8px; align-items: stretch; flex-wrap: wrap; padding: 8px 10px; border-radius: 12px; background: rgba(14,11,18,.85); border: 1px solid rgba(255,255,255,.1); }
  .df-slotgroup { display: flex; gap: 6px; align-items: center; }
  .df-slotgroup > em { font-style: normal; font-size: 10px; text-transform: uppercase; letter-spacing: .7px; color: #8d8272; writing-mode: vertical-rl; transform: rotate(180deg); }
  .df-slot {
    width: 58px; height: 62px; border-radius: 8px; border: 1px dashed rgba(255,255,255,.2); position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center; font-size: 11px; color: #6b6153; cursor: default;
  }
  .df-slot.filled { border-style: solid; border-color: var(--accent); cursor: pointer; }
  .df-slot.locked { border-color: #e8dcc4; cursor: default; }
  .df-slot canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
  .df-slot span { position: absolute; left: 0; right: 0; bottom: 0; font-size: 9px; font-weight: 700; text-align: center; background: rgba(10,8,12,.8); color: #e8dcc4; padding: 1px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .df-slot.filled:hover:not(.locked)::after { content: '✕'; position: absolute; top: 2px; right: 4px; color: #fff; font-size: 11px; text-shadow: 0 0 3px #000; }
  .df-next { padding: 10px 18px; font-size: 13.5px; align-self: center; }
  .df-next:not(:disabled) { animation: df-pulse 1.6s ease-in-out infinite; }
  @keyframes df-pulse { 0%, 100% { box-shadow: 0 0 0 0 var(--accent); } 50% { box-shadow: 0 0 0 6px transparent; } }
  .df-stage { margin-left: auto; align-self: center; font-size: 12px; color: #b8ac95; text-align: right; }
  .df-stage b { color: var(--accent); }

  @media (max-width: 900px) {
    .df-main { flex-direction: column; }
    .df-side { width: auto; flex-direction: row; flex-wrap: wrap; max-height: 40%; }
    .df-side > * { flex: 1 1 260px; }
  }
  `;
}

/** Bonds between two sets of deities, described for the analysis panel. */
function bondsBetween(
  ours: readonly Deity[],
  theirs: readonly Deity[],
  graph: RelationGraph,
): { text: string }[] {
  const found: { text: string }[] = [];
  const seen = new Set<string>();
  for (const a of ours) {
    for (const b of theirs) {
      if (a.id === b.id) continue;
      for (const mod of resolveCombat(a, b, graph)) {
        const key = `${a.id}|${b.id}|${mod.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        found.push({ text: `${a.name} vs ${b.name} — ${mod.name}` });
      }
    }
  }
  return found;
}

/** Bonds inside one deck. */
function bondsWithin(deck: readonly Deity[], graph: RelationGraph): { text: string }[] {
  const found: { text: string }[] = [];
  const seen = new Set<string>();
  for (const a of deck) {
    for (const b of deck) {
      if (a.id === b.id) continue;
      for (const mod of [...resolveAuras(a, [b], [b], graph), ...resolveCombat(a, b, graph)]) {
        const key = [a.id, b.id].sort().join('|') + mod.name;
        if (seen.has(key)) continue;
        seen.add(key);
        found.push({ text: `${a.name} & ${b.name} — ${mod.name}` });
      }
    }
  }
  return found;
}

/** How a relationship reads from `id`'s side, e.g. "Child of Cronus". */
function describeRelation(id: DeityId, edge: Edge, nameOf: (id: DeityId) => string): { text: string; other: DeityId } {
  const isFrom = edge.from === id;
  const other = isFrom ? edge.to : edge.from;
  const n = nameOf(other);
  switch (edge.kind) {
    case 'parent':
      return { text: isFrom ? `Parent of ${n}` : `Child of ${n}`, other };
    case 'spouse':
      return { text: `Married to ${n}`, other };
    case 'lover':
      return { text: `Lover of ${n}`, other };
    case 'sibling':
      return { text: `Sibling of ${n}`, other };
    case 'rival':
      return { text: `Rival of ${n}`, other };
    case 'slain_by':
      return { text: isFrom ? `Slain by ${n}` : `Slew ${n}`, other };
    case 'persecutes':
      return { text: isFrom ? `Persecutes ${n}` : `Persecuted by ${n}`, other };
  }
}

interface Tree {
  readonly pantheon: Pantheon;
  readonly layout: TreeLayout;
  readonly box: HTMLElement;
  readonly inner: HTMLElement;
  readonly cards: Map<DeityId, HTMLElement>;
  readonly lines: { node: SVGPathElement; from: DeityId; to: DeityId }[];
}

/** Builds the draft button and the picker overlay. */
export function mountDraftScreen(roster: readonly Deity[], graph: RelationGraph, onApply: () => void): void {
  if (document.getElementById('draft-open') !== null) return;

  const style = el('style');
  style.textContent = styles();
  document.head.append(style);

  const byId = new Map(roster.map((d) => [d.id, d]));
  const nameOf = (id: DeityId): string => byId.get(id)?.name ?? id;
  const resolve = (ids: readonly DeityId[]): Deity[] =>
    ids.map((id) => byId.get(id)).filter((d): d is Deity => d !== undefined);

  const adjacency = new Map<DeityId, Set<DeityId>>();
  for (const edge of graph.edges) {
    (adjacency.get(edge.from) ?? adjacency.set(edge.from, new Set()).get(edge.from))?.add(edge.to);
    (adjacency.get(edge.to) ?? adjacency.set(edge.to, new Set()).get(edge.to))?.add(edge.from);
  }

  const button = el('button', undefined, '⚔  Pick team');
  button.id = 'draft-open';

  const overlay = el('div');
  overlay.id = 'draft-overlay';

  // ---- state ----------------------------------------------------------------------------------
  let phase: Phase = 'opening';
  let opening: DeityId[] = [];
  let reinforcements: DeityId[] = [];
  let enemyOpening: DeityId[] = [];
  let tab: RealmId = 'greek';
  let view: 'gateway' | 'tree' = 'gateway';
  let hovered: DeityId | null = null;
  let selected: DeityId | null = null;

  // ---- chrome ---------------------------------------------------------------------------------
  const bg = el('canvas', 'df-bg');
  bg.width = 960;
  bg.height = 540;
  const bgCtx = bg.getContext('2d') as CanvasRenderingContext2D;
  const scrim = el('div', 'df-scrim');
  const shell = el('div', 'df-shell');
  overlay.append(bg, scrim, shell);

  // One shared set of arrowheads for every tree's lines.
  const defs = svg('svg', { width: '0', height: '0', style: 'position:absolute' });
  const defsInner = svg('defs');
  for (const [id, color] of [['df-arr-slain', KIND_STYLE.slain_by.color], ['df-arr-pers', KIND_STYLE.persecutes.color]] as const) {
    const marker = svg('marker', { id, viewBox: '0 0 10 10', refX: '8', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto' });
    marker.append(svg('path', { d: 'M0 0L10 5L0 10z', fill: color }));
    defsInner.append(marker);
  }
  defs.append(defsInner);
  overlay.append(defs);

  // The front door: pick a mythology before anything else.
  const gateway = el('div', 'df-gateway');
  gateway.append(el('h1', undefined, 'Choose a mythology'));
  gateway.append(
    el(
      'p',
      'lead',
      'Each mythology is a family of gods with its own feuds, marriages and murders. Pick one to build your team from its family tree — or take the Open World and mix them.',
    ),
  );
  const realmCards = el('div', 'df-realmcards');
  gateway.append(realmCards);
  const gatewayClose = el('button', 'df-btn', 'Back to the battle');
  gateway.append(gatewayClose);
  overlay.append(gateway);

  const thumbs = new Map<RealmId, { canvas: HTMLCanvasElement; count: HTMLElement }>();
  for (const realm of REALMS) {
    const card = el('button', 'df-realmcard');
    card.style.setProperty('--c', REALM_ACCENT[realm.id]);
    const canvas = el('canvas');
    canvas.width = 960;
    canvas.height = 540;
    const body = el('div', 'body');
    const count = el('span', 'count');
    body.append(el('h2', undefined, realm.label), el('p', undefined, realm.blurb), count, el('span', 'go', 'Choose →'));
    card.append(canvas, body);
    card.addEventListener('click', () => {
      tab = realm.id;
      view = 'tree';
      renderView();
    });
    realmCards.append(card);
    thumbs.set(realm.id, { canvas, count });
  }

  const top = el('div', 'df-top');
  const headText = el('div');
  const step = el('div', 'df-step');
  headText.append(el('h1', undefined, 'Build your team'), step);
  const instruction = el('p', 'df-instruction');
  headText.append(instruction);
  const actions = el('div', 'df-actions');
  const restart = el('button', 'df-btn', 'Start over');
  const advance = el('button', 'df-btn primary');
  const close = el('button', 'df-btn', 'Close');
  actions.append(restart, advance, close);
  top.append(headText, actions);

  const realmBar = el('div', 'df-realms');
  const change = el('button', 'df-tab df-change', '◀  Change mythology');
  change.addEventListener('click', () => {
    view = 'gateway';
    renderView();
  });
  realmBar.append(change, el('span', 'df-realmlabel', 'Viewing'));
  const tabNodes = new Map<RealmId, { node: HTMLElement; count: HTMLElement }>();
  for (const realm of REALMS) {
    const node = el('button', 'df-tab');
    node.style.setProperty('--c', REALM_ACCENT[realm.id]);
    node.append(el('i'), document.createTextNode(realm.label));
    const count = el('b', undefined, '0');
    node.append(count);
    node.addEventListener('click', () => setTab(realm.id));
    realmBar.append(node);
    tabNodes.set(realm.id, { node, count });
  }
  const blurb = el('div', 'df-blurb');
  realmBar.append(blurb);

  const main = el('div', 'df-main');
  const viewport = el('div', 'df-viewport');
  const side = el('div', 'df-side');
  main.append(viewport, side);

  const enemyPanel = el('div', 'df-panel enemy');
  const dossier = el('div', 'df-panel df-dossier');
  const analysis = el('div', 'df-panel');
  const legend = el('div', 'df-panel');
  side.append(enemyPanel, dossier, analysis, legend);

  legend.append(el('h4', undefined, 'Lines on the tree'));
  const legendRow = el('div', 'df-legend');
  for (const kind of ['parent', 'spouse', 'lover', 'sibling', 'rival', 'slain_by', 'persecutes'] as const) {
    const item = el('span');
    const swatch = el('i', KIND_STYLE[kind].dash === '' ? '' : 'dash');
    swatch.style.setProperty('--c', KIND_STYLE[kind].color);
    item.append(swatch, document.createTextNode(KIND_STYLE[kind].label));
    legendRow.append(item);
  }
  legend.append(legendRow);

  const tray = el('div', 'df-tray');
  const slots: HTMLElement[] = [];
  const openGroup = el('div', 'df-slotgroup');
  openGroup.append(el('em', undefined, 'Opening'));
  const reinGroup = el('div', 'df-slotgroup');
  reinGroup.append(el('em', undefined, 'Reinforce'));
  for (let i = 0; i < OPENING_SIZE + REINFORCEMENT_SIZE; i++) {
    const slot = el('div', 'df-slot', String(i + 1));
    slots.push(slot);
    (i < OPENING_SIZE ? openGroup : reinGroup).append(slot);
  }
  const stageNote = el('div', 'df-stage');
  const nextBtn = el('button', 'df-btn primary df-next');
  nextBtn.addEventListener('click', () => advance.click());
  tray.append(openGroup, reinGroup, nextBtn, stageNote);

  shell.append(top, realmBar, main, tray);

  // ---- trees ----------------------------------------------------------------------------------
  const trees = new Map<Pantheon, Tree>();

  function lineKind(edge: Edge): string {
    return edge.kind === 'parent' ? 'parent' : 'lateral';
  }

  function buildTree(pantheon: Pantheon): Tree {
    const deities = roster.filter((d) => d.pantheon === pantheon);
    const pantheonEdges = graph.edges.filter((e) => byId.get(e.from)?.pantheon === pantheon);
    const layout = layoutTree(deities, pantheonEdges);
    const pos = new Map(layout.nodes.map((n) => [n.id, n]));

    const box = el('div', 'df-box');
    const inner = el('div', 'df-tree');
    inner.style.width = `${layout.width}px`;
    inner.style.height = `${layout.height}px`;
    inner.style.setProperty('--c', REALM_ACCENT[pantheon]);
    const lineLayer = svg('svg', { class: 'df-lines', width: String(layout.width), height: String(layout.height) });
    inner.append(lineLayer);
    box.append(inner);

    const lines: Tree['lines'] = [];
    const addLine = (edge: Edge, d: string, attrs: Record<string, string> = {}): void => {
      const style = KIND_STYLE[edge.kind];
      const node = svg('path', { d, class: lineKind(edge), stroke: style.color, ...attrs });
      if (style.dash !== '') node.setAttribute('stroke-dasharray', style.dash);
      lineLayer.append(node);
      lines.push({ node, from: edge.from, to: edge.to });
    };

    // Parent lines share a bus under each parent, so a family reads as a family.
    const busY = (CARD_H + 32);
    for (const edge of pantheonEdges.filter((e) => e.kind === 'parent')) {
      const p = pos.get(edge.from);
      const c = pos.get(edge.to);
      if (p === undefined || c === undefined) continue;
      const sy = p.y + CARD_H;
      const mid = p.y + busY;
      addLine(edge, `M ${p.x} ${sy} V ${mid} H ${c.x} V ${c.y}`);
    }

    const sharesParent = (a: DeityId, b: DeityId): boolean =>
      pantheonEdges.some((e) => e.kind === 'parent' && e.to === a) &&
      pantheonEdges.some(
        (e1) => e1.kind === 'parent' && e1.to === a && pantheonEdges.some((e2) => e2.kind === 'parent' && e2.to === b && e2.from === e1.from),
      );

    const used = new Map<DeityId, number>();
    const jitter = (id: DeityId): number => {
      const n = used.get(id) ?? 0;
      used.set(id, n + 1);
      return (n % 5) * 9 - 18 + (n >= 5 ? 4 : 0);
    };

    for (const edge of pantheonEdges.filter((e) => e.kind !== 'parent')) {
      if (edge.kind === 'sibling' && sharesParent(edge.from, edge.to)) continue;
      // Killings and persecutions point at the victim; draw them from the aggressor.
      const attackerFirst = edge.kind === 'slain_by';
      const first = attackerFirst ? edge.to : edge.from;
      const second = attackerFirst ? edge.from : edge.to;
      const a = pos.get(first);
      const b = pos.get(second);
      if (a === undefined || b === undefined) continue;

      let d: string;
      const ja = jitter(first);
      const jb = jitter(second);
      if (a.rank === b.rank) {
        const gap = Math.abs(a.x - b.x);
        if (gap <= COL + 1) {
          const dir = b.x > a.x ? 1 : -1;
          const y = a.y + CARD_H * 0.52 + ja * 0.5;
          d = `M ${a.x + dir * (CARD_W / 2)} ${y} L ${b.x - dir * (CARD_W / 2)} ${y}`;
        } else {
          const lift = 34 + Math.min(70, gap * 0.1) + Math.abs(ja);
          d = `M ${a.x + ja} ${a.y} C ${a.x + ja} ${a.y - lift}, ${b.x + jb} ${b.y - lift}, ${b.x + jb} ${b.y}`;
        }
      } else {
        const aAbove = a.y < b.y;
        const ay = aAbove ? a.y + CARD_H : a.y;
        const by = aAbove ? b.y : b.y + CARD_H;
        const reach = 46;
        d = `M ${a.x + ja} ${ay} C ${a.x + ja} ${ay + (aAbove ? reach : -reach)}, ${b.x + jb} ${by + (aAbove ? -reach : reach)}, ${b.x + jb} ${by}`;
      }
      const attrs: Record<string, string> = {};
      if (edge.kind === 'slain_by') attrs['marker-end'] = 'url(#df-arr-slain)';
      if (edge.kind === 'persecutes') attrs['marker-end'] = 'url(#df-arr-pers)';
      addLine(edge, d, attrs);
    }

    if (layout.kinlessRank !== null) {
      const first = layout.nodes.find((n) => n.rank === layout.kinlessRank);
      if (first !== undefined) {
        const label = el('div', 'df-rowlabel', 'No blood ties');
        label.style.top = `${first.y - 18}px`;
        inner.append(label);
      }
    }

    const cards = new Map<DeityId, HTMLElement>();
    for (const node of layout.nodes) {
      const deity = byId.get(node.id);
      if (deity === undefined) continue;
      const card = el('div', 'df-card');
      card.tabIndex = 0;
      card.dataset['id'] = deity.id;
      card.style.left = `${node.x - CARD_W / 2}px`;
      card.style.top = `${node.y}px`;
      card.style.setProperty('--c', REALM_ACCENT[pantheon]);
      card.append(portraitFor(deity, CARD_W - 4, 70));
      card.append(el('div', 'df-name', deity.name));
      const meta = el('div', 'df-meta');
      meta.append(document.createTextNode(`${deity.cost}`));
      const pips = el('span', 'df-pips');
      for (let i = 1; i <= 4; i++) pips.append(el('i', i <= (TIER_RANK[deity.tier] ?? 1) ? '' : 'off'));
      meta.append(pips);
      card.append(meta, el('div', 'df-badge'), el('div', 'df-mark'));

      card.addEventListener('mouseenter', () => setHover(deity.id));
      card.addEventListener('mouseleave', () => setHover(null));
      card.addEventListener('focus', () => setHover(deity.id));
      card.addEventListener('blur', () => setHover(null));
      card.addEventListener('click', () => {
        selected = deity.id;
        toggle(deity.id);
      });
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selected = deity.id;
          toggle(deity.id);
        }
      });
      inner.append(card);
      cards.set(deity.id, card);
    }

    return { pantheon, layout, box, inner, cards, lines };
  }

  for (const pantheon of PANTHEON_ORDER) {
    if (roster.some((d) => d.pantheon === pantheon)) trees.set(pantheon, buildTree(pantheon));
  }

  const allCards = (): Map<DeityId, HTMLElement> => {
    const merged = new Map<DeityId, HTMLElement>();
    for (const tree of trees.values()) for (const [id, card] of tree.cards) merged.set(id, card);
    return merged;
  };
  const cards = allCards();

  // ---- focus: highlight a deity's family ------------------------------------------------------
  function applyFocus(): void {
    const focus = hovered ?? selected;
    const kin = focus === null ? new Set<DeityId>() : (adjacency.get(focus) ?? new Set<DeityId>());
    for (const tree of trees.values()) {
      const inTree = focus !== null && tree.cards.has(focus);
      tree.inner.classList.toggle('focusing', inTree);
      for (const [id, card] of tree.cards) {
        card.classList.toggle('focus', inTree && id === focus);
        card.classList.toggle('kin', inTree && kin.has(id));
      }
      for (const line of tree.lines) line.node.classList.toggle('hot', inTree && (line.from === focus || line.to === focus));
    }
    renderDossier(focus);
  }

  function setHover(id: DeityId | null): void {
    hovered = id;
    applyFocus();
  }

  // ---- dossier --------------------------------------------------------------------------------
  function renderDossier(id: DeityId | null): void {
    dossier.replaceChildren();
    const deity = id === null ? undefined : byId.get(id);
    if (deity === undefined) {
      dossier.append(el('h4', undefined, 'Dossier'));
      dossier.append(
        el('p', 'df-lore', 'Hover a deity to light up its family. Click to add it to your deck. Lines show who is bound to whom — and who will hesitate, or strike harder, when they meet.'),
      );
      return;
    }
    dossier.style.setProperty('--accent', REALM_ACCENT[deity.pantheon]);
    dossier.append(el('h2', undefined, deity.name));
    dossier.append(el('div', 'df-sub', `${REALM_LABEL[deity.pantheon]} · ${deity.tier}`));
    dossier.append(el('p', 'df-lore', unitLore(deity.id)));

    const stats = el('div', 'df-stats');
    const stat = (value: string, label: string): void => {
      const cell = el('div', 'df-stat');
      cell.append(el('b', undefined, value), el('span', undefined, label));
      stats.append(cell);
    };
    stat(String(deity.cost), 'Faith');
    stat(String(deity.hp), 'Health');
    stat(String(deity.damage), 'Damage');
    stat(String(deity.speed), 'Speed');
    stat(String(deity.armor), 'Armour');
    stat(String(deity.range), 'Reach');
    dossier.append(stats);

    const relations = graph.edges.filter((e) => e.from === deity.id || e.to === deity.id);
    if (relations.length === 0) {
      dossier.append(el('p', 'df-lore', 'No blood ties. Nothing in the family graph touches this one — it fights on statistics alone.'));
    } else {
      dossier.append(el('h4', undefined, 'Family and feuds'));
      const list = el('ul', 'df-rel');
      for (const edge of relations) {
        const { text, other } = describeRelation(deity.id, edge, nameOf);
        const li = el('li');
        li.style.setProperty('--c', KIND_STYLE[edge.kind].color);
        const details = el('details');
        const summary = el('summary', undefined, text);
        details.append(summary, el('p', undefined, pairLore(edge.from, edge.to, edge.kind)));
        li.append(details);
        li.addEventListener('mouseenter', () => setHover(other));
        li.addEventListener('mouseleave', () => setHover(null));
        list.append(li);
      }
      dossier.append(list);
    }

    // What this deity would do for or against the deck as it stands.
    const deck = resolve([...opening, ...reinforcements]).filter((d) => d.id !== deity.id);
    const lines: string[] = [];
    for (const mate of deck) {
      const names = new Set(
        [...resolveAuras(deity, [mate], [mate], graph), ...resolveAuras(mate, [deity], [deity], graph)].map((m) => m.name),
      );
      if (names.size > 0) lines.push(`with ${mate.name}: ${[...names].join(', ')}`);
    }
    if (phase === 'reinforce') {
      for (const foe of resolve(enemyOpening)) {
        const names = new Set(resolveCombat(deity, foe, graph).map((m) => m.name));
        if (names.size > 0) lines.push(`against ${foe.name}: ${[...names].join(', ')}`);
      }
    }
    if (lines.length > 0) {
      const deal = el('div', 'df-deal');
      deal.append(el('b', undefined, 'In your deck — '), document.createTextNode(lines.join(' · ')));
      dossier.append(deal);
    }
  }

  // ---- layout fitting -------------------------------------------------------------------------
  function visibleTrees(): Tree[] {
    return tab === 'openworld' ? [...trees.values()] : trees.has(tab) ? [trees.get(tab) as Tree] : [];
  }

  function fit(): void {
    const shown = visibleTrees();
    if (shown.length === 0) return;
    const widest = Math.max(...shown.map((t) => t.layout.width));
    const available = Math.max(320, viewport.clientWidth - 28);
    const scale = Math.max(0.5, Math.min(1.1, available / widest));
    for (const tree of shown) {
      tree.box.style.width = `${tree.layout.width * scale}px`;
      tree.box.style.height = `${tree.layout.height * scale}px`;
      tree.inner.style.transform = `scale(${scale})`;
    }
  }

  function renderTab(): void {
    overlay.style.setProperty('--accent', REALM_ACCENT[tab]);
    viewport.replaceChildren();
    if (tab === 'openworld') {
      for (const tree of trees.values()) {
        const section = el('div', 'df-section');
        section.style.setProperty('--c', REALM_ACCENT[tree.pantheon]);
        section.append(el('h3', undefined, `${REALM_LABEL[tree.pantheon]} family`), tree.box);
        viewport.append(section);
      }
    } else {
      const tree = trees.get(tab);
      if (tree !== undefined) viewport.append(tree.box);
    }
    for (const [id, { node }] of tabNodes) node.classList.toggle('on', id === tab);
    blurb.textContent = REALMS.find((r) => r.id === tab)?.blurb ?? '';
    fit();
    viewport.scrollTo({ top: 0, left: 0 });
    refresh();
  }

  function setTab(next: RealmId): void {
    tab = next;
    renderTab();
  }

  /** Shows either the mythology gateway or the family tree. */
  function renderView(): void {
    overlay.classList.toggle('gateway', view === 'gateway');
    if (view === 'gateway') {
      const deck = resolve([...opening, ...reinforcements]);
      for (const realm of REALMS) {
        const entry = thumbs.get(realm.id);
        if (entry === undefined) continue;
        const ctx = entry.canvas.getContext('2d');
        if (ctx !== null) drawBackdropScene(ctx, realm.id === 'openworld' ? 'openworld' : realm.id, 0);
        const n = realm.id === 'openworld' ? deck.length : deck.filter((d) => d.pantheon === realm.id).length;
        entry.count.textContent = n > 0 ? `${n} in your deck` : '';
      }
      gatewayClose.hidden = false;
    } else {
      renderTab();
    }
  }

  // ---- picking --------------------------------------------------------------------------------
  const picked = (): DeityId[] => (phase === 'opening' ? opening : reinforcements);
  const limit = (): number => (phase === 'opening' ? OPENING_SIZE : REINFORCEMENT_SIZE);

  /** The battlefield this deck will fight on. The city for the Open World tab or any mixed deck. */
  function stageFor(deck: readonly Deity[]): BackdropId {
    if (tab === 'openworld') return 'openworld';
    if (deck.length === 0) return tab;
    const found = new Set(deck.map((d) => d.pantheon));
    const only = [...found][0];
    return found.size === 1 && only !== undefined ? only : 'openworld';
  }

  function toggle(id: DeityId): void {
    if (phase === 'opening') {
      const i = opening.indexOf(id);
      if (i >= 0) opening.splice(i, 1);
      else if (opening.length < OPENING_SIZE) opening.push(id);
    } else {
      if (opening.includes(id)) return;
      const i = reinforcements.indexOf(id);
      if (i >= 0) reinforcements.splice(i, 1);
      else if (reinforcements.length < REINFORCEMENT_SIZE) reinforcements.push(id);
    }
    refresh();
    applyFocus();
  }

  function refresh(): void {
    step.textContent =
      phase === 'opening'
        ? `Step 1 of 2 — your opening (${opening.length}/${OPENING_SIZE})`
        : `Step 2 of 2 — reinforcements (${reinforcements.length}/${REINFORCEMENT_SIZE})`;
    instruction.textContent =
      phase === 'opening'
        ? 'Pick three to open with. They are revealed to your opponent and become your starting hand, so this also tells them which family you intend to fight as. They are choosing theirs blind, at the same time.'
        : 'Their opening is face up. Lock in six reinforcements knowing it. Share their pantheon and blood cuts both ways; go foreign and neither side can use it against the other, leaving a fight decided by raw statistics.';
    advance.textContent = phase === 'opening' ? 'Reveal openings' : 'Begin battle';
    advance.disabled = picked().length !== limit();
    const ready = !advance.disabled;
    nextBtn.disabled = advance.disabled;
    nextBtn.textContent = ready
      ? `${advance.textContent} →`
      : phase === 'opening'
        ? `Pick ${limit() - picked().length} more to open with`
        : `Pick ${limit() - picked().length} more reinforcements`;
    if (ready) {
      step.textContent += phase === 'opening' ? ' — complete. Reveal their opening to choose reinforcements.' : ' — complete. Ready to fight.';
    }

    const deckIds = [...opening, ...reinforcements];
    const deck = resolve(deckIds);
    const enemyDeities = resolve(enemyOpening);

    // Tabs: how many picks live in each realm.
    for (const [id, { count }] of tabNodes) {
      const n = id === 'openworld' ? deck.length : deck.filter((d) => d.pantheon === id).length;
      count.textContent = String(n);
    }

    // Cards.
    const chosen = picked();
    for (const [id, card] of cards) {
      const inOpening = opening.includes(id);
      const rIndex = reinforcements.indexOf(id);
      const inReinforcements = rIndex >= 0;
      card.classList.toggle('opening', inOpening);
      card.classList.toggle('picked', inReinforcements || (phase === 'opening' && inOpening));
      const selectable = !inOpening && !inReinforcements && chosen.length < limit();
      const open = phase === 'opening' ? !inOpening && chosen.length >= limit() : !inOpening && !inReinforcements && chosen.length >= limit();
      card.classList.toggle('disabled', !selectable && !inOpening && !inReinforcements && open);

      const mark = card.querySelector('.df-mark');
      if (mark instanceof HTMLElement) {
        const n = inOpening ? opening.indexOf(id) + 1 : inReinforcements ? OPENING_SIZE + rIndex + 1 : 0;
        mark.classList.toggle('on', n > 0);
        mark.textContent = n > 0 ? String(n) : '';
      }

      // In phase two, show what each candidate would trigger against the revealed opening.
      const badge = card.querySelector('.df-badge');
      if (badge instanceof HTMLElement) {
        const deity = byId.get(id);
        let text = '';
        if (phase === 'reinforce' && deity !== undefined && enemyDeities.length > 0) {
          const names = new Set<string>();
          for (const foe of enemyDeities) for (const mod of resolveCombat(deity, foe, graph)) names.add(mod.name);
          text = [...names].slice(0, 2).join(' · ');
        }
        badge.textContent = text;
        badge.classList.toggle('on', text !== '');
      }
    }

    // Tray.
    slots.forEach((slot, i) => {
      slot.replaceChildren();
      slot.className = 'df-slot';
      const id = deckIds[i];
      const deity = id === undefined ? undefined : byId.get(id);
      if (deity === undefined) {
        slot.textContent = String(i + 1);
        return;
      }
      slot.classList.add('filled');
      const locked = i < OPENING_SIZE && phase === 'reinforce';
      slot.classList.toggle('locked', locked);
      slot.append(portraitFor(deity, 58, 62), el('span', undefined, deity.name));
      slot.onclick = locked ? null : (): void => toggle(deity.id);
    });

    const target = stageFor(deck);
    stageNote.replaceChildren(
      document.createTextNode('The battle will be fought in '),
      el('b', undefined, REALM_LABEL[target]),
    );

    // Their opening.
    enemyPanel.replaceChildren(el('h4', undefined, 'Their opening'));
    const chips = el('div', 'df-chips');
    if (phase === 'opening') {
      for (let i = 0; i < OPENING_SIZE; i++) {
        const chip = el('div', 'df-chip down');
        const placeholder = el('canvas');
        placeholder.width = 76;
        placeholder.height = 62;
        placeholder.style.width = '76px';
        placeholder.style.height = '62px';
        chip.append(placeholder, el('div', 'df-empty', 'face down'));
        chips.append(chip);
      }
    } else {
      for (const deity of enemyDeities) {
        const chip = el('div', 'df-chip');
        chip.append(portraitFor(deity, 76, 62), el('div', undefined, deity.name));
        chip.addEventListener('mouseenter', () => setHover(deity.id));
        chip.addEventListener('mouseleave', () => setHover(null));
        chips.append(chip);
      }
    }
    enemyPanel.append(chips);

    // Analysis.
    analysis.replaceChildren(el('h4', undefined, 'Your deck'));
    const body = el('div', 'df-analysis');
    const pantheons = new Set(deck.map((d) => d.pantheon));
    if (phase === 'opening') {
      const within = bondsWithin(deck, graph);
      body.append(document.createTextNode(`Your opening holds ${within.length} bond${within.length === 1 ? '' : 's'}.`));
      if (deck.length > 0) {
        body.append(
          el(
            'span',
            'df-verdict',
            pantheons.size > 1
              ? 'A split opening reveals less about your intentions — and gives you less to build on.'
              : 'A committed opening. Strong, and it tells them exactly where to aim.',
          ),
        );
      }
    } else {
      const against = bondsBetween(deck, enemyDeities, graph);
      const shared = pantheonsOf(deckIds, roster).filter((p) => pantheonsOf(enemyOpening, roster).includes(p));
      body.append(
        document.createTextNode(
          `${against.length} relationship${against.length === 1 ? '' : 's'} would be live between your deck and their opening.`,
        ),
      );
      body.append(
        el(
          'span',
          'df-verdict',
          shared.length === 0
            ? 'No shared pantheon. Nothing either of you brings can be turned by blood — this will be settled on statistics alone.'
            : 'You share a pantheon. The graph is live, and it cuts in both directions.',
        ),
      );
      if (against.length > 0) {
        const list = el('ul', 'df-bonds');
        for (const bond of against.slice(0, 6)) list.append(el('li', undefined, bond.text));
        body.append(list);
      }
    }
    analysis.append(body);
  }

  // ---- background -----------------------------------------------------------------------------
  let raf = 0;
  const loop = (now: number): void => {
    drawBackdropScene(bgCtx, tab === 'openworld' ? 'openworld' : tab, now / 1000);
    raf = requestAnimationFrame(loop);
  };
  const open = (): void => {
    overlay.classList.add('open');
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    fit();
  };
  const shut = (): void => {
    overlay.classList.remove('open');
    cancelAnimationFrame(raf);
  };

  // ---- flow -----------------------------------------------------------------------------------
  const reset = (): void => {
    phase = 'opening';
    opening = [];
    reinforcements = [];
    enemyOpening = [];
    selected = null;
    view = 'gateway';
    renderView();
    refresh();
    applyFocus();
  };

  advance.addEventListener('click', () => {
    if (phase === 'opening') {
      // They chose blind, at the same time as you. Seeded so a given session is reproducible.
      enemyOpening = draftOpening(roster, graph, createRng(Date.now() & 0xffff));
      phase = 'reinforce';
      refresh();
      applyFocus();
      return;
    }
    const playerDeck = [...opening, ...reinforcements];
    // They answer your opening the same way you answered theirs.
    const enemyReinforcements = draftReinforcements(roster, graph, enemyOpening, opening);
    setSetting('deck', playerDeck);
    setSetting('opponentDeck', [...enemyOpening, ...enemyReinforcements]);
    setSetting('backdrop', stageFor(resolve(playerDeck)));
    onApply();
  });

  restart.addEventListener('click', reset);
  close.addEventListener('click', shut);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('open')) shut();
  });
  window.addEventListener('resize', () => {
    if (overlay.classList.contains('open')) fit();
  });

  button.addEventListener('click', () => {
    const saved = getSettings().deck;
    if (saved !== null && saved.length > 0) {
      opening = saved.slice(0, OPENING_SIZE);
      reinforcements = saved.slice(OPENING_SIZE);
      enemyOpening = (getSettings().opponentDeck ?? []).slice(0, OPENING_SIZE);
      phase = enemyOpening.length > 0 ? 'reinforce' : 'opening';
      const found = new Set(resolve(saved).map((d) => d.pantheon));
      const only = [...found][0];
      tab = found.size === 1 && only !== undefined ? only : found.size > 1 ? 'openworld' : tab;
    } else {
      reset();
    }
    view = saved !== null && saved.length > 0 ? 'tree' : 'gateway';
    open();
    renderView();
    applyFocus();
  });

  gatewayClose.addEventListener('click', shut);

  renderTab();
  document.body.append(button, overlay);

  // First launch: no deck yet, so the mythology gateway is the first thing you see.
  if (getSettings().deck === null) button.click();
}
