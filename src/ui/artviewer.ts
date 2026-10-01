/** Inspect the same portrait and PNG poses discovered by the game's art loader. */
import { artAssets, onArtLoaded, spriteFigure } from '../render/art/sprites';
import { ANIM_SECONDS } from '../render/rig/figure';
import type { AnimName } from '../render/rig/figure';
import type { Deity } from '../sim/types';

const POSES = [
  ['idle_01', 'Idle'], ['walk_01', 'Walk · contact'], ['walk_02', 'Walk · passing'],
  ['attack_01', 'Attack · wind-up'], ['attack_02', 'Attack · strike'],
  ['hit_01', 'Hit'], ['death_01', 'Death'],
] as const;
type PreviewMode = 'sequence' | AnimName;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className !== undefined) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const CSS = `
  #art-viewer { width: min(1060px, calc(100vw - 32px)); max-height: calc(100dvh - 32px);
    padding: 0; border: 1px solid #514649; border-radius: 14px; background: #17141a;
    color: #ede6d6; font-family: ui-sans-serif, system-ui, sans-serif; }
  #art-viewer::backdrop { background: rgba(0,0,0,.78); }
  .av-sheet { padding: 24px; }
  .av-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
  .av-header h2 { margin: 0; font-size: 24px; }
  .av-sub, .av-status, .av-caption { color: #b9ada1; font-size: 13px; line-height: 1.5; }
  .av-sub { margin: 8px 0 20px; }
  #art-viewer button, #art-viewer select { font: inherit; color: #ede6d6; background: #29232d;
    border: 1px solid #514649; border-radius: 7px; padding: 8px 12px; }
  #art-viewer button { cursor: pointer; }
  #art-viewer button:hover:not(:disabled) { border-color: #ede6d6; }
  #art-viewer :focus-visible { outline: 2px solid #c4442e; outline-offset: 3px; }
  #art-viewer button:disabled, #art-viewer select:disabled { opacity: .4; cursor: default; }
  .av-picker { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .av-picker select { flex: 1; min-width: 0; max-width: 480px; }
  .av-grid { display: grid; grid-template-columns: minmax(220px, 300px) minmax(0, 1fr); gap: 28px; }
  .av-grid h3 { margin: 0 0 12px; font-size: 16px; }
  .av-checker { background-color: #696969;
    background-image: conic-gradient(#777 25%, transparent 0 50%, #777 0 75%, transparent 0);
    background-size: 24px 24px; border-radius: 8px; overflow: hidden; }
  .av-portrait { aspect-ratio: 3 / 4; display: flex; align-items: center; justify-content: center; }
  .av-portrait img { width: 100%; height: 100%; object-fit: contain; }
  .av-empty { padding: 24px; text-align: center; color: #fff; font-size: 14px; }
  .av-info h3 { margin: 20px 0 5px; font-size: 22px; }
  .av-info p { color: #b9ada1; margin: 6px 0 12px; font-size: 13px; }
  .av-stats { display: grid; grid-template-columns: 1fr 1fr; margin: 0; gap: 10px 18px; }
  .av-stats div { border-top: 1px solid #39303c; padding-top: 7px; }
  .av-stats dt { color: #b9ada1; font-size: 11px; }
  .av-stats dd { margin: 3px 0 0; font-size: 14px; }
  .av-stage { position: relative; width: min(100%, 512px); margin: 0 auto; }
  .av-stage canvas { display: block; width: 100%; aspect-ratio: 1; }
  .av-stage .av-empty { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
  .av-stage .av-empty[hidden] { display: none; }
  .av-controls { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
  .av-controls label { display: flex; align-items: center; gap: 6px; color: #b9ada1; font-size: 12px; }
  .av-controls input[type=range] { width: 85px; accent-color: #c4442e; }
  .av-guide { font-size: 12px; color: #b9ada1; display: flex; gap: 6px; align-items: center; }
  .av-caption { min-height: 20px; overflow-wrap: anywhere; }
  .av-frames { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; margin-top: 14px; }
  #art-viewer .av-frame { padding: 5px; min-width: 0; font-size: 10px; line-height: 1.4; }
  .av-frame img { display: block; width: 100%; aspect-ratio: 1; object-fit: contain; background: #696969; border-radius: 3px; }
  .av-frame span { display: block; padding-top: 5px; }
  #art-viewer .av-frame[aria-pressed=true] { border-color: #c4442e; background: #442720; }
  .av-missing { display: grid; place-items: center; aspect-ratio: 1; color: #b9ada1; background: #211c25; }
  @media (max-width: 720px) {
    .av-sheet { padding: 16px; }
    .av-grid { grid-template-columns: 1fr; gap: 24px; }
    .av-portrait { max-width: 230px; margin: 0 auto; }
    .av-frames { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }
`;

