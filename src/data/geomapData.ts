import { INDEX_1M_QUADRANGLES } from './index1mData';

export type LayerKey =
  | 'province'
  | 'geology'
  | 'fault'
  | 'volcano'
  | 'groundwater'
  | 'basin'
  | 'grid';

export type BasemapId = 'sat' | 'rbi' | 'terrain' | 'osm' | 'minimal';

export interface BasemapOption {
  id: BasemapId;
  shortName: string;
  fullName: string;
  desc: string;
  swatchClass: string;
  thumbnailUrl: string;
}

export const BASEMAP_OPTIONS: BasemapOption[] = [
  {
    id: 'sat',
    shortName: 'Satelit',
    fullName: 'Citra Satelit Resolusi Tinggi',
    desc: 'Citra optik permukaan bumi',
    swatchClass: 'gm-bm-swatch-sat',
    thumbnailUrl: '/basemaps/sat.jpg',
  },
  {
    id: 'rbi',
    shortName: 'RBI BIG',
    fullName: 'Rupa Bumi Indonesia (BIG)',
    desc: 'Peta dasar resmi skala nasional',
    swatchClass: 'gm-bm-swatch-rbi',
    thumbnailUrl: '/basemaps/rbi.jpg',
  },
  {
    id: 'terrain',
    shortName: 'Terrain',
    fullName: 'Hillshade & Relief Muka Bumi',
    desc: 'Bayangan lereng & morfologi',
    swatchClass: 'gm-bm-swatch-terrain',
    thumbnailUrl: '/basemaps/terrain.svg',
  },
  {
    id: 'osm',
    shortName: 'Jalan (OSM)',
    fullName: 'OpenStreetMap Jalan & Batas',
    desc: 'Jaringan jalan & toponimi rinci',
    swatchClass: 'gm-bm-swatch-osm',
    thumbnailUrl: '/basemaps/osm.svg',
  },
  {
    id: 'minimal',
    shortName: 'Kanvas',
    fullName: 'Kanvas Abu Minimalis',
    desc: 'Latar netral untuk overlay tematik',
    swatchClass: 'gm-bm-swatch-minimal',
    thumbnailUrl: '/basemaps/minimal.svg',
  },
];

export type LandingMapDataFormat = 'Semua' | 'SHP' | 'Raster';

export interface LandingMapTypeFilter {
  id: string;
  label: string;
  format: 'SHP' | 'Raster';
  keywords: string[];
  relatedLayer?: LayerKey;
}

export const LANDING_MAP_TYPE_FILTERS: LandingMapTypeFilter[] = [
  {
    id: 'shp-kab-kota',
    label: 'Batas Kab. / Kota',
    format: 'SHP',
    keywords: ['kab', 'kota', 'barito', 'administrasi', 'provinsi', 'patahan', 'sesar'],
    relatedLayer: 'province',
  },
  {
    id: 'geologi',
    label: 'Peta Geologi',
    format: 'Raster',
    keywords: ['geologi'],
    relatedLayer: 'geology',
  },
  {
    id: 'geologi-interpretasi',
    label: 'Peta Geologi Interpretasi',
    format: 'Raster',
    keywords: ['interpretasi', 'inderaja', 'inderaan jauh', 'geomorfologi', 'radiometri'],
    relatedLayer: 'geology',
  },
  {
    id: 'anomali-bouguer',
    label: 'Peta Anomali Bouguer',
    format: 'Raster',
    keywords: ['bouguer', 'gaya berat'],
    relatedLayer: 'basin',
  },
  {
    id: 'anomali-magnet',
    label: 'Peta Anomali Magnet',
    format: 'Raster',
    keywords: ['magnet', 'kemagnetan'],
  },
  {
    id: 'cekungan-air-tanah',
    label: 'Peta Cekungan Air Tanah',
    format: 'Raster',
    keywords: ['cekungan air tanah', 'cat'],
    relatedLayer: 'groundwater',
  },
  {
    id: 'ketersediaan-air-tanah',
    label: 'Peta Ketersediaan Air Tanah',
    format: 'Raster',
    keywords: ['hidrogeologi', 'air tanah', 'ketersediaan'],
    relatedLayer: 'groundwater',
  },
  {
    id: 'kerentanan-likuefaksi',
    label: 'Peta Kerentanan Likuefaksi',
    format: 'Raster',
    keywords: ['likuefaksi', 'rawan bencana', 'gempa', 'seismotektonik', 'vulkanik'],
    relatedLayer: 'fault',
  },
  {
    id: 'tanah-lunak',
    label: 'Peta Sebaran Tanah Lunak Indonesia',
    format: 'Raster',
    keywords: ['tanah lunak', 'sedimen', 'cekungan sedimen'],
    relatedLayer: 'basin',
  },
];

export function matchesLandingTypeFilter(
  dataset: { title: string; theme: string; hasShp: boolean },
  formatFilter: LandingMapDataFormat,
  selectedTypeIds: string[],
): boolean {
  if (formatFilter === 'SHP' && !dataset.hasShp) {
    return false;
  }
  if (selectedTypeIds.length === 0) return true;

  const haystack = `${dataset.title} ${dataset.theme}`.toLowerCase();
  return selectedTypeIds.some((id) => {
    const spec = LANDING_MAP_TYPE_FILTERS.find((item) => item.id === id);
    if (!spec) return false;
    if (spec.format === 'SHP' && !dataset.hasShp) return false;
    return spec.keywords.some((kw) => haystack.includes(kw));
  });
}

export interface DummySheetFile {
  typeId: string;
  title: string;
  format: 'SHP' | 'Raster';
  fileName: string;
  sizeLabel: string;
  previewSlug: string;
}

const DUMMY_FILE_SIZES: Record<string, string> = {
  'shp-kab-kota': '4.2 MB',
  geologi: '18.4 MB',
  'geologi-interpretasi': '16.1 MB',
  'anomali-bouguer': '11.2 MB',
  'anomali-magnet': '9.8 MB',
  'cekungan-air-tanah': '12.5 MB',
  'ketersediaan-air-tanah': '14.0 MB',
  'kerentanan-likuefaksi': '15.6 MB',
  'tanah-lunak': '13.4 MB',
};

const DUMMY_PREVIEW_SLUGS: Record<string, string> = {
  'shp-kab-kota': 'peta-patahan-aktif-indonesia',
  geologi: 'peta-geologi-indonesia',
  'geologi-interpretasi': 'peta-geomorfologi-inderaan-jauh-indonesia',
  'anomali-bouguer': 'peta-anomali-bouguer-indonesia-2025',
  'anomali-magnet': 'peta-sebaran-arah-kemagnetan-purba-di-indonesia',
  'cekungan-air-tanah': 'peta-cekungan-air-tanah-indonesia',
  'ketersediaan-air-tanah': 'peta-hidrogeologi-lembar-jakarta-bekasi',
  'kerentanan-likuefaksi': 'peta-wilayah-rawan-bencana-gempa-bumi-indonesia',
  'tanah-lunak': 'peta-cekungan-sedimen-indonesia',
};

