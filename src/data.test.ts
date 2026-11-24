import {describe,it,expect} from 'vitest';
import {combine,safeLink} from './data';
import type {Country} from './country';
const country={properties:{ISO_A3_EH:'FRA',ADM0_A3:'FRA'}} as Country;
describe('country data',()=>{
 it('excludes aggregates and preserves indicator years',()=>{const data=combine([country],{'SP.POP.TOTL':[{countryiso3code:'FRA',value:1000,date:'2024'},{countryiso3code:'WLD',value:9000,date:'2024'}]});expect(data.size).toBe(1);expect(data.get('FRA')?.population).toBe(1000);expect(data.get('FRA')?.years.population).toBe('2024');expect(data.get('FRA')?.birth).toBeNull();});
 it('rejects non-finite and negative numbers',()=>{const data=combine([country],{'SP.DYN.CBRT.IN':[{countryiso3code:'FRA',value:NaN,date:'2024'}],'SP.DYN.CDRT.IN':[{countryiso3code:'FRA',value:-1,date:'2024'}]});expect(data.get('FRA')?.birth).toBeNull();expect(data.get('FRA')?.death).toBeNull();});
 it('allows only web links from external content',()=>{expect(safeLink('javascript:alert(1)')).toBeNull();expect(safeLink('https://example.com/article')).toBe('https://example.com/article');expect(safeLink(undefined)).toBeNull();});
});