/** Mount once; the returned function opens a modal and starts its preview. */
export function mountArtViewer(roster: readonly Deity[]): () => void {
  const style = el('style');
  style.textContent = CSS;
  document.head.append(style);
  const dialog = el('dialog');
  dialog.id = 'art-viewer';
  dialog.setAttribute('aria-labelledby', 'art-viewer-title');
  const sheet = el('div', 'av-sheet');
  const header = el('div', 'av-header');
  const title = el('h2', undefined, 'Character images');
  title.id = 'art-viewer-title';
  const close = el('button', undefined, 'Close');
  close.type = 'button';
  header.append(title, close);
  sheet.append(header, el('p', 'av-sub', 'Portraits and animation poses from the game’s art library. Select a frame to inspect it.'));

  const picker = el('div', 'av-picker');
  const pickerLabel = el('label', undefined, 'Character');
  pickerLabel.htmlFor = 'art-viewer-character';
  const character = el('select');
  character.id = 'art-viewer-character';
  for (const pantheon of ['greek', 'norse', 'egyptian'] as const) {
    const group = el('optgroup');
    group.label = pantheon[0].toUpperCase() + pantheon.slice(1);
    for (const deity of roster.filter((d) => d.pantheon === pantheon).sort((a, b) => a.name.localeCompare(b.name))) {
      const option = el('option', undefined, deity.name);
      option.value = deity.id;
      group.append(option);
    }
    character.append(group);
  }
  character.value = roster.find((d) => artAssets(d.id).some((a) => a.frame === 'portrait'))?.id ?? roster[0]?.id ?? '';
  picker.append(pickerLabel, character);
  const grid = el('div', 'av-grid');
  const left = el('section');
  const portrait = el('div', 'av-portrait av-checker');
  const portraitStatus = el('p', 'av-status');
  const info = el('div', 'av-info');
  left.append(el('h3', undefined, 'Portrait'), portrait, portraitStatus, info);
  const right = el('section');
  const stage = el('div', 'av-stage av-checker');
  const canvas = el('canvas');
  canvas.width = canvas.height = 1024;
  canvas.setAttribute('aria-label', 'Character animation preview');
  const empty = el('div', 'av-empty');
  stage.append(canvas, empty);
  const controls = el('div', 'av-controls');
  const play = el('button', undefined, 'Pause');
  const previous = el('button', undefined, 'Previous');
  const next = el('button', undefined, 'Next');
  previous.setAttribute('aria-label', 'Previous pose');
  next.setAttribute('aria-label', 'Next pose');
  const modeLabel = el('label', undefined, 'Preview');
  const mode = el('select');
  mode.setAttribute('aria-label', 'Preview mode');
  for (const [value, label] of [['sequence', 'PNG sequence'], ['idle', 'Idle'], ['walk', 'Walk'], ['attack', 'Attack'], ['hit', 'Hit'], ['death', 'Death']]) {
    const option = el('option', undefined, label);
    option.value = value;
    mode.append(option);
  }
  modeLabel.append(mode);
  const speedLabel = el('label', undefined, 'Frames / sec');
  const speed = el('input');
  speed.type = 'range'; speed.min = '1'; speed.max = '8'; speed.value = '2';
  speed.setAttribute('aria-label', 'Sequence frames per second');
  const speedValue = el('span', undefined, '2');
  speedLabel.append(speed, speedValue);
  controls.append(play, previous, next, modeLabel, speedLabel);
  const guideLabel = el('label', 'av-guide', 'Show alignment guides');
  const guides = el('input'); guides.type = 'checkbox';
  guideLabel.prepend(guides);
  const caption = el('div', 'av-caption');
  const status = el('p', 'av-status');
  const frames = el('div', 'av-frames');
  right.append(el('h3', undefined, 'Animated poses'), stage, controls, guideLabel, caption, status, frames);
  grid.append(left, right);
  sheet.append(picker, grid);
  dialog.append(sheet);
  document.body.append(dialog);

  const byId = new Map(roster.map((d) => [d.id, d]));
  const cache = new Map<string, HTMLImageElement>();
  let selected: Deity | undefined;
  let sequence: { frame: string; url: string }[] = [];
  let frameButtons: { frame: string; node: HTMLButtonElement }[] = [];
  let playing = true;
  let playhead = 0;
  let started = 0;
  let raf = 0;
  let lastCaption = '';
  const context = canvas.getContext('2d');
  const seconds = (now: number): number => playhead + (playing ? (now - started) / 1000 : 0);

  function imageFor(url: string): HTMLImageElement {
    const existing = cache.get(url);
    if (existing !== undefined) return existing;
    const image = new Image();
    image.addEventListener('load', () => { if (dialog.open && !playing) draw(performance.now()); });
    image.addEventListener('error', () => { if (dialog.open) draw(performance.now()); });
    image.src = url;
    cache.set(url, image);
    return image;
  }

  function draw(now: number): void {
    if (context === null || selected === undefined) return;
    context.setTransform(2, 0, 0, 2, 0, 0);
    context.clearRect(0, 0, 512, 512);
    const t = seconds(now);
    const previewMode = mode.value as PreviewMode;
    let text = '';
    let visibleFrames: readonly string[] = [];
    let message = 'No battle PNGs available for this character.';
    let drawn = false;
    if (previewMode === 'sequence') {
      const asset = sequence[Math.floor(t * Number(speed.value)) % sequence.length];
      if (asset !== undefined) {
        const image = imageFor(asset.url);
        visibleFrames = [asset.frame];
        text = `${selected.id}_${asset.frame}.png`;
        if (image.complete && image.naturalWidth > 0) {
          context.drawImage(image, 0, 0, 512, 512);
          text += ` · ${image.naturalWidth} × ${image.naturalHeight}`;
          drawn = true;
        } else message = image.complete ? 'This image could not be loaded.' : 'Loading image…';
      }
    } else {
      const figure = spriteFigure(selected.id, selected.name, selected.tier);
      if (figure !== null) {
        const duration = previewMode === 'idle' || previewMode === 'walk' ? 2 : ANIM_SECONDS[previewMode] + .6;
        context.save();
        context.translate(256, 480);
        context.scale(512 / 112, 512 / 112);
        figure.draw(context, previewMode, t % duration, t);
        context.restore();
        drawn = true;
        visibleFrames = sequence.filter((a) => a.frame.startsWith(previewMode)).map((a) => a.frame);
        text = `${previewMode[0].toUpperCase() + previewMode.slice(1)} · in-game animation`;
      } else message = 'Loading animation poses…';
    }
    if (guides.checked) {
      context.strokeStyle = 'rgba(255,255,255,.65)';
      context.lineWidth = 1;
      context.setLineDash([5, 5]);
      context.beginPath(); context.moveTo(256, 0); context.lineTo(256, 512);
      context.moveTo(0, 480); context.lineTo(512, 480); context.stroke();
      context.setLineDash([]);
    }
    empty.hidden = drawn;
    empty.textContent = message;
    if (text !== lastCaption) {
      caption.textContent = text;
      lastCaption = text;
      for (const entry of frameButtons) entry.node.setAttribute('aria-pressed', String(visibleFrames.includes(entry.frame)));
    }
  }

  function tick(now: number): void {
    if (!dialog.open) return;
    draw(now);
    if (playing) raf = requestAnimationFrame(tick);
  }

  function refreshPlayback(): void {
    cancelAnimationFrame(raf);
    play.textContent = playing ? 'Pause' : 'Play';
    previous.disabled = next.disabled = mode.value !== 'sequence' || sequence.length === 0;
    speed.disabled = mode.value !== 'sequence' || sequence.length === 0;
    if (dialog.open) tick(performance.now());
  }

  function selectFrame(index: number): void {
    mode.value = 'sequence'; playing = false;
    playhead = index / Number(speed.value);
    refreshPlayback();
  }

  function selectCharacter(): void {
    selected = byId.get(character.value);
    if (selected === undefined) return;
    const deity = selected;
    const assets = artAssets(deity.id);
    const portraitAsset = assets.find((a) => a.frame === 'portrait');
    portrait.replaceChildren();
    if (portraitAsset === undefined) {
      portrait.append(el('div', 'av-empty', 'Portrait not available yet'));
      portraitStatus.textContent = `${deity.id}_portrait.png · missing`;
    } else {
      const image = el('img');
      image.alt = `${deity.name} portrait`;
      image.addEventListener('load', () => {
        if (selected?.id === deity.id) portraitStatus.textContent = `${deity.id}_portrait.png · ${image.naturalWidth} × ${image.naturalHeight}`;
      });
      image.addEventListener('error', () => {
        if (selected?.id !== deity.id) return;
        portrait.replaceChildren(el('div', 'av-empty', 'Portrait could not be loaded'));
        portraitStatus.textContent = `${deity.id}_portrait.png · load failed`;
      });
      image.src = portraitAsset.url;
      portrait.append(image);
      portraitStatus.textContent = `${deity.id}_portrait.png · loading`;
    }
    info.replaceChildren(el('h3', undefined, deity.name), el('p', undefined, `${deity.pantheon[0].toUpperCase() + deity.pantheon.slice(1)} · ${deity.tier} · ${deity.cost} faith`));
    const stats = el('dl', 'av-stats');
    for (const [label, value] of [
      ['Health', deity.hp], ['Damage', deity.damage], ['Attack interval', `${deity.attackInterval}s`],
      ['Armour', deity.armor], ['Range', deity.range], ['Speed', deity.speed],
      ['Traits', deity.traits.length > 0 ? deity.traits.join(', ') : 'None'],
    ]) {
      const cell = el('div'); cell.append(el('dt', undefined, String(label)), el('dd', undefined, String(value))); stats.append(cell);
    }
    info.append(stats);
    sequence = assets.filter((a) => a.frame !== 'portrait');
    frames.replaceChildren(); frameButtons = [];
    for (const [frame, label] of POSES) {
      const button = el('button', 'av-frame');
      button.setAttribute('aria-label', `${label}: ${deity.id}_${frame}.png`);
      button.setAttribute('aria-pressed', 'false');
      const index = sequence.findIndex((a) => a.frame === frame);
      if (index === -1) {
        button.disabled = true;
        button.append(el('div', 'av-missing', 'Missing'));
      } else {
        const asset = sequence[index];
        const thumb = el('img'); thumb.src = asset.url; thumb.alt = '';
        button.append(thumb);
        imageFor(asset.url);
        button.addEventListener('click', () => selectFrame(index));
      }
      button.append(el('span', undefined, label));
      frames.append(button); frameButtons.push({ frame, node: button });
    }
    const missing = POSES.filter(([frame]) => !sequence.some((a) => a.frame === frame)).map(([, label]) => label);
    status.textContent = `${sequence.length} of 7 battle poses available.${missing.length > 0 ? ` Missing: ${missing.join(', ')}.` : ' Select an animation to preview the battlefield motion.'}`;
    for (const option of mode.options) option.disabled = option.value !== 'sequence' && sequence.length !== 7;
    mode.value = 'sequence'; mode.disabled = sequence.length === 0;
    play.disabled = sequence.length === 0;
    playing = sequence.length > 0;
    playhead = 0; started = performance.now(); lastCaption = '';
    caption.textContent = '';
    refreshPlayback();
  }

  play.addEventListener('click', () => {
    const now = performance.now(); playhead = seconds(now); started = now; playing = !playing;
    refreshPlayback();
  });
  previous.addEventListener('click', () => selectFrame((Math.floor(seconds(performance.now()) * Number(speed.value)) - 1 + sequence.length) % sequence.length));
  next.addEventListener('click', () => selectFrame((Math.floor(seconds(performance.now()) * Number(speed.value)) + 1) % sequence.length));
  mode.addEventListener('change', () => { playhead = 0; started = performance.now(); refreshPlayback(); });
  speed.addEventListener('input', () => {
    speedValue.textContent = speed.value;
    playhead = 0; started = performance.now(); refreshPlayback();
  });
  guides.addEventListener('change', () => draw(performance.now()));
  character.addEventListener('change', selectCharacter);
  onArtLoaded((id) => {
    if (dialog.open && selected?.id === id && !playing) draw(performance.now());
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  // Keep shortcuts in the battle and other panels from responding while this modal is open.
  dialog.addEventListener('keydown', (event) => event.stopPropagation());
  dialog.addEventListener('close', () => {
    cancelAnimationFrame(raf);
    document.getElementById('admin-open')?.focus();
  });
  return () => {
    if (dialog.open) return;
    dialog.showModal();
    selectCharacter();
    dialog.scrollTop = 0;
    character.focus();
  };
}
