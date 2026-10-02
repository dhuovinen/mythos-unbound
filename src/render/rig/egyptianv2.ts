/** Egyptian v2: authored silhouettes, visible secondary motion and five-state animation for every unit. */
import { EGYPTIAN_DEITIES } from '../../data/egyptian';
import { ANUBIS_STUDIES } from './anubisstudies';
import { makeBiped } from './compose';
import type { BipedSpec } from './compose';
import type { AnimName, Figure } from './figure';
import { ANIM_SECONDS, clamp01 } from './figure';
import { atHead } from './parts';
import type { Animated, P, Recipe, Skel } from './rig';
import { animate, buildSkel, drawRig, inked } from './rig';
import { featherWing, strikeAmount, v2Line, v2Shape, v2Stone } from './egyptianv2parts';
import { egyptianCreaturesV2 } from './egyptianv2creatures';

import type { EgyptianColors as Colors } from './egyptianv2parts';
export interface EgyptianDesign {
  readonly title: string;
  readonly description: string;
  readonly motif: 'sentry' | 'ceramic' | 'spirit' | 'hunter' | 'scribe' | 'lotus' | 'lion' | 'guardian' | 'moon' | 'sun' | 'king' | 'wings' | 'storm' | 'veil' | 'music' | 'fire' | 'forge' | 'chaos' | 'devourer' | 'soul';
  readonly colors: Colors;
  readonly spec?: Partial<BipedSpec>;
}
const linen = '#d8cdb8', silver = '#a2acb4';
const colors = (skin: string, cloth: string, dark: string, light: string): Colors => ({ skin, cloth, dark, metal: silver, light });
const tall = { bulk: 1.02, legs: 1.05, hunch: .015, head: .98 };
const lean = { bulk: .88, legs: 1.05, hunch: .05, head: .95 };
const broad = { bulk: 1.38, legs: .94, hunch: .065, head: 1.04 };

