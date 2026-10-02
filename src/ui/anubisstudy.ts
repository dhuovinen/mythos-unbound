import { ANUBIS_STUDIES, anubisStudyFrame } from '../render/rig/anubisstudies';
import { FIGURE_BY_ID } from '../render/rig/figures';
import type { Figure } from '../render/rig/figure';
import { previewDuration, samplePreview } from '../render/rig/previewstate';
import type { PreviewAnimation } from '../render/rig/previewstate';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}
const CSS = `
  .as { --rv-accent: #93c3c4; }
  .as [hidden] { display: none !important; }
  .as-intro { display: flex; justify-content: space-between; align-items: start; gap: 20px; margin-bottom: 18px; }
  .as h3 { font: 400 30px Georgia, serif; letter-spacing: -.5px; }
  .as-intro p { color: #aaa6ae; font-size: 12px; line-height: 1.65; max-width: 700px; margin-top: 8px; }
  .as-controls { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; padding: 12px; background: #1b1e27; border: 1px solid #343b45; border-radius: 10px; margin: 12px 0; font-size: 12px; }
  .as-controls label { display: flex; align-items: center; gap: 8px; color: #b9b9bc; }
  .as-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 18px; }
  .as-card { border: 1px solid #39404a; border-radius: 14px; overflow: hidden; background: #171c26; min-width: 0; }
  .as-card-top { padding: 17px 18px 0; }
  .as-number { color: var(--study-accent); font-size: 10px; text-transform: uppercase; letter-spacing: 2px; }
  .as-card h4 { font: 400 23px Georgia, serif; color: #eee8dc; margin: 7px 0 8px; }
  .as-label { color: #bbb8b6; font-size: 11px; letter-spacing: .2px; }
  .as canvas { width: 100%; height: auto; display: block; background: transparent; }
  .as-card-text { border-top: 1px solid #343b45; padding: 16px 18px 18px; }
  .as-card-text p { color: #c2bebc; font-size: 12px; line-height: 1.65; min-height: 78px; }
  .as-motion { color: var(--study-accent); font-size: 11px; line-height: 1.5; margin: 10px 0 15px; }
  .as-card-text button { width: 100%; }
  .as-scrub { display: flex; gap: 12px; align-items: center; font-size: 11px; color: #aaa6ae; }
  .as-scrub input { flex: 1; min-width: 40px; }
  .as-scrub output { min-width: 110px; text-align: right; font-variant-numeric: tabular-nums; }
  .as-note { font-size: 11px; color: #999da6; line-height: 1.7; margin-top: 16px !important; }
  .as-grid[data-focused=true] { grid-template-columns: minmax(0, 760px); justify-content: center; }
  .as-grid[data-focused=true] .as-card canvas { max-width: 660px; margin: auto; }
  .as-grid[data-focused=true] .as-card-text p { min-height: 0; }
  @media (max-width: 850px) { .as-grid { grid-template-columns: 1fr; max-width: 500px; margin: 18px auto 0; } .as-intro { flex-wrap: wrap; } }
`;

