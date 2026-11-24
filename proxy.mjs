import {readFile} from 'node:fs/promises';
const cache=new Map(); const pending=new Map(); let nextNews=0;
const countries=JSON.parse(await readFile(new URL('./public/countries.geojson',import.meta.url),'utf8'));
const names=new Set(countries.features.map(f=>f.properties.ADMIN));
export async function api(req,res,next){
 const url=new URL(req.url,'http://localhost'); if(!url.pathname.startsWith('/api/'))return next();
 const kind=url.pathname.slice(5),country=url.searchParams.get('country')??'';
 if(!['news','wiki'].includes(kind)||!names.has(country)){res.writeHead(400);res.end('Invalid request');return;}
 const key=kind+country; const cached=cache.get(key);
 res.setHeader('Content-Type','application/json'); res.setHeader('Cache-Control','private, max-age=300');
 if(cached&&cached.expires>Date.now()){res.end(cached.body);return;}
 try {
  if(!pending.has(key))pending.set(key,(async()=>{
   if(kind==='news'){const wait=Math.max(0,nextNews-Date.now()); if(wait>20000)throw Error('News is busy. Try again shortly.');nextNews=Date.now()+wait+5500; await new Promise(r=>setTimeout(r,wait));}
   const titles={'United States of America':'United States','Republic of Serbia':'Serbia','United Republic of Tanzania':'Tanzania','The Bahamas':'The Bahamas','East Timor':'East Timor','eSwatini':'Eswatini','Republic of the Congo':'Republic of the Congo','Ivory Coast':'Ivory Coast','Democratic Republic of the Congo':'Democratic Republic of the Congo'};
   const endpoint=kind==='wiki'?'https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(titles[country]??country):'https://api.gdeltproject.org/api/v2/doc/doc?'+new URLSearchParams({query:'"'+country+'" sourcelang:english',mode:'artlist',format:'json',maxrecords:'5',sort:'datedesc',timespan:'48h'});
   const response=await fetch(endpoint,{headers:{'User-Agent':'BetweenGlobe/1.0 (educational statistics visualization)'},signal:AbortSignal.timeout(18000)});
   if(!response.ok)throw Error('Source temporarily unavailable ('+response.status+')');
   const data=await response.json(); if(kind==='wiki'&&!data.extract)throw Error('No summary available');
   if(kind==='news'&&!Array.isArray(data.articles))throw Error('News source did not return headlines');
   const body=JSON.stringify(data);cache.set(key,{body,expires:Date.now()+300000});return body;
  })().finally(()=>pending.delete(key)));
  res.end(await pending.get(key));
 }catch{res.writeHead(503);res.end(JSON.stringify({error:'This source is temporarily unavailable. Please try again shortly.'}));}
}
