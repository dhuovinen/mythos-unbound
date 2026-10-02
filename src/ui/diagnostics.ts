import type { DiagnosticEvent } from '../sim/diagnostics';
import { ANALYSIS_PROMPT, buildDiagnosticPacket, gameInstructions, packetJson, packetMarkdown } from '../sim/diagnosticexport';
import type { DiagnosticCapture } from '../sim/diagnosticexport';
import type { AttackResult } from '../sim/combat';
import type { Modifier, Unit } from '../sim/types';

const PAGE_SIZE = 50;
function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node;
}
const n = (value: number): string => Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
const CSS = `
  #diagnostic-open { position:fixed; top:16px; left:258px; z-index:41; height:40px; padding:0 14px; border-radius:20px; background:#17141a; border:2px solid #807662; color:#e8dcc4; cursor:pointer; font:700 12px system-ui; }
  #diagnostic-log { width:min(1200px,calc(100vw - 32px)); max-width:none; max-height:calc(100dvh - 32px); padding:24px; border:1px solid #514b47; border-radius:14px; background:#17141a; color:#e8dcc4; font:13px/1.5 system-ui; }
  #diagnostic-log::backdrop { background:rgba(8,7,10,.88); }
  #diagnostic-log * { box-sizing:border-box; }
  #diagnostic-log h2 { margin:0; font:500 28px Georgia,serif; }
  #diagnostic-log h3 { margin:18px 0 8px; font-size:15px; }
  #diagnostic-log p { color:#b8ab99; }
  #diagnostic-log button, #diagnostic-log select, #diagnostic-log input { font:inherit; padding:7px 10px; border:1px solid #514b47; border-radius:6px; background:#25212b; color:#e8dcc4; }
  #diagnostic-log button { cursor:pointer; }
  #diagnostic-log button:hover { border-color:#c9a227; }
  #diagnostic-log button:disabled { opacity:.4; cursor:default; }
  .dl-head, .dl-controls, .dl-page { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .dl-head { justify-content:space-between; }
  .dl-stat { color:#e8dcc4 !important; background:#242029; padding:12px 14px; border-radius:8px; }
  .dl-controls { margin:12px 0; }
  .dl-grid { display:grid; grid-template-columns:minmax(280px,.9fr) minmax(0,1.1fr); gap:18px; margin-top:18px; }
  .dl-list { display:flex; flex-direction:column; gap:6px; max-height:480px; overflow-y:auto; padding-right:3px; }
  #diagnostic-log .dl-event { text-align:left; padding:10px 12px; }
  #diagnostic-log .dl-event[aria-pressed=true] { border-color:#c9a227; background:#342d22; }
  .dl-event small { display:block; color:#b8ab99; margin-bottom:4px; }
  .dl-page { justify-content:space-between; margin:12px 0; }
  .dl-details { min-width:0; background:#1e1a23; border:1px solid #3f3741; border-radius:9px; padding:16px; align-self:start; }
  .dl-scroll { overflow-x:auto; }
  #diagnostic-log table { border-collapse:collapse; width:100%; font-size:12px; }
  #diagnostic-log th, #diagnostic-log td { padding:5px 7px; border-bottom:1px solid #3d3540; text-align:left; white-space:nowrap; font-variant-numeric:tabular-nums; }
  #diagnostic-log th { color:#b8ab99; font-size:11px; }
  #diagnostic-log pre { white-space:pre-wrap; overflow-wrap:anywhere; font:11px/1.6 ui-monospace,monospace; background:#131017; padding:12px; border-radius:6px; max-height:600px; overflow:auto; }
  #diagnostic-log details { margin:14px 0; }
  #diagnostic-log summary { cursor:pointer; color:#cabcaa; }
  .dl-prompt { width:100%; min-height:220px; resize:vertical; background:#131017; color:#e8dcc4; border:1px solid #4d424a; padding:12px; font:12px/1.5 system-ui; }
  #diagnostic-log :focus-visible { outline:2px solid #c9a227; outline-offset:3px; }
  @media(max-width:850px) { .dl-grid { grid-template-columns:1fr; } .dl-list { max-height:260px; } #diagnostic-log { padding:16px; } }
  @media(max-width:560px) { #diagnostic-open { top:64px; left:16px; } }
`;

