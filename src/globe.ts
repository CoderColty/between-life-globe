import Globe from 'globe.gl';
import type {Country} from './country';
export function createGlobe(el: HTMLElement, countries: Country[], select: (c: Country) => void) {
 let hovered: object | null = null;
 const globe = new Globe(el, {animateIn: false}).backgroundColor('#00000000')
  .globeImageUrl('/earth-night.jpg').atmosphereColor('#7595b8').atmosphereAltitude(0.12)
  .polygonsData(countries).polygonAltitude(0.004).polygonCapColor(d => d === hovered ? 'rgba(151,178,204,0.22)' : 'rgba(20,35,53,0.10)')
  .polygonSideColor(() => 'transparent').polygonStrokeColor(() => 'rgba(136,164,187,0.22)')
  .polygonLabel(d => (d as Country).properties.ADMIN)
  .onPolygonHover(d => { hovered = d; globe.polygonCapColor(globe.polygonCapColor()); el.style.cursor = d ? 'pointer' : 'grab'; })
  .onPolygonClick(d => { const c = d as Country; globe.pointOfView({lat:c.properties.LABEL_Y,lng:c.properties.LABEL_X,altitude:1.9},1000); select(c); });
 globe.renderer().setPixelRatio(Math.min(devicePixelRatio, 1.6));
 globe.pointOfView({lat:17,lng:20,altitude:2.15});
 const controls = globe.controls(); controls.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches; controls.autoRotateSpeed = 0.28; controls.enableDamping = true;
 controls.minDistance = 120; controls.maxDistance = 550;
 let idle: ReturnType<typeof setTimeout>;
 function pause() { controls.autoRotate=false; clearTimeout(idle); }
 function resume() { clearTimeout(idle); idle=setTimeout(()=>{controls.autoRotate=!matchMedia('(prefers-reduced-motion: reduce)').matches;},5000); }
 controls.addEventListener('start',pause); controls.addEventListener('end',resume);
 const resize = () => globe.width(el.clientWidth).height(el.clientHeight);
 new ResizeObserver(resize).observe(el); resize();
 return globe;
}