export function buildDummySheetFiles(
  sheetCode: string,
  areaLabel: string,
  formatFilter: LandingMapDataFormat,
  selectedTypeIds: string[],
): DummySheetFile[] {
  const cleanCode =
    sheetCode.replace(/[^a-zA-Z0-9-]+/g, '_').replace(/^_+|_+$/g, '') ||
    'sheet';
  const cleanArea = areaLabel.trim() || 'Indonesia';

  return LANDING_MAP_TYPE_FILTERS.filter((spec) => {
    if (formatFilter !== 'Semua' && spec.format !== formatFilter) return false;
    if (selectedTypeIds.length > 0 && !selectedTypeIds.includes(spec.id)) {
      return false;
    }
    return true;
  }).map((spec) => {
    const ext = spec.format === 'SHP' ? 'shp.zip' : 'tif';
    const title =
      spec.id === 'shp-kab-kota'
        ? `Kab. / Kota ${cleanArea}`
        : `${spec.label} (${cleanCode})`;
    return {
      typeId: spec.id,
      title,
      format: spec.format,
      fileName: `${spec.id}_${cleanCode}.${ext}`,
      sizeLabel: DUMMY_FILE_SIZES[spec.id] ?? '12.0 MB',
      previewSlug: DUMMY_PREVIEW_SLUGS[spec.id] ?? 'peta-geologi-indonesia',
    };
  });
}

export type PreviewMode = 'geology' | 'fault' | 'basin' | 'hydro';

export type ThemeCluster =
  | 'Geologi & Geomorfologi'
  | 'Patahan & Kebencanaan'
  | 'Gunung Api & Vulkanologi'
  | 'Air Tanah & Hidrogeologi'
  | 'Energi, Sedimen & Mineral'
  | 'Geofisika & Tektonik';

export interface GeoDataset {
  id: string;
  isNational: boolean;
  isPopular?: boolean;
  popularRank?: number;
  title: string;
  slug: string;
  theme: ThemeCluster;
  scale: string;
  scaleRank: number;
  region: 'Nasional' | 'Jawa & Bali' | 'Kalimantan' | 'Sumatera' | 'Sulawesi';
  sheetCode: string;
  year: number;
  hasShp: boolean;
  fileSizeRaster: string;
  fileSizeShp: string;
  previewMode: PreviewMode;
  layerKey: LayerKey;
  lat: number;
  lng: number;
  zoom: number;
  datum: string;
  publisher: string;
  summary: string;
}

export interface MapLayerMeta {
  key: LayerKey;
  name: string;
  desc: string;
  defaultOn: boolean;
  defaultOpacity: number;
  color: string;
}

export interface VolcanoItem {
  id: string;
  name: string;
  province: string;
  elevation: string;
  level: 'Level I (Normal)' | 'Level II (Waspada)' | 'Level III (Siaga)' | 'Level IV (Awas)';
  lat: number;
  lng: number;
  color: string;
  magmaUrl: string;
}

export interface ActiveFaultFeature {
  id: string;
  name: string;
  kinematics: string;
  slipRate: string;
  coords: [number, number][];
  center: [number, number];
  slug: string;
}

export interface QuadrangleFeature {
  code: string;
  name: string;
  scale: MapScaleValue;
  region: string;
  year: number;
  summary: string;
  hasShp: boolean;
  slug: string;
  bounds: [[number, number], [number, number]];
  center: [number, number];
  /** True ketika dihasilkan otomatis dari grid matematis SNI 6502 / IMW */
  isComputedGrid?: boolean;
  /** True ketika berasal dari berkas Indeks Geologi Regional PSG (Ndx GL-ID 100-250) */
  isRegionalIndex?: boolean;
  /** Kode tema geologi regional (mis. GL-JW 100, GL-SM 250) */
  themeCode?: string;
  /** Nama penyusun lembar peta geologi regional */
  compilers?: string;
  /** Instansi penerbit lembar peta */
  publisher?: string;
  /** Nama kota/lokasi perwakilan di dalam sel indeks */
  locationLabel?: string;
  /** Kode lembar induk (mis. 1209 untuk 1209-3) */
  parentCode?: string;
  /** Resolusi sudut sel grid (mis. 30' × 30') */
  gridResolution?: string;
  /** Standar sistem penomoran indeks peta */
  standardName?: string;
}

export type MapScaleValue =
  | '1:5.000.000'
  | '1:1.000.000'
  | '1:500.000'
  | '1:250.000'
  | '1:100.000'
  | '1:50.000';

export type MapScaleFilter = MapScaleValue | null;

export type RegionalIndexMode = 'all' | '100k' | '250k';
export type RegionalIndexFilter = RegionalIndexMode | null;
export type RegionalIndexRegion =
  | 'Semua'
  | 'Sumatera'
  | 'Jawa'
  | 'Kalimantan'
  | 'Sulawesi'
  | 'Bali & Nusa Tenggara'
  | 'Maluku'
  | 'Papua';

export interface RegionalIndexOptionMeta {
  value: RegionalIndexMode;
  shortLabel: string;
  badgeLabel: string;
  desc: string;
  targetCenter: [number, number];
  targetZoom: number;
}

export const REGIONAL_INDEX_OPTIONS: RegionalIndexOptionMeta[] = [
  {
    value: 'all',
    shortLabel: 'Semua (234)',
    badgeLabel: 'Regional 100–250K',
    desc: 'Seluruh 234 lembar Indeks Geologi Regional 1:100.000 (Jawa) & 1:250.000 (Luar Jawa)',
    targetCenter: [-2.4, 117.5],
    targetZoom: 5,
  },
  {
    value: '100k',
    shortLabel: 'Jawa 1:100K',
    badgeLabel: 'Regional 1:100K',
    desc: '57 lembar geologi bersistem Jawa & Madura skala 1:100.000 (GL-JW 100)',
    targetCenter: [-7.25, 109.8],
    targetZoom: 7,
  },
  {
    value: '250k',
    shortLabel: 'Luar Jawa 250K',
    badgeLabel: 'Regional 1:250K',
    desc: '177 lembar geologi bersistem Luar Jawa skala 1:250.000 (GL-ID 250)',
    targetCenter: [-2.0, 117.5],
    targetZoom: 5,
  },
];

export const REGIONAL_REGION_OPTIONS: {
  value: RegionalIndexRegion;
  label: string;
  targetCenter: [number, number];
  targetZoom: number;
}[] = [
  { value: 'Semua', label: 'Semua', targetCenter: [-2.4, 117.5], targetZoom: 5 },
  { value: 'Sumatera', label: 'Sumatera', targetCenter: [-0.4, 101.2], targetZoom: 6 },
  { value: 'Jawa', label: 'Jawa', targetCenter: [-7.25, 109.8], targetZoom: 7 },
  { value: 'Kalimantan', label: 'Kalimantan', targetCenter: [-0.2, 114.2], targetZoom: 6 },
  { value: 'Sulawesi', label: 'Sulawesi', targetCenter: [-1.4, 121.6], targetZoom: 6 },
  { value: 'Bali & Nusa Tenggara', label: 'Bali & Nusra', targetCenter: [-8.9, 120.5], targetZoom: 7 },
  { value: 'Maluku', label: 'Maluku', targetCenter: [-3.2, 129.0], targetZoom: 6 },
  { value: 'Papua', label: 'Papua', targetCenter: [-4.2, 136.5], targetZoom: 6 },
];

