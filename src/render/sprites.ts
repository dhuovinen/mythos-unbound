/**
 * Sprite loader for the production roster art (WP-9).
 *
 * The art does not exist yet, so every path here is written to degrade quietly: a missing sprite
 * is a normal state, not an error. Units without one fall back to placeholder geometry
 * individually, which means a half-delivered roster still renders a playable battlefield.
 */

/** Where WP-9 delivers its output. Filenames match deity ids exactly. */
const SPRITE_DIR = '/art/roster';

type LoadState = 'pending' | 'ready' | 'missing';

interface Entry {
  state: LoadState;
  image: HTMLImageElement | null;
}

const entries = new Map<string, Entry>();

/** Begins loading a sprite for each id. Safe to call repeatedly; each id is fetched once. */
export function preloadSprites(ids: readonly string[]): void {
  for (const id of ids) {
    if (entries.has(id)) continue;

    const entry: Entry = { state: 'pending', image: null };
    entries.set(id, entry);

    const image = new Image();
    image.onload = (): void => {
      entry.state = 'ready';
      entry.image = image;
    };
    image.onerror = (): void => {
      // Expected until WP-9 lands. Not logged: 22 console errors on every boot is worse than silence.
      entry.state = 'missing';
    };
    image.src = `${SPRITE_DIR}/${id}.png`;
  }
}

/** The loaded sprite for a deity, or null if it is still loading or does not exist. */
export function getSprite(id: string): HTMLImageElement | null {
  const entry = entries.get(id);
  return entry !== undefined && entry.state === 'ready' ? entry.image : null;
}

/** How many requested sprites actually resolved. Drives the readout in the settings panel. */
export function spriteStats(): { ready: number; missing: number; pending: number; total: number } {
  let ready = 0;
  let missing = 0;
  let pending = 0;
  for (const entry of entries.values()) {
    if (entry.state === 'ready') ready++;
    else if (entry.state === 'missing') missing++;
    else pending++;
  }
  return { ready, missing, pending, total: entries.size };
}
