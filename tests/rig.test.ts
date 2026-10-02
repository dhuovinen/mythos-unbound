import { describe, expect, it } from 'vitest';
import { FIGURES, FIGURE_BY_ID, RIG_ROSTER, figureFor } from '../src/render/rig/figures';
import { ANIM_SECONDS } from '../src/render/rig/figure';
import { RECIPES } from '../src/render/rig/recipes';
import { animate } from '../src/render/rig/rig';
import { previewDuration, samplePreview } from '../src/render/rig/previewstate';

describe('full roster rig coverage', () => {
  it('provides exactly one named figure per game entity, without block fallbacks', () => {
    expect(new Set(FIGURES.map((f) => f.id)).size).toBe(RIG_ROSTER.length);
    expect(FIGURES).toHaveLength(RIG_ROSTER.length);
    for (const deity of RIG_ROSTER) {
      const figure = figureFor(deity, 'rig');
      expect(figure, deity.id).toBeDefined();
      expect(figure?.name).toBe(deity.name);
      expect(figure?.tier).toBe(deity.tier);
      expect(figureFor(deity, 'blocks')).toBeUndefined();
    }
  });
  it('preserves creature silhouettes across the three pantheons', () => {
    for (const id of ['typhon', 'jormungandr', 'apep']) expect(FIGURE_BY_ID.get(id)?.body).toBe('serpent');
    for (const id of ['fenrir', 'ammit']) expect(FIGURE_BY_ID.get(id)?.body).toBe('beast');
    for (const id of ['harpy', 'ba']) expect(FIGURE_BY_ID.get(id)?.body).toBe('flyer');
  });
  it('can sample every animation for every biped and holds the completed death pose', () => {
    for (const recipe of RECIPES) {
      for (const anim of ['idle', 'walk', 'attack', 'hit', 'death'] as const) {
        for (const t of [0, 0.2, 0.5, 1, 10]) {
          const sampled = animate(recipe, anim, t);
          expect(JSON.stringify(sampled)).not.toContain('null');
        }
      }
      expect(animate(recipe, 'death', 10)).toEqual(animate(recipe, 'death', ANIM_SECONDS.death));
      expect(animate(recipe, 'attack', 10)).toEqual(animate(recipe, 'attack', ANIM_SECONDS.attack));
    }
  });
  it('uses distinct pantheon cadence while keeping combat one-shots on the same clock', () => {
    const greek = RECIPES.find((r) => r.id === 'hoplite')!;
    const norse = RECIPES.find((r) => r.id === 'einherjar')!;
    const egyptian = RECIPES.find((r) => r.id === 'medjay')!;
    const poses = [greek, norse, egyptian].map((r) => JSON.stringify(animate(r, 'walk', 0.25).pose));
    expect(new Set(poses).size).toBe(3);
    for (const recipe of [greek, norse, egyptian]) {
      expect(animate(recipe, 'hit', ANIM_SECONDS.hit).flash).toBe(0);
      expect(animate(recipe, 'death', ANIM_SECONDS.death).fall).toBe(1.5);
    }
  });
});

describe('preview playback', () => {
  it('covers all five animations and wraps the full cycle exactly', () => {
    const duration = previewDuration('cycle');
    const seen = new Set(Array.from({ length: Math.ceil(duration * 100) }, (_, i) => samplePreview('cycle', i / 100).anim));
    expect([...seen]).toEqual(['idle', 'walk', 'attack', 'hit', 'death']);
    expect(samplePreview('cycle', duration)).toEqual({ anim: 'idle', t: 0 });
  });
  it('holds one-shot end frames before replaying, and retains fractional scrub precision', () => {
    for (const anim of ['attack', 'hit', 'death'] as const) {
      expect(samplePreview(anim, ANIM_SECONDS[anim] + 0.3)).toEqual({ anim, t: ANIM_SECONDS[anim] + 0.3 });
      expect(samplePreview(anim, previewDuration(anim))).toEqual({ anim, t: 0 });
    }
    expect(samplePreview('cycle', 5.25)).toEqual({ anim: 'attack', t: 0.25 });
  });
  it('keeps idle and walk phase continuous across playhead wraps', () => {
    expect(samplePreview('walk', 3.01)).toEqual({ anim: 'walk', t: 3.01 });
    expect(samplePreview('idle', 6.25)).toEqual({ anim: 'idle', t: 6.25 });
  });
});
