/**
 * Player HUD — faith meter and one summon card per deck member.
 *
 * Every drafted unit is on offer for the whole battle. Number keys 1–9 follow draft order, the same
 * order the cards are listed in. A card greys out with its reason when the player cannot afford it
 * or the field limits block it, so the only questions are what to summon and when.
 *
 * DOM nodes are built once and only mutated in update(), which runs every frame.
 */

import { DRAFT_DECK_SIZE } from '../sim/draft';
import type { HudHandle, MountHud } from '../sim/types';

/** Number keys 1–9 reach this many cards; any beyond are click-only. */
const KEYED_CARDS = Math.min(9, DRAFT_DECK_SIZE);

let activeKeyHandler: ((event: KeyboardEvent) => void) | null = null;

/** What the field limits currently look like to the player, pushed in from the game loop. */
export interface FieldStatus {
  readonly units: number;
  readonly unitsMax: number;
  readonly heavy: number;
  readonly heavyMax: number;
  /** Per deck index: which field limit blocks that card right now, or null. */
  readonly blocked: readonly (string | null)[];
}

let applyFieldStatus: ((status: FieldStatus) => void) | null = null;

/** Updates the field counter and the field-limit reasons the cards show. Call before update(). */
export function setFieldStatus(status: FieldStatus): void {
  applyFieldStatus?.(status);
}

function ensureStyles(): void {
  if (document.getElementById('hud-styles') !== null) return;
  const style = document.createElement('style');
  style.id = 'hud-styles';
  style.textContent = `
    .hud-container {
      display: flex; flex-direction: column; width: 100%; box-sizing: border-box;
      font-family: ui-sans-serif, system-ui, sans-serif; color: #e8dcc4; user-select: none;
    }
    .hud-banner {
      text-align: center; font-size: 20px; font-weight: 800; padding: 9px 16px;
      border-radius: 8px; margin-bottom: 10px; letter-spacing: 2px; text-transform: uppercase;
    }
    .hud-banner.victory { background: rgba(201,162,39,.15); color: #c9a227; border: 2px solid #c9a227; }
    .hud-banner.defeat { background: rgba(196,68,46,.15); color: #c4442e; border: 2px solid #c4442e; }
    .hud-faith-wrap {
      background: #1a1616; border: 1px solid #3a3030; border-radius: 8px;
      padding: 9px 14px; margin-bottom: 10px;
    }
    .hud-faith-header {
      display: flex; justify-content: space-between; align-items: center;
      font-weight: 700; font-size: 13px; margin-bottom: 5px;
    }
    .hud-faith-track {
      width: 100%; height: 9px; background: #0a0808; border-radius: 5px;
      overflow: hidden; border: 1px solid #2a2020;
    }
    .hud-faith-fill {
      height: 100%; background: linear-gradient(90deg, #8C2F20, #c9a227);
      border-radius: 5px; transition: width .1s linear;
    }
    .hud-field { font-weight: 600; font-size: 12px; color: #a99c85; }
    .hud-field b { color: #e8dcc4; }
    .hud-field .full { color: #e0614a; }
    .hud-reason {
      position: absolute; left: 0; right: 0; bottom: 6px; text-align: center; font-size: 10px; font-weight: 800;
      letter-spacing: .6px; text-transform: uppercase; color: #a99c85; display: none;
    }
    .hud-card.blocked .hud-reason { color: #e0614a; }
    .hud-card.blocked .hud-reason, .hud-card.short .hud-reason { display: block; }
    .hud-card.blocked .hud-progress, .hud-card.blocked .hud-pantheon,
    .hud-card.short .hud-pantheon { display: none; }
    .hud-cards { display: flex; gap: 10px; justify-content: center; align-items: stretch; flex-wrap: wrap; }
    .hud-card {
      position: relative; flex: 1 1 0; max-width: 200px; min-width: 118px;
      display: flex; flex-direction: column; align-items: center;
      background: #1a1616; border: 2px solid #3a3030; border-radius: 10px;
      padding: 10px 10px 13px; cursor: pointer; overflow: hidden;
      transition: transform .15s ease, border-color .15s ease, opacity .15s ease;
    }
    .hud-card:hover:not(.disabled) { transform: translateY(-3px); border-color: #e8dcc4; }
    .hud-card.disabled { opacity: .45; cursor: not-allowed; transform: none; }
    .hud-card.tier-chaff { border-color: #7a8b9e; }
    .hud-card.tier-demigod { border-color: #4fe3e0; }
    .hud-card.tier-god { border-color: #c9a227; }
    .hud-card.tier-titan { border-color: #c4442e; }
    .hud-key {
      position: absolute; top: 5px; left: 7px; font-size: 10px; font-weight: 700;
      background: rgba(0,0,0,.7); padding: 1px 6px; border-radius: 3px;
      border: 1px solid rgba(255,255,255,.15);
    }
    .hud-name { font-weight: 700; font-size: 15px; margin-top: 14px; text-align: center; }
    .hud-cost { font-size: 12px; margin-top: 2px; color: #cabfa9; }
    .hud-pantheon {
      font-size: 9px; text-transform: uppercase; letter-spacing: .7px; color: #857a68; margin-top: 3px;
    }
    .hud-progress {
      position: absolute; bottom: 0; left: 0; height: 3px;
      background: #c9a227; transition: width .1s linear;
    }
  `;
  document.head.append(style);
}

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className !== undefined) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

