import type { Deity, Pantheon } from '../sim/types';
import { drawBackdropScene } from '../render/backdrops';
import type { Figure } from '../render/rig/figure';
import { FIGURE_BY_ID } from '../render/rig/figures';
import { previewDuration, samplePreview } from '../render/rig/previewstate';
import type { PreviewAnimation } from '../render/rig/previewstate';
import { RIG_THEMES } from '../render/rig/themes';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

const CSS = `
  .rv { --rv-accent: #b4becf; color: #e6e0d5; font-family: ui-sans-serif, system-ui, sans-serif; }
  .rv * { box-sizing: border-box; }
  .rv button, .rv select, .rv input[type=search] {
    font: inherit; color: #d9d4ca; background: #22222c; border: 1px solid #42414e;
    border-radius: 7px; padding: 8px 11px;
  }
  .rv button { cursor: pointer; }
  .rv button:hover { border-color: var(--rv-accent); }
  .rv button[aria-pressed=true] { color: #14151d; background: var(--rv-accent); border-color: var(--rv-accent); }
  .rv button:focus-visible, .rv input:focus-visible, .rv select:focus-visible { outline: 2px solid var(--rv-accent); outline-offset: 3px; }
  .rv-top, .rv-tabs, .rv-controls, .rv-roster-head { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; }
  .rv-top { justify-content: space-between; gap: 16px; margin-bottom: 18px; }
  .rv h2, .rv h3, .rv p { margin: 0; }
  .rv h2 { font: 500 27px Georgia, serif; }
  .rv-eyebrow { color: var(--rv-accent); font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; }
  .rv-sub { color: #aaa6ae; font-size: 12px; line-height: 1.6; margin-top: 6px !important; }
  .rv-badge { color: var(--rv-accent); font-size: 11px; border: 1px solid #444451; border-radius: 20px; padding: 7px 12px; }
  .rv-tabs { margin-bottom: 10px; }
  .rv-tabs button { min-width: 90px; }
  .rv-feel { font-size: 12px; color: #aaa6ae; min-height: 20px; margin: 10px 0 17px !important; }
  .rv-previews { display: grid; grid-template-columns: minmax(240px, .65fr) minmax(0, 1.35fr); gap: 16px; }
  .rv-pane { border: 1px solid #353541; border-radius: 12px; background: #181922; overflow: hidden; }
  .rv-pane-head { padding: 13px 16px; display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
  .rv-pane h3 { font-size: 14px; font-weight: 600; }
  .rv-meta { color: #a4a1ab; font-size: 11px; }
  .rv canvas { display: block; width: 100%; height: auto; border-radius: 0; background: transparent; }
  .rv-pane-foot { padding: 10px 16px; color: #aaa6ae; font-size: 11px; border-top: 1px solid #30313c; }
  .rv-controls { margin: 16px 0 10px; font-size: 12px; }
  .rv-controls label { display: flex; align-items: center; gap: 7px; color: #aaa6ae; }
  .rv input { accent-color: var(--rv-accent); }
  .rv-scrub { display: flex; align-items: center; gap: 12px; font-size: 11px; color: #aaa6ae; }
  .rv-scrub input { flex: 1; min-width: 40px; }
  .rv-scrub output { min-width: 60px; text-align: right; font-variant-numeric: tabular-nums; }
  .rv-roster-head { margin: 24px 0 12px; justify-content: space-between; }
  .rv-roster-head h3 { font: 500 20px Georgia, serif; }
  .rv-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); gap: 8px; }
  .rv .rv-card { padding: 0 0 10px; overflow: hidden; text-align: left; background: #1c1d27; min-width: 0; }
  .rv .rv-card[aria-pressed=true] { background: #292d37; color: #e6e0d5; box-shadow: inset 0 0 0 1px var(--rv-accent); }
  .rv-card span { display: block; padding: 0 10px; font-size: 12px; }
  .rv-card small { display: block; padding: 4px 10px 0; font-size: 10px; color: #aaa6ae; text-transform: capitalize; }
  .rv-card[hidden] { display: none; }
  .rv-empty { color: #aaa6ae; padding: 18px 0; font-size: 12px; }
  #rig-viewer { width: min(1220px, calc(100vw - 32px)); max-width: none; max-height: calc(100dvh - 32px); padding: 24px; background: #11121a; border: 1px solid #484653; border-radius: 16px; }
  #rig-viewer::backdrop { background: rgba(7,8,13,.85); backdrop-filter: blur(5px); }
  .rv-close-row { display: flex; justify-content: flex-end; margin-bottom: 8px; }
  @media (max-width: 760px) {
    .rv-previews { grid-template-columns: 1fr; }
    .rv-previews .rv-pane:first-child { max-width: 450px; width: 100%; margin: auto; }
    #rig-viewer { padding: 16px; }
    .rv-gallery { grid-template-columns: repeat(auto-fill, minmax(105px, 1fr)); }
  }
`;

