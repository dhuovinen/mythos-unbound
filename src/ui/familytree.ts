/**
 * Family-tree layout for the team picker.
 *
 * Pure geometry: given one pantheon's deities and edges, decides which row each deity sits in and
 * where along it. Parents sit above their children; spouses and lovers share a row, side by side;
 * deities with no blood ties at all (the chaff) get a row of their own at the bottom.
 *
 * No DOM here, so it is testable and the renderer stays a thin drawing layer.
 */

import type { Deity, DeityId, Edge } from '../sim/types';

/** Card footprint in layout units; the renderer uses the same numbers. */
export const CARD_W = 96;
export const CARD_H = 124;
export const COL = CARD_W + 16;
export const ROW = CARD_H + 64;
const PAD = 20;

export interface TreeNode {
  readonly id: DeityId;
  readonly rank: number;
  /** Horizontal centre. */
  readonly x: number;
  /** Top edge. */
  readonly y: number;
}

export interface TreeLayout {
  readonly nodes: readonly TreeNode[];
  readonly width: number;
  readonly height: number;
  /** The rank of the row holding deities without blood ties, or null if there are none. */
  readonly kinlessRank: number | null;
}

const isSpousal = (kind: Edge['kind']): boolean => kind === 'spouse' || kind === 'lover';