/** Evaluation workspace; no settings are persisted and no game figure is replaced. */
export function createAnubisStudy(): { root: HTMLElement; start: () => void; stop: () => void } {
  if (!document.getElementById('anubis-study-styles')) {
    const style = el('style'); style.id = 'anubis-study-styles'; style.textContent = CSS; document.head.append(style);
  }
  const root = el('section', 'as'); root.setAttribute('aria-label', 'Anubis rig design comparison');
  const intro = el('div', 'as-intro'), heading = el('div');
  heading.append(el('div', 'rv-eyebrow', 'Egyptian detail study · Anubis'), el('h3', undefined, 'One jackal. Three directions.'),
    el('p', undefined, 'Compare form, materials and movement before choosing a direction for the Egyptian roster. All three use a shared playhead. The small figures compare each study with the current battle rig at the same scale.'));
  const all = el('button', undefined, 'Show all three'); all.hidden = true;
  intro.append(heading, all); root.append(intro);
  const controls = el('div', 'as-controls'); controls.setAttribute('aria-label', 'Anubis comparison playback');
  const play = el('button');
  const restart = el('button', undefined, 'Restart'), step = el('button', undefined, 'Step frame');
  const animLabel = el('label', undefined, 'Animation'), animation = el('select'); animation.setAttribute('aria-label', 'Anubis study animation');
  for (const [value, label] of [['idle', 'Idle'], ['walk', 'Walk'], ['attack', 'Attack'], ['hit', 'Hit'], ['death', 'Death'], ['cycle', 'Full cycle']]) {
    const option = el('option', undefined, label); option.value = value; animation.append(option);
  }
  animLabel.append(animation);
  const speedLabel = el('label', undefined, 'Speed'), speed = el('select'); speed.setAttribute('aria-label', 'Anubis study speed');
  for (const value of [.25, .5, 1, 1.5]) {
    const option = el('option', undefined, `${value}×`); option.value = String(value); speed.append(option);
  }
  speed.value = '1'; speedLabel.append(speed);
  const mirrorLabel = el('label', undefined, 'Face left'), mirror = el('input'); mirror.type = 'checkbox'; mirrorLabel.prepend(mirror);
  const guidesLabel = el('label', undefined, 'Alignment guides'), guides = el('input'); guides.type = 'checkbox'; guidesLabel.prepend(guides);
  controls.append(play, restart, step, animLabel, speedLabel, mirrorLabel, guidesLabel); root.append(controls);
  const scrubLabel = el('label', 'as-scrub', 'Playhead'), scrub = el('input');
  scrub.type = 'range'; scrub.min = '0'; scrub.max = String(previewDuration('idle')); scrub.step = '.01'; scrub.value = '0'; scrub.setAttribute('aria-label', 'Anubis study playhead');
  const readout = el('output'); readout.setAttribute('aria-live', 'off'); scrubLabel.append(scrub, readout); root.append(scrubLabel);
  const grid = el('div', 'as-grid'); root.append(grid);
  const cards = ANUBIS_STUDIES.map((study) => {
    const card = el('article', 'as-card'); card.style.setProperty('--study-accent', study.accent); card.setAttribute('aria-label', study.name);
    const top = el('div', 'as-card-top');
    top.append(el('div', 'as-number', `Direction ${study.number}`), el('h4', undefined, study.name), el('div', 'as-label', study.label));
    const canvas = el('canvas'); canvas.setAttribute('aria-label', `${study.name}: animated detail and battle-size comparison`);
    const dpr = Math.min(2, window.devicePixelRatio || 1); canvas.width = 440 * dpr; canvas.height = 440 * dpr;
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('2D canvas context unavailable'); ctx.scale(dpr, dpr);
    const text = el('div', 'as-card-text'), focus = el('button', undefined, 'Enlarge this direction');
    text.append(el('p', undefined, study.description), el('div', 'as-motion', study.motion), focus);
    card.append(top, canvas, text); grid.append(card);
    focus.addEventListener('click', () => {
      for (const entry of cards) entry.card.hidden = entry.study.direction !== study.direction;
      grid.dataset.focused = 'true'; all.hidden = false; all.focus();
    });
    return { study, card, ctx };
  });
  root.append(el('p', 'as-note', 'Evaluation concepts · the current battle appearance and unit rules are unchanged. Review the large figure for detail, the small pair for readability, and Walk / Attack for character.'));
  let playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active = false, playhead = 0, last = 0, raf = 0;
  const currentAnimation = (): PreviewAnimation => animation.value as PreviewAnimation;
  function paint(ctx: CanvasRenderingContext2D, figure: Figure, x: number, y: number, scale: number): void {
    const sampled = samplePreview(currentAnimation(), playhead);
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,.24)'; ctx.beginPath(); ctx.ellipse(0, 2, 18 * scale, 2.7 * scale, 0, 0, Math.PI * 2); ctx.fill();
    ctx.scale(mirror.checked ? -scale : scale, scale); figure.draw(ctx, sampled.anim, sampled.t, playhead); ctx.restore();
  }
  function draw(): void {
    const duration = previewDuration(currentAnimation()), pose = samplePreview(currentAnimation(), playhead);
    scrub.value = String(playhead % duration); readout.textContent = `${pose.anim} · ${(playhead % duration).toFixed(2)}s`;
    for (const { study, card, ctx } of cards) {
      if (card.hidden) continue;
      ctx.clearRect(0, 0, 440, 440);
      // Identical quiet stage for all three: differences belong to the character.
      const gradient = ctx.createRadialGradient(220, 140, 5, 220, 160, 240);
      gradient.addColorStop(0, '#303d49'); gradient.addColorStop(1, '#171c26'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 440, 330);
      ctx.strokeStyle = '#71818b'; ctx.globalAlpha = .17; ctx.lineWidth = .7;
      ctx.beginPath(); ctx.arc(220, 166, 111, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(220, 166, 119, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const angle = i * Math.PI / 6;
        ctx.beginPath(); ctx.moveTo(220 + Math.cos(angle) * 116, 166 + Math.sin(angle) * 116);
        ctx.lineTo(220 + Math.cos(angle) * 121, 166 + Math.sin(angle) * 121); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const frame = anubisStudyFrame(pose.anim, mirror.checked);
      paint(ctx, study.figure, frame.x, frame.y, frame.scale);
      if (guides.checked) {
        ctx.strokeStyle = '#909ca6'; ctx.setLineDash([4, 5]); ctx.lineWidth = .7; ctx.beginPath();
        ctx.moveTo(0, 302); ctx.lineTo(440, 302); ctx.moveTo(220, 20); ctx.lineTo(220, 330); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.fillStyle = '#131922'; ctx.fillRect(0, 330, 440, 110);
      ctx.strokeStyle = '#343e49'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(18, 330); ctx.lineTo(422, 330); ctx.stroke();
      const baseline = FIGURE_BY_ID.get('anubis');
      const sampleY = pose.anim === 'death' ? 386 : 421, sampleScale = pose.anim === 'death' ? .38 : .55;
      if (baseline) paint(ctx, baseline, 155, sampleY, sampleScale);
      paint(ctx, study.figure, 285, sampleY, sampleScale);
      ctx.font = '9px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#aeb7bc';
      ctx.fillText('CURRENT', 155, 437); ctx.fillStyle = study.accent; ctx.fillText('STUDY', 285, 437);
      ctx.textAlign = 'left'; ctx.fillStyle = '#818c97'; ctx.fillText('BATTLE', 18, 350); ctx.fillText('SIZE', 18, 363);
    }
  }
  function tick(now: number): void {
    if (!active) return;
    if (playing) playhead += Math.min(.1, Math.max(0, (now - last) / 1000)) * Number(speed.value);
    last = now; draw(); if (playing) raf = requestAnimationFrame(tick);
  }
  function refresh(): void {
    cancelAnimationFrame(raf); play.textContent = playing ? 'Pause' : 'Play';
    play.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} Anubis comparison`);
    last = performance.now(); if (active) tick(last);
  }
  all.addEventListener('click', () => { for (const entry of cards) entry.card.hidden = false; grid.dataset.focused = 'false'; all.hidden = true; refresh(); });
  play.addEventListener('click', () => { playing = !playing; refresh(); });
  restart.addEventListener('click', () => { playhead = 0; refresh(); });
  step.addEventListener('click', () => { playing = false; playhead += 1 / 30; refresh(); });
  animation.addEventListener('change', () => { playhead = 0; scrub.max = String(previewDuration(currentAnimation())); refresh(); });
  speed.addEventListener('change', refresh);
  mirror.addEventListener('change', refresh); guides.addEventListener('change', refresh);
  scrub.addEventListener('input', () => { playing = false; playhead = Number(scrub.value); refresh(); });
  refresh();
  return { root, start: () => { if (active) return; active = true; refresh(); }, stop: () => { active = false; cancelAnimationFrame(raf); } };
}