export interface MapScaleMeta {
  value: MapScaleValue;
  shortLabel: string;
  desc: string;
  targetCenter: [number, number];
  targetZoom: number;
  strokeColor: string;
  fillColor: string;
}

export const HIGHLIGHT_MAP_SCALES: MapScaleMeta[] = [
  {
    value: '1:1.000.000',
    shortLabel: '1:1.000.000',
    desc: 'Kompilasi Regional IMW 4° × 6°',
    targetCenter: [-2.4, 115.0],
    targetZoom: 5,
    strokeColor: '#0284C7',
    fillColor: '#38BDF8',
  },
  {
    value: '1:250.000',
    shortLabel: '1:250.000',
    desc: "SNI NLP Induk 1° × 1°30'",
    targetCenter: [-1.1, 117.25],
    targetZoom: 7,
    strokeColor: '#7C3AED',
    fillColor: '#A78BFA',
  },
  {
    value: '1:100.000',
    shortLabel: '1:100.000',
    desc: "SNI NLP Sistematik 30' × 30'",
    targetCenter: [-6.95, 107.65],
    targetZoom: 8,
    strokeColor: '#D5B600',
    fillColor: '#FFF500',
  },
  {
    value: '1:50.000',
    shortLabel: '1:50.000',
    desc: "SNI NLP Detail 15' × 15'",
    targetCenter: [-6.88, 107.65],
    targetZoom: 9,
    strokeColor: '#DC2626',
    fillColor: '#FB7185',
  },
];

export interface FaqItem {
  id: string;
  cat: 'Akun & Akses' | 'Pencarian & Filter' | 'Format, CRS & SHP' | 'Layer Kebencanaan & PVMBG' | 'Peta & Cakupan';
  catAnchor: 'category-1' | 'category-2' | 'category-3' | 'category-4' | 'category-5';
  q: string;
  a: string;
}

export interface DemoPersona {
  id: 'peneliti' | 'investor' | 'publik';
  label: string;
  name: string;
  email: string;
  role: string;
}

export const OFFICIAL_ATTRIBUTION =
  '© 2016–2026 GeoMap [V 2.2.1] | Pusat Survei Geologi | Geologi Indonesia | Badan Geologi | Kementerian ESDM | Leaflet';

/**
 * 18 Unique Verified Geospatial Datasets:
 * - Includes ALL 11 unique PETA SKALA NASIONAL (1:5.000.000) without duplicate Peta Geologi Indonesia (Bab 4.3 B)
 * - Includes ALL 10 Pencarian Terbanyak with repaired 1:1 slugs (Bandung != Cianjur, Yogyakarta != Kebumen) (Bab 4.3 C)
 * - Includes PVMBG Volcanoes & Hydrogeology collections across all 6 taxonomy clusters
 */
