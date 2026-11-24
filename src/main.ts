import './style.css';
import {createGlobe} from './globe';
import {iso,type Country} from './country';
import {loadStats,type Stat} from './data';
import {rate,poisson,prepareGeometry,randomPoint} from './simulation';
import {panelController,escape} from './panel';
document.querySelector('#app')!.innerHTML=`
<div id="globe" aria-label="Interactive Earth. Drag to rotate, scroll to zoom, or choose a country from the list."></div>
<header><span class="brand">between<span class="brand-dot">.</span></span><span class="eyebrow tagline">A LIVING PORTRAIT OF EARTH</span><button id="about-button">About the data <span>ⓘ</span></button></header>
<main class="intro"><span class="eyebrow">ONE PLANET. COUNTLESS STORIES.</span><h1>Every moment,<br>the world changes.</h1><p>A quiet glimpse of life beginning<br>and life coming to a close.</p><label class="country-picker"><span>Explore a country</span><select id="countries" aria-label="Explore a country"><option value="">Choose a country</option></select></label></main>
<div class="counters" aria-label="Worldwide simulated event counters"><div class="counter gold"><span class="counter-label"><i></i> BIRTHS</span><strong id="birth-count">0</strong><small><b id="birth-rate">—</b> / second worldwide</small></div><div class="counter violet"><span class="counter-label"><i></i> DEATHS</span><strong id="death-count">0</strong><small><b id="death-rate">—</b> / second worldwide</small></div><p>Simulated since opening <span id="speed-label">at 10×</span></p></div>
<div class="globe-caption"><span class="orbit-line"></span> A shared world. An unfolding story.</div>
<aside id="panel" aria-label="Country details" hidden></aside>
<div class="bottom"><div class="controls"><fieldset><legend class="sr-only">Simulation speed</legend><span class="control-label">TIME SCALE</span><button data-speed="1" aria-pressed="false">1×</button><button data-speed="10" aria-pressed="true">10×</button><button data-speed="100" aria-pressed="false">100×</button></fieldset><span class="divider"></span><label class="toggle gold"><input type="checkbox" id="birth-toggle" checked><span class="switch"></span>Births</label><label class="toggle violet"><input type="checkbox" id="death-toggle" checked><span class="switch"></span>Deaths</label></div><div class="hint">Drag to explore <span>·</span> Scroll to zoom <span>·</span> Select a country</div></div>
<footer><span>Live estimates based on World Bank rates, not individual records.</span><span id="data-status" role="status">Connecting to annual statistics…</span></footer>
<dialog id="about"><button class="close" aria-label="Close about data">×</button><span class="eyebrow">BEHIND THE LIGHTS</span><h2>Statistics, brought to life.</h2><p>There is no public feed of individual births and deaths. Each light here is a simulated event, generated from real annual statistics. It does not represent a known person.</p><p>For each country, the expected events per second are <strong>population × crude annual rate ÷ 1,000 ÷ 31,557,600</strong>. Every simulation tick draws independent Poisson counts. Locations are sampled uniformly over land inside bundled country borders, not from population-density maps.</p><p>The time scale multiplies simulation time. Counters count all simulated events, including hidden or visually dropped pulses. Worldwide rates show the unscaled rate for covered countries. The simulation pauses in hidden tabs and does not backfill that time.</p><p>World Bank indicators use the latest non-empty value for population, crude birth and death rates, and life expectancy. Years may differ; each is shown in the country panel. Data is cached for 24 hours. If unavailable, a bundled snapshot is used and labeled. Missing rates contribute no events. Natural change excludes migration.</p><p>Natural Earth 110m borders simplify geography and omit some small states. Boundaries are for visualization. Rings fade over two seconds and are capped at 300. Recent news comes from GDELT; background from Wikipedia. Both may be temporarily unavailable.</p><div class="sources"><a href="https://data.worldbank.org/" target="_blank" rel="noopener">World Bank</a><a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a><a href="https://www.gdeltproject.org/" target="_blank" rel="noopener">GDELT</a></div></dialog>`;
const $=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s)!;
const about=$<HTMLDialogElement>('#about');$('#about-button').onclick=()=>about.showModal();about.querySelector<HTMLButtonElement>('.close')!.onclick=()=>about.close();about.onclick=e=>{if(e.target===about){const r=about.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)about.close();}};
let stats=new Map<string,Stat>(),speed=10,showBirths=true,showDeaths=true;
const counts=new Map<string,{birth:number;death:number}>();
const panel=panelController($('#panel'),id=>stats.get(id));
try{
 const response=await fetch('/countries.geojson');if(!response.ok)throw Error('Borders could not load');
 const countries=((await response.json()).features as Country[]).filter(c=>c.properties.ADMIN!=='Antarctica');
 const globe=createGlobe($('#globe'),countries,panel.open);
 const select=$<HTMLSelectElement>('#countries');
 for(const c of [...countries].sort((a,b)=>a.properties.ADMIN.localeCompare(b.properties.ADMIN)))select.insertAdjacentHTML('beforeend',`<option value="${escape(iso(c))}">${escape(c.properties.ADMIN)}</option>`);
 select.onchange=()=>{const c=countries.find(c=>iso(c)===select.value);if(c){globe.pointOfView({lat:c.properties.LABEL_Y,lng:c.properties.LABEL_X,altitude:1.9},1000);panel.open(c);}};
 type Pulse={lat:number;lng:number;kind:'birth'|'death';time:number};let pulses:Pulse[]=[];
 globe.ringAltitude(0.008).ringMaxRadius(2.4).ringPropagationSpeed(1.2).ringRepeatPeriod(Infinity).ringResolution(32)
 .ringColor((d: object)=>(t:number)=>`rgba(${(d as Pulse).kind==='birth'?'244,195,116':'160,156,247'},${0.85*(1-t)})`);
 document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(b=>b.onclick=()=>{speed=Number(b.dataset.speed);document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#speed-label').textContent='at '+speed+'×';});
 function syncRings(){globe.ringsData(pulses.filter(p=>p.kind==='birth'?showBirths:showDeaths));}
 $('#birth-toggle').onchange=()=>{showBirths=$<HTMLInputElement>('#birth-toggle').checked;syncRings();};$('#death-toggle').onchange=()=>{showDeaths=$<HTMLInputElement>('#death-toggle').checked;syncRings();};
 const result=await loadStats(countries);stats=result.stats;panel.refresh();
 const models=countries.map(c=>{const s=stats.get(iso(c));counts.set(iso(c),{birth:0,death:0});return {id:iso(c),geometry:prepareGeometry(c.geometry),birth:rate(s?.population,s?.birth),death:rate(s?.population,s?.death)};});
 const covered=models.filter(m=>m.birth>0&&m.death>0).length;
 $('#data-status').textContent=result.source+' · '+covered+'/'+countries.length+' countries';
 $('#birth-rate').textContent=models.reduce((s,m)=>s+m.birth,0).toFixed(2);$('#death-rate').textContent=models.reduce((s,m)=>s+m.death,0).toFixed(2);
 let totalBirth=0,totalDeath=0,displayBirth=0,displayDeath=0,last=performance.now(),accumulator=0,lastUI=0;
 document.addEventListener('visibilitychange',()=>{last=performance.now();accumulator=0;if(document.hidden)globe.pauseAnimation();else globe.resumeAnimation();});
 function frame(now:number){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,0.5);last=now;if(document.hidden)return;accumulator+=dt;
  if(accumulator>=0.1){const elapsed=accumulator*speed;accumulator=0;pulses=pulses.filter(p=>now-p.time<2000);
   for(const m of models){const count=counts.get(m.id)!;for(const kind of ['birth','death'] as const){const n=poisson(m[kind]*elapsed);count[kind]+=n;if(kind==='birth')totalBirth+=n;else totalDeath+=n;
    if(kind==='birth'?!showBirths:!showDeaths)continue;
    for(let i=0;i<Math.min(n,300);i++){const point=randomPoint(m.geometry);if(point)pulses.push({...point,kind,time:now-Math.random()*100});}
   }}
   pulses.sort((a,b)=>a.time-b.time);pulses=pulses.slice(-300);syncRings();
  }
  const smooth=1-Math.exp(-dt*12);displayBirth+=(totalBirth-displayBirth)*smooth;displayDeath+=(totalDeath-displayDeath)*smooth;
  if(now-lastUI>60){$('#birth-count').textContent=Math.round(displayBirth).toLocaleString();$('#death-count').textContent=Math.round(displayDeath).toLocaleString();panel.update(counts,speed);lastUI=now;}
 }
 requestAnimationFrame(frame);
}catch(e){$('#data-status').textContent='The globe could not start. Refresh to try again.';console.error(e);}

