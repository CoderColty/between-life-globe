import type { Polygon, MultiPolygon, Position } from 'geojson';
export const YEAR_SECONDS = 31_557_600;
export function rate(population: number | null | undefined, crude: number | null | undefined): number {
 return population != null && crude != null && Number.isFinite(population) && Number.isFinite(crude) && population >= 0 && crude >= 0 ? population * crude / 1000 / YEAR_SECONDS : 0;
}
// Independent Poisson variables add. Chunking keeps Knuth's exact sampler stable for large means.
export function poisson(lambda: number, rng: () => number = Math.random): number {
 if (!Number.isFinite(lambda) || lambda <= 0) return 0;
 let result=0;
 while(lambda>0) { const part=Math.min(lambda,20), limit=Math.exp(-part); let product=1,k=0;
 do {k++;product*=rng();} while(product>limit); result+=k-1;lambda-=part; }
 return result;
}
export function inRing([x,y]: Position, ring: Position[]): boolean {
 let inside=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++) { const [xi,yi]=ring[i], [xj,yj]=ring[j]; if((yi>y)!==(yj>y) && x<(xj-xi)*(y-yi)/(yj-yi)+xi) inside=!inside; }
 return inside;
}
export function inPolygon(point: Position, rings: Position[][]): boolean {return inRing(point,rings[0]) && !rings.slice(1).some(h=>inRing(point,h));}
export type Prepared = {rings:Position[][];west:number;east:number;south:number;north:number;weight:number}[];
export function prepareGeometry(geometry: Polygon | MultiPolygon): Prepared {
 const polys=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;
 return polys.map(raw=>{
  // Unwrap antimeridian-crossing rings around the first exterior longitude.
  const anchor=raw[0][0][0]; const rings=raw.map(r=>r.map(([x,y])=>{while(x-anchor>180)x-=360;while(x-anchor< -180)x+=360;return [x,y];}));
  const xs=rings[0].map(p=>p[0]), ys=rings[0].map(p=>p[1]);const west=Math.min(...xs),east=Math.max(...xs),south=Math.min(...ys),north=Math.max(...ys);
  return {rings,west,east,south,north,weight:(east-west)*(Math.sin(north*Math.PI/180)-Math.sin(south*Math.PI/180))};
 }).filter(p=>p.weight>0);
}
// Choose bounding boxes by spherical area, reject holes and ocean; uniform over land area.
export function randomPoint(prepared: Prepared,rng:()=>number=Math.random): {lat:number;lng:number}|null {
 const total=prepared.reduce((s,p)=>s+p.weight,0);if(total<=0)return null;
 for(let attempt=0;attempt<10000;attempt++) {
  let pick=rng()*total; const p=prepared.find(p=>{pick-=p.weight;return pick<0;}) ?? prepared[prepared.length-1];
  const lng=p.west+rng()*(p.east-p.west),low=Math.sin(p.south*Math.PI/180),high=Math.sin(p.north*Math.PI/180);
  const lat=Math.asin(low+rng()*(high-low))*180/Math.PI;
  if(inPolygon([lng,lat],p.rings))return {lat,lng:((lng+180)%360+360)%360-180};
 }
 return null;
}