export const DATASETS: GeoDataset[] = [
  // --- 11 PETA SKALA NASIONAL (1:5.000.000 — ZERO DUPLICATION PER BAB 4.3 B) ---
  {
    id: 'nat-01',
    isNational: true,
    isPopular: true,
    popularRank: 3,
    title: 'Peta Patahan Aktif Indonesia',
    slug: 'peta-patahan-aktif-indonesia',
    theme: 'Patahan & Kebencanaan',
    scale: '1:5.000.000',
    scaleRank: 5000000,
    region: 'Nasional',
    sheetCode: 'PSG-NAT-01',
    year: 2024,
    hasShp: true,
    fileSizeRaster: '12.1 MB',
    fileSizeShp: '9.4 MB',
    previewMode: 'fault',
    layerKey: 'fault',
    lat: -2.2,
    lng: 117.5,
    zoom: 5,
    datum: 'WGS 1984 (EPSG:4326)',
    publisher: 'Pusat Survei Geologi — Badan Geologi KESDM',
    summary:
      'Sebaran segmen sesar aktif utama Nusantara (Sumatera, Cimandiri, Lembang, Opak, Palu-Koro, Matano, Sorong) lengkap dengan kinematika dan laju geser.',
  },
  {
    id: 'nat-02',
    isNational: true,
    title: 'Peta Cekungan Sedimen Indonesia',
    slug: 'peta-cekungan-sedimen-indonesia',
    theme: 'Energi, Sedimen & Mineral',
    scale: '1:5.000.000',
    scaleRank: 5000000,
    region: 'Nasional',
    sheetCode: 'PSG-NAT-02',
    year: 2023,
    hasShp: true,
    fileSizeRaster: '11.0 MB',
    fileSizeShp: '6.8 MB',
    previewMode: 'basin',
    layerKey: 'basin',
    lat: -1.8,
    lng: 116.5,
    zoom: 5,
    datum: 'WGS 1984 (EPSG:4326)',
    publisher: 'Pusat Survei Geologi — Badan Geologi KESDM',
    summary:
      'Delineasi 128 cekungan sedimen Tersier dan Pra-Tersier di daratan maupun lepas pantai untuk eksplorasi migas dan penyimpanan karbon (CCS).',
  },
  {
    id: 'nat-03',
    isNational: true,
    title: 'Peta Metalogeni Indonesia',
    slug: 'peta-metalogeni-indonesia',
    theme: 'Energi, Sedimen & Mineral',
    scale: '1:5.000.000',
    scaleRank: 5000000,
    region: 'Nasional',
    sheetCode: 'PSD-NAT-03',
    year: 2023,
    hasShp: true,
    fileSizeRaster: '13.1 MB',
    fileSizeShp: '8.2 MB',
    previewMode: 'geology',
    layerKey: 'geology',
    lat: -1.6,
    lng: 121.5,
    zoom: 5,
    datum: 'WGS 1984 (EPSG:4326)',
    publisher: 'PSDMBP — Badan Geologi KESDM',
    summary:
      'Distribusi busur metalogenik, provinsi mineralisasi tembaga-emas-nikel, dan keterkaitannya dengan sabuk magmatik Nusantara.',
  },
  {
    id: 'nat-04',
    isNational: true,
    title: 'Peta Anomali Bouguer Indonesia 2025',
    slug: 'peta-anomali-bouguer-indonesia-2025',
    theme: 'Geofisika & Tektonik',
    scale: '1:5.000.000',
    scaleRank: 5000000,
    region: 'Nasional',
    sheetCode: 'PSG-NAT-04',
    year: 2025,
    hasShp: true,
    fileSizeRaster: '15.4 MB',
    fileSizeShp: '19.1 MB',
    previewMode: 'basin',
    layerKey: 'basin',
    lat: -2.0,
    lng: 118.0,
    zoom: 5,
    datum: 'WGS 1984 (EPSG:4326)',
    publisher: 'Pusat Survei Geologi — Badan Geologi KESDM',
    summary:
      'Pemutakhiran kontur anomali gaya berat Bouguer edisi 2025 yang menggambarkan variasi densitas kerak untuk riset tektonik dan eksplorasi energi.',
  },
  {
    id: 'nat-05',
    isNational: true,
    title: 'Peta Cekungan Sedimen Indonesia Berdasarkan Anomali Gaya Berat',
    slug: 'peta-cekungan-sedimen-indonesia-berdasarkan-anomali-gaya-berat',
    theme: 'Energi, Sedimen & Mineral',
    scale: '1:5.000.000',
    scaleRank: 5000000,
    region: 'Nasional',
    sheetCode: 'PSG-NAT-05',
    year: 2022,
    hasShp: false,
    fileSizeRaster: '10.6 MB',
    fileSizeShp: '—',
    previewMode: 'basin',
    layerKey: 'basin',
    lat: -2.5,
    lng: 114.0,
    zoom: 5,
    datum: 'WGS 1984 (EPSG:4326)',
    publisher: 'Pusat Survei Geologi — Badan Geologi KESDM',
    summary:
      'Interpretasi ketebalan sedimen dan batas sub-cekungan bawah permukaan berbasis pemodelan anomali gaya berat terpadu.',
  },
  {
    id: 'nat-06',
    isNational: true,
    isPopular: true,
    popularRank: 2,
    title: 'Peta Geologi Indonesia',
    slug: 'peta-geologi-indonesia',
    theme: 'Geologi & Geomorfologi',
    scale: '1:5.000.000',
    scaleRank: 5000000,
    region: 'Nasional',
    sheetCode: 'PSG-NAT-06',
    year: 2023,
    hasShp: true,
    fileSizeRaster: '14.2 MB',
    fileSizeShp: '28.6 MB',
    previewMode: 'geology',
    layerKey: 'geology',
    lat: -2.2,
    lng: 118.0,
    zoom: 5,
    datum: 'WGS 1984 (EPSG:4326)',
    publisher: 'Pusat Survei Geologi — Badan Geologi KESDM',
    summary:
      'Kompilasi nasional stratigrafi, litologi batuan beku, sedimen, malihan, dan struktur tektonik utama seluruh kepulauan Indonesia.',
  },
  {
    id: 'nat-07',
    isNational: true,
    title: 'Peta Seismotektonik Indonesia',
    slug: 'peta-seismotektonik-indonesia',
    theme: 'Geofisika & Tektonik',
    scale: '1:5.000.000',
    scaleRank: 5000000,
    region: 'Nasional',
    sheetCode: 'PSG-NAT-07',
    year: 2023,
    hasShp: false,
    fileSizeRaster: '12.9 MB',
    fileSizeShp: '—',
    previewMode: 'fault',
    layerKey: 'fault',
    lat: -2.8,
    lng: 121.0,
    zoom: 5,
    datum: 'WGS 1984 (EPSG:4326)',
    publisher: 'Pusat Survei Geologi — Badan Geologi KESDM',
    summary:
      'Integrasi hiposenter kegempaan historis, mekanisme fokal, laju konvergensi lempeng, serta zona subduksi Sunda–Banda–Maluku.',
  },
  {
    id: 'nat-08',
    isNational: true,
    title: 'Peta Anomali Bouguer Indonesia',
    slug: 'peta-anomali-bouguer-indonesia',
    theme: 'Geofisika & Tektonik',
    scale: '1:5.000.000',
    scaleRank: 5000000,
    region: 'Nasional',
    sheetCode: 'PSG-NAT-08',
    year: 2021,
    hasShp: false,
    fileSizeRaster: '11.9 MB',
    fileSizeShp: '—',
    previewMode: 'basin',
    layerKey: 'basin',
    lat: -2.2,
    lng: 116.0,
    zoom: 5,
    datum: 'WGS 1984 (EPSG:4326)',
    publisher: 'Pusat Survei Geologi — Badan Geologi KESDM',
    summary:
      'Edisi standar peta kontur anomali gravitasi Bouguer nasional sebagai acuan komparatif survei geofisika regional.',
  },
  {
    id: 'nat-09',
    isNational: true,
    title: 'Peta Sebaran Arah Kemagnetan Purba di Indonesia',
    slug: 'peta-sebaran-arah-kemagnetan-purba-di-indonesia',
    theme: 'Geofisika & Tektonik',
    scale: '1:5.000.000',
    scaleRank: 5000000,
    region: 'Nasional',
    sheetCode: 'PSG-NAT-09',
    year: 2021,
    hasShp: false,
    fileSizeRaster: '9.4 MB',
    fileSizeShp: '—',
    previewMode: 'geology',
    layerKey: 'geology',
    lat: -2.1,
    lng: 122.0,
    zoom: 5,
    datum: 'WGS 1984 (EPSG:4326)',
    publisher: 'Pusat Survei Geologi — Badan Geologi KESDM',
    summary:
      'Vektor paleomagnetik batuan dari rekaman rotasi blok mikro-benua selama evolusi tektonik Asia Tenggara.',
  },
  {
    id: 'nat-10',
    isNational: true,
    title: 'Peta Sebaran Umur Radiometri di Indonesia',
    slug: 'peta-sebaran-umur-radiometri-di-indonesia',
    theme: 'Geofisika & Tektonik',
    scale: '1:5.000.000',
    scaleRank: 5000000,
    region: 'Nasional',
    sheetCode: 'PSG-NAT-10',
    year: 2022,
    hasShp: false,
    fileSizeRaster: '10.1 MB',
    fileSizeShp: '—',
    previewMode: 'geology',
    layerKey: 'geology',
    lat: -1.5,
    lng: 114.5,
    zoom: 5,
    datum: 'WGS 1984 (EPSG:4326)',
    publisher: 'Pusat Survei Geologi — Badan Geologi KESDM',
    summary:
      'Lokasi dan hasil penanggalan radiometrik (U-Pb, K-Ar, Ar-Ar) formasi batuan kristalin dan vulkanik di seluruh Indonesia.',
  },
  {
    id: 'nat-11',
    isNational: true,
    isPopular: true,
    popularRank: 8,
    title: 'Peta Geomorfologi Inderaan Jauh Indonesia',
    slug: 'peta-geomorfologi-inderaan-jauh-indonesia',
    theme: 'Geologi & Geomorfologi',
    scale: '1:5.000.000',
    scaleRank: 5000000,
    region: 'Nasional',
    sheetCode: 'PSG-NAT-11',
    year: 2022,
    hasShp: true,
    fileSizeRaster: '13.8 MB',
    fileSizeShp: '11.6 MB',
    previewMode: 'geology',
    layerKey: 'geology',
    lat: -2.0,
    lng: 118.5,
    zoom: 5,
    datum: 'WGS 1984 (EPSG:4326)',
    publisher: 'Pusat Survei Geologi — Badan Geologi KESDM',
    summary:
      'Klasifikasi bentang alam struktural, vulkanik, kars, fluvial, dan marin Indonesia hasil interpretasi citra penginderaan jauh.',
  },

  // --- REMAINING POPULAR SEARCHES (PENCARIAN TERBANYAK 1-10) & CORE THEMATIC SHEETS ---
  {
    id: 'pop-bandung',
    isNational: false,
    isPopular: true,
    popularRank: 1,
    title: 'Peta Geologi Lembar Bandung, Jawa',
    slug: 'peta-geologi-lembar-bandung-jawa',
    theme: 'Geologi & Geomorfologi',
    scale: '1:100.000',
    scaleRank: 100000,
    region: 'Jawa & Bali',
    sheetCode: 'Lembar 1209-3',
    year: 2024,
    hasShp: true,
    fileSizeRaster: '16.4 MB',
    fileSizeShp: '22.8 MB',
    previewMode: 'geology',
    layerKey: 'geology',
    lat: -6.9175,
    lng: 107.6191,
    zoom: 10,
    datum: 'WGS 1984 / UTM Zona 48S',
    publisher: 'Pusat Survei Geologi — Badan Geologi KESDM',
    summary:
      'Pemetaan geologi detail Cekungan Bandung, Formasi Citarum, endapan danau Kuarter, dan jalur Sesar Lembang (slug tervalidasi 1:1).',
  },
  {
    id: 'pop-yogyakarta',
    isNational: false,
    isPopular: true,
    popularRank: 4,
    title: 'Peta Geologi Lembar Yogyakarta, Jawa',
    slug: 'peta-geologi-lembar-yogyakarta-jawa',
    theme: 'Geologi & Geomorfologi',
    scale: '1:100.000',
    scaleRank: 100000,
    region: 'Jawa & Bali',
    sheetCode: 'Lembar 1408-2',
    year: 2023,
    hasShp: true,
    fileSizeRaster: '15.8 MB',
    fileSizeShp: '19.5 MB',
    previewMode: 'geology',
    layerKey: 'geology',
    lat: -7.7956,
    lng: 110.3695,
    zoom: 10,
    datum: 'WGS 1984 / UTM Zona 49S',
    publisher: 'Pusat Survei Geologi — Badan Geologi KESDM',
    summary:
      'Sebaran endapan vulkanik Merapi Muda, Formasi Sentolo, batu gamping Pegunungan Selatan, serta jalur Sesar Opak.',
  },
  {
    id: 'pop-gempa',
    isNational: false,
    isPopular: true,
    popularRank: 5,
    title: 'Peta Wilayah Rawan Bencana Gempa Bumi Indonesia',
    slug: 'peta-wilayah-rawan-bencana-gempa-bumi-indonesia',
    theme: 'Patahan & Kebencanaan',
    scale: '1:5.000.000',
    scaleRank: 5000000,
    region: 'Nasional',
    sheetCode: 'PVMBG-GB-01',
    year: 2024,
    hasShp: true,
    fileSizeRaster: '13.4 MB',
    fileSizeShp: '14.2 MB',
    previewMode: 'fault',
    layerKey: 'fault',
    lat: -4.2,
    lng: 108.5,
    zoom: 5,
    datum: 'WGS 1984 (EPSG:4326)',
    publisher: 'PVMBG & Pusat Survei Geologi — Badan Geologi',
    summary:
      'Klasifikasi zona rawan guncangan gempa bumi di Indonesia berdasarkan sumber subduksi, sesar kerak dangkal, dan kondisi geologi.',
  },
  {
    id: 'pop-jateng',
    isNational: false,
    isPopular: true,
    popularRank: 6,
    title: 'Peta Geologi Lembar Jawa Bagian Tengah',
    slug: 'peta-geologi-lembar-jawa-bagian-tengah',
    theme: 'Geologi & Geomorfologi',
    scale: '1:500.000',
    scaleRank: 500000,
    region: 'Jawa & Bali',
    sheetCode: 'PSG-JT-500',
    year: 2022,
    hasShp: true,
    fileSizeRaster: '18.2 MB',
    fileSizeShp: '16.0 MB',
    previewMode: 'geology',
    layerKey: 'geology',
    lat: -7.25,
    lng: 110.15,
    zoom: 8,
    datum: 'WGS 1984 (EPSG:4326)',
    publisher: 'Pusat Survei Geologi — Badan Geologi KESDM',
    summary:
      'Sintesis regional stratigrafi Zona Serayu Utara, Zona Solo, Pegunungan Serayu Selatan, dan kelurusan gunung api Jawa Tengah.',
  },
  {
    id: 'pop-jabar',
    isNational: false,
    isPopular: true,
    popularRank: 7,
    title: 'Peta Geologi Lembar Jawa Bagian Barat',
    slug: 'peta-geologi-lembar-jawa-bagian-barat',
    theme: 'Geologi & Geomorfologi',
    scale: '1:500.000',
    scaleRank: 500000,
    region: 'Jawa & Bali',
    sheetCode: 'PSG-JB-500',
    year: 2022,
    hasShp: true,
    fileSizeRaster: '17.6 MB',
    fileSizeShp: '15.4 MB',
    previewMode: 'geology',
    layerKey: 'geology',
    lat: -6.75,
    lng: 107.1,
    zoom: 8,
    datum: 'WGS 1984 (EPSG:4326)',
    publisher: 'Pusat Survei Geologi — Badan Geologi KESDM',
    summary:
      'Sebaran batuan sedimen Bogor Trough, Zona Bandung vulkanik Kuarter, hingga Zona Pegunungan Selatan Jawa Barat.',
  },
  {
    id: 'pop-samarinda',
    isNational: false,
    isPopular: true,
    popularRank: 9,
    title: 'Peta Geologi Lembar Samarinda, Kalimantan',
    slug: 'peta-geologi-lembar-samarinda-kalimantan',
    theme: 'Geologi & Geomorfologi',
    scale: '1:250.000',
    scaleRank: 250000,
    region: 'Kalimantan',
    sheetCode: 'Lembar 1915',
    year: 2023,
    hasShp: true,
    fileSizeRaster: '15.2 MB',
    fileSizeShp: '18.9 MB',
    previewMode: 'geology',
    layerKey: 'geology',
    lat: -0.5022,
    lng: 117.1536,
    zoom: 9,
    datum: 'WGS 1984 / UTM Zona 50S',
    publisher: 'Pusat Survei Geologi — Badan Geologi KESDM',
    summary:
      'Formasi pembawa batubara Cekungan Kutai (Formasi Balikpapan & Pulaubalang), lipatan antiklin, dan satuan aluvial Delta Mahakam.',
  },
  {
    id: 'pop-jakarta',
    isNational: false,
    isPopular: true,
    popularRank: 10,
    title: 'Peta Geologi Indonesia, Lembar Jakarta',
    slug: 'peta-geologi-indonesia-lembar-jakarta',
    theme: 'Geologi & Geomorfologi',
    scale: '1:1.000.000',
    scaleRank: 1000000,
    region: 'Jawa & Bali',
    sheetCode: 'Lembar SB-48',
    year: 2023,
    hasShp: true,
    fileSizeRaster: '14.5 MB',
    fileSizeShp: '12.3 MB',
    previewMode: 'geology',
    layerKey: 'geology',
    lat: -6.2,
    lng: 106.82,
    zoom: 8,
    datum: 'WGS 1984 (EPSG:4326)',
    publisher: 'Pusat Survei Geologi — Badan Geologi KESDM',
    summary:
      'Lembar kompilasi skala 1:1.000.000 wilayah Jabodetabek, Laut Jawa Barat, dan cekungan aluvial pantai utara Jawa.',
  },

  // --- GUNUNG API PVMBG & HIDROGEOLOGI CORE DATASETS ---
  {
    id: 'vol-01',
    isNational: false,
    title: 'Peta Sebaran Gunung Api Aktif & Zona Bahaya Vulkanik Indonesia',
    slug: 'peta-sebaran-gunung-api-indonesia',
    theme: 'Gunung Api & Vulkanologi',
    scale: '1:2.500.000',
    scaleRank: 2500000,
    region: 'Nasional',
    sheetCode: 'PVMBG-GA-01',
    year: 2025,
    hasShp: true,
    fileSizeRaster: '14.6 MB',
    fileSizeShp: '8.7 MB',
    previewMode: 'hydro',
    layerKey: 'volcano',
    lat: -7.54,
    lng: 110.44,
    zoom: 6,
    datum: 'WGS 1984 (EPSG:4326)',
    publisher: 'PVMBG — Badan Geologi KESDM',
    summary:
      'Inventarisasi 127 gunung api tipe A/B/C di Indonesia terhubung langsung dengan tingkat aktivitas PVMBG & portal MAGMA Indonesia.',
  },
  {
    id: 'hyd-01',
    isNational: false,
    title: 'Peta Hidrogeologi Lembar Jakarta–Bekasi',
    slug: 'peta-hidrogeologi-lembar-jakarta-bekasi',
    theme: 'Air Tanah & Hidrogeologi',
    scale: '1:50.000',
    scaleRank: 50000,
    region: 'Jawa & Bali',
    sheetCode: 'Lembar 1209-42',
    year: 2024,
    hasShp: true,
    fileSizeRaster: '14.0 MB',
    fileSizeShp: '16.2 MB',
    previewMode: 'hydro',
    layerKey: 'groundwater',
    lat: -6.22,
    lng: 106.92,
    zoom: 11,
    datum: 'WGS 1984 / UTM Zona 48S',
    publisher: 'PATGTL — Badan Geologi KESDM',
    summary:
      'Kontur muka piezometrik akuifer tertekan dan tidak tertekan pada Cekungan Air Tanah (CAT) Jakarta serta zona amblesan dan intrusi.',
  },
  {
    id: 'hyd-02',
    isNational: false,
    title: 'Peta Cekungan Air Tanah Indonesia',
    slug: 'peta-cekungan-air-tanah-indonesia',
    theme: 'Air Tanah & Hidrogeologi',
    scale: '1:5.000.000',
    scaleRank: 5000000,
    region: 'Nasional',
    sheetCode: 'PAG-CAT-01',
    year: 2023,
    hasShp: true,
    fileSizeRaster: '10.8 MB',
    fileSizeShp: '11.4 MB',
    previewMode: 'hydro',
    layerKey: 'groundwater',
    lat: -2.2,
    lng: 115.5,
    zoom: 5,
    datum: 'WGS 1984 (EPSG:4326)',
    publisher: 'PATGTL — Badan Geologi KESDM',
    summary:
      'Deliniasi 421 Cekungan Air Tanah lintas provinsi dan dalam provinsi beserta potensi imbuhan akuifer nasional.',
  },
];

