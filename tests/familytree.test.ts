import { describe, expect, it } from 'vitest';
import { EGYPTIAN_DEITIES, EGYPTIAN_EDGES } from '../src/data/egyptian';
import { GREEK_DEITIES, GREEK_EDGES } from '../src/data/greek';
import { NORSE_DEITIES, NORSE_EDGES } from '../src/data/norse';
import { COL, layoutTree } from '../src/ui/familytree';

const PANTHEONS = [
  ['greek', GREEK_DEITIES, GREEK_EDGES],
  ['norse', NORSE_DEITIES, NORSE_EDGES],
  ['egyptian', EGYPTIAN_DEITIES, EGYPTIAN_EDGES],
] as const;

describe.each(PANTHEONS)('family tree layout — %s', (_name, deities, edges) => {
  const layout = layoutTree(deities, edges);
  const byId = new Map(layout.nodes.map((n) => [n.id, n]));

  it('places every deity exactly once', () => {
    expect(layout.nodes).toHaveLength(deities.length);
    expect(new Set(layout.nodes.map((n) => n.id)).size).toBe(deities.length);
  });

  it('puts every parent in a row above their child', () => {
    for (const e of edges.filter((x) => x.kind === 'parent')) {
      expect((byId.get(e.from) as { rank: number }).rank).toBeLessThan((byId.get(e.to) as { rank: number }).rank);
    }
  });

  it('keeps spouses and lovers level with each other', () => {
    for (const e of edges.filter((x) => x.kind === 'spouse' || x.kind === 'lover')) {
      expect((byId.get(e.from) as { rank: number }).rank).toBe((byId.get(e.to) as { rank: number }).rank);
    }
  });

  it('never overlaps two cards in a row', () => {
    for (const node of layout.nodes) {
      for (const other of layout.nodes) {
        if (node.id >= other.id || node.rank !== other.rank) continue;
        expect(Math.abs(node.x - other.x)).toBeGreaterThanOrEqual(COL - 0.01);
      }
    }
  });

  it('keeps every card inside the tree bounds', () => {
    for (const node of layout.nodes) {
      expect(node.x).toBeGreaterThan(0);
      expect(node.x).toBeLessThan(layout.width);
    }
  });

  it('is deterministic', () => {
    expect(layoutTree(deities, edges)).toEqual(layout);
  });
});

describe('family tree layout — chaff', () => {
  it('gives the blood-less units a row of their own beneath the family', () => {
    const layout = layoutTree(GREEK_DEITIES, GREEK_EDGES);
    expect(layout.kinlessRank).not.toBeNull();
    const chaff = layout.nodes.filter((n) => n.rank === layout.kinlessRank).map((n) => n.id);
    expect(chaff.sort()).toEqual(['harpy', 'hoplite', 'satyr']);
  });
});
