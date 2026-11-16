import { INDEX_100K_SHEETS } from './index100kData';
import { INDEX_250K_SHEETS } from './index250kData';

// Auto-generated from 100-250.zip (official Pusat Survei Geologi Ndx GL-ID 100-250 MapInfo dataset, WGS 84).
// Tuple: [code, name, scaleDenom, themeCode, region, southLat, westLng, northLat, eastLng, compilers, year]
export type RegionalIndexTuple = readonly [
  string,
  string,
  100000 | 250000,
  string,
  string,
  number,
  number,
  number,
  number,
  string,
  number,
];

export { INDEX_100K_SHEETS, INDEX_250K_SHEETS };

export const REGIONAL_INDEX_SHEETS: readonly RegionalIndexTuple[] = [
  ...INDEX_100K_SHEETS,
  ...INDEX_250K_SHEETS,
];
