/** V2 body plans: painted soul bird, eclipse serpent and the crocodile/lion/hippo devourer. */
import type { AnimName, Figure } from './figure';
import { ANIM_SECONDS, clamp01, smooth } from './figure';
import { makeBeast } from './beast';
import { DEFAULT_TONES, GEAR, HEADS } from './parts';
import { capsule, inked } from './rig';
import type { EgyptianDesign } from './egyptianv2';
import { featherWing, strikeAmount, v2Line, v2Shape, v2Stone } from './egyptianv2parts';

export function egyptianCreatureMotion(anim: AnimName,t:number,time:number) {
  const clock=anim==='death'?Math.min(t,ANIM_SECONDS.death):time;
  const death=anim==='death'?smooth(clamp01(t/ANIM_SECONDS.death)):0;
  const hit=anim==='hit'?Math.sin(clamp01(t/ANIM_SECONDS.hit)*Math.PI):0;
  return {clock,death,hit,strike:strikeAmount(anim,t),travel:anim==='walk'?1:0};
}
function soulBird(d:EgyptianDesign):Figure {
  const p=d.colors;
  return {id:'ba',name:'Ba',tier:'chaff',body:'flyer',view:{x:-28,y:-106,w:78,h:75},
    draw(ctx,anim,t,time) {
      const m=egyptianCreatureMotion(anim,t,time),flap=Math.sin(m.clock*(m.travel?12:8));
      const dx=m.strike*21-m.hit*12,hover=35*(1-m.death),bob=Math.sin(m.clock*3)*3*(1-m.death);
      ctx.save();ctx.translate(dx,-hover+bob);ctx.rotate(.1+m.strike*.5-m.hit*.3-m.death*1.2);
      const lift=(.25+flap*.75+m.strike*.9)*(1-m.death),span=56*(1-m.death*.55);
      featherWing(ctx,-3,-25,span,lift,p,true);
      // Long, split and separately swaying painted tail feathers.
      for(let i=0;i<5;i++) {
        const wind=Math.sin(m.clock*3+i*.7)*3*(1-m.death);
        v2Shape(ctx,i%2?p.dark:p.cloth,[[-5,-2],[-10-i*5,24+wind],[-20-i*6,40+wind],[-16-i*3,6]],.8);
        v2Line(ctx,p.light,.55,[[-7-i*2,3],[-18-i*5,33+wind]]);
      }
      inked(ctx,p.dark,1.1,()=>ctx.ellipse(0,-16,12,23,-.25,0,Math.PI*2));
      v2Shape(ctx,p.metal,[[-9,-20],[8,-26],[13,-10],[0,1]],.8);
      for(let i=0;i<4;i++)v2Line(ctx,p.cloth,.7,[[-6+i*3,-17],[-2+i*3,-5]]);
      featherWing(ctx,-4,-24,span,lift+.18,p);
      for(let i=0;i<2;i++) {
        const x=2+i*8,reach=m.strike*16;
        capsule(ctx,{x,y:0},{x:x+reach,y:12-m.death*8},3,p.skin);
        for(let j=0;j<3;j++)v2Line(ctx,p.metal,1,[[x+reach,10-m.death*8],[x+reach+4+j*2,14-m.death*8]]);
      }
      ctx.save();ctx.translate(12,-43);ctx.rotate(-.15-m.strike*.15);
      const tones={...DEFAULT_TONES,skin:p.skin,cloth:p.cloth,cloth2:p.dark,metal:p.metal,accent:p.light};
      HEADS.human(ctx,8.8,tones);GEAR.nemes(ctx,8.8,tones);v2Stone(ctx,-1,-8,1.8,p.light);
      v2Line(ctx,p.dark,.7,[[2,-3],[6,-2]]);ctx.restore();
      ctx.restore();
    }};
}
function eclipseSerpent(d:EgyptianDesign):Figure {
  const p=d.colors;
  return {id:'apep',name:'Apep',tier:'titan',body:'serpent',view:{x:-32,y:-125,w:99,h:86},
    draw(ctx,anim,t,time) {
      const m=egyptianCreatureMotion(anim,t,time),n=30;
      const wave=(m.travel?7:2.8)*(1-m.death),phase=m.clock*(m.travel?6:1.8);
      const reach=m.strike*43-m.hit*17, lift=(73+Math.sin(m.clock*1.8)*5-m.strike*36-m.hit*10)*(1-m.death);
      const points=Array.from({length:n+1},(_,i)=>{
        const u=i/n, neck=smooth((u-.6)/.4);
        return {x:-151+u*(169+reach),y:-9-Math.sin(u*Math.PI*5-phase)*wave*Math.sin(u*Math.PI)-neck*lift,
          w:(3+Math.sin(u*Math.PI*.7)*17)*(1-u*.18)};
      });
      const normals=points.map((_,i)=>{
        const a=points[Math.max(0,i-1)],b=points[Math.min(n,i+1)],len=Math.hypot(b.x-a.x,b.y-a.y)||1;
        return {x:-(b.y-a.y)/len,y:(b.x-a.x)/len};
      });
      const edge=(side:number)=>points.map((q,i)=>[q.x+normals[i].x*q.w*.5*side,q.y+normals[i].y*q.w*.5*side] as const);
      v2Shape(ctx,p.skin,[...edge(-1),...edge(1).reverse()],1.7);
      for(let i=2;i<n;i++) {
        const q=points[i],normal=normals[i],a=Math.atan2(normal.y,normal.x);
        ctx.save();ctx.translate(q.x,q.y);ctx.rotate(a);
        v2Shape(ctx,i%2?p.cloth:p.metal,[[0,-2],[q.w*.5,-2],[q.w*.5,2],[0,3]],.55);
        if(i%2===0)v2Stone(ctx,-q.w*.25,0,2.2,p.dark);
        v2Line(ctx,p.light,.6,[[-q.w*.35,-2],[-q.w*.15,0],[-q.w*.35,2]]);
        if(i>18) v2Shape(ctx,p.dark,[[-q.w*.5,-2],[-q.w*.5-9-Math.sin(m.clock*3+i)*2*(1-m.death),0],[-q.w*.5,3]],.7);
        ctx.restore();
      }
      const h=points[n];ctx.save();ctx.translate(h.x,h.y);ctx.rotate(-.1+m.strike*.25+m.death*.2);
      // A spreading cobra-like fan adds a distinctive head silhouette.
      for(let i=0;i<6;i++) {
        const a=2.1+i*.28,r=22+Math.sin(m.clock*2+i)*2*(1-m.death);
        v2Shape(ctx,i%2?p.dark:p.skin,[[0,0],[Math.cos(a)*r,Math.sin(a)*r-13],[Math.cos(a+.2)*r,Math.sin(a+.2)*r-6]],.65);
      }
      ctx.save();ctx.translate(4,4);ctx.rotate(m.strike*.55+m.death*.25);
      v2Shape(ctx,p.cloth,[[0,0],[33,1],[30,7],[0,7]],.9);
      for(let i=0;i<4;i++)v2Shape(ctx,'#e8dfd1',[[8+i*6,1],[10+i*6,-5],[12+i*6,1]],.4);ctx.restore();
      v2Shape(ctx,p.dark,[[-11,-10],[1,-17],[17,-11],[35,-3],[33,2],[-4,2]],1.2);
      v2Line(ctx,p.metal,.7,[[-5,-10],[3,-12],[20,-7]]);
      v2Shape(ctx,p.light,[[5,-9],[12,-8],[9,-4],[5,-5]],.4);
      for(let i=0;i<3;i++)v2Shape(ctx,'#e8dfd1',[[16+i*5,1],[18+i*5,8],[20+i*5,2]],.4);
      if(m.strike>0) {ctx.strokeStyle=p.light;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(32,3);ctx.quadraticCurveTo(46,8,51,2);ctx.stroke();}
      ctx.restore();
    }};
}
function devourer(d:EgyptianDesign):Figure {
  const p=d.colors;let clock=0;
  const base=makeBeast({id:'ammit',name:'Ammit',tier:'titan',length:78,depth:34,leg:27,color:p.skin,belly:p.cloth,
    head:'crocodile',headScale:1.05,tail:'whip',tones:{fur:p.skin,accent:p.light},
    decorate(ctx,shoulder,hip) {
      // The mane follows the actual shoulder/hip joints during the lunge and collapse.
      for(let i=0;i<12;i++) {
        const a=i*Math.PI*2/12,r=23+Math.sin(clock*3+i)*1.5;
        v2Shape(ctx,i%2?p.dark:'#8c756b',[[shoulder.x+Math.cos(a)*9,shoulder.y+Math.sin(a)*9],
          [shoulder.x+Math.cos(a)*r-5,shoulder.y+Math.sin(a)*r],[shoulder.x+Math.cos(a+.28)*14,shoulder.y+Math.sin(a+.28)*14]],.7);
      }
      inked(ctx,'#75878a',1,()=>ctx.ellipse(hip.x+1,hip.y,18,14,-.1,0,Math.PI*2));
      v2Line(ctx,p.dark,1,[[hip.x-8,hip.y-5],[hip.x-2,hip.y-7],[hip.x+8,hip.y-5]]);
      for(let row=0;row<3;row++)for(let col=0;col<6;col++){
        const x=hip.x+8+col*6,y=hip.y-10+row*5+(col%2)*1.5;
        v2Shape(ctx,col%2?p.dark:p.skin,[[x-3,y],[x,y-2],[x+3,y],[x,y+2]],.4);
      }
      for(let i=0;i<5;i++)v2Shape(ctx,p.metal,[[hip.x+12+i*7,hip.y-13],[hip.x+15+i*7,hip.y-20],[hip.x+18+i*7,hip.y-13]],.55);
      v2Stone(ctx,shoulder.x-8,shoulder.y,4,p.light);
    }});
  return {...base,draw(ctx,anim,t,time){clock=anim==='death'?Math.min(t,ANIM_SECONDS.death):time;base.draw(ctx,anim,t,clock);}};
}
export function egyptianCreaturesV2(designs:Readonly<Record<string,EgyptianDesign>>):readonly Figure[] {
  return [soulBird(designs.ba),eclipseSerpent(designs.apep),devourer(designs.ammit)];
}
