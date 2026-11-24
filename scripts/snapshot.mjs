import {writeFile} from 'node:fs/promises';
const codes=['SP.POP.TOTL','SP.DYN.CBRT.IN','SP.DYN.CDRT.IN','SP.DYN.LE00.IN'];
const results=await Promise.all(codes.map(async code=>{const url='https://api.worldbank.org/v2/country/all/indicator/'+code+'?format=json&mrnev=1&per_page=300';const r=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error(code+': '+r.status);const data=await r.json();if(!Array.isArray(data[1]))throw Error('Invalid World Bank response');console.log(code,data[1].length);return [code,data[1]];}));
await writeFile('public/world-bank-snapshot.json',JSON.stringify({fetchedAt:Date.now(),indicators:Object.fromEntries(results)}));
