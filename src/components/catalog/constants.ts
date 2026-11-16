import type { FormatFilter, RegionFilter } from '../../context/GeoMapContext';
import type { ThemeCluster } from '../../data/geomapData';

export interface ActiveCatalogFilter {
  key: string;
  label: string;
  clear: () => void;
}

export const REGIONS: RegionFilter[] = [
  'Semua',
  'Nasional',
  'Jawa & Bali',
  'Kalimantan',
  'Sumatera',
  'Sulawesi',
];

export const THEMES: ('Semua' | ThemeCluster)[] = [
  'Semua',
  'Geologi & Geomorfologi',
  'Patahan & Kebencanaan',
  'Gunung Api & Vulkanologi',
  'Air Tanah & Hidrogeologi',
  'Energi, Sedimen & Mineral',
  'Geofisika & Tektonik',
];

export const SCALES = [
  'Semua',
  '1:5.000.000',
  '1:1.000.000',
  '1:500.000',
  '1:250.000',
  '1:100.000',
  '1:50.000',
];

export const FORMATS: FormatFilter[] = ['Semua', 'Raster', 'SHP'];