interface CardRefs {
  readonly root: HTMLElement;
  readonly progress: HTMLElement;
  readonly reason: HTMLElement;
  /** Last reason text written, so the DOM is only touched when it changes. */
  shown: string;
}

/** Builds the faith bar and the deck's summon cards into `root`. */
export const mountHud: MountHud = (root, deck, onSummon) => {
  root.replaceChildren();
  ensureStyles();

  if (activeKeyHandler !== null) {
    window.removeEventListener('keydown', activeKeyHandler);
    activeKeyHandler = null;
  }

  const container = el('div', 'hud-container');
  root.append(container);

  const banner = el('div', 'hud-banner');
  banner.style.display = 'none';
  container.append(banner);

  const faithWrap = el('div', 'hud-faith-wrap');
  const faithHeader = el('div', 'hud-faith-header');
  const faithText = el('span', undefined, 'Faith: 0 / 0');
  const faithRegen = el('span', undefined, '+0.0/s');
  const fieldInfo = el('span', 'hud-field');
  faithHeader.append(faithText, fieldInfo, faithRegen);
  const faithTrack = el('div', 'hud-faith-track');
  const faithFill = el('div', 'hud-faith-fill');
  faithFill.style.width = '0%';
  faithTrack.append(faithFill);
  faithWrap.append(faithHeader, faithTrack);
  container.append(faithWrap);

  const cardRow = el('div', 'hud-cards');
  container.append(cardRow);

  const cards: CardRefs[] = deck.map((deity, i) => {
    const card = el('div', `hud-card tier-${deity.tier}`);
    const progress = el('div', 'hud-progress');
    progress.style.width = '0%';
    const reason = el('div', 'hud-reason');
    if (i < KEYED_CARDS) card.append(el('div', 'hud-key', `${i + 1}`));
    card.append(
      el('div', 'hud-name', deity.name),
      el('div', 'hud-cost', `${deity.cost} faith`),
      el('div', 'hud-pantheon', deity.pantheon),
      reason,
      progress,
    );
    card.addEventListener('click', () => onSummon(i));
    cardRow.append(card);
    return { root: card, progress, reason, shown: '' };
  });

  const handleKeyDown = (event: KeyboardEvent): void => {
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      event.repeat || event.metaKey || event.ctrlKey || event.altKey
    ) {
      return;
    }
    if (!/^[1-9]$/.test(event.key)) return;
    const index = Number(event.key) - 1;
    if (index < Math.min(deck.length, KEYED_CARDS)) onSummon(index);
  };
  activeKeyHandler = handleKeyDown;
  window.addEventListener('keydown', handleKeyDown);

  let blockedBy: readonly (string | null)[] = [];
  applyFieldStatus = (status): void => {
    const unitsFull = status.units >= status.unitsMax;
    const heavyFull = status.heavy >= status.heavyMax;
    fieldInfo.innerHTML = `<span>Field <b class="${unitsFull ? 'full' : ''}">${status.units}/${status.unitsMax}</b></span><span>Gods &amp; titans <b class="${heavyFull ? 'full' : ''}">${status.heavy}/${status.heavyMax}</b></span>`;
    blockedBy = status.blocked;
  };

  const handle: HudHandle = {
    update(world): void {
      faithText.textContent = `Faith: ${Math.floor(world.faith)} / ${world.faithMax}`;
      faithRegen.textContent = `+${world.faithRegen.toFixed(1)}/s`;
      faithFill.style.width = `${Math.min(100, (world.faith / world.faithMax) * 100)}%`;

      const over = world.outcome !== 'ongoing';
      if (over) {
        banner.style.display = 'block';
        banner.className = `hud-banner ${world.outcome}`;
        banner.textContent =
          world.outcome === 'victory' ? 'Victory — the enemy base has fallen' : 'Defeat — your base has fallen';
      } else {
        banner.style.display = 'none';
      }

      // Affordability and field limits shift continuously, so this runs every frame.
      cards.forEach((refs, i) => {
        const deity = deck[i];
        if (deity === undefined) return;
        const blocked = over ? null : (blockedBy[i] ?? null);
        const shortBy = Math.ceil(deity.cost - world.faith);
        const short = !over && blocked === null && shortBy > 0;
        const text = blocked ?? (short ? `${shortBy} faith short` : '');
        if (text !== refs.shown) {
          refs.shown = text;
          refs.reason.textContent = text;
        }
        refs.root.classList.toggle('blocked', blocked !== null);
        refs.root.classList.toggle('short', short);
        refs.root.classList.toggle('disabled', over || blocked !== null || short);
        refs.progress.style.width = `${Math.min(100, (world.faith / deity.cost) * 100)}%`;
      });
    },
  };

  return handle;
};