export const EGYPTIAN_V2_DESIGNS: Readonly<Record<string, EgyptianDesign>> = {
  medjay: { title: 'Dune sentry', description: 'Patched red linen, an etched shield and a long spear; alert breathing and a quick planted thrust.', motif: 'sentry', colors: colors('#b39880', '#9e5950', '#344653', '#dbb09b'), spec: { build: lean, gear: ['nemes'], body: ['shendyt', 'bandolier'], offhand: 'shieldKite', weapon: 'spear', attack: 'thrust', behind: ['cape'] } },
  shabti: { title: 'Awakened faience', description: 'Turquoise ceramic, luminous fracture lines and layered bindings; stiff marching steps and a two-stage crook strike.', motif: 'ceramic', colors: colors('#688f94', '#b6cec5', '#30444e', '#c3e8d5'), spec: { build: { bulk: .92, legs: .91, hunch: 0, head: 1.03 }, gear: ['nemes'], body: ['wraps'], weapon: 'crook', attack: 'overhead' } },
  ba: { title: 'Painted soul-bird', description: 'A human-faced bird with a lapis mantle, painted wing eyes and long split tail feathers; flapping hover, swift swoop and folded landing.', motif: 'soul', colors: colors('#c0a18b', '#667f99', '#303650', '#b5d4cd') },
  anubis: { title: 'Guide of the Duat', description: 'Jade-marked obsidian, translucent violet veils and an orbiting soul halo; visible floating breath, a travelling glide and an ankh invocation.', motif: 'spirit', colors: colors('#263b43', '#8b85ad', '#263b43', '#b9f1dc'), spec: { build: { bulk: .86, legs: 1.14, head: .94, hunch: 0 }, head: 'jackal', attack: 'cast' } },
  wepwawet: { title: 'Silver pathfinder', description: 'A silver wolf in segmented blue armour with a forked pennant; wide strides, turning ears and a driving spear lunge.', motif: 'hunter', colors: colors('#87949e', '#49687d', '#30414d', '#b3d6db'), spec: { build: lean, head: 'wolf', body: ['shendyt', 'cuirass'], weapon: 'spear', attack: 'thrust' } },
  imhotep: { title: 'Living blueprint', description: 'An ivory-robed architect with folded plans, an ink sash and floating geometric diagrams; thoughtful head motion and a widening scroll invocation.', motif: 'scribe', colors: colors('#b49d89', linen, '#405775', '#9fc4d0'), spec: { build: lean, gear: ['cap'], body: ['robe'], weapon: 'scroll', attack: 'cast' } },
  nefertem: { title: 'Lotus awakening', description: 'Overlapping green leaves, rose inlays and a breathing lotus crown; supple walking and a blooming staff gesture.', motif: 'lotus', colors: colors('#b79f8b', '#789080', '#3b5860', '#d6a5c0'), spec: { build: tall, gear: ['lotus'], body: ['shendyt'], weapon: 'staff', attack: 'cast' } },
  maahes: { title: 'Scarred lion prince', description: 'A layered rust-coloured mane, etched shoulder plates and a hooked blade; predatory head dips and a fast sweeping cut.', motif: 'lion', colors: colors('#92715d', '#a76953', '#403b48', '#d8b89d'), spec: { build: broad, head: 'lion', gear: ['sundisc'], body: ['kilt', 'pauldron'], weapon: 'khopesh', attack: 'sweep' } },
  bes: { title: 'Laughing ward', description: 'A compact feather-crowned guardian with a carved shield and protective charms; bouncing steps and an emphatic overhead ward strike.', motif: 'guardian', colors: colors('#aa8a71', '#755a83', '#454452', '#dac2a9'), spec: { build: { bulk: 1.55, legs: .67, hunch: .07, head: 1.2 }, head: 'lion', gear: ['feathers'], body: ['kilt', 'belt'], weapon: 'dagger', offhand: 'shieldRound', attack: 'overhead' } },
  khonsu: { title: 'Moon traveller', description: 'Pale linen and blue bindings beneath a moving lunar crescent; suspended ribbons, a slow glide and a crescent crook cast.', motif: 'moon', colors: colors('#b1c2c2', '#bbc9d2', '#52617b', '#d5e6e8'), spec: { build: lean, gear: ['crescent'], body: ['wraps'], weapon: 'crook', attack: 'cast' } },
  ra: { title: 'Dawn sovereign', description: 'A falcon with a rotating pale solar crown, layered copper-red plumage and a was sceptre; proud steps and a radiating sun cast.', motif: 'sun', colors: colors('#9d8077', '#a87669', '#4d475b', '#e9bb9d'), spec: { build: tall, head: 'falcon', gear: ['sundisc'], body: ['shendyt'], weapon: 'was', attack: 'cast' } },
  osiris: { title: 'Jade resurrection', description: 'Jade skin, intricate burial wrappings and a tall white crown; stately movement, a lifting crook and renewed light through the bindings.', motif: 'king', colors: colors('#6f9a8d', '#cbd1be', '#4a6869', '#bfe0c5'), spec: { build: tall, gear: ['atef'], body: ['wraps'], weapon: 'crook', beard: 'pointed', attack: 'cast', view: { x: -34, y: -145, w: 74, h: 90 } } },
  isis: { title: 'Winged restorer', description: 'Ivory and violet feathers, jewelled linen and a throne crown; layered wings breathe, open during travel and flare during her ankh cast.', motif: 'wings', colors: colors('#bda494', '#b9adc5', '#4b4c73', '#b4d6df'), spec: { build: lean, gear: ['throne'], hair: 'long', body: ['robe'], weapon: 'ankh', attack: 'cast' } },
  set: { title: 'Red storm', description: 'An angular beast mask, asymmetric dark armour and a torn wine-coloured banner; a restless crouch and a violent overhead sceptre blow.', motif: 'storm', colors: colors('#895a5f', '#813f51', '#342d43', '#d99b9d'), spec: { build: broad, head: 'setbeast', body: ['shendyt', 'pauldron'], weapon: 'was', attack: 'overhead' } },
  horus: { title: 'Skyblade heir', description: 'Steel-blue falcon armour and articulated wing feathers; compact wings open with the stride and drive a diving khopesh sweep.', motif: 'wings', colors: colors('#899bac', '#657f96', '#334960', '#b8d9df'), spec: { build: tall, head: 'falcon', gear: ['nemes'], body: ['kilt', 'cuirass'], weapon: 'khopesh', offhand: 'shieldKite', attack: 'sweep' } },
  nephthys: { title: 'Twilight vigil', description: 'Long plum-coloured mourning veils and silver temple ornaments; drifting stars follow a slow walk and a protective ankh gesture.', motif: 'veil', colors: colors('#b7a4ba', '#87789b', '#3d3b5d', '#cdbfdc'), spec: { build: lean, gear: ['temple'], hair: 'long', body: ['robe'], weapon: 'ankh', attack: 'cast' } },
  thoth: { title: 'Ink of eternity', description: 'A sharp ibis profile, blue-violet scholar robes and an inscribed scroll; precise head tilts and animated rings of written symbols.', motif: 'scribe', colors: colors('#b6c5ca', '#8598b4', '#434c74', '#b9cde4'), spec: { build: lean, head: 'ibis', body: ['shendyt'], weapon: 'scroll', attack: 'cast' } },
  hathor: { title: 'Resonant delight', description: 'A rose-coloured dancing robe, silver horn crown and a detailed sistrum; swaying shoulders, lilting steps and ringing instrument strokes.', motif: 'music', colors: colors('#c4a597', '#b98196', '#604968', '#e4c1ce'), spec: { build: tall, gear: ['cowhorns'], hair: 'long', body: ['robe'], weapon: 'sistrum', attack: 'cast' } },
  sekhmet: { title: 'Ember lioness', description: 'Charcoal war armour, a dark red mane and pale ember edges; heavy planted steps, a fierce blade strike and a dying ember plume.', motif: 'fire', colors: colors('#987968', '#91505c', '#38323f', '#e0a398'), spec: { build: broad, head: 'lion', gear: ['sundisc'], body: ['kilt', 'cuirass'], weapon: 'khopesh', attack: 'overhead' } },
  ptah: { title: 'Kiln-born maker', description: 'Glazed teal plates, heavy white bindings and a stonework apron; deliberate weight shifts and a forceful crafting staff cast.', motif: 'forge', colors: colors('#8faea9', '#b7c3b9', '#465d66', '#c0dbd2'), spec: { build: { bulk: 1.36, legs: .9, head: 1, hunch: .025 }, gear: ['cap'], body: ['wraps', 'apron'], weapon: 'was', beard: 'pointed', attack: 'cast' } },
  apep: { title: 'Eclipse serpent', description: 'Obsidian coils, silver belly plates and glowing violet seams; travelling body waves, an unfurling neck fan and a fanged lunge.', motif: 'chaos', colors: colors('#463f60', '#909bab', '#272735', '#c69cdb') },
  ammit: { title: 'Devourer of hearts', description: 'Scaled crocodile jaws, a layered lion mane and broad hippo hindquarters; a low stalking gait, snapping bite and heavy collapse.', motif: 'devourer', colors: colors('#6a817d', '#a69382', '#3c454c', '#c9a29b') },
};

