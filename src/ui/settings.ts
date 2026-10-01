/**
 * Runtime settings, persisted to localStorage.
 *
 * Read by the render layer every frame, so getSettings() must stay cheap — it returns the live
 * module-level object rather than parsing storage. Nothing in src/sim/ may import this: the
 * simulation must stay deterministic and independent of how the game happens to look.
 */

/** How units are drawn on the battlefield. */
export type UnitGraphics = 'blocks' | 'sprites' | 'rig';

/** Which battlefield scene to draw. 'auto' follows the deck: one pantheon gets its realm, a mix gets the city. */
export type BackdropChoice = 'auto' | 'greek' | 'norse' | 'egyptian' | 'openworld';

export const BACKDROP_CHOICES: readonly BackdropChoice[] = ['auto', 'greek', 'norse', 'egyptian', 'openworld'];

export interface Settings {
  /** The battlefield scene. */
  backdrop: BackdropChoice;
  /** How much the backdrops are lightened, 0 (as painted) to 1 (as light as it goes). */
  backdropLight: number;
  /** 'blocks' is placeholder geometry; 'sprites' uses art from art/roster/; 'rig' draws animated figures in code. */
  unitGraphics: UnitGraphics;
  /** Coloured arcs linking units that currently have a live relationship. */
  showTethers: boolean;
  /** The persistent pip row and net caret beneath each unit. */
  showStatusPips: boolean;
  /** Floating proc tags and damage numbers. */
  showFloatingText: boolean;
  /** Append the underlying figures to the consultant's advice. Off = prose only. */
  quantifyAdvice: boolean;
  /** Let the opponent summon its own counters instead of only running the scripted timeline. */
  enemyAi: boolean;
  /** The player's drafted deck, opening first. Null means fall back to the stage default. */
  deck: string[] | null;
  /** The opponent's drafted deck, opening first. Null means it improvises from the full roster. */
  opponentDeck: string[] | null;
}

/** Deck size. Nine because summon shortcuts are the number keys 1-9. */
export const DECK_SIZE = 9;

const STORAGE_KEY = 'mythos-unbound.settings.v1';

const DEFAULTS: Settings = {
  backdrop: 'auto',
  backdropLight: 0.3,
  unitGraphics: 'blocks',
  showTethers: true,
  showStatusPips: true,
  showFloatingText: true,
  quantifyAdvice: false,
  enemyAi: true,
  deck: null,
  opponentDeck: null,
};

const current: Settings = { ...DEFAULTS };

/** Reads persisted settings over the defaults. Unknown or malformed values are ignored. */
function load(): void {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return; // storage can be unavailable (private mode, blocked cookies) — defaults are fine
  }
  if (raw === null) return;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return;
    const record = parsed as Record<string, unknown>;
    if (record['unitGraphics'] === 'blocks' || record['unitGraphics'] === 'sprites' || record['unitGraphics'] === 'rig') {
      current.unitGraphics = record['unitGraphics'];
    }
    const backdrop = record['backdrop'];
    if (BACKDROP_CHOICES.some((choice) => choice === backdrop)) current.backdrop = backdrop as BackdropChoice;
    const light = record['backdropLight'];
    if (typeof light === 'number' && Number.isFinite(light)) current.backdropLight = Math.min(1, Math.max(0, light));
    const flags = [
      'showTethers',
      'showStatusPips',
      'showFloatingText',
      'quantifyAdvice',
      'enemyAi',
    ] as const;
    for (const key of flags) {
      if (typeof record[key] === 'boolean') current[key] = record[key];
    }
    for (const key of ['deck', 'opponentDeck'] as const) {
      const value = record[key];
      if (Array.isArray(value) && value.every((id) => typeof id === 'string')) {
        current[key] = value.slice(0, DECK_SIZE);
      }
    }
  } catch {
    // corrupt payload — keep defaults rather than throwing during boot
  }
}

function persist(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // non-fatal: the setting still applies for this session
  }
}

load();

/** Live settings. Safe to call every frame; does not touch storage. */
export function getSettings(): Readonly<Settings> {
  return current;
}

/** Updates one setting and persists it. */
export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  current[key] = value;
  persist();
}