export const MAP_LAYERS: MapLayerMeta[] = [
  {
    key: 'grid',
    name: 'Indeks Lembar Peta (1:5.000.000 – 1:50.000)',
    desc: 'Klik kotak lembar di peta dasar untuk detail & pratinjau',
    defaultOn: false,
    defaultOpacity: 85,
    color: '#233C5A',
  },
  {
    key: 'province',
    name: 'Batas Administrasi Provinsi',
    desc: '38 wilayah administrasi provinsi Indonesia',
    defaultOn: false,
    defaultOpacity: 85,
    color: '#233C5A',
  },
  {
    key: 'geology',
    name: 'Peta Geologi Indonesia',
    desc: 'Formasi batuan, litologi & struktur',
    defaultOn: false,
    defaultOpacity: 75,
    color: '#D5B600',
  },
  {
    key: 'fault',
    name: 'Patahan Aktif (Sesar)',
    desc: 'Jalur sesar aktif & zona gempa kerak dangkal',
    defaultOn: false,
    defaultOpacity: 95,
    color: '#DC2626',
  },
  {
    key: 'volcano',
    name: 'Sebaran Gunung Api (PVMBG)',
    desc: 'Status tingkat aktivitas + tautan MAGMA',
    defaultOn: false,
    defaultOpacity: 100,
    color: '#EA580C',
  },
  {
    key: 'groundwater',
    name: 'Air Tanah & Hidrogeologi',
    desc: 'Cekungan Air Tanah (CAT) & akuifer produktif',
    defaultOn: false,
    defaultOpacity: 75,
    color: '#0284C7',
  },
  {
    key: 'basin',
    name: 'Cekungan Sedimen Indonesia',
    desc: 'Delineasi cekungan migas & potensial CCS',
    defaultOn: false,
    defaultOpacity: 70,
    color: '#00B473',
  },
];

