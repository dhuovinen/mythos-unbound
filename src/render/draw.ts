/**
 * STUB — owned by WP-4. Replace this file wholesale.
 * Deliberately crude: flat rectangles and circles, just enough to confirm the loop runs.
 */

import { CANVAS_HEIGHT, CANVAS_WIDTH, LANE_LENGTH, LANE_Y } from '../sim/constants';
import type { DrawWorld } from '../sim/types';

/** World-space x to screen-space x. */
export function worldToScreen(x: number): number {
  return (x / LANE_LENGTH) * CANVAS_WIDTH;
}

/** Draws lane, bases, units and health bars. */
export const drawWorld: DrawWorld = (ctx, world, deities) => {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.strokeStyle = '#3a3229';
  ctx.beginPath();
  ctx.moveTo(0, LANE_Y);
  ctx.lineTo(CANVAS_WIDTH, LANE_Y);
  ctx.stroke();

  for (const unit of world.units) {
    const sx = worldToScreen(unit.x);
    const color = unit.side === 'player' ? '#4FE3E0' : '#E34FA8';

    if (unit.isBase) {
      ctx.fillStyle = color;
      ctx.fillRect(sx - 14, LANE_Y - 96, 28, 96);
    } else {
      const deity = deities.get(unit.deityId);
      const radius = deity !== undefined && deity.tier === 'chaff' ? 9 : 14;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx, LANE_Y - radius, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const frac = Math.max(0, unit.hp / unit.maxHp);
    const barY = unit.isBase ? LANE_Y - 108 : LANE_Y - 40;
    ctx.fillStyle = '#2b2b33';
    ctx.fillRect(sx - 16, barY, 32, 4);
    ctx.fillStyle = frac > 0.35 ? '#7BB661' : '#D62828';
    ctx.fillRect(sx - 16, barY, 32 * frac, 4);
  }
};
