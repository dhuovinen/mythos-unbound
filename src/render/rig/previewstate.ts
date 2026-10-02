import type { AnimName } from './figure';
import { ANIM_SECONDS } from './figure';

export type PreviewAnimation = AnimName | 'cycle';
export const PREVIEW_CYCLE: readonly { anim: AnimName; seconds: number }[] = [
  { anim: 'idle', seconds: 2 }, { anim: 'walk', seconds: 3 },
  { anim: 'attack', seconds: 1.4 }, { anim: 'hit', seconds: 0.92 }, { anim: 'death', seconds: 1.6 },
];
export const previewDuration = (anim: PreviewAnimation): number => anim === 'cycle'
  ? PREVIEW_CYCLE.reduce((sum, part) => sum + part.seconds, 0)
  : anim === 'idle' || anim === 'walk' ? 3 : ANIM_SECONDS[anim] + 0.7;

/** One playhead drives both previews. One-shots hold their end pose before repeating. */
export function samplePreview(anim: PreviewAnimation, seconds: number): { anim: AnimName; t: number } {
  if (anim === 'idle' || anim === 'walk') return { anim, t: Math.max(0, seconds) };
  let t = Math.max(0, seconds) % previewDuration(anim);
  if (anim !== 'cycle') return { anim, t };
  for (const part of PREVIEW_CYCLE) {
    if (t < part.seconds) return { anim: part.anim, t };
    t -= part.seconds;
  }
  return { anim: 'idle', t: 0 };
}
