import type { Feature, Polygon, MultiPolygon } from 'geojson';
export type Country = Feature<Polygon | MultiPolygon, { NAME: string; ADMIN: string; ISO_A3: string; ADM0_A3: string; ISO_A3_EH: string; ISO_A2: string; ISO_A2_EH: string; LABEL_X: number; LABEL_Y: number }>;
export const iso = (c: Country) => c.properties.ISO_A3_EH !== '-99' ? c.properties.ISO_A3_EH : c.properties.ADM0_A3;
