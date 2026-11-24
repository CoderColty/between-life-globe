import type {Country} from './country';
import {iso} from './country';
export const indicators={population:'SP.POP.TOTL',birth:'SP.DYN.CBRT.IN',death:'SP.DYN.CDRT.IN',life:'SP.DYN.LE00.IN'} as const;
type Field=keyof typeof indicators;
export interface WBRow {countryiso3code:string;value:number|null;date:string;}
interface Snapshot {fetchedAt:number;indicators:Record<string,WBRow[]>;}
export interface Stat {population:number|null;birth:number|null;death:number|null;life:number|null;years:Partial<Record<Field,string>>;}
export interface DataResult {stats:Map<string,Stat>;source:string;}
export interface Article {title:string;url:string;domain:string;seendate:string;}
export interface Wiki {extract:string;content_urls?:{desktop?:{page?:string}};}
export async function json<T>(url:string,timeout=20000):Promise<T>{const r=await fetch(url,{signal:AbortSignal.timeout(timeout)});if(!r.ok)throw Error('Source unavailable');return r.json();}
export function combine(countries:Country[],values:Record<string,WBRow[]>):Map<string,Stat>{
 const stats=new Map<string,Stat>();for(const c of countries)stats.set(iso(c),{population:null,birth:null,death:null,life:null,years:{}});
 for(const [field,code]of Object.entries(indicators))for(const row of values[code]??[]){const s=stats.get(row.countryiso3code);if(s && typeof row.value==='number' && Number.isFinite(row.value) && row.value>=0){s[field as Field]=row.value;s.years[field as Field]=row.date;}}
 return stats;
}
export async function loadStats(countries:Country[]):Promise<DataResult>{
 const key='between:wb:v1';let saved:Snapshot|undefined;
 try{saved=JSON.parse(localStorage.getItem(key)??'null')??undefined;if(saved&&Date.now()-saved.fetchedAt<86400000)return {stats:combine(countries,saved.indicators),source:'World Bank · cached within 24 hours'};}catch{saved=undefined;}
 const entries=await Promise.allSettled(Object.values(indicators).map(async code=>{const data=await json<[unknown,WBRow[]]>('https://api.worldbank.org/v2/country/all/indicator/'+code+'?format=json&mrnev=1&per_page=300',14000);if(!Array.isArray(data[1]))throw Error('Invalid data');return [code,data[1]] as const;}));
 const fresh=Object.fromEntries(entries.flatMap(r=>r.status==='fulfilled'?[r.value]:[]));
 if(entries.every(r=>r.status==='fulfilled')){const data={fetchedAt:Date.now(),indicators:fresh};try{localStorage.setItem(key,JSON.stringify(data));}catch{/* Storage may be disabled. */}return {stats:combine(countries,fresh),source:'World Bank · latest available annual rates'};}
 let fallback=saved; if(!fallback)try{fallback=await json<Snapshot>('/world-bank-snapshot.json');}catch{/* Missing data is explicitly represented. */}
 return {stats:combine(countries,{...fallback?.indicators,...fresh}),source:fallback?'World Bank · includes offline snapshot ('+new Date(fallback.fetchedAt).toLocaleDateString()+')':'World Bank · partial data; unavailable countries excluded'};
}
const contextCache=new Map<string,Promise<unknown>>();
export function context<T>(kind:'wiki'|'news',country:string):Promise<T>{const key=kind+country;if(!contextCache.has(key)){const p=json<T>('/api/'+kind+'?country='+encodeURIComponent(country),45000).catch(e=>{contextCache.delete(key);throw e;});contextCache.set(key,p);}return contextCache.get(key) as Promise<T>;}
export function safeLink(value:string|undefined):string|null{try{const u=new URL(value??'');return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}}
