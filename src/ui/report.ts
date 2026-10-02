/**
 * Post-match battle report.
 *
 * Only reachable once a battle has ended, and deliberately the one place in the game that speaks in
 * hard numbers. The consultant is qualitative by design; this is the audit. It answers the question
 * the whole design rests on: *did the relationships actually do anything?*
 *
 * The key column is the swing — actual damage minus what the same attack would have dealt with no
 * relations in play. A positive total means the graph won you damage; a negative one means it cost
 * you, which is a real outcome worth showing rather than hiding.
 */

import type { BattleLog, BattleSummary } from '../sim/battlelog';
import { summarise } from '../sim/battlelog';
import { MODIFIER_COLORS } from '../sim/constants';
import type { DeityIndex, Outcome, Side } from '../sim/types';

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className !== undefined) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const signed = (n: number): string => `${n >= 0 ? '+' : ''}${Math.round(n)}`;

function styles(): string {
  return `
  #report-open {
    position: fixed; top: 66px; left: 16px; z-index: 41; display: none;
    height: 40px; padding: 0 14px; border-radius: 20px;
    background: #241d10; color: #c9a227; border: 2px solid #c9a227;
    font: 700 12px ui-sans-serif, system-ui, sans-serif; cursor: pointer;
  }
  @media(max-width:560px) { #report-open { left:128px; } }
  #report-open.available { display: inline-block; }
  #report-overlay {
    position: fixed; inset: 0; z-index: 60; display: none;
    background: rgba(10,8,8,.92); overflow-y: auto; padding: 22px 16px 60px;
  }
  #report-overlay.open { display: block; }
  .rp-sheet {
    max-width: 1000px; margin: 0 auto; background: #17141a; border: 1px solid #3a3229;
    border-radius: 12px; padding: 24px 28px 28px; color: #e8dcc4;
    font-family: ui-sans-serif, system-ui, sans-serif;
  }
  .rp-head { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; flex-wrap: wrap; }
  .rp-head h1 { margin: 0; font-size: 26px; }
  .rp-outcome { font-size: 13px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; }
  .rp-outcome.victory { color: #c9a227; }
  .rp-outcome.defeat { color: #c4442e; }
  .rp-btn {
    background: none; border: 1px solid #4a4038; color: #e8dcc4; cursor: pointer;
    border-radius: 6px; padding: 7px 13px; font-size: 12.5px; font-weight: 700; font-family: inherit;
  }
  .rp-btn:hover { border-color: #c9a227; color: #c9a227; }
  .rp-cards { display: flex; gap: 12px; margin: 18px 0 6px; flex-wrap: wrap; }
  .rp-card {
    flex: 1 1 190px; background: #1b1720; border: 1px solid #2b2620;
    border-radius: 10px; padding: 13px 15px;
  }
  .rp-card .k { font-size: 10.5px; text-transform: uppercase; letter-spacing: .7px; color: #a99c85; }
  .rp-card .v { font-size: 24px; font-weight: 800; margin-top: 4px; font-variant-numeric: tabular-nums; }
  .rp-card .v.pos { color: #c9a227; }
  .rp-card .v.neg { color: #c4442e; }
  .rp-card .sub { font-size: 11.5px; color: #6d6355; margin-top: 3px; line-height: 1.45; }
  .rp-sheet h2 {
    margin: 30px 0 10px; font-size: 17px; color: #c9a227;
    border-bottom: 1px solid #3a3229; padding-bottom: 6px;
  }
  .rp-note { font-size: 12.5px; color: #857a68; margin: 0 0 10px; line-height: 1.5; max-width: 78ch; }
  .rp-scroll { overflow-x: auto; }
  .rp-table { width: 100%; border-collapse: collapse; font-size: 12.5px; min-width: 560px; }
  .rp-table th, .rp-table td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #2b2620; }
  .rp-table th {
    color: #a99c85; font-size: 10.5px; text-transform: uppercase; letter-spacing: .6px; font-weight: 700;
  }
  .rp-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .rp-chip {
    display: inline-block; padding: 1px 7px; border-radius: 4px;
    font-weight: 800; font-size: 11px; color: #17141a;
  }
  .rp-side { font-size: 10.5px; text-transform: uppercase; letter-spacing: .5px; }
  .rp-side.player { color: #cabfa9; }
  .rp-side.enemy { color: #c4442e; }
  .pos { color: #c9a227; }
  .neg { color: #c4442e; }
  .rp-empty { color: #6d6355; font-style: italic; font-size: 13px; }
  .rp-more { font-size: 11.5px; color: #6d6355; margin-top: 8px; }
  `;
}

const SIDE_LABEL: Readonly<Record<Side, string>> = { player: 'You', enemy: 'Opponent' };

