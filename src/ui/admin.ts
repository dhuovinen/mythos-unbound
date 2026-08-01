/**
 * Admin panel — the gear button.
 *
 * Runtime toggles for how the battlefield is drawn. Deliberately view-only: nothing here touches
 * the simulation, so flipping a switch can never change how a battle plays out, only how it looks.
 */

import { spriteStats } from '../render/sprites';
import type { Settings, UnitGraphics } from './settings';
import { getSettings, setSetting } from './settings';

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className !== undefined) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function styles(): string {
  return `
  #admin-open {
    position: fixed; top: 16px; right: 66px; z-index: 40;
    width: 40px; height: 40px; border-radius: 50%;
    background: #1a1616; color: #a99c85; border: 2px solid #4a4038;
    font: 700 18px ui-sans-serif, system-ui, sans-serif; cursor: pointer; line-height: 1;
    box-shadow: 0 4px 12px rgba(0,0,0,.5); transition: transform .15s ease, border-color .15s ease, color .15s ease;
  }
  #admin-open:hover { transform: rotate(45deg) scale(1.08); border-color: #c9a227; color: #c9a227; }
  #admin-panel {
    position: fixed; top: 66px; right: 16px; z-index: 45; width: 320px; max-width: calc(100vw - 32px);
    display: none; background: #17141a; border: 1px solid #3a3229; border-radius: 12px;
    padding: 16px 18px 18px; color: #e8dcc4; font-family: ui-sans-serif, system-ui, sans-serif;
    box-shadow: 0 16px 40px rgba(0,0,0,.6);
  }
  #admin-panel.open { display: block; }
  .ad-title { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
  .ad-title h2 { margin: 0; font-size: 15px; letter-spacing: .4px; color: #c9a227; }
  .ad-title button { background: none; border: none; color: #6d6355; cursor: pointer; font-size: 15px; padding: 0 2px; }
  .ad-title button:hover { color: #e8dcc4; }
  .ad-sub { margin: 0 0 14px; font-size: 11.5px; color: #6d6355; }
  .ad-group { margin-top: 14px; }
  .ad-label { font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: #a99c85; margin-bottom: 6px; }
  .ad-seg { display: flex; border: 1px solid #3a3229; border-radius: 8px; overflow: hidden; }
  .ad-seg button {
    flex: 1; background: #0f0d0d; border: none; color: #a99c85; cursor: pointer;
    padding: 8px 6px; font-size: 12.5px; font-weight: 700; font-family: inherit;
  }
  .ad-seg button + button { border-left: 1px solid #3a3229; }
  .ad-seg button.on { background: #c9a227; color: #17141a; }
  .ad-seg button:not(.on):hover { background: #1d1913; color: #e8dcc4; }
  .ad-note { margin-top: 7px; font-size: 11.5px; line-height: 1.45; color: #6d6355; }
  .ad-note.warn { color: #c98a27; }
  .ad-row {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 7px 0; border-bottom: 1px solid #241f26;
  }
  .ad-row:last-child { border-bottom: none; }
  .ad-row span { font-size: 13px; color: #cabfa9; }
  .ad-switch {
    position: relative; width: 38px; height: 21px; border-radius: 11px; flex: 0 0 auto;
    background: #2b2620; border: 1px solid #3a3229; cursor: pointer; transition: background .15s ease;
  }
  .ad-switch::after {
    content: ''; position: absolute; top: 2px; left: 2px; width: 15px; height: 15px;
    border-radius: 50%; background: #6d6355; transition: transform .15s ease, background .15s ease;
  }
  .ad-switch.on { background: #3d3216; border-color: #c9a227; }
  .ad-switch.on::after { transform: translateX(17px); background: #c9a227; }
  `;
}

type ToggleKey = Exclude<keyof Settings, 'unitGraphics'>;

