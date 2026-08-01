/**
 * STUB — owned by WP-6. Replace this file wholesale.
 * Unstyled faith readout and summon buttons, present only so summoning is testable.
 */

import type { HudHandle, MountHud } from '../sim/types';

/** Builds the faith bar and summon buttons into `root`. */
export const mountHud: MountHud = (root, deck, onSummon) => {
  root.replaceChildren();

  const faith = document.createElement('div');
  faith.style.marginBottom = '6px';
  root.append(faith);

  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.gap = '6px';
  root.append(row);

  const buttons = deck.map((deity) => {
    const button = document.createElement('button');
    button.textContent = `${deity.name} (${deity.cost})`;
    button.addEventListener('click', () => onSummon(deity.id));
    row.append(button);
    return { deity, button };
  });

  const handle: HudHandle = {
    update(world) {
      faith.textContent = `Faith ${Math.floor(world.faith)} / ${world.faithMax}`;
      for (const { deity, button } of buttons) {
        button.disabled = world.faith < deity.cost || world.outcome !== 'ongoing';
      }
    },
  };
  return handle;
};
