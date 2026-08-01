/**
 * FROZEN CONTRACT — owned by WP-0 (integrator). No work package may edit this file.
 * Seeded PRNG (mulberry32). The sim never calls Math.random(); it receives one of these.
 */

import type { Rng } from './types';

/** Creates a deterministic Rng from a 32-bit seed. Same seed always yields the same sequence. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return {
    next(): number {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}
