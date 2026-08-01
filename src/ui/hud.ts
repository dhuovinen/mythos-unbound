/**
 * Player HUD control surface — WP-6.
 *
 * Renders the faith meter, unit summon cards, tier badges, affordability hints, keyboard shortcuts,
 * and game over banner. Pure DOM manipulation, zero runtime dependencies.
 */

import type { Deity, HudHandle, MountHud } from '../sim/types';

/** Module-level keydown handler ref to clean up on re-mounts. */
let activeKeyHandler: ((event: KeyboardEvent) => void) | null = null;

/** Injects HUD CSS rules into document head if not already present. */
function ensureHudStyles(): void {
  if (document.getElementById('hud-styles') !== null) {
    return;
  }
  const style = document.createElement('style');
  style.id = 'hud-styles';
  style.textContent = `
    .hud-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      box-sizing: border-box;
      font-family: 'Outfit', system-ui, -apple-system, sans-serif;
      color: #e8dcc4;
      user-select: none;
    }
    .hud-banner {
      text-align: center;
      font-size: 22px;
      font-weight: 800;
      padding: 10px 16px;
      border-radius: 8px;
      margin-bottom: 12px;
      letter-spacing: 2px;
      text-transform: uppercase;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    }
    .hud-banner.victory {
      background: rgba(79, 227, 224, 0.15);
      color: #4fe3e0;
      border: 2px solid #4fe3e0;
    }
    .hud-banner.defeat {
      background: rgba(227, 79, 168, 0.15);
      color: #e34fa8;
      border: 2px solid #e34fa8;
    }
    .hud-faith-wrap {
      background: #1a1616;
      border: 1px solid #3a3030;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    .hud-faith-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 6px;
    }
    .hud-faith-track {
      width: 100%;
      height: 10px;
      background: #0a0808;
      border-radius: 5px;
      overflow: hidden;
      border: 1px solid #2a2020;
    }
    .hud-faith-fill {
      height: 100%;
      background: linear-gradient(90deg, #c86a3a, #4fe3e0);
      border-radius: 5px;
      transition: width 0.1s linear;
    }
    .hud-deck-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .hud-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #1a1616;
      border: 2px solid #3a3030;
      border-radius: 8px;
      padding: 8px 10px;
      min-width: 90px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: transform 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    }
    .hud-card:hover:not(.disabled) {
      transform: translateY(-3px);
      border-color: #ffffff;
    }
    .hud-card.disabled {
      opacity: 0.45;
      cursor: not-allowed;
      transform: none;
    }
    .hud-card.tier-chaff { border-color: #7a8b9e; }
    .hud-card.tier-demigod { border-color: #4fe3e0; }
    .hud-card.tier-god { border-color: #e5b82a; }
    .hud-card.tier-titan { border-color: #e34fa8; }
    .hud-card-key {
      position: absolute;
      top: 4px;
      left: 6px;
      font-size: 10px;
      font-weight: 700;
      background: rgba(0, 0, 0, 0.7);
      color: #e8dcc4;
      padding: 1px 5px;
      border-radius: 3px;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .hud-card-name {
      font-weight: 700;
      font-size: 13px;
      color: #ffffff;
      margin-top: 14px;
      text-align: center;
    }
    .hud-card-cost {
      font-size: 12px;
      color: #e8dcc4;
      font-weight: 600;
      margin-top: 2px;
    }
    .hud-card-tier {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      margin-top: 5px;
    }
    .hud-card.tier-chaff .hud-card-tier { background: #2a3544; color: #b0c4de; }
    .hud-card.tier-demigod .hud-card-tier { background: #104040; color: #4fe3e0; }
    .hud-card.tier-god .hud-card-tier { background: #403510; color: #e5b82a; }
    .hud-card.tier-titan .hud-card-tier { background: #401030; color: #e34fa8; }
    .hud-card-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: #4fe3e0;
      transition: width 0.1s linear;
    }
  `;
  document.head.append(style);
}

/** Interface for cached card DOM elements to enable fast zero-allocation updates. */
interface CardRef {
  readonly deity: Deity;
  readonly cardEl: HTMLElement;
  readonly progressEl: HTMLElement;
}

