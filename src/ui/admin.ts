/**
 * Admin panel — the gear button.
 *
 * Runtime toggles for how the battlefield is drawn. Deliberately view-only: nothing here touches
 * the simulation, so flipping a switch can never change how a battle plays out, only how it looks.
 */

import { BACKDROPS } from '../render/backdrops';
import { spriteStats } from '../render/art/sprites';
import type { Deity } from '../sim/types';
import { mountArtViewer } from './artviewer';
import { mountRigViewer } from './rigviewer';
import type { BackdropChoice, Settings, UnitGraphics } from './settings';
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
    max-height: calc(100dvh - 90px); overflow-y: auto;
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
  .ad-row-block { margin-top: 12px; }
  .ad-slider { display: flex; align-items: center; gap: 10px; }
  .ad-slider input { flex: 1; accent-color: #e8dcc4; }
  .ad-slider span { width: 38px; text-align: right; font-size: 12px; color: #cabfa9; }
  .ad-seg.wrap { flex-wrap: wrap; }
  .ad-seg.wrap button { flex: 1 1 33%; border-top: 1px solid #3a3229; }
  .ad-seg button + button { border-left: 1px solid #3a3229; }
  .ad-seg button.on { background: #c9a227; color: #17141a; }
  .ad-seg button:not(.on):hover { background: #1d1913; color: #e8dcc4; }
  .ad-note { margin-top: 7px; font-size: 11.5px; line-height: 1.45; color: #6d6355; }
  .ad-wide-btn {
    width: 100%; background: #241d10; color: #c9a227; border: 1px solid #c9a227;
    border-radius: 8px; padding: 9px 12px; font-size: 13px; font-weight: 700;
    font-family: inherit; cursor: pointer;
  }
  .ad-wide-btn:hover:not(:disabled) { background: #2f2614; }
  .ad-wide-btn:disabled { opacity: .5; cursor: wait; }
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

/** Only the boolean settings can be driven by a switch. Derived, so new settings can't break it. */
type ToggleKey = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];

/** What a fast-forward returned, so the panel can report it without guessing. */
export interface ResolveResult {
  readonly outcome: string;
  readonly simulatedSeconds: number;
  readonly realMilliseconds: number;
  readonly hitBudget: boolean;
}

/**
 * Builds the gear button and the admin panel, and wires up every control.
 *
 * `onResolve` fast-forwards the current battle to its conclusion. It is a testing aid, so it lives
 * in its own clearly-labelled section rather than beside the display toggles.
 */
export function mountAdminPanel(onResolve?: () => ResolveResult, deities: readonly Deity[] = []): void {
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
    { value: 'rig', label: 'Rig' },
    { value: 'sprites', label: 'Art' },
  ];
  const note = el('div', 'ad-note');

  const refreshNote = (): void => {
    note.className = 'ad-note';
    const mode = getSettings().unitGraphics;
    if (mode === 'blocks') {
      note.textContent = 'Placeholder geometry: tier-sized shapes with each unit’s initial.';
    } else if (mode === 'rig') {
      note.textContent = 'The full roster animated in code, with distinct Greek, Norse and Egyptian styling.';
    } else {
      const stats = spriteStats();
      note.textContent = `Hand-drawn art for ${stats.sets} deities (${stats.ready} loaded). The rest of the roster uses its code-drawn rig.`;
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

  const size = el('div', 'ad-row-block');
  size.append(el('div', 'ad-label', 'Unit size'));
  const sizeRow = el('div', 'ad-slider');
  const sizeSlider = document.createElement('input');
  sizeSlider.type = 'range';
  sizeSlider.min = '80';
  sizeSlider.max = '220';
  sizeSlider.step = '5';
  sizeSlider.setAttribute('aria-label', 'Unit size');
  const sizeValue = el('span');
  sizeSlider.addEventListener('input', () => {
    setSetting('unitScale', Number(sizeSlider.value) / 100);
    sizeValue.textContent = `${sizeSlider.value}%`;
  });
  sizeRow.append(sizeSlider, sizeValue);
  size.append(sizeRow, el('div', 'ad-note', 'How large art and rig figures are drawn. Blocks are unaffected.'));
  group.append(size);
  panel.append(group);

  // ---- battlefield backdrop -----------------------------------------------
  const scene = el('div', 'ad-group');
  scene.append(el('div', 'ad-label', 'Battlefield'));
  const sceneSeg = el('div', 'ad-seg wrap');
  const sceneOptions: readonly { value: BackdropChoice; label: string }[] = [
    { value: 'auto', label: 'Auto' },
    ...BACKDROPS.map((b) => ({ value: b.id as BackdropChoice, label: b.label })),
  ];
  const sceneButtons = sceneOptions.map((option) => {
    const node = el('button', undefined, option.label);
    node.addEventListener('click', () => {
      setSetting('backdrop', option.value);
      sync();
    });
    sceneSeg.append(node);
    return { option, node };
  });
  scene.append(sceneSeg, el('div', 'ad-note', 'Auto picks the realm your deck belongs to, or the city if it mixes pantheons.'));
  panel.append(scene);

  const light = el('div', 'ad-row-block');
  light.append(el('div', 'ad-label', 'Backdrop brightness'));
  const lightRow = el('div', 'ad-slider');
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '100';
  slider.step = '5';
  slider.setAttribute('aria-label', 'Backdrop brightness');
  const lightValue = el('span');
  slider.addEventListener('input', () => {
    setSetting('backdropLight', Number(slider.value) / 100);
    lightValue.textContent = `${slider.value}%`;
  });
  lightRow.append(slider, lightValue);
  light.append(lightRow, el('div', 'ad-note', 'Lightens the battlefield scenery and the picker background. Units are not affected.'));
  scene.append(light);

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
    sizeSlider.value = String(Math.round(settings.unitScale * 100));
    sizeValue.textContent = `${sizeSlider.value}%`;
    slider.value = String(Math.round(settings.backdropLight * 100));
    lightValue.textContent = `${slider.value}%`;
    for (const entry of sceneButtons) {
      entry.node.classList.toggle('on', settings.backdrop === entry.option.value);
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

  if (deities.length > 0) {
    const openViewer = mountArtViewer(deities);
    const art = el('div', 'ad-group');
    art.append(el('div', 'ad-label', 'Character art'));
    const view = el('button', 'ad-wide-btn', 'View character images');
    view.addEventListener('click', () => {
      setOpen(false);
      openViewer();
    });
    art.append(view, el('div', 'ad-note', 'Inspect portraits, character details and animated PNG poses.'));
    const openRigViewer = mountRigViewer(deities);
    const rigs = el('button', 'ad-wide-btn', 'View Rig scenario');
    rigs.style.marginTop = '10px';
    rigs.addEventListener('click', () => { setOpen(false); openRigViewer(); });
    art.append(rigs, el('div', 'ad-note', 'Review every rig, themed pantheon lineups and all five animations.'));
    panel.append(art);
  }

  // ---- testing aids -------------------------------------------------------
  if (onResolve !== undefined) {
    const testing = el('div', 'ad-group');
    testing.append(el('div', 'ad-label', 'Testing'));

    const resolve = document.createElement('button');
    resolve.className = 'ad-wide-btn';
    resolve.textContent = 'Resolve battle instantly';
    const outcomeNote = el('div', 'ad-note');
    outcomeNote.textContent =
      'Fast-forwards the current battle through the same simulation, playing both sides with the rule engine. The result is what would have happened if you had let it run.';

    resolve.addEventListener('click', () => {
      resolve.disabled = true;
      resolve.textContent = 'Resolving…';
      // Yield a frame so the disabled state paints before the loop blocks the thread.
      window.setTimeout(() => {
        const result = onResolve();
        outcomeNote.className = 'ad-note';
        outcomeNote.textContent = result.hitBudget
          ? `Stopped at the ${Math.round(result.simulatedSeconds)}s budget without a result — the battle was still a stalemate. Took ${Math.round(result.realMilliseconds)}ms.`
          : `${result.outcome} after ${Math.round(result.simulatedSeconds)}s of battle, simulated in ${Math.round(result.realMilliseconds)}ms.`;
        resolve.textContent = 'Resolve battle instantly';
        resolve.disabled = false;
      }, 16);
    });

    testing.append(resolve, outcomeNote);
    panel.append(testing);
  }

  sync();
  document.body.append(button, panel);

  // Sprites resolve asynchronously, so refresh the readout shortly after boot rather than
  // reporting "none found" forever on a roster that is still loading.
  window.setTimeout(refreshNote, 1500);
}