/** Opens a frozen view of a live log. Refresh takes a new snapshot; exports include that entire snapshot. */
export function mountDiagnostics(getCapture: () => DiagnosticCapture): () => void {
  const style = el('style'); style.textContent = CSS; document.head.append(style);
  const button = el('button', undefined, 'Battle log'); button.id = 'diagnostic-open';
  const dialog = el('dialog'); dialog.id = 'diagnostic-log'; dialog.setAttribute('aria-labelledby', 'diagnostic-title');
  const header = el('div', 'dl-head'); const title = el('h2', undefined, 'Battle diagnostic log'); title.id = 'diagnostic-title';
  const close = el('button', undefined, 'Close'); header.append(title, close);
  const status = el('p', 'dl-stat');
  const note = el('p', undefined, 'A recorded snapshot of the battle. Refresh to capture more events; the battle keeps running. Downloads contain the complete log, game instructions and an example prompt for a separate review.');
  const controls = el('div', 'dl-controls');
  const refresh = el('button', undefined, 'Refresh snapshot');
  const markdown = el('button', undefined, 'Export review packet (.md)');
  const json = el('button', undefined, 'Export JSON');
  controls.append(refresh, markdown, json);
  const exportNotice = el('div'); exportNotice.setAttribute('role', 'status');
  const help = el('details'); help.append(el('summary', undefined, 'How to review this with a cloud model'));
  help.append(el('p', undefined, 'Download the review packet, attach it to a separate model conversation, then paste the example prompt. The file includes rules, roster, relationships, engine source and every recorded event. The app makes no model requests and performs no diagnostic analysis.'));
  const prompt = el('textarea', 'dl-prompt'); prompt.readOnly = true; prompt.value = ANALYSIS_PROMPT; prompt.setAttribute('aria-label', 'Example external analysis prompt');
  const copy = el('button', undefined, 'Copy analysis prompt');
  const copyStatus = el('span'); copyStatus.setAttribute('role', 'status');
  help.append(prompt, copy, copyStatus);
  const rules = el('details'); rules.append(el('summary', undefined, 'Game instructions included in the export')); const rulesText = el('pre'); rules.append(rulesText);
  const filters = el('div', 'dl-controls');
  const kind = el('select'); kind.setAttribute('aria-label', 'Filter battle event type');
  for (const value of ['all', 'attack', 'deployment', 'summon-attempt', 'decision', 'death', 'target', 'snapshot', 'start', 'settings', 'mode', 'outcome']) {
    const option = el('option', undefined, value === 'all' ? 'All events' : value); option.value = value; kind.append(option);
  }
  const search = el('input'); search.type = 'search'; search.placeholder = 'Search names, IDs, descriptions'; search.setAttribute('aria-label', 'Search battle event descriptions');
  const filterNote = el('span', undefined, 'Filters affect this viewer only.'); filters.append(kind, search, filterNote);
  const grid = el('div', 'dl-grid'); const left = el('section'); const list = el('div', 'dl-list');
  list.setAttribute('aria-label', 'Chronological battle events');
  const pageRow = el('div', 'dl-page'); const previous = el('button', undefined, 'Previous page'); const next = el('button', undefined, 'Next page'); const pageLabel = el('span');
  pageRow.append(previous, pageLabel, next); left.append(list, pageRow);
  const detail = el('section', 'dl-details'); detail.setAttribute('aria-label', 'Selected battle event details'); grid.append(left, detail);
  dialog.append(header, note, status, controls, exportNotice, help, rules, filters, grid);
  document.body.append(button, dialog);

  let capture: DiagnosticCapture | undefined;
  let exportedAt = '';
  let page = 0;
  let selectedSequence: number | null = null;
  let exportUrl: string | undefined;
  function clearExport(): void {
    if (exportUrl) URL.revokeObjectURL(exportUrl);
    exportUrl = undefined;
    exportNotice.replaceChildren();
  }
  const names = new Map<string, string>();
  const unitName = (u: Unit): string => `${u.side} ${u.isBase ? 'Base' : names.get(u.deityId) ?? u.deityId} #${u.id}`;
  function table(host: HTMLElement, headers: string[], rows: (string | number | boolean | null)[][]): void {
    const wrap = el('div', 'dl-scroll'); const node = el('table'); const head = el('thead'); const row = el('tr');
    for (const h of headers) row.append(el('th', undefined, h)); head.append(row); const body = el('tbody');
    for (const values of rows) { const r = el('tr'); for (const value of values) r.append(el('td', undefined, value === null ? 'not evaluated' : typeof value === 'number' ? n(value) : String(value))); body.append(r); }
    node.append(head, body); wrap.append(node); host.append(wrap);
  }
  function field(host: HTMLElement, units: Unit[], heading: string): void {
    host.append(el('h3', undefined, heading));
    table(host, ['Instance', 'Position', 'HP', 'Max HP', 'Cooldown', 'Target ID'], units.map((u) => [unitName(u), u.x, u.hp, u.maxHp, u.cooldown, u.targetId === null ? '—' : u.targetId]));
  }
  function showDetails(event: DiagnosticEvent): void {
    selectedSequence = event.sequence; detail.replaceChildren();
    detail.append(el('h3', undefined, `#${event.sequence} · ${event.kind} · tick ${event.tick}`), el('p', undefined, event.message));
    if (event.kind === 'attack') {
      const data = event.data as unknown as { attackerBefore: Unit; defenderBefore: Unit; attackerAfter: Unit; defenderAfter: Unit; fieldBefore: Unit[]; result: AttackResult; hpRemoved: number; overkill: number; distance: number; combatEdges: { from: string; to: string; kind: string }[] };
      const calc = data.result.calculation;
      table(detail, ['Attack evidence', 'Value'], [
        ['Attacker', unitName(data.attackerBefore)], ['Target', unitName(data.defenderBefore)], ['Distance', data.distance],
        ['Attack range', capture?.log.metadata.roster.find((d) => d.id === data.attackerBefore.deityId)?.range ?? null],
        ['Calculated damage', data.result.damage], ['HP removed', data.hpRemoved], ['Overkill', data.overkill],
        ['No-relations same-hit baseline', data.result.baseDamage], ['Suppressed', data.result.suppressed],
        ['Target HP before → after', `${n(data.defenderBefore.hp)} → ${n(data.defenderAfter.hp)}`],
        ['Attacker cooldown before → after', `${n(data.attackerBefore.cooldown)} → ${n(data.attackerAfter.cooldown)}`],
      ]);
      if (calc) {
        detail.append(el('h3', undefined, 'Damage calculation'));
        table(detail, ['Input / operation', 'Value'], [
          ['Roster damage', calc.baseDamageStat], ['Damage multiplier (after ceiling)', calc.attackerCombined.damageMult],
          ['Raw damage', calc.rawDamage], ['Roster armour', calc.baseArmorStat],
          ['Defender aura armour multiplier', calc.defenderCombined?.armorMult ?? null], ['Effective armour subtracted', calc.effectiveArmor],
          ['Attack rate multiplier', calc.attackerCombined.attackSpeedMult], ['Cooldown assigned', calc.cooldownAssigned],
          ['Armour penetration', calc.attackerCombined.armorPen], ['Defender auras evaluated', calc.defenderAurasEvaluated],
        ]);
        if (!calc.defenderAurasEvaluated) detail.append(el('p', undefined, 'Defender aura evaluation was skipped by the resolver. This does not establish that no theoretical aura exists.'));
        detail.append(el('h3', undefined, 'Relationship modifiers'));
        const mods: [string, Modifier][] = [
          ...calc.combatModifiers.map((m): [string, Modifier] => ['Enemy combat', m]),
          ...calc.attackerAuras.map((m): [string, Modifier] => ['Attacker aura', m]),
          ...calc.defenderAuras.map((m): [string, Modifier] => ['Defender aura', m]),
        ];
        if (mods.length) table(detail, ['Scope', 'Modifier', 'Damage ×', 'Rate ×', 'Armour ×', 'Pierces', 'Suppresses'], mods.map(([scope, m]) => [scope, m.name, m.damageMult, m.attackSpeedMult, m.armorMult, m.armorPen, m.suppress]));
        else detail.append(el('p', undefined, 'No modifiers returned for this attack.'));
        if (data.combatEdges.length) {
          detail.append(el('h3', undefined, 'Direct relationship edges'));
          table(detail, ['From', 'Relation', 'To'], data.combatEdges.map((e) => [names.get(e.from) ?? e.from, e.kind, names.get(e.to) ?? e.to]));
        }
        const allies = (ids: number[]): string => ids.map((id) => {
          const unit = data.fieldBefore.find((u) => u.id === id);
          return unit ? unitName(unit) : `#${id}`;
        }).join(', ') || 'None';
        detail.append(el('h3', undefined, 'Allies supplied to aura evaluation'));
        table(detail, ['Pool', 'Instances'], [
          ['Attacker: nearby', allies(calc.attackerNearbyAllies)], ['Attacker: entire field', allies(calc.attackerAllies)],
          ['Defender: nearby', calc.defenderAurasEvaluated ? allies(calc.defenderNearbyAllies) : 'Not evaluated'],
          ['Defender: entire field', calc.defenderAurasEvaluated ? allies(calc.defenderAllies) : 'Not evaluated'],
        ]);
      }
      field(detail, data.fieldBefore, 'Entire field immediately before attack');
    } else {
      const state = (event.data.state ?? event.data.stateBefore ?? event.data.stateAfter) as ReturnType<typeof import('../sim/diagnostics').diagnosticState> | undefined;
      if (state) {
        table(detail, ['Economy', 'Value'], [['Player faith', state.player.faith], ['Enemy faith', state.enemy.faith], ['Enemy AI enabled', state.enemy.aiEnabled], ['Player hand', state.player.hand.slots.join(', ')], ['Player queue', state.player.hand.queue.join(', ')]]);
        for (const side of ['player', 'enemy'] as const) {
          const host = side === 'enemy' ? el('details') : detail;
          host.append(side === 'enemy' ? el('summary', undefined, `Opponent summon availability · ${state.enemy.available.length} candidates`) : el('h3', undefined, 'Player summon availability'));
          table(host, ['Slot / index', 'Character', 'Cost', 'Affordable', 'Field block', 'Summonable'], state[side].available.map((a) => [a.slot + 1, names.get(a.deityId) ?? a.deityId, a.cost, a.affordable, a.fieldBlock ?? '—', a.summonable]));
          if (side === 'enemy') detail.append(host);
        }
        field(detail, state.units, 'Field at this event');
      }
    }
    const raw = el('details'); raw.append(el('summary', undefined, 'Exact record (JSON, full precision)'));
    raw.append(el('pre', undefined, JSON.stringify(event, null, 2))); detail.append(raw);
  }
  function filtered(): DiagnosticEvent[] {
    const text = search.value.trim().toLocaleLowerCase();
    return capture?.log.events.filter((e) => (kind.value === 'all' || e.kind === kind.value) && (!text || `${e.sequence} ${e.message}`.toLocaleLowerCase().includes(text))) ?? [];
  }
  function renderList(): void {
    const entries = filtered(); const pages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE)); page = Math.min(page, pages - 1);
    const shown = entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE); list.replaceChildren();
    if (!shown.length) list.append(el('p', undefined, 'No events match these filters.'));
    for (const event of shown) {
      const b = el('button', 'dl-event'); b.setAttribute('aria-pressed', String(selectedSequence === event.sequence));
      b.append(el('small', undefined, `#${event.sequence} · ${n(event.time)}s · tick ${event.tick} · ${event.kind}`), el('span', undefined, event.message));
      b.addEventListener('click', () => { showDetails(event); renderList(); }); list.append(b);
    }
    previous.disabled = page === 0; next.disabled = page === pages - 1;
    pageLabel.textContent = `${entries.length} events · page ${page + 1} / ${pages}`;
    if (!shown.some((e) => e.sequence === selectedSequence)) {
      if (shown[0]) { showDetails(shown[0]); list.children[0]?.setAttribute('aria-pressed', 'true'); }
      else { selectedSequence = null; detail.replaceChildren(el('p', undefined, 'Select a recorded event to inspect its evidence.')); }
    }
  }
  function takeSnapshot(): void {
    clearExport();
    capture = structuredClone(getCapture()); exportedAt = new Date().toISOString();
    names.clear(); for (const d of capture.log.metadata.roster) names.set(d.id, d.name);
    const events = capture.log.events;
    status.textContent = `${capture.state.outcome === 'ongoing' ? 'In progress' : String(capture.state.outcome)} · snapshot at ${n(capture.time)}s · ${events.length} events · ${events.filter((e) => e.kind === 'attack').length} attacks · ${events.filter((e) => e.kind === 'deployment').length} deployments`;
    page = 0; selectedSequence = null; rulesText.textContent = gameInstructions(capture.log); renderList();
  }
  function download(format: 'md' | 'json'): void {
    if (!capture) return;
    const packet = buildDiagnosticPacket(capture, exportedAt);
    const content = format === 'md' ? packetMarkdown(packet) : packetJson(packet);
    const blob = new Blob([content], { type: format === 'md' ? 'text/markdown;charset=utf-8' : 'application/json' });
    clearExport();
    const url = URL.createObjectURL(blob); exportUrl = url; const a = el('a');
    a.href = url; a.download = `mythos-battle-${capture.log.metadata.createdAt.replace(/\D/g, '').slice(0,14)}-t${Math.round(capture.time * 1000)}.${format}`;
    a.textContent = `Download ${a.download} (${(blob.size / 1024 / 1024).toFixed(2)} MB, ${capture.log.events.length} events)`;
    a.style.color = '#c9a227';
    const copyExport = el('button', undefined, 'Copy complete export');
    const exportStatus = el('span'); exportStatus.setAttribute('role', 'status');
    const exportContents = el('details'); exportContents.append(el('summary', undefined, 'Export preview'));
    exportContents.append(el('p', undefined, 'Preview shows the first 20,000 characters. Download and Copy complete export include every event.'));
    const text = el('textarea', 'dl-prompt'); text.readOnly = true; text.value = content.slice(0, 20000); text.setAttribute('aria-label', 'Export preview');
    exportContents.append(text);
    copyExport.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(content); exportStatus.textContent = ' Complete export copied.'; }
      catch {
        text.value = content; text.setAttribute('aria-label', 'Complete export contents');
        exportContents.open = true; text.focus(); text.select(); exportStatus.textContent = ' Select and copy the highlighted complete export.';
      }
    });
    const row = el('div', 'dl-controls'); row.append(a, copyExport, exportStatus);
    exportNotice.replaceChildren(row, exportContents);
    a.click();
  }
  const open = (): void => { if (dialog.open) return; takeSnapshot(); dialog.showModal(); close.focus(); };
  button.addEventListener('click', open); refresh.addEventListener('click', takeSnapshot);
  markdown.addEventListener('click', () => download('md')); json.addEventListener('click', () => download('json'));
  kind.addEventListener('change', () => { page = 0; renderList(); }); search.addEventListener('input', () => { page = 0; renderList(); });
  previous.addEventListener('click', () => { page--; renderList(); }); next.addEventListener('click', () => { page++; renderList(); });
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(ANALYSIS_PROMPT); copyStatus.textContent = ' Prompt copied.'; }
    catch { prompt.focus(); prompt.select(); copyStatus.textContent = ' Select and copy the highlighted prompt.'; }
  });
  close.addEventListener('click', () => dialog.close()); dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', (event) => event.stopPropagation());
  dialog.addEventListener('close', () => {
    clearExport();
    button.focus();
  });
  return open;
}