function installStyles(): void {
  if (document.getElementById('rig-viewer-styles')) return;
  const style = el('style'); style.id = 'rig-viewer-styles'; style.textContent = CSS;
  document.head.append(style);
}

function canvasContext(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = width * dpr; canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('2D canvas context unavailable');
  ctx.scale(dpr, dpr);
  return ctx;
}

/** Shared by the admin modal and /rig.html. All renderers are the same ones used in battle. */
export function createRigExplorer(roster: readonly Deity[]): { root: HTMLElement; start: () => void; stop: () => void } {
  installStyles();
  const root = el('section', 'rv');
  const titleRow = el('div', 'rv-top');
  const title = el('div');
  title.append(el('div', 'rv-eyebrow', 'Animation study · iteration 01'), el('h2', undefined, 'Rig scenario'),
    el('p', 'rv-sub', 'Explore the whole roster in motion. Choose a realm, select a character, and review each pose.'));
  const covered = roster.filter((d) => FIGURE_BY_ID.has(d.id));
  titleRow.append(title, el('div', 'rv-badge', `${covered.length} / ${roster.length} characters rigged`));
  root.append(titleRow);
  const tabs = el('div', 'rv-tabs'); tabs.setAttribute('aria-label', 'Pantheon filter');
  const feel = el('p', 'rv-feel');
  root.append(tabs, feel);
  const previews = el('div', 'rv-previews');
  const solo = el('section', 'rv-pane');
  const soloHead = el('div', 'rv-pane-head');
  const name = el('h3'); const meta = el('span', 'rv-meta'); soloHead.append(name, meta);
  const soloCanvas = el('canvas'); soloCanvas.setAttribute('aria-label', 'Selected character rig animation');
  const soloCtx = canvasContext(soloCanvas, 640, 480);
  const caption = el('div', 'rv-pane-foot');
  solo.append(soloHead, soloCanvas, caption);
  const lineup = el('section', 'rv-pane');
  const lineupHead = el('div', 'rv-pane-head');
  const lineupTitle = el('h3'); const lineupCount = el('span', 'rv-meta');
  lineupHead.append(lineupTitle, lineupCount);
  const lineupCanvas = el('canvas'); lineupCanvas.setAttribute('aria-label', 'Pantheon rig lineup in motion');
  const lineupCtx = canvasContext(lineupCanvas, 960, 540);
  lineup.append(lineupHead, lineupCanvas, el('div', 'rv-pane-foot', 'Tier-scaled lineup · the same figures used by Rig graphics in battle'));
  previews.append(solo, lineup); root.append(previews);

  const controls = el('div', 'rv-controls');
  const play = el('button', undefined, 'Pause'); play.setAttribute('aria-label', 'Pause rig animation');
  const restart = el('button', undefined, 'Restart');
  const step = el('button', undefined, 'Step frame');
  const animationLabel = el('label', undefined, 'Animation');
  const animation = el('select'); animation.setAttribute('aria-label', 'Rig animation');
  for (const [value, label] of [['cycle', 'Full cycle'], ['idle', 'Idle'], ['walk', 'Walk'], ['attack', 'Attack'], ['hit', 'Hit'], ['death', 'Death']]) {
    const option = el('option', undefined, label); option.value = value; animation.append(option);
  }
  animationLabel.append(animation);
  const speedLabel = el('label', undefined, 'Speed');
  const speed = el('select'); speed.setAttribute('aria-label', 'Rig playback speed');
  for (const value of [0.25, 0.5, 1, 1.5]) {
    const option = el('option', undefined, `${value}×`); option.value = String(value); speed.append(option);
  }
  speed.value = '1'; speedLabel.append(speed);
  const flipLabel = el('label', undefined, 'Face left'); const flip = el('input'); flip.type = 'checkbox'; flipLabel.prepend(flip);
  const guideLabel = el('label', undefined, 'Guides'); const guides = el('input'); guides.type = 'checkbox'; guideLabel.prepend(guides);
  controls.append(play, restart, step, animationLabel, speedLabel, flipLabel, guideLabel);
  const scrubRow = el('label', 'rv-scrub', 'Playhead');
  const scrub = el('input'); scrub.type = 'range'; scrub.min = '0'; scrub.max = String(previewDuration('cycle')); scrub.step = '0.01'; scrub.value = '0';
  scrub.setAttribute('aria-label', 'Rig animation playhead');
  const readout = el('output'); scrubRow.append(scrub, readout);
  root.insertBefore(controls, previews);
  root.insertBefore(scrubRow, previews);
  scrubRow.style.marginBottom = '16px';

  const rosterHead = el('div', 'rv-roster-head');
  const rosterTitle = el('h3');
  const search = el('input'); search.type = 'search'; search.placeholder = 'Find a character…'; search.setAttribute('aria-label', 'Find rig character');
  rosterHead.append(rosterTitle, search);
  const gallery = el('div', 'rv-gallery');
  const empty = el('p', 'rv-empty', 'No characters match this search.'); empty.hidden = true;
  root.append(rosterHead, gallery, empty);

  let realm: Pantheon | 'all' = 'greek';
  let selected = covered[0];
  let playing = true;
  let active = false;
  let playhead = 0;
  let last = 0;
  let raf = 0;
  const cards: { deity: Deity; button: HTMLButtonElement }[] = [];
  const realmButtons = new Map<Pantheon | 'all', HTMLButtonElement>();
  const visibleRoster = (): readonly Deity[] => roster.filter((d) => realm === 'all' || d.pantheon === realm);
  const currentAnimation = (): PreviewAnimation => animation.value as PreviewAnimation;

  function paintFigure(ctx: CanvasRenderingContext2D, figure: Figure, x: number, y: number, scale: number, seconds: number): void {
    const pose = samplePreview(currentAnimation(), seconds);
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath();
    ctx.ellipse(0, 2, (figure.body === 'biped' ? 19 : 40) * scale, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.scale(flip.checked ? -scale : scale, scale);
    figure.draw(ctx, pose.anim, pose.t, seconds);
    ctx.restore();
  }

  function draw(): void {
    const duration = previewDuration(currentAnimation());
    scrub.value = String(playhead % duration);
    readout.textContent = `${(playhead % duration).toFixed(2)} / ${duration.toFixed(2)}s`;
    soloCtx.clearRect(0, 0, 640, 480);
    const theme = RIG_THEMES[selected?.pantheon ?? 'greek'];
    const gradient = soloCtx.createRadialGradient(320, 240, 20, 320, 240, 330);
    gradient.addColorStop(0, '#353442'); gradient.addColorStop(1, '#181923');
    soloCtx.fillStyle = gradient; soloCtx.fillRect(0, 0, 640, 480);
    soloCtx.strokeStyle = theme.accent; soloCtx.globalAlpha = 0.2;
    soloCtx.beginPath(); soloCtx.arc(320, 235, 140, 0, Math.PI * 2); soloCtx.stroke(); soloCtx.globalAlpha = 1;
    const figure = selected ? FIGURE_BY_ID.get(selected.id) : undefined;
    if (figure) {
      // Leave room above crowns, behind serpent tails and beside the fallen body.
      const anchor = figure.body === 'serpent' ? 400 : figure.body === 'beast' ? 280 : 320;
      const x = flip.checked ? 640 - anchor : anchor;
      paintFigure(soloCtx, figure, x, 390, 2.05, playhead);
    }
    if (guides.checked) {
      soloCtx.strokeStyle = '#8c8798'; soloCtx.setLineDash([6, 6]); soloCtx.beginPath();
      soloCtx.moveTo(0, 390); soloCtx.lineTo(640, 390); soloCtx.moveTo(320, 0); soloCtx.lineTo(320, 480);
      soloCtx.stroke(); soloCtx.setLineDash([]);
    }
    const pose = samplePreview(currentAnimation(), playhead);
    caption.textContent = `${pose.anim[0].toUpperCase() + pose.anim.slice(1)} · ${playing ? 'playing' : 'paused'} · ${speed.value}× · ${flip.checked ? 'facing left' : 'facing right'}`;

    lineupCtx.clearRect(0, 0, 960, 540);
    drawBackdropScene(lineupCtx, realm === 'all' ? 'openworld' : realm, playhead);
    lineupCtx.fillStyle = 'rgba(12,13,20,.22)'; lineupCtx.fillRect(0, 0, 960, 540);
    const entries = visibleRoster();
    const cols = realm === 'all' ? 11 : 6;
    const rows = Math.ceil(entries.length / cols);
    entries.forEach((deity, i) => {
      const f = FIGURE_BY_ID.get(deity.id);
      const cell = 920 / cols;
      const x = 20 + cell * ((i % cols) + 0.5);
      const y = 160 + Math.floor(i / cols) * (355 / Math.max(1, rows - 1));
      const tierScale = { chaff: 0.57, demigod: 0.7, god: 0.8, titan: 0.85 }[deity.tier];
      const k = tierScale * (realm === 'all' ? 0.52 : 0.83);
      if (f) paintFigure(lineupCtx, f, x + (f.body === 'serpent' ? cell * 0.17 * (flip.checked ? -1 : 1) : 0), y, k, playhead);
      if (deity.id === selected?.id) {
        lineupCtx.strokeStyle = RIG_THEMES[deity.pantheon].accent; lineupCtx.lineWidth = 1.5;
        lineupCtx.beginPath(); lineupCtx.ellipse(x, y + 2, 30, 5, 0, 0, Math.PI * 2); lineupCtx.stroke();
      }
      lineupCtx.font = realm === 'all' ? '9px system-ui' : '11px system-ui';
      lineupCtx.textAlign = 'center'; lineupCtx.lineWidth = 3; lineupCtx.strokeStyle = '#14151d';
      lineupCtx.strokeText(deity.name, x, y + 18); lineupCtx.fillStyle = '#e4dfd4'; lineupCtx.fillText(deity.name, x, y + 18);
    });
  }

  function tick(now: number): void {
    if (!active) return;
    if (playing) playhead += Math.min(0.1, (now - last) / 1000) * Number(speed.value);
    last = now; draw();
    if (playing) raf = requestAnimationFrame(tick);
  }
  function refresh(): void {
    cancelAnimationFrame(raf);
    play.textContent = playing ? 'Pause' : 'Play';
    play.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} rig animation`);
    last = performance.now();
    if (active) tick(last);
  }
  function filterCards(): void {
    const query = search.value.trim().toLocaleLowerCase();
    let count = 0;
    for (const { deity, button } of cards) {
      button.hidden = (realm !== 'all' && deity.pantheon !== realm) || !`${deity.name} ${deity.id}`.toLocaleLowerCase().includes(query);
      if (!button.hidden) count++;
    }
    rosterTitle.textContent = `Roster · ${count} ${count === 1 ? 'character' : 'characters'}`;
    empty.hidden = count > 0;
  }
  function select(deity: Deity): void {
    selected = deity;
    name.textContent = deity.name;
    const figure = FIGURE_BY_ID.get(deity.id);
    meta.textContent = `${deity.tier} · ${figure?.body ?? 'missing rig'}`;
    soloCanvas.setAttribute('aria-label', `${deity.name} rig animation`);
    for (const entry of cards) entry.button.setAttribute('aria-pressed', String(entry.deity.id === deity.id));
    if (active) draw();
  }
  function setRealm(next: Pantheon | 'all'): void {
    realm = next;
    root.style.setProperty('--rv-accent', next === 'all' ? '#b19cc1' : RIG_THEMES[next].accent);
    for (const [key, button] of realmButtons) button.setAttribute('aria-pressed', String(key === realm));
    feel.textContent = next === 'all' ? 'All three pantheons together · compare silhouettes, proportions and motion.' : RIG_THEMES[next].feel;
    lineupTitle.textContent = next === 'all' ? 'All pantheons' : `${RIG_THEMES[next].label} realm`;
    lineupCount.textContent = `${visibleRoster().length} characters`;
    filterCards();
    if (selected && next !== 'all' && selected.pantheon !== next) {
      const first = visibleRoster()[0]; if (first) select(first);
    }
    if (active) draw();
  }
  for (const pantheon of ['greek', 'norse', 'egyptian', 'all'] as const) {
    const button = el('button', undefined, pantheon === 'all' ? 'All pantheons' : RIG_THEMES[pantheon].label);
    button.addEventListener('click', () => setRealm(pantheon));
    tabs.append(button); realmButtons.set(pantheon, button);
  }
  for (const deity of roster) {
    const button = el('button', 'rv-card'); button.setAttribute('aria-label', `Inspect ${deity.name} rig`);
    const thumbnail = el('canvas'); const ctx = canvasContext(thumbnail, 180, 120);
    const figure = FIGURE_BY_ID.get(deity.id);
    if (figure) {
      ctx.save();
      ctx.translate(figure.body === 'serpent' ? 130 : figure.body === 'beast' ? 66 : 90, 113);
      ctx.scale(0.72, 0.72); figure.draw(ctx, 'idle', 0.4, 0.4); ctx.restore();
    }
    button.append(thumbnail, el('span', undefined, deity.name), el('small', undefined, `${deity.tier} · ${deity.pantheon}`));
    button.addEventListener('click', () => select(deity));
    gallery.append(button); cards.push({ deity, button });
  }
  search.addEventListener('input', filterCards);
  play.addEventListener('click', () => { playing = !playing; refresh(); });
  restart.addEventListener('click', () => { playhead = 0; refresh(); });
  step.addEventListener('click', () => { playing = false; playhead += 1 / 30; refresh(); });
  animation.addEventListener('change', () => { playhead = 0; scrub.max = String(previewDuration(currentAnimation())); refresh(); });
  speed.addEventListener('change', refresh);
  scrub.addEventListener('input', () => { playing = false; playhead = Number(scrub.value); refresh(); });
  flip.addEventListener('change', () => { if (active) draw(); });
  guides.addEventListener('change', () => { if (active) draw(); });
  setRealm('greek'); if (selected) select(selected);
  return {
    root,
    start: () => { if (active) return; active = true; refresh(); },
    stop: () => { active = false; cancelAnimationFrame(raf); },
  };
}

export function mountRigViewer(roster: readonly Deity[]): () => void {
  installStyles();
  const dialog = el('dialog'); dialog.id = 'rig-viewer'; dialog.className = 'rv';
  dialog.setAttribute('aria-label', 'Rig scenario animation viewer');
  const closeRow = el('div', 'rv-close-row'); const close = el('button', undefined, 'Close');
  closeRow.append(close); dialog.append(closeRow); document.body.append(dialog);
  let explorer: ReturnType<typeof createRigExplorer> | undefined;
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', (event) => event.stopPropagation());
  dialog.addEventListener('close', () => { explorer?.stop(); document.getElementById('admin-open')?.focus(); });
  return () => {
    if (dialog.open) return;
    if (!explorer) { explorer = createRigExplorer(roster); dialog.append(explorer.root); }
    dialog.showModal(); explorer.start(); close.focus();
  };
}
