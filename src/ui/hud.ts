/**
 * Player HUD — faith meter and the cycling hand.
 *
 * The hand is what drives this layout. Only the summonable slots are large and interactive;
 * everything else is a small "next up" strip showing what is arriving and in what order. That
 * distinction is the tension the cycling deck exists to create — the counter you need may be
 * visible, and still two summons away.
 *
 * DOM nodes are built once and only mutated in update(), which runs every frame.
 */

import { HAND_SIZE } from '../sim/hand';
import type { HudHandle, MountHud } from '../sim/types';

let activeKeyHandler: ((event: KeyboardEvent) => void) | null = null;

/** What the field limits currently look like to the player, pushed in from the game loop. */
export interface FieldStatus {
  readonly units: number;
  readonly unitsMax: number;
  readonly heavy: number;
  readonly heavyMax: number;
  /** Per hand slot: why that card cannot be played right now, or null. */
  readonly blocked: readonly (string | null)[];
}

let applyFieldStatus: ((status: FieldStatus) => void) | null = null;

/** Updates the field counter and marks any summon card the limits are currently blocking. */
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
    .hud-blocked {
      position: absolute; left: 0; right: 0; bottom: 6px; text-align: center; font-size: 10px; font-weight: 800;
      letter-spacing: .6px; text-transform: uppercase; color: #e0614a; display: none;
    }
    .hud-slot.blocked .hud-blocked { display: block; }
    .hud-slot.blocked .hud-progress, .hud-slot.blocked .hud-pantheon { display: none; }
    .hud-hand { display: flex; gap: 10px; justify-content: center; align-items: stretch; }
    .hud-slot {
      position: relative; flex: 1 1 0; max-width: 200px; min-width: 118px;
      display: flex; flex-direction: column; align-items: center;
      background: #1a1616; border: 2px solid #3a3030; border-radius: 10px;
      padding: 10px 10px 13px; cursor: pointer; overflow: hidden;
      transition: transform .15s ease, border-color .15s ease, opacity .15s ease;
    }
    .hud-slot:hover:not(.disabled) { transform: translateY(-3px); border-color: #e8dcc4; }
    .hud-slot.disabled { opacity: .45; cursor: not-allowed; transform: none; }
    .hud-slot.tier-chaff { border-color: #7a8b9e; }
    .hud-slot.tier-demigod { border-color: #4fe3e0; }
    .hud-slot.tier-god { border-color: #c9a227; }
    .hud-slot.tier-titan { border-color: #c4442e; }
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
    .hud-next {
      display: flex; align-items: center; gap: 7px; justify-content: center;
      margin-top: 9px; flex-wrap: wrap;
    }
    .hud-next-label {
      text-transform: uppercase; letter-spacing: .6px; font-size: 10px; color: #6d6355;
    }
    .hud-next-item {
      padding: 3px 9px; border-radius: 4px; background: #161313;
      border: 1px solid #2b2620; color: #857a68; font-size: 11px;
    }
    .hud-next-item.first { border-color: #4a4038; color: #cabfa9; }
  `;
  document.head.append(style);
}

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className !== undefined) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

interface SlotRefs {
  readonly root: HTMLElement;
  readonly name: HTMLElement;
  readonly cost: HTMLElement;
  readonly pantheon: HTMLElement;
  readonly progress: HTMLElement;
  readonly blocked: HTMLElement;
}

/** Builds the faith bar and the cycling hand into `root`. */
export const mountHud: MountHud = (root, onSummonSlot) => {
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

  const handRow = el('div', 'hud-hand');
  container.append(handRow);

  const slots: SlotRefs[] = [];
  for (let i = 0; i < HAND_SIZE; i++) {
    const slot = el('div', 'hud-slot');
    const name = el('div', 'hud-name');
    const cost = el('div', 'hud-cost');
    const pantheon = el('div', 'hud-pantheon');
    const progress = el('div', 'hud-progress');
    progress.style.width = '0%';
    const blocked = el('div', 'hud-blocked');
    slot.append(el('div', 'hud-key', `${i + 1}`), name, cost, pantheon, blocked, progress);
    slot.addEventListener('click', () => onSummonSlot(i));
    handRow.append(slot);
    slots.push({ root: slot, name, cost, pantheon, progress, blocked });
  }

  const nextRow = el('div', 'hud-next');
  nextRow.append(el('span', 'hud-next-label', 'Next up'));
  const nextItems: HTMLElement[] = [];
  for (let i = 0; i < 4; i++) {
    const item = el('span', 'hud-next-item');
    nextRow.append(item);
    nextItems.push(item);
  }
  container.append(nextRow);

  const handleKeyDown = (event: KeyboardEvent): void => {
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    ) {
      return;
    }
    const index = Number.parseInt(event.key, 10) - 1;
    if (Number.isInteger(index) && index >= 0 && index < HAND_SIZE) onSummonSlot(index);
  };
  activeKeyHandler = handleKeyDown;
  window.addEventListener('keydown', handleKeyDown);

  applyFieldStatus = (status): void => {
    const unitsFull = status.units >= status.unitsMax;
    const heavyFull = status.heavy >= status.heavyMax;
    fieldInfo.innerHTML = `<span>Field <b class="${unitsFull ? 'full' : ''}">${status.units}/${status.unitsMax}</b></span><span>Gods &amp; titans <b class="${heavyFull ? 'full' : ''}">${status.heavy}/${status.heavyMax}</b></span>`;
    slots.forEach((refs, i) => {
      const reason = status.blocked[i] ?? null;
      refs.root.classList.toggle('blocked', reason !== null);
      refs.blocked.textContent = reason ?? '';
    });
  };

  let lastSlotIds = '';
  let lastQueueIds = '';

  const handle: HudHandle = {
    update(world, handSlots, queued): void {
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

      // Slot contents only change when the hand cycles, so skip the DOM work otherwise.
      const slotIds = handSlots.map((d) => d.id).join(',');
      if (slotIds !== lastSlotIds) {
        lastSlotIds = slotIds;
        slots.forEach((refs, i) => {
          const deity = handSlots[i];
          if (deity === undefined) {
            refs.root.style.visibility = 'hidden';
            return;
          }
          refs.root.style.visibility = '';
          refs.root.className = `hud-slot tier-${deity.tier}`;
          refs.name.textContent = deity.name;
          refs.cost.textContent = `${deity.cost} faith`;
          refs.pantheon.textContent = deity.pantheon;
        });
      }

      const queueIds = queued.map((d) => d.id).join(',');
      if (queueIds !== lastQueueIds) {
        lastQueueIds = queueIds;
        nextItems.forEach((item, i) => {
          const deity = queued[i];
          item.textContent = deity === undefined ? '' : deity.name;
          item.style.display = deity === undefined ? 'none' : '';
          item.className = `hud-next-item${i === 0 ? ' first' : ''}`;
        });
      }

      // Affordability shifts continuously, so this part does run every frame.
      slots.forEach((refs, i) => {
        const deity = handSlots[i];
        if (deity === undefined) return;
        const affordable = !over && world.faith >= deity.cost && !refs.root.classList.contains('blocked');
        refs.root.classList.toggle('disabled', !affordable);
        refs.progress.style.width = `${Math.min(100, (world.faith / deity.cost) * 100)}%`;
      });
    },
  };

  return handle;
};