export const VOLCANOES: VolcanoItem[] = [
  {
    id: 'sinabung',
    name: 'G. Sinabung',
    province: 'Sumatera Utara',
    elevation: '2.460 mdpl',
    level: 'Level II (Waspada)',
    lat: 3.17,
    lng: 98.392,
    color: '#F59E0B',
    magmaUrl: 'https://magma.esdm.go.id',
  },
  {
    id: 'marapi',
    name: 'G. Marapi',
    province: 'Sumatera Barat',
    elevation: '2.891 mdpl',
    level: 'Level III (Siaga)',
    lat: -0.381,
    lng: 100.473,
    color: '#DC2626',
    magmaUrl: 'https://magma.esdm.go.id',
  },
  {
    id: 'krakatau',
    name: 'G. Anak Krakatau',
    province: 'Selat Sunda, Lampung',
    elevation: '157 mdpl',
    level: 'Level III (Siaga)',
    lat: -6.102,
    lng: 105.423,
    color: '#DC2626',
    magmaUrl: 'https://magma.esdm.go.id',
  },
  {
    id: 'merapi',
    name: 'G. Merapi',
    province: 'DIY & Jawa Tengah',
    elevation: '2.968 mdpl',
    level: 'Level III (Siaga)',
    lat: -7.541,
    lng: 110.446,
    color: '#DC2626',
    magmaUrl: 'https://magma.esdm.go.id',
  },
  {
    id: 'semeru',
    name: 'G. Semeru',
    province: 'Jawa Timur',
    elevation: '3.676 mdpl',
    level: 'Level III (Siaga)',
    lat: -8.108,
    lng: 112.922,
    color: '#DC2626',
    magmaUrl: 'https://magma.esdm.go.id',
  },
  {
    id: 'rinjani',
    name: 'G. Rinjani',
    province: 'Nusa Tenggara Barat',
    elevation: '3.726 mdpl',
    level: 'Level I (Normal)',
    lat: -8.42,
    lng: 116.46,
    color: '#059669',
    magmaUrl: 'https://magma.esdm.go.id',
  },
  {
    id: 'lokon',
    name: 'G. Lokon',
    province: 'Sulawesi Utara',
    elevation: '1.580 mdpl',
    level: 'Level II (Waspada)',
    lat: 1.358,
    lng: 124.792,
    color: '#F59E0B',
    magmaUrl: 'https://magma.esdm.go.id',
  },
  {
    id: 'gamalama',
    name: 'G. Gamalama',
    province: 'Maluku Utara',
    elevation: '1.715 mdpl',
    level: 'Level II (Waspada)',
    lat: 0.8,
    lng: 127.33,
    color: '#F59E0B',
    magmaUrl: 'https://magma.esdm.go.id',
  },
];

