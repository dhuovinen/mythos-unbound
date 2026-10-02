/** Shared painted details for the Egyptian v2 body plans. */
import type { AnimName } from './figure';
import { ANIM_SECONDS, clamp01, smooth } from './figure';
import { inked, poly } from './rig';
export interface EgyptianColors { skin: string; cloth: string; dark: string; metal: string; light: string }
type Colors = EgyptianColors;
type Ctx = CanvasRenderingContext2D;
export function v2Line(ctx: Ctx, color: string, width: number, pts: readonly (readonly [number, number])[]): void {
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
}
export function v2Shape(ctx: Ctx, fill: string, pts: readonly (readonly [number, number])[], width = 1): void {
  inked(ctx, fill, width, () => poly(ctx, pts));
}
export function v2Stone(ctx: Ctx, x: number, y: number, r: number, color: string): void {
  v2Shape(ctx, color, [[x, y-r], [x+r*.7, y], [x,y+r], [x-r*.7,y]], .5);
  v2Line(ctx, '#e1e5dc', .4, [[x,y-r*.6], [x+r*.35,y]]);
}
export function strikeAmount(anim: AnimName, t: number): number {
  if (anim !== 'attack') return 0;
  const u = clamp01(t / ANIM_SECONDS.attack);
  return smooth((u - .35) / .2) * (1 - smooth((u - .68) / .32));
}

/** Feathers articulate from the shoulder with delayed phase and unfold for a cast. */
export function featherWing(ctx: Ctx, x:number,y:number,span:number,lift:number,p:Colors,far=false):void {
  ctx.save();ctx.translate(x,y);ctx.rotate(-.15-lift*.55);ctx.scale(-1,1);
  for(let i=9;i>=0;i--) {
    const root=i*span*.037, end=span*(.65+i*.034), drop=10+i*2.6-lift*15;
    v2Shape(ctx,far?p.dark:(i%2?p.cloth:p.metal),[[root,-2],[end,drop-4],[end+4,drop],[end-2,drop+4],[root+4,7]],.8);
    v2Line(ctx,p.light,.45,[[root+3,3],[end,drop]]);
    if(i%3===0)v2Stone(ctx,end-10,drop-2,1.6,p.dark);
  }
  ctx.restore();
}