/** Builds the gear button and the admin panel, and wires up every control. */
export function mountAdminPanel(): void {
  if (document.getElementById('admin-open') !== null) return;

  const style = el('style');
  style.textContent = styles();
  document.head.append(style);

  const button = el('button', undefined, '⚙');
  button.id = 'admin-open';
  button.setAttribute('aria-label', 'Open display settings');

  const panel = el('div');
  panel.id = 'admin-panel';

  const title = el('div', 'ad-title');
  title.append(el('h2', undefined, 'Display settings'));
  const close = el('button', undefined, '✕');
  close.setAttribute('aria-label', 'Close settings');
  title.append(close);
  panel.append(title);
  panel.append(el('p', 'ad-sub', 'View only — none of this changes how a battle plays out.'));

  // ---- unit graphics ------------------------------------------------------
  const group = el('div', 'ad-group');
  group.append(el('div', 'ad-label', 'Unit graphics'));

  const seg = el('div', 'ad-seg');
  const options: readonly { value: UnitGraphics; label: string }[] = [
    { value: 'blocks', label: 'Blocks' },
    { value: 'sprites', label: 'Sprites' },
  ];
  const note = el('div', 'ad-note');

  const refreshNote = (): void => {
    const stats = spriteStats();
    if (getSettings().unitGraphics === 'blocks') {
      note.className = 'ad-note';
      note.textContent = 'Placeholder geometry: tier-sized shapes with each unit’s initial.';
      return;
    }
    if (stats.ready === 0) {
      note.className = 'ad-note warn';
      note.textContent = `No sprites found in art/roster/ (${stats.total} expected). Every unit is falling back to blocks — deliver WP-9 to populate them.`;
    } else if (stats.ready < stats.total) {
      note.className = 'ad-note warn';
      note.textContent = `${stats.ready} of ${stats.total} sprites loaded. Units without one fall back to blocks individually.`;
    } else {
      note.className = 'ad-note';
      note.textContent = `All ${stats.total} sprites loaded from art/roster/.`;
    }
  };

  const buttons = options.map((option) => {
    const optionButton = el('button', undefined, option.label);
    optionButton.addEventListener('click', () => {
      setSetting('unitGraphics', option.value);
      sync();
    });
    seg.append(optionButton);
    return { option, node: optionButton };
  });
  group.append(seg, note);
  panel.append(group);

  // ---- overlay toggles ----------------------------------------------------
  const overlays = el('div', 'ad-group');
  overlays.append(el('div', 'ad-label', 'Relational overlays'));

  const toggles: readonly { key: ToggleKey; label: string }[] = [
    { key: 'showStatusPips', label: 'Status pips under units' },
    { key: 'showTethers', label: 'Relationship tethers' },
    { key: 'showFloatingText', label: 'Proc tags & damage numbers' },
  ];

  const consultToggles: readonly { key: ToggleKey; label: string }[] = [
    { key: 'quantifyAdvice', label: 'Quantify the consultant’s advice' },
    { key: 'enemyAi', label: 'Opponent summons its own counters' },
  ];

  const buildSwitch = (toggle: { key: ToggleKey; label: string }, host: HTMLElement) => {
    const row = el('div', 'ad-row');
    row.append(el('span', undefined, toggle.label));
    const sw = el('div', 'ad-switch');
    sw.setAttribute('role', 'switch');
    sw.setAttribute('tabindex', '0');
    const flip = (): void => {
      setSetting(toggle.key, !getSettings()[toggle.key]);
      sync();
    };
    sw.addEventListener('click', flip);
    sw.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        flip();
      }
    });
    row.append(sw);
    host.append(row);
    return { key: toggle.key, node: sw };
  };

  const switches = toggles.map((toggle) => buildSwitch(toggle, overlays));
  panel.append(overlays);

  const consultGroup = el('div', 'ad-group');
  consultGroup.append(el('div', 'ad-label', 'Consultant & opponent'));
  switches.push(...consultToggles.map((toggle) => buildSwitch(toggle, consultGroup)));
  panel.append(consultGroup);
  consultGroup.append(
    el(
      'div',
      'ad-note',
      'Quantification annotates the same sentences with the figures behind them; it never rewrites the advice.',
    ),
  );

  /** Pushes current settings into the controls. */
  function sync(): void {
    const settings = getSettings();
    for (const entry of buttons) {
      entry.node.classList.toggle('on', settings.unitGraphics === entry.option.value);
    }
    for (const entry of switches) {
      entry.node.classList.toggle('on', settings[entry.key]);
      entry.node.setAttribute('aria-checked', String(settings[entry.key]));
    }
    refreshNote();
  }

  const setOpen = (open: boolean): void => {
    panel.classList.toggle('open', open);
    if (open) sync();
  };
  button.addEventListener('click', () => setOpen(!panel.classList.contains('open')));
  close.addEventListener('click', () => setOpen(false));
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });

  sync();
  document.body.append(button, panel);

  // Sprites resolve asynchronously, so refresh the readout shortly after boot rather than
  // reporting "none found" forever on a roster that is still loading.
  window.setTimeout(refreshNote, 1500);
}
