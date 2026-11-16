import type { QuadrangleFeature } from './geomapData';

export interface Index1mSheetRecord {
  no: string;
  locationLabel: string;
  south: number;
  west: number;
  north: number;
  east: number;
  region: string;
  slug: string;
}

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

/**
 * 16 lembar resmi Indeks Peta Geologi Indonesia 1:1.000.000 PSG (Ndx GL-ID 1M, Lembar I–XVI)
 * hasil ekstraksi MapInfo TAB `1M.zip` (proyeksi geografis WGS 84).
 */
export const INDEX_1M_SHEETS: readonly Index1mSheetRecord[] = [
  {
    no: 'I',
    locationLabel: 'Medan',
    south: 0.0,
    west: 95.0,
    north: 6.0,
    east: 102.0,
    region: 'Sumatera',
    slug: 'peta-geologi-indonesia',
  },
  {
    no: 'II',
    locationLabel: 'Batam',
    south: 0.0,
    west: 102.0,
    north: 6.0,
    east: 110.0,
    region: 'Sumatera',
    slug: 'peta-geologi-indonesia',
  },
  {
    no: 'III',
    locationLabel: 'Singkawang',
    south: 0.0,
    west: 108.590278,
    north: 6.0,
    east: 119.0,
    region: 'Kalimantan',
    slug: 'peta-geologi-indonesia',
  },
  {
    no: 'IV',
    locationLabel: 'Manado',
    south: 0.0,
    west: 118.0,
    north: 6.0,
    east: 126.0,
    region: 'Sulawesi',
    slug: 'peta-geologi-indonesia',
  },
  {
    no: 'V',
    locationLabel: 'Morotai',
    south: -1.0,
    west: 126.0,
    north: 6.0,
    east: 131.0,
    region: 'Maluku',
    slug: 'peta-geologi-indonesia',
  },
  {
    no: 'XI',
    locationLabel: 'Padang',
    south: -4.0,
    west: 97.75,
    north: 0.0,
    east: 102.0,
    region: 'Sumatera',
    slug: 'peta-geologi-indonesia',
  },
  {
    no: 'X',
    locationLabel: 'Palembang',
    south: -6.0,
    west: 102.0,
    north: 0.0,
    east: 108.590278,
    region: 'Sumatera',
    slug: 'peta-geologi-indonesia',
  },
  {
    no: 'IX',
    locationLabel: 'Banjarmasin',
    south: -4.216667,
    west: 108.590278,
    north: 0.0,
    east: 119.0,
    region: 'Kalimantan',
    slug: 'peta-geologi-indonesia',
  },
  {
    no: 'VIII',
    locationLabel: 'Ujungpandang',
    south: -6.0,
    west: 118.0,
    north: 0.0,
    east: 126.0,
    region: 'Sulawesi',
    slug: 'peta-geologi-indonesia',
  },
  {
    no: 'VII',
    locationLabel: 'Ambon',
    south: -6.0,
    west: 126.0,
    north: 0.0,
    east: 134.0,
    region: 'Maluku',
    slug: 'peta-geologi-indonesia',
  },
  {
    no: 'VI',
    locationLabel: 'Jayapura',
    south: -4.75,
    west: 128.4,
    north: 0.016667,
    east: 135.833333,
    region: 'Papua',
    slug: 'peta-geologi-indonesia',
  },
  {
    no: 'XII',
    locationLabel: 'Jakarta',
    south: -10.783333,
    west: 102.0,
    north: -5.808333,
    east: 110.0,
    region: 'Jawa & Bali',
    slug: 'peta-geologi-lembar-bandung-jawa',
  },
  {
    no: 'XIII',
    locationLabel: 'Surabaya',
    south: -10.25,
    west: 110.0,
    north: -6.0,
    east: 118.0,
    region: 'Jawa & Bali',
    slug: 'peta-geologi-lembar-yogyakarta-jawa',
  },
  {
    no: 'XIV',
    locationLabel: 'Kupang',
    south: -11.25,
    west: 118.0,
    north: -6.0,
    east: 126.0,
    region: 'Nusa Tenggara',
    slug: 'peta-geologi-indonesia',
  },
  {
    no: 'XV',
    locationLabel: 'Tanimbar',
    south: -12.0,
    west: 126.0,
    north: -6.0,
    east: 134.0,
    region: 'Maluku',
    slug: 'peta-geologi-indonesia',
  },
  {
    no: 'XVI',
    locationLabel: 'Merauke',
    south: -9.316667,
    west: 134.191667,
    north: 0.016667,
    east: 141.7,
    region: 'Papua',
    slug: 'peta-geologi-indonesia',
  },
];

export const INDEX_1M_QUADRANGLES: QuadrangleFeature[] = INDEX_1M_SHEETS.map(
  (s) => ({
    code: s.no,
    name: `Lembar ${s.locationLabel} (${s.no})`,
    locationLabel: s.locationLabel,
    scale: '1:1.000.000',
    region: s.region,
    year: 2024,
    hasShp: true,
    summary: `Peta Geologi Regional Indonesia skala 1:1.000.000 Lembar ${s.no} (${s.locationLabel}), wilayah ${s.region}.`,
    slug: s.slug,
    bounds: [
      [s.south, s.west],
      [s.north, s.east],
    ],
    center: [round6((s.south + s.north) / 2), round6((s.west + s.east) / 2)],
    isComputedGrid: false,
    publisher: 'Pusat Survei Geologi',
    parentCode: 'Indonesia (Nasional)',
    gridResolution: '16 Lembar Regional (I–XVI)',
    standardName: 'Indeks Peta Geologi Indonesia 1:1.000.000 PSG (Ndx GL-ID 1M)',
  }),
);
