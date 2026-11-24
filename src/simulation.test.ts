import {describe,it,expect} from 'vitest';
import {rate,poisson,prepareGeometry,randomPoint,inPolygon,YEAR_SECONDS} from './simulation';
function seeded(){let s=12345;return ()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};}
describe('annual rates',()=>{
 it('converts population and per-thousand annual rate to seconds',()=>expect(rate(1000000,20)*YEAR_SECONDS).toBeCloseTo(20000));
 it('handles missing, invalid, zero and negative inputs',()=>{for(const x of [null,undefined,NaN,-1])expect(rate(x,20)).toBe(0);expect(rate(0,20)).toBe(0);expect(rate(100,Infinity)).toBe(0);});
});
describe('Poisson sampling',()=>{
 it('handles zero and invalid means',()=>{expect(poisson(0)).toBe(0);expect(poisson(NaN)).toBe(0);});
 it.each([0.1,4,80])('has mean and variance near %s',lambda=>{const rng=seeded(),n=40000;let s=0,sq=0;for(let i=0;i<n;i++){const k=poisson(lambda,rng);expect(Number.isInteger(k)&&k>=0).toBe(true);s+=k;sq+=k*k;}expect(Math.abs(s/n-lambda)).toBeLessThan(0.04*lambda+0.02);expect(Math.abs(sq/n-(s/n)**2-lambda)).toBeLessThan(0.07*lambda+0.03);});
});
describe('land sampling',()=>{
 const exterior=[[0,0],[10,0],[10,10],[0,10],[0,0]],hole=[[3,3],[7,3],[7,7],[3,7],[3,3]];
 it('never places points in holes or outside the country',()=>{const p=prepareGeometry({type:'Polygon',coordinates:[exterior,hole]}),rng=seeded();for(let i=0;i<1000;i++){const v=randomPoint(p,rng)!;expect(inPolygon([v.lng,v.lat],[exterior,hole])).toBe(true);}});
 it('samples both islands in a multipolygon',()=>{const p=prepareGeometry({type:'MultiPolygon',coordinates:[[exterior],[[[20,0],[30,0],[30,10],[20,10],[20,0]]]]}),rng=seeded();const points=Array.from({length:300},()=>randomPoint(p,rng)!);expect(points.some(v=>v.lng>20)).toBe(true);expect(points.some(v=>v.lng<10)).toBe(true);});
 it('unwraps the dateline',()=>{const p=prepareGeometry({type:'Polygon',coordinates:[[[179,-2],[-179,-2],[-179,2],[179,2],[179,-2]]]}),rng=seeded();for(let i=0;i<100;i++)expect(Math.abs(randomPoint(p,rng)!.lng)).toBeGreaterThanOrEqual(179);});
 it('returns null for empty geometry',()=>expect(randomPoint([])).toBe(null));
});
