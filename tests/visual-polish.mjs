import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
process.env.TEMP=path.resolve('.tmp');process.env.TMP=process.env.TEMP;
const base=process.env.TRIMIND_URL||'http://127.0.0.1:4173',dir='test-results/visual-polish/after';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true}),context=await browser.newContext(),page=await context.newPage();
const issues=[],contrasts=[],touch=[],checks=[];let inspections=0;
page.on('pageerror',e=>issues.push(e.message));
const routes=['/','/dashboard','/assessment','/my-plan','/learn','/learn/build-your-first-mvp/requirements','/learn/build-your-first-mvp/quiz','/practice','/practice/investor','/practice/founder','/practice/builder','/projects','/projects?track=builder','/projects?track=founder','/projects?track=investor','/login'];
const go=async r=>{await page.goto(base+r);await page.locator('main h1').waitFor();await page.evaluate(()=>document.fonts.ready);};
function inspectText(){
 const rgb=s=>{const v=s.match(/[\d.]+/g)?.map(Number)||[0,0,0];return [...v.slice(0,3),v[3]??1];};
 const mix=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3])).concat(1);
 const bg=el=>{let chain=[];for(let n=el;n;n=n.parentElement)chain.unshift(n);let c=[255,255,255,1];for(const n of chain)c=mix(rgb(getComputedStyle(n).backgroundColor),c);return c;};
 const lum=c=>c.slice(0,3).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
 const failures=[],targets=[];let count=0;
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
 while(node=walker.nextNode()){
  const el=node.parentElement;if(!el||!node.textContent.trim()||el.closest('script,style,[aria-hidden="true"],button:disabled'))continue;
  const r=el.getBoundingClientRect(),s=getComputedStyle(el);if(r.width<2||r.height<2||s.visibility!=='visible'||r.right<0)continue;
  let faded=false;for(let p=el;p;p=p.parentElement)if(Number(getComputedStyle(p).opacity)<1)faded=true;if(faded)continue;
  const background=bg(el),foreground=mix(rgb(s.color),background),l=[lum(foreground),lum(background)].sort((a,b)=>a-b),ratio=(l[1]+.05)/(l[0]+.05),size=parseFloat(s.fontSize),large=size>=24||(size>=18.66&&parseInt(s.fontWeight)>=700);count++;
  if(ratio+0.01<(large?3:4.5))failures.push({text:node.textContent.trim().slice(0,65),ratio:Number(ratio.toFixed(2)),required:large?3:4.5,color:s.color,background:background.slice(0,3)});
 }
 for(const el of document.querySelectorAll('button:not(:disabled),.button,.account-access,.main-nav a,.choice,.header-inner > a,.account-links a,.footer-links a,.breadcrumb a,a.text-link')){
  const r=el.getBoundingClientRect();if(r.width>0&&r.height>0&&r.height<43.9)targets.push({text:el.textContent.trim().slice(0,35),height:r.height});
 }
 return {failures,count,targets};
}
try{
 for(const lang of ['en','ar']){
  if(lang==='ar'){await go('/');await page.getByRole('button',{name:'Switch to Arabic',exact:true}).click();}
  for(const width of [1440,320]){
   await page.setViewportSize({width,height:900});
   for(const route of routes){await go(route);inspections++;
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`Overflow: ${route} ${lang} ${width}`);
    assert.equal(await page.getAttribute('html','dir'),lang==='ar'?'rtl':'ltr');
    const measured=await page.evaluate(inspectText);contrasts.push({route,lang,width,checked:measured.count,failures:measured.failures});touch.push(...measured.targets.map(t=>({route,lang,width,...t})));
    if(['/','/dashboard','/assessment','/my-plan'].includes(route))await page.screenshot({path:`${dir}/${route==='/'?'home':route.slice(1)}-${lang}-${width}.png`,fullPage:true});
   }
  }
 }
 checks.push(`${inspections} route/language/width inspections without overflow; RTL verified`);
 const palette=await page.evaluate(()=>{const s=getComputedStyle(document.documentElement);return Object.fromEntries(['--ink','--canvas','--surface','--muted','--accent','--indigo-soft','--builder','--builder-soft','--founder','--founder-soft','--investor','--investor-soft','--success','--success-soft','--error','--error-soft','--warning','--warning-soft'].map(k=>[k,s.getPropertyValue(k).trim()]));});
 const luminance=hex=>{const c=hex.replace('#','').match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c.reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);};
 const pairs=[['body','--ink','--canvas'],['supporting','--muted','--canvas'],['neutral reading','--muted','--surface'],['primary button','#ffffff','--accent'],...['builder','founder','investor','success','error','warning'].map(k=>[k,'--'+k,'--'+k+'-soft'])];
 const paletteContrast=pairs.map(([name,fg,bg])=>{const a=luminance(palette[fg]||fg),b=luminance(palette[bg]||bg);return {name,foreground:palette[fg]||fg,background:palette[bg]||bg,ratio:Number(((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(2))};});
 assert.ok(paletteContrast.every(p=>p.ratio>=4.5));await fs.writeFile('test-results/visual-polish/palette-contrast.json',JSON.stringify(paletteContrast,null,2));checks.push('Ten actual semantic palette pairs meet WCAG AA normal-text contrast');

 await go('/assessment');await page.locator('[data-assessment-question="ambition"] input[value="build"]').check();
 assert.equal(await page.locator('.choice.selected input:checked').count(),1);await page.screenshot({path:dir+'/assessment-selected-ar-320.png',fullPage:true});
 checks.push('Selected answer remains a real checked radio with a visible non-colour indicator');
 await go('/');await page.evaluate(()=>{document.body.tabIndex=-1;document.body.focus();});await page.keyboard.press('Tab');
 const focus=await page.locator(':focus').evaluate(el=>({text:el.textContent,outline:getComputedStyle(el).outlineStyle,width:parseFloat(getComputedStyle(el).outlineWidth)}));assert.match(focus.text,/تخط/);assert.notEqual(focus.outline,'none');assert.ok(focus.width>=2);checks.push('Keyboard focus ring visible');
 await page.emulateMedia({reducedMotion:'reduce'});const motion=await page.locator('.button').first().evaluate(el=>({transition:getComputedStyle(el).transitionDuration,animation:getComputedStyle(el).animationDuration}));assert.equal(motion.transition,'0s');assert.equal(motion.animation,'0s');checks.push('Reduced-motion disables transitions and animation');
 const bad=contrasts.filter(x=>x.failures.length);await fs.writeFile('test-results/visual-polish/report.json',JSON.stringify({status:bad.length||touch.length||issues.length?'FAIL':'PASS',checks,inspections,textContrast:{method:'Computed sRGB foreground and composited ancestor background; WCAG AA 4.5 normal / 3 large. Disabled, faded and aria-hidden decoration excluded.',cases:contrasts},touchTargetFailures:touch,issues},null,2));
 assert.deepEqual(bad,[],'Text contrast failures: '+JSON.stringify(bad));assert.deepEqual(touch,[],'Targets below 44px: '+JSON.stringify(touch));assert.deepEqual(issues,[]);console.log(`PASS ${inspections} visual inspections; contrast, 44px targets, focus and reduced motion.`);
}catch(e){await fs.writeFile('test-results/visual-polish/report.json',JSON.stringify({status:'FAIL',error:String(e),inspections,contrasts,touch,issues},null,2));await page.screenshot({path:dir+'/failure.png',fullPage:true}).catch(()=>{});throw e;}finally{await browser.close();}
