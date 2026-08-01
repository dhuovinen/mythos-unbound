/**
 * Runtime settings, persisted to localStorage.
 *
 * Read by the render layer every frame, so getSettings() must stay cheap — it returns the live
 * module-level object rather than parsing storage. Nothing in src/sim/ may import this: the
 * simulation must stay deterministic and independent of how the game happens to look.
 */

/** How units are drawn on the battlefield. */
export type UnitGraphics = 'blocks' | 'sprites';

export interface Settings {
  /** 'blocks' is the built-in placeholder geometry; 'sprites' uses art from art/roster/. */
  unitGraphics: UnitGraphics;
  /** Coloured arcs linking units that currently have a live relationship. */
  showTethers: boolean;
  /** The persistent pip row and net caret beneath each unit. */
  showStatusPips: boolean;
  /** Floating proc tags and damage numbers. */
  showFloatingText: boolean;
}

const STORAGE_KEY = 'theomachy.settings.v1';

const DEFAULTS: Settings = {
  unitGraphics: 'blocks',
  showTethers: true,
  showStatusPips: true,
  showFloatingText: true,
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
    if (record['unitGraphics'] === 'blocks' || record['unitGraphics'] === 'sprites') {
      current.unitGraphics = record['unitGraphics'];
    }
    for (const key of ['showTethers', 'showStatusPips', 'showFloatingText'] as const) {
      if (typeof record[key] === 'boolean') current[key] = record[key];
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
