import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const source = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(source, '../..');
const options = process.argv.slice(2);
const opt = (key, fallback) => { const i=options.indexOf(key); if(i===-1)return fallback; if(!options[i+1]||options[i+1].startsWith('--'))throw new Error(`Missing value for ${key}`); return options[i+1]; };
const work = path.resolve(opt('--work', path.join(os.tmpdir(),'mythos-trailer-revision')));
const media = path.join(repo,'promo/trailer-media');
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const stills = opt('--stills', null);
const rawClips = opt('--clips', null);
const output = path.resolve(opt('--output',path.join(repo,'promo/mythos-unbound-trailer-16x9-revised.mp4')));
const run = (cmd,args) => {const result=spawnSync(cmd,args,{stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)throw new Error(`${cmd} failed (${result.status})`);};
fs.mkdirSync(work,{recursive:true});fs.mkdirSync(media,{recursive:true});
const specs = {greek:[30,75],norse:[120,75],egyptian:[155,45]};
for(const [name,[start,count]] of Object.entries(specs)) {
 const dest=path.join(media,`${name}.mp4`);
 if(rawClips) {
  // Reuse the unlabelled source recordings from the first trailer.
  run(ffmpeg,['-hide_banner','-loglevel','error','-y','-framerate','30','-start_number',String(start),'-i',path.join(path.resolve(rawClips),name,'%04d.jpg'),'-frames:v',String(count),'-c:v','libx264','-crf','12','-pix_fmt','yuv420p','-an',dest]);
 }
 if(!fs.existsSync(dest))throw new Error(`Missing source media: ${dest}. Supply --clips <original recordings folder>.`);
}
if(options.includes('--capture-draft')) {
 run(process.execPath,[path.join(source,'capture-draft-revised.mjs'),path.join(work,'draft')]);
 run(ffmpeg,['-hide_banner','-loglevel','error','-y','-framerate','30','-i',path.join(work,'draft','%04d.jpg'),'-frames:v','90','-vf','pad=ceil(iw/2)*2:ceil(ih/2)*2','-c:v','libx264','-crf','12','-pix_fmt','yuv420p','-an',path.join(media,'draft.mp4')]);
}
for(const name of [...Object.keys(specs),'draft']) {
 const input=path.join(media,`${name}.mp4`),dest=path.join(work,'frames',name);
 if(!fs.existsSync(input))throw new Error(`Missing ${input}; use --capture-draft while the local game is running.`);
 fs.mkdirSync(dest,{recursive:true});
 run(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',input,'-start_number','0','-q:v','1',path.join(dest,'%04d.jpg')]);
 const expected=name==='draft'?90:specs[name][1];
 if(!fs.existsSync(path.join(dest,`${String(expected-1).padStart(4,'0')}.jpg`)))throw new Error(`Incomplete ${name} recording`);
}
const browser=await chromium.launch({channel:'chrome'});
const problems=[];
try {
 const ctx=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 const types={'.html':'text/html','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf','.svg':'image/svg+xml'};
 await ctx.route('http://trailer.test/**',async route=>{
  const rel=decodeURIComponent(new URL(route.request().url()).pathname.slice(1));
  const base=rel.startsWith('site/')?repo:rel.startsWith('frames/')?work:source;
  const file=path.resolve(base,rel);
  if(!file.startsWith(base+path.sep)||!fs.existsSync(file)){problems.push(`Missing asset: ${rel}`);return route.fulfill({status:404,body:''});}
  await route.fulfill({status:200,body:fs.readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'});
 });
 const page=await ctx.newPage();page.on('pageerror',e=>problems.push(e.message));
 await page.goto('http://trailer.test/trailer-revised.html');await page.evaluate(()=>window.ready);
 const root=page.locator('#root');
 const times=stills?stills.split(',').map(Number):Array.from({length:780},(_,f)=>f/30);
 const dir=path.join(work,stills?'stills':'render');fs.mkdirSync(dir,{recursive:true});
 for(let i=0;i<times.length;i++) {
  const t=times[i];if(!Number.isFinite(t)||t<0||t>=26)throw new Error(`Invalid frame time ${t}`);
  await page.evaluate(t=>window.renderFrame(t),t);
  if(problems.length)throw new Error(problems.join('\n'));
  await root.screenshot({path:path.join(dir,stills?`${t}.jpg`:`${String(i).padStart(4,'0')}.jpg`),type:'jpeg',quality:96,animations:'allow'});
  if(!stills&&i%90===0)console.log(`Rendered ${(t).toFixed(1)} / 26 seconds`);
 }
 console.log(`Verified ${times.length} frames; no missing assets or browser errors.`);
} finally {await browser.close();}
if(!stills) {
 const score=path.join(work,'score-revised.wav');
 run('uv',['run','--python','3.12','--no-project','--with','numpy','--with','scipy',path.join(source,'score-revised.py'),score]);
 // Keep the original music style; rebuild its cues for the revised edit.
 run(ffmpeg,['-hide_banner','-loglevel','error','-y','-framerate','30','-i',path.join(work,'render','%04d.jpg'),'-i',score,'-af','loudnorm=I=-14:TP=-1.5:LRA=8','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-c:a','aac','-b:a','320k','-ar','48000','-t','26','-movflags','+faststart',output]);
 console.log(`Saved ${output}`);
}