type Ctx = CanvasRenderingContext2D;
/** Loops are deliberately visible; one-shots retain the simulation's standard duration. */
export function egyptianV2Pose(recipe: Recipe, design: EgyptianDesign, anim: AnimName, t: number): Animated {
  const a = animate(recipe, anim, t);
  if (anim === 'idle' || anim === 'walk') {
    const ph = t * 2.6 * (recipe.motion?.cadence ?? 1), wave = Math.sin(ph);
    const floating = design.motif === 'spirit' || design.motif === 'moon';
    const dancing = design.motif === 'music';
    const pose = { ...a.pose, bob: a.pose.bob + wave * (floating ? 3.2 : dancing ? 1.8 : 1.1),
      lean: a.pose.lean + Math.sin(ph*.72) * (dancing ? .07 : .025),
      tilt: Math.sin(ph*.83) * (design.motif === 'hunter' ? .1 : .055),
      armF: [a.pose.armF[0] + wave * .09, a.pose.armF[1] + Math.cos(ph) * .07] as const,
      armB: [a.pose.armB[0] - wave * .12, a.pose.armB[1] + Math.sin(ph*.8) * .09] as const,
      w: a.pose.w + wave * .07 };
    if (floating) {
      pose.bob = -5 + wave * 3.2; pose.lean = .02 + wave*.03;
      pose.legF = [.08 + Math.sin(ph*.8)*.16, .18]; pose.legB = [-.18 + Math.sin(ph*.8+1)*.12, .24];
      if (anim === 'walk') { pose.armF = [.4+Math.sin(t*3)*.18,.55]; pose.armB = [.05-Math.sin(t*3)*.2,.45]; }
    }
    return { ...a, pose };
  }
  if (anim === 'attack') return { ...a, pose: { ...a.pose, bob: a.pose.bob - strikeAmount(anim,t)*2, tilt: a.pose.tilt - strikeAmount(anim,t)*.07 } };
  return a;
}