/** How many individual attacks to list. A long battle produces thousands. */
const MAX_ROWS = 120;

export interface ReportHandle {
  /** Call each frame; the button reveals itself when the battle ends. */
  update(outcome: Outcome): void;
}

/** Builds the report button and overlay. Both stay hidden until a battle finishes. */
export function mountReport(log: BattleLog, deities: DeityIndex, onDiagnostics?: () => void): ReportHandle {
  const style = el('style');
  style.textContent = styles();
  document.head.append(style);

  const button = el('button', undefined, '📜  Battle report');
  button.id = 'report-open';

  const overlay = el('div');
  overlay.id = 'report-overlay';
  const sheet = el('div', 'rp-sheet');
  overlay.append(sheet);

  const nameOf = (unitId: number): string => {
    const identity = log.identities.get(unitId);
    if (identity === undefined) return 'unknown';
    return deities.get(identity.deityId)?.name ?? identity.deityId;
  };
  const sideOf = (unitId: number): Side | null => log.identities.get(unitId)?.side ?? null;

  const render = (outcome: Outcome): void => {
    const summary: BattleSummary = summarise(log, deities);
    sheet.replaceChildren();

    // ---- header ----
    const head = el('div', 'rp-head');
    const headText = el('div');
    headText.append(el('h1', undefined, 'Battle report'));
    const outcomeLabel = el(
      'div',
      `rp-outcome ${outcome}`,
      outcome === 'victory' ? 'Victory' : outcome === 'defeat' ? 'Defeat' : 'In progress',
    );
    headText.append(outcomeLabel);
    const close = el('button', 'rp-btn', 'Close');
    head.append(headText, close);
    close.addEventListener('click', () => overlay.classList.remove('open'));
    sheet.append(head);
    if (onDiagnostics) {
      const fullLog = el('button', 'rp-btn', 'Open full diagnostic log & export');
      fullLog.style.marginTop = '14px';
      fullLog.addEventListener('click', onDiagnostics);
      sheet.append(fullLog);
    }

    // ---- headline figures ----
    const cards = el('div', 'rp-cards');
    const card = (key: string, value: string, sub: string, cls = ''): HTMLElement => {
      const node = el('div', 'rp-card');
      node.append(el('div', 'k', key));
      node.append(el('div', `v ${cls}`.trim(), value));
      node.append(el('div', 'sub', sub));
      return node;
    };

    const yourSwing = summary.swingBySide.player;
    const theirSwing = summary.swingBySide.enemy;

    cards.append(
      card(
        'Your relational swing',
        signed(yourSwing),
        yourSwing >= 0
          ? 'Extra damage your bloodlines won you, over and above plain statistics.'
          : 'Damage your own bloodlines cost you — kinship cuts both ways.',
        yourSwing >= 0 ? 'pos' : 'neg',
      ),
    );
    cards.append(
      card(
        'Their relational swing',
        signed(theirSwing),
        'The same figure for your opponent. Compare the two: this is who the graph favoured.',
        theirSwing >= 0 ? 'neg' : 'pos',
      ),
    );
    cards.append(
      card(
        'Attacks with a relation',
        `${summary.relationalAttacks}`,
        `of ${summary.totalAttacks} total — ${
          summary.totalAttacks === 0
            ? '0'
            : Math.round((summary.relationalAttacks / summary.totalAttacks) * 100)
        }% of all blows were shaped by kinship.`,
      ),
    );
    sheet.append(cards);

    // ---- what was fielded ----
    sheet.append(el('h2', undefined, 'What was fielded'));
    if (summary.deployments.length === 0) {
      sheet.append(el('p', 'rp-empty', 'Nothing was deployed.'));
    } else {
      const wrap = el('div', 'rp-scroll');
      const table = el('table', 'rp-table');
      const thead = el('thead');
      const hr = el('tr');
      for (const h of ['Side', 'Unit', 'Times summoned', 'Faith spent']) hr.append(el('th', undefined, h));
      thead.append(hr);
      const tbody = el('tbody');
      for (const deployment of summary.deployments) {
        const tr = el('tr');
        const sideCell = el('td');
        sideCell.append(el('span', `rp-side ${deployment.side}`, SIDE_LABEL[deployment.side]));
        tr.append(sideCell);
        tr.append(el('td', undefined, deities.get(deployment.deityId)?.name ?? deployment.deityId));
        tr.append(el('td', 'num', `${deployment.count}`));
        tr.append(el('td', 'num', `${Math.round(deployment.totalCost)}`));
        tbody.append(tr);
      }
      table.append(thead, tbody);
      wrap.append(table);
      sheet.append(wrap);
    }

    // ---- which relationships mattered ----
    sheet.append(el('h2', undefined, 'Which relationships mattered'));
    sheet.append(
      el(
        'p',
        'rp-note',
        'Swing is damage gained or lost against what the same attacks would have dealt with no relations at all. Where several relations fired on one blow the swing is split evenly between them, so nothing is counted twice.',
      ),
    );
    if (summary.tallies.length === 0) {
      sheet.append(
        el('p', 'rp-empty', 'No relationship fired all battle — this was settled on raw statistics.'),
      );
    } else {
      const wrap = el('div', 'rp-scroll');
      const table = el('table', 'rp-table');
      const thead = el('thead');
      const hr = el('tr');
      for (const h of ['Side', 'Relationship', 'Times fired', 'Attacks refused', 'Damage swing']) {
        hr.append(el('th', undefined, h));
      }
      thead.append(hr);
      const tbody = el('tbody');
      for (const tally of summary.tallies) {
        const tr = el('tr');
        const sideCell = el('td');
        sideCell.append(el('span', `rp-side ${tally.side}`, SIDE_LABEL[tally.side]));
        tr.append(sideCell);

        const modCell = el('td');
        const chip = el('span', 'rp-chip', tally.modifier);
        chip.style.background = MODIFIER_COLORS[tally.modifier];
        modCell.append(chip);
        tr.append(modCell);

        tr.append(el('td', 'num', `${tally.procs}`));
        tr.append(el('td', 'num', tally.prevented > 0 ? `${tally.prevented}` : '—'));
        const swingCell = el('td', `num ${tally.swing >= 0 ? 'pos' : 'neg'}`, signed(tally.swing));
        tr.append(swingCell);
        tbody.append(tr);
      }
      table.append(thead, tbody);
      wrap.append(table);
      sheet.append(wrap);
    }

    // ---- blow by blow ----
    sheet.append(el('h2', undefined, 'Blow by blow'));
    const relational = log.entries.filter((e) => e.modifiers.length > 0);
    const shown = relational.slice(-MAX_ROWS);
    if (shown.length === 0) {
      sheet.append(el('p', 'rp-empty', 'No attack was modified by a relationship.'));
    } else {
      const wrap = el('div', 'rp-scroll');
      const table = el('table', 'rp-table');
      const thead = el('thead');
      const hr = el('tr');
      for (const h of ['Time', 'Attacker', 'Target', 'Relations', 'Would have', 'Dealt', 'Swing']) {
        hr.append(el('th', undefined, h));
      }
      thead.append(hr);
      const tbody = el('tbody');
      for (const entry of shown) {
        const tr = el('tr');
        tr.append(el('td', 'num', `${entry.time.toFixed(1)}s`));

        const attackerCell = el('td');
        const side = sideOf(entry.attackerId);
        if (side !== null) attackerCell.append(el('span', `rp-side ${side}`, `${SIDE_LABEL[side]} · `));
        attackerCell.append(document.createTextNode(nameOf(entry.attackerId)));
        tr.append(attackerCell);

        tr.append(el('td', undefined, nameOf(entry.defenderId)));

        const modCell = el('td');
        for (const modifier of entry.modifiers) {
          const chip = el('span', 'rp-chip', modifier);
          chip.style.background = MODIFIER_COLORS[modifier];
          chip.style.marginRight = '4px';
          modCell.append(chip);
        }
        tr.append(modCell);

        tr.append(el('td', 'num', `${Math.round(entry.baseDamage)}`));
        tr.append(
          el('td', 'num', entry.prevented ? 'refused' : `${Math.round(entry.damage)}`),
        );
        tr.append(el('td', `num ${entry.swing >= 0 ? 'pos' : 'neg'}`, signed(entry.swing)));
        tbody.append(tr);
      }
      table.append(thead, tbody);
      wrap.append(table);
      sheet.append(wrap);

      if (relational.length > shown.length) {
        sheet.append(
          el(
            'p',
            'rp-more',
            `Showing the last ${shown.length} of ${relational.length} relational attacks.`,
          ),
        );
      }
    }
  };

  let lastOutcome: Outcome = 'ongoing';
  let opened = false;

  button.addEventListener('click', () => {
    // Re-rendered on open rather than cached, so reopening after a longer battle stays accurate.
    render(lastOutcome);
    overlay.classList.add('open');
  });

  document.body.append(button, overlay);

  return {
    update(outcome): void {
      lastOutcome = outcome;
      const over = outcome !== 'ongoing';
      button.classList.toggle('available', over);
      if (over && !opened) {
        // First frame after the battle ends: surface the report, since this is its whole moment.
        opened = true;
        render(outcome);
        overlay.classList.add('open');
      }
    },
  };
}