export const ACTIVE_FAULTS: ActiveFaultFeature[] = [
  {
    id: 'lembang',
    name: 'Sesar Lembang (Segmen Aktif)',
    kinematics: 'Geser mengiri (Sinistral)',
    slipRate: '3 – 5,5 mm/tahun',
    coords: [
      [-6.835, 107.47],
      [-6.818, 107.61],
      [-6.805, 107.75],
    ],
    center: [-6.818, 107.61],
    slug: 'peta-patahan-aktif-indonesia',
  },
  {
    id: 'sumatera',
    name: 'Sistem Sesar Sumatera (Segmen Sianok–Ketaun)',
    kinematics: 'Geser menganan (Dekstral)',
    slipRate: '11 – 23 mm/tahun',
    coords: [
      [4.95, 95.85],
      [1.2, 99.1],
      [-0.35, 100.38],
      [-3.3, 102.5],
      [-5.3, 104.7],
    ],
    center: [-0.35, 100.38],
    slug: 'peta-patahan-aktif-indonesia',
  },
  {
    id: 'opak',
    name: 'Sesar Opak (DIY & Jawa Tengah)',
    kinematics: 'Geser mengiri oblik',
    slipRate: '2 – 4 mm/tahun',
    coords: [
      [-8.01, 110.29],
      [-7.89, 110.39],
      [-7.77, 110.48],
    ],
    center: [-7.89, 110.39],
    slug: 'peta-patahan-aktif-indonesia',
  },
  {
    id: 'palukoro',
    name: 'Sesar Palu–Koro (Sulawesi Tengah)',
    kinematics: 'Geser mengiri aktif tinggi',
    slipRate: '30 – 40 mm/tahun',
    coords: [
      [0.4, 119.7],
      [-0.9, 119.87],
      [-2.3, 120.3],
    ],
    center: [-0.9, 119.87],
    slug: 'peta-patahan-aktif-indonesia',
  },
  {
    id: 'sorong',
    name: 'Zona Sesar Sorong (Papua Barat)',
    kinematics: 'Geser mengiri',
    slipRate: '18 – 25 mm/tahun',
    coords: [
      [-0.88, 130.9],
      [-0.92, 132.4],
      [-1.05, 133.9],
    ],
    center: [-0.92, 132.4],
    slug: 'peta-patahan-aktif-indonesia',
  },
];

export const QUADRANGLE_GRIDS: QuadrangleFeature[] = [
  // --- SKALA 1:1.000.000 (16 Lembar Resmi PSG Ndx GL-ID 1M: I–XVI) ---
  ...INDEX_1M_QUADRANGLES,

  // --- SKALA 1:250.000 (Sistematik Induk SNI NLP — Bandung) ---
  {
    code: '1209',
    name: 'Lembar Bandung (Induk Regional)',
    scale: '1:250.000',
    region: 'Jawa & Bali',
    year: 2024,
    hasShp: true,
    summary: 'Lembar induk SNI 6502 wilayah Cekungan Bandung, Priangan Barat–Tengah, dan jalur vulkanik Jawa Barat.',
    slug: 'peta-geologi-lembar-bandung-jawa',
    bounds: [
      [-7.0, 106.5],
      [-6.0, 108.0],
    ],
    center: [-6.5, 107.25],
  },

  // --- SKALA 1:100.000 (Sistematik — Bandung) ---
  {
    code: '1209-3',
    name: 'Lembar Bandung',
    scale: '1:100.000',
    region: 'Jawa & Bali',
    year: 2024,
    hasShp: true,
    summary: 'Pemetaan geologi detail Cekungan Bandung, Formasi Citarum, endapan danau Kuarter, serta jalur Sesar Lembang.',
    slug: 'peta-geologi-lembar-bandung-jawa',
    bounds: [
      [-7.0, 107.5],
      [-6.5, 108.0],
    ],
    center: [-6.75, 107.75],
  },

  // --- SKALA 1:50.000 (Detail — Bandung) ---
  {
    code: '1209-32',
    name: 'Detail Cekungan Bandung–Soreang',
    scale: '1:50.000',
    region: 'Jawa & Bali',
    year: 2024,
    hasShp: true,
    summary: 'Deliniasi detail endapan danau purba Bandung, akuifer vulkanik selatan, dan litologi Cekungan Bandung.',
    slug: 'peta-geologi-lembar-bandung-jawa',
    bounds: [
      [-7.0, 107.75],
      [-6.75, 108.0],
    ],
    center: [-6.875, 107.875],
  },
];

/** Simplified Geographic Silhouettes of Indonesia (Fallback Offline Landmass + Province Corridors) */
export const INDONESIA_ISLANDS: [number, number][][] = [
  // Sumatera
  [[5.55, 95.3], [3.6, 98.7], [0.8, 102.9], [-2.5, 105.8], [-5.9, 105.9], [-5.4, 103.5], [-1.5, 100.2], [2.4, 97.4], [5.55, 95.3]],
  // Jawa
  [[-6.05, 105.9], [-6.15, 106.9], [-6.5, 108.6], [-6.9, 110.5], [-7.2, 112.9], [-7.9, 114.4], [-8.5, 114.2], [-8.2, 110.2], [-7.7, 107.5], [-6.8, 105.4], [-6.05, 105.9]],
  // Kalimantan
  [[4.2, 117.7], [1.9, 118.9], [-1.2, 117.1], [-3.8, 116.1], [-3.4, 111.5], [-2.9, 109.9], [1.4, 109.0], [2.1, 112.8], [4.2, 117.7]],
  // Sulawesi
  [[1.5, 125.1], [0.4, 124.2], [-0.4, 122.9], [-2.8, 122.2], [-5.5, 122.4], [-5.4, 119.4], [-3.4, 119.0], [-0.9, 119.8], [1.3, 120.8], [1.5, 125.1]],
  // Bali - Lombok - Sumbawa - Flores - Timor
  [[-8.1, 114.5], [-8.8, 115.6], [-8.4, 116.5], [-8.7, 119.1], [-8.6, 122.9], [-9.4, 125.2], [-10.3, 123.5], [-8.9, 117.2], [-8.1, 114.5]],
  // Halmahera - Maluku
  [[1.9, 127.8], [0.3, 128.8], [-0.6, 128.0], [1.0, 127.2], [1.9, 127.8]],
  [[-2.8, 128.0], [-3.5, 130.6], [-3.8, 128.1], [-2.8, 128.0]],
  // Papua
  [[-0.9, 131.1], [-1.8, 134.1], [-2.6, 140.9], [-8.9, 140.9], [-5.4, 137.8], [-3.9, 134.5], [-2.2, 132.1], [-0.9, 131.1]],
];