/** Joint-bound detail for both forearms and shins. */
function plate(ctx: Ctx, a: P, b: P, p: Colors, wraps: boolean): void {
  const length = Math.hypot(b.x-a.x,b.y-a.y);
  ctx.save(); ctx.translate(a.x,a.y); ctx.rotate(-Math.atan2(b.x-a.x,b.y-a.y));
  v2Shape(ctx,wraps?p.cloth:p.dark,[[-3.5,length*.33],[3.5,length*.33],[3,length*.85],[-3,length*.85]],.65);
  for(let y=length*.4;y<length*.8;y+=3) v2Line(ctx,wraps?p.metal:p.light,.6,[[-3,y],[3,y+1]]);
  if(!wraps) v2Stone(ctx,0,length*.57,1.7,p.light);
  ctx.restore();
}
function clothingDetail(ctx: Ctx, s: Skel, d: EgyptianDesign): void {
  const p=d.colors;
  ctx.save(); ctx.translate(s.shoulder.x,s.shoulder.y); ctx.rotate(s.torsoAngle);
  const width=9*s.build.bulk;
  v2Shape(ctx,p.dark,[[-width-2,-1],[-width+2,-2],[width,24],[width-4,29]],.6);
  // Separate collar stones make the same detail level work across very different clothing.
  for(let row=0;row<3;row++) for(let col=-3;col<=3;col++) {
    const x=col*2.8*s.build.bulk, y=2+row*2.6+(3-Math.abs(col))*1.05;
    v2Shape(ctx,(col+row)%2?p.light:p.metal,[[x-1,y],[x+1,y],[x+.8,y+2],[x-.8,y+2]],.25);
  }
  v2Stone(ctx,0,12,2.5,p.light);
  if(d.motif==='ceramic'||d.motif==='forge') {
    v2Line(ctx,p.light,.7,[[-4,15],[-1,18],[-3,22],[1,24]]);
    v2Line(ctx,p.light,.7,[[5,12],[3,17],[6,20]]);
  }
  // Character-specific materials follow the torso through all five animations.
  if (['hunter','wings','storm','forge'].includes(d.motif)) for(let i=0;i<3;i++) {
    const x=-width-3+i*2,y=4+i*3;
    v2Shape(ctx,i%2?p.dark:p.cloth,[[x-3,y],[x+3,y-2],[x+7,y+4],[x-2,y+5]],.65);
    v2Line(ctx,p.metal,.55,[[x-2,y+1],[x+4,y+2]]);
  }
  if(d.motif==='lotus') for(let i=-2;i<=2;i++)
    v2Shape(ctx,i%2?p.dark:p.cloth,[[0,22],[i*5,11+Math.abs(i)*2],[i*6,21]],.55);
  if(d.motif==='sentry') {
    v2Shape(ctx,p.cloth,[[-width,17],[-width+6,15],[-width+7,23],[-width+1,25]],.6);
    for(let i=0;i<4;i++)v2Line(ctx,p.light,.6,[[-width+i*2,18],[-width+i*2+1,20]]);
  }
  if(d.motif==='ceramic'||d.motif==='king') for(let i=0;i<5;i++) {
    const y=15+i*3;
    v2Line(ctx,p.metal,.6,[[-width+2,y],[width-2,y+2]]);
    v2Line(ctx,p.light,.45,[[-width+3,y+1],[-width+6,y+3]]);
  }
  if(d.motif==='scribe') {
    v2Shape(ctx,p.cloth,[[-width,19],[-width+7,17],[-width+9,35],[-width+1,37]],.7);
    v2Line(ctx,p.dark,.7,[[-width+2,22],[-width+6,21],[-width+7,30],[-width+3,32],[-width+2,22]]);
    v2Line(ctx,p.light,.55,[[-width+3,25],[-width+6,24],[-width+6,27]]);
  }
  if(d.motif==='music') for(let i=0;i<7;i++) {
    const x=(i-3)*2.7,y=22+Math.sin(i+s.time*3)*1.5;
    v2Line(ctx,p.metal,.6,[[x,17],[x,y]]);v2Stone(ctx,x,y,1.6,p.light);
  }
  ctx.restore();
  ctx.save();ctx.translate(s.hip.x,s.hip.y);ctx.rotate(s.torsoAngle*.5);
  const flow=Math.sin(s.time*3)*2.5;
  const long=['scribe','veil','music','king','moon'].includes(d.motif), end=long?32:24;
  v2Shape(ctx,p.dark,[[-3,-3],[5,-3],[7+flow,end],[0+flow,end+3]],.8);
  v2Line(ctx,p.metal,.7,[[0,0],[3,0],[5+flow,end-2],[2+flow,end]]);
  for(let i=0;i<3;i++) {const y=5+i*5;v2Line(ctx,p.light,.65,[[1,y],[4,y],[3,y+2],[1,y+2]]);}
  v2Shape(ctx,p.metal,[[-9,-4],[9,-4],[9,0],[-9,0]],.6);v2Stone(ctx,0,-2,2.8,p.light);
  ctx.restore();
}
function ribbon(ctx: Ctx,s:Skel,p:Colors,wide:boolean):void {
  const wind=Math.sin(s.time*2.4)*5, x=s.shoulder.x-8,y=s.shoulder.y;
  for(let i=0;i<(wide?3:1);i++) {
    ctx.save();ctx.globalAlpha*=wide ? .62 : 1;
    inked(ctx,i%2?p.dark:p.cloth,.8,()=>{
      ctx.moveTo(x-i*3,y);ctx.bezierCurveTo(x-30-i*4,y+20,x-10+wind,y+52,x-34+wind-i*6,y+87-i*9);
      ctx.lineTo(x-17+wind,y+74-i*6);ctx.bezierCurveTo(x+6,y+46,x-14,y+17,x+4,y+5);ctx.closePath();
    });ctx.restore();
  }
}
function ornamentsBehind(ctx:Ctx,s:Skel,d:EgyptianDesign):void {
  const p=d.colors, wave=Math.sin(s.time*3);
  if(['spirit','veil','moon'].includes(d.motif)) ribbon(ctx,s,p,true);
  else if(['sentry','hunter','storm','lion'].includes(d.motif)) {
    const x=s.neck.x-7,y=s.neck.y+5;
    v2Shape(ctx,p.cloth,[[x,y],[x-15,y+4],[x-48,y+6+wave*4],[x-54,y+15+wave*4],[x-32,y+12],[x,y+8]],.9);
    v2Line(ctx,p.metal,.7,[[x-14,y+8],[x-41,y+9+wave*4]]);
  }
  if(d.motif==='wings') {
    const lift=.35+wave*.35+Math.abs(s.pose.armF[0])*.28;
    featherWing(ctx,s.shoulder.x+1,s.shoulder.y+3,d.spec?.head==='falcon'?42:62,lift,p,true);
    featherWing(ctx,s.shoulder.x-2,s.shoulder.y+4,d.spec?.head==='falcon'?50:70,lift+.15,p);
  }
  if(d.motif==='fire'||d.motif==='lion') {
    ctx.save();ctx.translate(s.neck.x,s.neck.y+4);
    for(let i=0;i<9;i++) {const a=.5+i*.34,r=15+Math.sin(s.time*4+i)*2;
      v2Shape(ctx,i%2?p.dark:p.cloth,[[Math.cos(a)*7,Math.sin(a)*7],[Math.cos(a)*r-4,Math.sin(a)*r+9],[Math.cos(a+.3)*10,Math.sin(a+.3)*10]],.6);
    }ctx.restore();
  }
}
function headDetail(ctx:Ctx,s:Skel,d:EgyptianDesign):void {
  const p=d.colors;
  atHead(ctx,s,r=>{
    if(d.spec?.head && d.spec.head!=='human') {
      v2Line(ctx,p.metal,.65,[[-r*.5,-r*.5],[-r*.6,r*.2],[-r*.2,r*.6]]);
      v2Line(ctx,p.light,.65,[[r*.2,-r*.6],[r*.7,-r*.35],[r*.9,-r*.05]]);
      v2Stone(ctx,r*.1,-r*.55,1.5,p.light);
    } else {v2Line(ctx,p.dark,.8,[[r*.2,-r*.4],[r*.75,-r*.3]]);v2Stone(ctx,-r*.45,r*.2,1.3,p.light);}
    if(d.motif==='hunter') {
      for(let i=0;i<4;i++)v2Shape(ctx,i%2?p.cloth:p.dark,[[-r*.8,-r*.1+i*2],[-r-5,r*.3+i*3],[-r*.5,r*.3+i*2]],.55);
      v2Line(ctx,p.metal,.65,[[-r*.45,-r*.6],[-r*.65,-r*1.1],[-r*.25,-r*.9]]);
    }
    if(d.motif==='forge') {
      v2Shape(ctx,p.cloth,[[-r*.9,-r*.55],[-r*.55,-r*1.1],[r*.4,-r*1.05],[r*.8,-r*.65]],.65);
      for(let i=0;i<4;i++)v2Line(ctx,p.light,.5,[[-r*.7+i*3,-r*.65],[-r*.5+i*3,-r*.85]]);
    }
    if(d.motif==='guardian') {
      v2Line(ctx,p.light,.7,[[r*.3,r*.4],[r*.75,r*.7],[r*1.3,r*.4]]);
      for(let i=0;i<3;i++)v2Line(ctx,p.metal,.6,[[r*.55+i*2,r*.5],[r*.55+i*2,r*.7]]);
    }
    if(d.motif==='lotus') {
      const open=.9+Math.sin(s.time*2.2)*.15;
      for(let i=-2;i<=2;i++) v2Shape(ctx,i%2?p.cloth:p.light,[[0,-r*.8],[i*4*open,-r-17+Math.abs(i)*2],[i*5*open,-r*.9]],.65);
    }
    if(d.motif==='sun'||d.motif==='moon') {
      ctx.strokeStyle=p.light;ctx.lineWidth=.7;ctx.beginPath();ctx.arc(0,-r-12,14,0,Math.PI*2);ctx.stroke();
      for(let i=0;i<8;i++) {const a=s.time*.3+i*Math.PI/4;v2Stone(ctx,Math.cos(a)*16,-r-12+Math.sin(a)*16,1.1,p.light);}
    }
  });
}
function effect(ctx:Ctx,s:Skel,d:EgyptianDesign,anim:AnimName,t:number,time:number):void {
  if(anim==='death'&&t>=ANIM_SECONDS.death)return;
  const p=d.colors, strength=strikeAmount(anim,t), alive=anim==='death'?1-clamp01(t/ANIM_SECONDS.death):1;
  ctx.save();ctx.globalAlpha*=alive;
  if(d.motif==='fire') {
    for(let i=0;i<7;i++) {
      const rise=(time*.8+i/7)%1,x=s.neck.x-12-Math.sin(i+time*2)*9,y=s.neck.y+12-rise*30;
      ctx.save();ctx.globalAlpha*=.65*(1-rise);v2Stone(ctx,x,y,1.2+strength,p.light);ctx.restore();
    }
  }
  if(d.motif==='spirit'||d.motif==='veil'||d.motif==='moon') {
    ctx.strokeStyle=p.light;ctx.lineWidth=.7;ctx.globalAlpha*=.65;
    ctx.beginPath();ctx.ellipse(s.head.x-3,s.head.y+8,30,35,Math.sin(time)*.12,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<6;i++){const a=time*.85+i*Math.PI/3;v2Stone(ctx,s.head.x-3+Math.cos(a)*30,s.head.y+8+Math.sin(a)*35,1.3,p.light);}
  }
  if(['scribe','music','sun','forge','lotus','spirit','king','veil','moon'].includes(d.motif)) {
    const x=s.armB.hand.x,y=s.armB.hand.y-8, radius=8+strength*13;
    ctx.strokeStyle=p.light;ctx.lineWidth=.65;ctx.globalAlpha*=.35+strength*.55;
    ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<5;i++){
      const a=time*.8+i*Math.PI*2/5, px=x+Math.cos(a)*radius,py=y+Math.sin(a)*radius;
      if(d.motif==='scribe')v2Line(ctx,p.light,.7,[[px-2,py-2],[px+2,py-2],[px,py+2],[px+2,py+3]]);
      else v2Stone(ctx,px,py,1.4,p.light);
    }
  }
  if(strength>0) {
    ctx.globalAlpha=alive*strength*.6;ctx.strokeStyle=p.light;ctx.lineWidth=1.1;
    ctx.beginPath();ctx.arc(s.armF.hand.x+8,s.armF.hand.y-6,12+strength*22,-.9,.8);ctx.stroke();
  }
  ctx.restore();
}
function weaponDetail(ctx:Ctx,d:EgyptianDesign):void {
  const p=d.colors, weapon=d.spec?.weapon;
  if(weapon==='scroll') {
    v2Shape(ctx,p.cloth,[[-5,-29],[5,-29],[5,5],[-5,5]],.7);
    for(let row=0;row<5;row++)for(let col=0;col<2;col++){
      const x=-3+col*4,y=-24+row*5;
      v2Line(ctx,p.dark,.55,[[x,y],[x+2,y],[x+1,y+2],[x+2,y+3]]);
    }
    if(d.colors.cloth===linen)v2Line(ctx,p.dark,.65,[[-3,-23],[3,-21],[2,-10],[-2,-11],[-3,-23]]);
  } else if(weapon==='khopesh') {
    v2Line(ctx,p.dark,.7,[[0,-7],[0,-31],[4,-42],[14,-43],[21,-37]]);
    for(let i=0;i<4;i++)v2Stone(ctx,0,-12-i*5,.9,p.light);
  } else if(weapon==='spear') {
    v2Shape(ctx,p.cloth,[[-3,-44],[-8,-41],[-16,-34],[-10,-33],[-3,-38]],.55);
    v2Line(ctx,p.metal,.55,[[0,-55],[0,-74]]);
  } else if(weapon==='sistrum') {
    for(let i=0;i<3;i++){v2Line(ctx,p.dark,.65,[[-6,-43+i*9],[6,-43+i*9]]);v2Stone(ctx,(i-1)*2,-43+i*9,1.4,p.light);}
    v2Stone(ctx,0,-11,2.4,p.light);
  } else if(weapon==='ankh') {
    v2Line(ctx,p.light,.6,[[-6,-30],[6,-30]]);v2Stone(ctx,0,-27,2,p.light);
    for(let i=0;i<3;i++)v2Line(ctx,p.dark,.6,[[-2,-16+i*4],[2,-16+i*4]]);
  } else for(const y of [-16,-22,-28])v2Line(ctx,p.light,.7,[[-2,y],[2,y]]);
}
function bipedV2(id:string,design:EgyptianDesign):{figure:Figure;recipe:Recipe} {
  const deity=EGYPTIAN_DEITIES.find(d=>d.id===id)!;const p=design.colors;
  const base=makeBiped({id,name:deity.name,tier:deity.tier,build:tall,skin:p.skin,limb:p.skin,head:'human',attack:'cast',rest:.08,
    ...design.spec, tones:{skin:p.skin,fur:p.skin,cloth:p.cloth,cloth2:p.dark,metal:p.metal,accent:p.light,hair:p.dark},
    motion:{cadence:design.motif==='guardian'?1.3:design.motif==='hunter'?1.14:design.motif==='forge' ? .67 : .92,stride:design.motif==='hunter'?1.1:.9,sway:1,weight:design.motif==='forge'?1.2:.85}});
  const source=id==='anubis'?ANUBIS_STUDIES[2].recipe:base.recipe;
  const recipe:Recipe={...source,id,name:deity.name,tier:deity.tier,
    drawBehind(ctx,s){ornamentsBehind(ctx,s,design);},
    drawBody(ctx,s){source.drawBody(ctx,s);if(id!=='anubis')clothingDetail(ctx,s,design);},
    drawHead(ctx,s){source.drawHead(ctx,s);if(id!=='anubis')headDetail(ctx,s,design);},
    drawOffhand(ctx,s){
      source.drawOffhand?.(ctx,s);
      if(!design.spec?.offhand)return;
      const x=s.armB.hand.x+7,y=s.armB.hand.y-6;
      ctx.strokeStyle=p.light;ctx.lineWidth=.65;ctx.beginPath();ctx.ellipse(x,y,6,3,0,0,Math.PI*2);ctx.stroke();
      v2Stone(ctx,x,y,2,p.light);v2Line(ctx,p.metal,.65,[[x,y+3],[x-2,y+7],[x+2,y+9]]);
      for(let i=0;i<5;i++)v2Stone(ctx,x+Math.cos(i*1.2)*9,y+Math.sin(i*1.2)*9,1,p.light);
    },
    drawWeapon(ctx){source.drawWeapon(ctx);if(id!=='anubis')weaponDetail(ctx,design);} };
  const figure:Figure={id,name:deity.name,tier:deity.tier,body:'biped',view:design.spec?.view??{x:-34,y:-142,w:78,h:88},
    draw(ctx,anim,t,time){
      const a=egyptianV2Pose(recipe,design,anim,t),clock=anim==='death'?Math.min(t,ANIM_SECONDS.death):time;
      const s=buildSkel(recipe,a.pose,clock);
      ctx.save();if(design.motif==='spirit')ctx.globalAlpha*=.92;
      drawRig(ctx,recipe,a,clock);
      ctx.translate(0,-a.drop);ctx.rotate(-a.fall);
      const wraps=['ceramic','king','moon','forge','sentry'].includes(design.motif);
      plate(ctx,s.armB.elbow,s.armB.hand,p,wraps);plate(ctx,s.armF.elbow,s.armF.hand,p,wraps);
      plate(ctx,s.legB.knee,s.legB.foot,p,wraps);plate(ctx,s.legF.knee,s.legF.foot,p,wraps);
      effect(ctx,s,design,anim,t,clock);ctx.restore();
    }};
  return {figure,recipe};
}
const built=EGYPTIAN_DEITIES.filter(d=>EGYPTIAN_V2_DESIGNS[d.id].spec).map(d=>bipedV2(d.id,EGYPTIAN_V2_DESIGNS[d.id]));
export const EGYPTIAN_V2_RECIPES:readonly Recipe[]=built.map(b=>b.recipe);
const figures=new Map([...built.map(b=>b.figure),...egyptianCreaturesV2(EGYPTIAN_V2_DESIGNS)].map(f=>[f.id,f]));
export const EGYPTIAN_V2_FIGURES:readonly Figure[]=EGYPTIAN_DEITIES.map(d=>figures.get(d.id)!);
