import type {Country} from './country';
import {iso} from './country';
import {context,safeLink,type Stat,type Article,type Wiki} from './data';
import {rate} from './simulation';
const fmt=(n:number|null|undefined,digits=0)=>n==null||!Number.isFinite(n)?'n/a':n.toLocaleString(undefined,{maximumFractionDigits:digits});
export const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const flag=(code:string)=>/^[A-Z]{2}$/.test(code)?[...code].map(c=>String.fromCodePoint(127397+c.charCodeAt(0))).join(''):'◉';
export function panelController(el:HTMLElement,getStat:(id:string)=>Stat|undefined){
 let current:Country|null=null,version=0,lastFocus:HTMLElement|null=null;
 function close(){current=null;version++;el.hidden=true;document.body.classList.remove('panel-open');lastFocus?.focus();}
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 function stats(){if(!current)return;const s=getStat(iso(current));const net=s?.population!=null&&s.birth!=null&&s.death!=null?(rate(s.population,s.birth)-rate(s.population,s.death))*86400:null;
 el.querySelector('#country-stats')!.innerHTML=`<div><span>Population</span><strong>${fmt(s?.population)}</strong><small>${s?.years.population??'Unavailable'}</small></div><div><span>Life expectancy</span><strong>${fmt(s?.life,1)} <em>years</em></strong><small>${s?.years.life??'Unavailable'}</small></div><div><span>Birth rate</span><strong>${fmt(s?.birth,1)}</strong><small>per 1,000 / year · ${s?.years.birth??'n/a'}</small></div><div><span>Death rate</span><strong>${fmt(s?.death,1)}</strong><small>per 1,000 / year · ${s?.years.death??'n/a'}</small></div><div class="net"><span>Natural change / day</span><strong>${net!=null&&net>0?'+':''}${fmt(net)}</strong><small>Births minus deaths · excludes migration</small></div>`;}
 async function section(kind:'news'|'wiki',country:string,v:number){
 const target=el.querySelector<HTMLElement>('#'+kind)!;target.innerHTML='<div class="skeleton"></div><div class="skeleton short"></div>';target.setAttribute('aria-busy','true');
 try{if(kind==='news'){const result=await context<{articles:Article[]}>('news',country);if(v!==version)return;
 const articles=result.articles.filter(a=>safeLink(a.url)).slice(0,5);
 target.innerHTML=articles.length?articles.map(a=>{const date=a.seendate.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,'$1-$2-$3T$4:$5:$6Z');const d=new Date(date);return `<a class="article" href="${escape(safeLink(a.url)!)}" target="_blank" rel="noopener noreferrer">${escape(a.title)}<small>${escape(a.domain)} · ${Number.isNaN(d.getTime())?'Recent':d.toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</small></a>`;}).join(''):'<p>No English-language headlines found in the last 48 hours.</p>';
 }else{const result=await context<Wiki>('wiki',country);if(v!==version)return;const sentences=result.extract.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)??[result.extract];const link=safeLink(result.content_urls?.desktop?.page);target.innerHTML=`<p>${escape(sentences.slice(0,3).join(' '))}</p>${link?`<a class="text-link" href="${escape(link)}" target="_blank" rel="noopener noreferrer">Read on Wikipedia</a>`:''}`;}
 }catch{if(v!==version)return;target.innerHTML='<p>This source is taking a moment. You can still explore the globe.</p><button class="retry">Try again</button>';target.querySelector('button')!.onclick=()=>void section(kind,country,v);}
 finally{if(v===version)target.removeAttribute('aria-busy');}
 }
 function open(c:Country){current=c;version++;const v=version;lastFocus=document.activeElement as HTMLElement;el.hidden=false;document.body.classList.add('panel-open');
 el.innerHTML=`<button class="close" aria-label="Close country panel">×</button><span class="eyebrow">COUNTRY PORTRAIT</span><h2><span class="flag">${flag(c.properties.ISO_A2_EH)}</span> ${escape(c.properties.ADMIN)}</h2><div id="country-stats" class="country-stats"></div><div class="country-session"><span class="eyebrow">SIMULATED SINCE OPENING · <b id="country-speed">10×</b></span><div><span class="gold"><strong id="country-births">0</strong> births</span><span class="violet"><strong id="country-deaths">0</strong> deaths</span></div></div><section><h3>In the news <small>LAST 48 HOURS · GDELT</small></h3><div id="news"></div></section><section><h3>Background <small>WIKIPEDIA</small></h3><div id="wiki"></div></section>`;
 el.querySelector<HTMLButtonElement>('.close')!.onclick=close;el.querySelector<HTMLButtonElement>('.close')!.focus({preventScroll:true});stats();void section('news',c.properties.ADMIN,v);void section('wiki',c.properties.ADMIN,v);
 }
 return {open,close,refresh:stats,update(counts:Map<string,{birth:number;death:number}>,speed:number){if(!current)return;const c=counts.get(iso(current));el.querySelector('#country-births')!.textContent=fmt(c?.birth??0);el.querySelector('#country-deaths')!.textContent=fmt(c?.death??0);el.querySelector('#country-speed')!.textContent=speed+'×';}};
}