/** Builds the faith bar and summon buttons into `root`. Returns a live HudHandle. */
export const mountHud: MountHud = (root, deck, onSummon) => {
  root.replaceChildren();
  ensureHudStyles();

  if (activeKeyHandler !== null) {
    window.removeEventListener('keydown', activeKeyHandler);
    activeKeyHandler = null;
  }

  let currentFaith = 0;
  let currentOutcome: 'ongoing' | 'victory' | 'defeat' = 'ongoing';

  const container = document.createElement('div');
  container.className = 'hud-container';
  root.append(container);

  const banner = document.createElement('div');
  banner.className = 'hud-banner';
  banner.style.display = 'none';
  container.append(banner);

  const faithWrap = document.createElement('div');
  faithWrap.className = 'hud-faith-wrap';

  const faithHeader = document.createElement('div');
  faithHeader.className = 'hud-faith-header';

  const faithText = document.createElement('span');
  faithText.textContent = 'Faith: 0 / 0';
  const faithRegenText = document.createElement('span');
  faithRegenText.textContent = '+0.0/s';

  faithHeader.append(faithText, faithRegenText);

  const faithTrack = document.createElement('div');
  faithTrack.className = 'hud-faith-track';

  const faithFill = document.createElement('div');
  faithFill.className = 'hud-faith-fill';
  faithFill.style.width = '0%';
  faithTrack.append(faithFill);

  faithWrap.append(faithHeader, faithTrack);
  container.append(faithWrap);

  const deckRow = document.createElement('div');
  deckRow.className = 'hud-deck-row';
  container.append(deckRow);

  const cardRefs: CardRef[] = deck.map((deity, index) => {
    const cardEl = document.createElement('div');
    cardEl.className = `hud-card tier-${deity.tier}`;

    if (index < 9) {
      const keyEl = document.createElement('div');
      keyEl.className = 'hud-card-key';
      keyEl.textContent = `${index + 1}`;
      cardEl.append(keyEl);
    }

    const nameEl = document.createElement('div');
    nameEl.className = 'hud-card-name';
    nameEl.textContent = deity.name;

    const costEl = document.createElement('div');
    costEl.className = 'hud-card-cost';
    costEl.textContent = `${deity.cost} Faith`;

    const tierEl = document.createElement('div');
    tierEl.className = 'hud-card-tier';
    tierEl.textContent = deity.tier;

    const progressEl = document.createElement('div');
    progressEl.className = 'hud-card-progress';
    progressEl.style.width = '0%';

    cardEl.append(nameEl, costEl, tierEl, progressEl);

    cardEl.addEventListener('click', () => {
      if (currentOutcome === 'ongoing' && currentFaith >= deity.cost) {
        onSummon(deity.id);
      }
    });

    deckRow.append(cardEl);
    return { deity, cardEl, progressEl };
  });

  const handleKeyDown = (event: KeyboardEvent): void => {
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    ) {
      return;
    }

    const keyNum = parseInt(event.key, 10);
    if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= 9) {
      const slotIndex = keyNum - 1;
      if (slotIndex < deck.length) {
        const deity = deck[slotIndex];
        if (currentOutcome === 'ongoing' && currentFaith >= deity.cost) {
          onSummon(deity.id);
        }
      }
    }
  };

  activeKeyHandler = handleKeyDown;
  window.addEventListener('keydown', handleKeyDown);

  const handle: HudHandle = {
    update(world) {
      currentFaith = world.faith;
      currentOutcome = world.outcome;

      faithText.textContent = `Faith: ${Math.floor(world.faith)} / ${world.faithMax}`;
      faithRegenText.textContent = `+${world.faithRegen.toFixed(1)}/s`;
      const faithPct = Math.min(100, Math.max(0, (world.faith / world.faithMax) * 100));
      faithFill.style.width = `${faithPct}%`;

      if (world.outcome === 'ongoing') {
        banner.style.display = 'none';
      } else if (world.outcome === 'victory') {
        banner.style.display = 'block';
        banner.className = 'hud-banner victory';
        banner.textContent = 'VICTORY — OLYMPUS CONQUERED';
      } else if (world.outcome === 'defeat') {
        banner.style.display = 'block';
        banner.className = 'hud-banner defeat';
        banner.textContent = 'DEFEAT — YOUR BASE FELL';
      }

      for (const { deity, cardEl, progressEl } of cardRefs) {
        const affordable = world.outcome === 'ongoing' && world.faith >= deity.cost;
        cardEl.classList.toggle('disabled', !affordable);

        const cardProgressPct = Math.min(100, Math.max(0, (world.faith / deity.cost) * 100));
        progressEl.style.width = `${cardProgressPct}%`;
      }
    },
  };

  return handle;
};