export function layoutTree(deities: readonly Deity[], allEdges: readonly Edge[]): TreeLayout {
  const known = new Set(deities.map((d) => d.id));
  const edges = allEdges.filter((e) => known.has(e.from) && known.has(e.to));

  const parentsOf = new Map<DeityId, DeityId[]>();
  const childrenOf = new Map<DeityId, DeityId[]>();
  const touched = new Set<DeityId>();
  for (const e of edges) {
    touched.add(e.from);
    touched.add(e.to);
    if (e.kind !== 'parent') continue;
    (parentsOf.get(e.to) ?? parentsOf.set(e.to, []).get(e.to))?.push(e.from);
    (childrenOf.get(e.from) ?? childrenOf.set(e.from, []).get(e.from))?.push(e.to);
  }

  const bound = deities.filter((d) => touched.has(d.id));
  const kinless = deities.filter((d) => !touched.has(d.id));

  // ---- ranks: parents above children, spouses level -------------------------------------------
  const rank = new Map<DeityId, number>(bound.map((d) => [d.id, 0]));
  const get = (id: DeityId): number => rank.get(id) ?? 0;
  for (let pass = 0; pass < 40; pass++) {
    let changed = false;
    for (const e of edges) {
      if (e.kind === 'parent') {
        const want = get(e.from) + 1;
        if (get(e.to) < want) {
          rank.set(e.to, want);
          changed = true;
        }
      } else if (isSpousal(e.kind)) {
        const level = Math.max(get(e.from), get(e.to));
        if (get(e.from) !== level || get(e.to) !== level) {
          rank.set(e.from, level);
          rank.set(e.to, level);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  // Deities known only through feuds and killings sit level with whoever they are tied to, rather
  // than all piling into the top row.
  for (const d of bound) {
    const structural =
      (parentsOf.get(d.id)?.length ?? 0) > 0 ||
      (childrenOf.get(d.id)?.length ?? 0) > 0 ||
      edges.some((e) => isSpousal(e.kind) && (e.from === d.id || e.to === d.id));
    if (structural) continue;
    const neighbours = edges
      .filter((e) => e.from === d.id || e.to === d.id)
      .map((e) => (e.from === d.id ? e.to : e.from));
    const ranks = neighbours.map(get);
    if (ranks.length > 0) rank.set(d.id, Math.round(ranks.reduce((a, b) => a + b, 0) / ranks.length));
  }

  // Close up any empty rows.
  const used = [...new Set(bound.map((d) => get(d.id)))].sort((a, b) => a - b);
  const compact = new Map(used.map((r, i) => [r, i]));
  for (const d of bound) rank.set(d.id, compact.get(get(d.id)) ?? 0);

  const rowCount = used.length;
  const rows: DeityId[][] = Array.from({ length: rowCount }, () => []);
  for (const d of bound) (rows[get(d.id)] as DeityId[]).push(d.id);
  const kinlessRank = kinless.length > 0 ? rowCount : null;
  if (kinlessRank !== null) rows.push(kinless.map((d) => d.id));

  // ---- order within rows: barycentre sweeps to untangle the lines -----------------------------
  const position = new Map<DeityId, number>();
  const reindex = (): void => rows.forEach((row) => row.forEach((id, i) => position.set(id, i)));
  reindex();

  const lateral = new Map<DeityId, DeityId[]>();
  for (const e of edges) {
    if (e.kind === 'parent') continue;
    (lateral.get(e.from) ?? lateral.set(e.from, []).get(e.from))?.push(e.to);
    (lateral.get(e.to) ?? lateral.set(e.to, []).get(e.to))?.push(e.from);
  }

  const barycentre = (id: DeityId, anchors: readonly DeityId[]): number => {
    if (anchors.length === 0) return position.get(id) ?? 0;
    return anchors.reduce((sum, a) => sum + (position.get(a) ?? 0), 0) / anchors.length;
  };

  for (let sweep = 0; sweep < 6; sweep++) {
    const down = sweep % 2 === 0;
    const order = down ? [...rows.keys()] : [...rows.keys()].reverse();
    for (const r of order) {
      const row = rows[r] as DeityId[];
      if (r === kinlessRank) continue;
      const keyed = row.map((id) => {
        const anchors = down ? (parentsOf.get(id) ?? []) : (childrenOf.get(id) ?? []);
        const same = (lateral.get(id) ?? []).filter((o) => get(o) === r);
        return { id, key: barycentre(id, [...anchors, ...same.slice(0, 1)]) };
      });
      keyed.sort((a, b) => a.key - b.key);
      rows[r] = keyed.map((k) => k.id);
      reindex();
    }
  }

  // Spouses and lovers stand next to each other.
  for (const e of edges) {
    if (!isSpousal(e.kind)) continue;
    const r = get(e.from);
    if (r !== get(e.to)) continue;
    const row = rows[r] as DeityId[];
    const a = row.indexOf(e.from);
    const b = row.indexOf(e.to);
    if (Math.abs(a - b) === 1) continue;
    const [keep, move] = a < b ? [e.from, e.to] : [e.to, e.from];
    row.splice(row.indexOf(move), 1);
    row.splice(row.indexOf(keep) + 1, 0, move);
  }
  reindex();

  // ---- x: centre parents over children without ever reordering a row --------------------------
  const x = new Map<DeityId, number>();
  for (const row of rows) row.forEach((id, i) => x.set(id, i * COL));

  const settle = (r: number, anchorsOf: (id: DeityId) => readonly DeityId[]): void => {
    const row = rows[r] as DeityId[];
    const ideal = row.map((id) => {
      const anchors = anchorsOf(id);
      return anchors.length === 0 ? (x.get(id) ?? 0) : anchors.reduce((s, a) => s + (x.get(a) ?? 0), 0) / anchors.length;
    });
    const placed = ideal.slice();
    for (let i = 1; i < placed.length; i++) placed[i] = Math.max(placed[i] as number, (placed[i - 1] as number) + COL);
    // Shift the packed row back toward where it wanted to be.
    const drift = ideal.reduce((s, v, i) => s + (v - (placed[i] as number)), 0) / Math.max(1, placed.length);
    row.forEach((id, i) => x.set(id, (placed[i] as number) + drift));
  };
  for (let pass = 0; pass < 3; pass++) {
    for (let r = 1; r < rows.length; r++) if (r !== kinlessRank) settle(r, (id) => parentsOf.get(id) ?? []);
    for (let r = rows.length - 1; r >= 0; r--) if (r !== kinlessRank) settle(r, (id) => childrenOf.get(id) ?? []);
  }

  // Centre the unbound row under the rest.
  const nodesBound = bound.map((d) => x.get(d.id) ?? 0);
  const boundMin = nodesBound.length > 0 ? Math.min(...nodesBound) : 0;
  const boundMax = nodesBound.length > 0 ? Math.max(...nodesBound) : 0;
  if (kinlessRank !== null) {
    const row = rows[kinlessRank] as DeityId[];
    const span = (row.length - 1) * COL;
    const start = (boundMin + boundMax) / 2 - span / 2;
    row.forEach((id, i) => x.set(id, start + i * COL));
  }

  // ---- normalise ------------------------------------------------------------------------------
  const all = [...x.values()];
  const minX = Math.min(...all);
  const maxX = Math.max(...all);
  const offset = PAD + CARD_W / 2 - minX;
  const nodes: TreeNode[] = [];
  rows.forEach((row, r) => {
    for (const id of row) nodes.push({ id, rank: r, x: (x.get(id) ?? 0) + offset, y: PAD + r * ROW });
  });

  return {
    nodes,
    width: maxX - minX + CARD_W + PAD * 2,
    height: PAD * 2 + (rows.length - 1) * ROW + CARD_H,
    kinlessRank,
  };
}