export const SEDIMENT_BASINS: { name: string; status: string; thickness: string; polygon: [number, number][] }[] = [
  {
    name: 'Cekungan Sumatera Selatan',
    status: 'Produksi Migas & CCS',
    thickness: '> 5.200 m',
    polygon: [[-1.5, 102.5], [-2.2, 104.8], [-4.2, 105.0], [-3.6, 102.7]],
  },
  {
    name: 'Cekungan Jawa Barat Utara',
    status: 'Produksi Migas',
    thickness: '4.100 m',
    polygon: [[-5.6, 106.4], [-6.1, 108.5], [-6.7, 108.2], [-6.2, 106.5]],
  },
  {
    name: 'Cekungan Kutai (Kalimantan Timur)',
    status: 'Produksi Gas & Batubara',
    thickness: '> 8.500 m',
    polygon: [[0.8, 116.4], [0.4, 118.2], [-1.3, 117.6], [-0.9, 116.0]],
  },
  {
    name: 'Cekungan Bintuni (Papua Barat)',
    status: 'Produksi LNG',
    thickness: '6.300 m',
    polygon: [[-1.9, 132.4], [-2.1, 134.1], [-3.1, 133.9], [-2.8, 132.2]],
  },
];

export const GROUNDWATER_BASINS: { name: string; potential: string; center: [number, number]; radiusKm: number }[] = [
  { name: 'CAT Jakarta–Bekasi', potential: 'Akuifer Tertekan Sedang–Tinggi', center: [-6.22, 106.92], radiusKm: 42 },
  { name: 'CAT Bandung–Soreang', potential: 'Imbuhan Vulkanik Kuarter', center: [-6.95, 107.61], radiusKm: 34 },
  { name: 'CAT Yogyakarta–Sleman', potential: 'Akuifer Merapi Produktif Tinggi', center: [-7.75, 110.38], radiusKm: 32 },
  { name: 'CAT Medan–Binjai', potential: 'Endapan Aluvial Pesisir', center: [3.59, 98.67], radiusKm: 45 },
  { name: 'CAT Makassar–Maros', potential: 'Kars & Aluvial Pesisir', center: [-5.14, 119.45], radiusKm: 36 },
];

export const FAQ_DATA: FaqItem[] = [
  {
    id: 'faq-1',
    cat: 'Akun & Akses',
    catAnchor: 'category-1',
    q: 'Apakah saya harus masuk akun untuk melihat pratinjau peta beresolusi jelas?',
    a: 'Tidak. Eksplorasi peta interaktif dan kanvas Pratinjau Resolusi Menengah (dengan fitur geser dan zoom bebas) sepenuhnya gratis dan terbuka untuk publik tanpa login. Otentikasi (Masuk) hanya diperlukan saat mengunduh paket GeoPDF resolusi penuh atau data vektor mentah (.SHP).',
  },
  {
    id: 'faq-2',
    cat: 'Akun & Akses',
    catAnchor: 'category-1',
    q: 'Berapa batas kuota unduhan harian pada portal GeoMap ESDM?',
    a: 'Setiap akun terdaftar mendapatkan kuota 20 unduhan dataset penuh (GeoPDF resolusi cetak / paket .SHP + .DBF + .PRJ) per hari. Setelah masuk lewat modal kontekstual, halaman dan layer terakhir Anda tetap tersimpan otomatis.',
  },
  {
    id: 'faq-3',
    cat: 'Pencarian & Filter',
    catAnchor: 'category-2',
    q: 'Bagaimana cara mencari peta berdasarkan nomor lembar atau kata kunci khusus?',
    a: 'Tekan bilah pencarian (atau pintasan keyboard ⌘K / Ctrl+K atau /) lalu ketik nama daerah (mis. "Bandung"), topik ("Patahan", "Gunung Api"), atau nomor lembar ("1209-3"). Sistem juga mendukung sinonim seperti "sesar" untuk "patahan" dan "akuifer" untuk "air tanah".',
  },
  {
    id: 'faq-4',
    cat: 'Format, CRS & SHP',
    catAnchor: 'category-3',
    q: 'Sistem koordinat dan datum apa yang digunakan file vektor (.SHP) GeoMap?',
    a: 'Seluruh koleksi skala nasional (1:5.000.000) menggunakan datum WGS 1984 (EPSG:4326), sedangkan peta lembar detail (1:100.000 dan 1:50.000) dilengkapi metadata proyeksi UTM zona lokal Indonesia (mis. Zona 48S dan 49S).',
  },
  {
    id: 'faq-5',
    cat: 'Layer Kebencanaan & PVMBG',
    catAnchor: 'category-4',
    q: 'Dari mana sumber tingkat aktivitas pada layer Sebaran Gunung Api (PVMBG)?',
    a: 'Layer Sebaran Gunung Api menampilkan status klasifikasi resmi Pusat Vulkanologi dan Mitigasi Bencana Geologi (PVMBG) — Level I (Normal), Level II (Waspada), Level III (Siaga), hingga Level IV (Awas) — lengkap dengan tautan langsung ke portal pemantauan MAGMA Indonesia (magma.esdm.go.id).',
  },
  {
    id: 'faq-6',
    cat: 'Peta & Cakupan',
    catAnchor: 'category-5',
    q: 'Mengapa layer peta interaktif tidak semuanya menyala saat pertama kali dibuka?',
    a: 'GeoMap menerapkan prinsip Clean Startup agar peta dasar awal bersih, cepat dimuat, dan bebas tumpang-tindih: seluruh lapisan data geospasial (Batas Provinsi, Geologi, Patahan Aktif, Gunung Api, Air Tanah, Cekungan Sedimen, dan Indeks Lembar) nonaktif saat awal dibuka (0 Aktif) dan baru ditampilkan setelah diaktifkan 1 klik dari Manajer Layer maupun saat memilih filter skala.',
  },
];

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: 'peneliti',
    label: 'Peneliti Geologi',
    name: 'Dr. Raka Pratama',
    email: 'raka.pratama@geologi-id.ac.id',
    role: 'Peneliti & Akademisi',
  },
  {
    id: 'investor',
    label: 'Investor Energi',
    name: 'Nadia Kusuma',
    email: 'nadia.kusuma@nusantara-energi.co.id',
    role: 'Analis Eksplorasi',
  },
  {
    id: 'publik',
    label: 'Masyarakat Umum',
    name: 'Budi Santoso',
    email: 'budi.santoso@warga-bandung.id',
    role: 'Publik / Warga',
  },
];

/** Normalize user search keywords across common Indonesian geological synonyms & typos */
export function normalizeGeoQuery(raw: string): string {
  let q = raw.trim().toLowerCase();
  const corrections: Record<string, string> = {
    yogyakata: 'yogyakarta',
    jogja: 'yogyakarta',
    jogjakarta: 'yogyakarta',
    kerantanan: 'kerentanan',
    sesar: 'patahan',
    akuifer: 'air tanah',
    hidro: 'hidrogeologi',
    vulkanik: 'gunung api',
    merapi: 'gunung api',
  };
  for (const [k, v] of Object.entries(corrections)) {
    if (q.includes(k)) {
      q = q.replace(k, v);
    }
  }
  return q;
}

