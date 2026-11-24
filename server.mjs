import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {api} from './proxy.mjs';
const root=resolve('dist');const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.json':'application/json','.geojson':'application/geo+json'};
createServer((req,res)=>api(req,res,async()=>{
 try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}res.setHeader('Content-Type',types[extname(file)]??'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404);res.end('Not found');}
})).listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log('Between running at http://127.0.0.1:'+(process.env.PORT||4173)));
