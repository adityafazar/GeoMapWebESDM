import {
  DATASETS,
  QUADRANGLE_GRIDS,
  type MapScaleValue,
  type QuadrangleFeature,
} from '../data/geomapData';
import { resolveCellLocationLabel } from '../data/indonesiaGazetteer';

/** Titik asal standar SNI 6502 / BIG (Bakosurtanal): 90° BT dan 15° LS */
export const SNI_NLP_ORIGIN_LNG = 90.0;
export const SNI_NLP_ORIGIN_LAT = -15.0;

export interface ScaleGridSpec {
  scale: MapScaleValue;
  latSpan: number;
  lngSpan: number;
  resolutionLabel: string;
  standardName: string;
  parentFallbackScale: MapScaleValue | null;
}

export const SCALE_GRID_SPECS: Record<MapScaleValue, ScaleGridSpec> = {
  '1:5.000.000': {
    scale: '1:5.000.000',
    latSpan: 17.5,
    lngSpan: 23.5,
    resolutionLabel: 'Nasional Barat / Timur',
    standardName: 'Indeks Nasional Sintesis 1:5.000.000 ESDM',
    parentFallbackScale: null,
  },
  '1:1.000.000': {
    scale: '1:1.000.000',
    latSpan: 4.0,
    lngSpan: 6.0,
    resolutionLabel: '4° × 6° (IMW Sejuta)',
    standardName: 'International Map of the World (IMW 1:1.000.000)',
    parentFallbackScale: '1:5.000.000',
  },
  '1:500.000': {
    scale: '1:500.000',
    latSpan: 2.0,
    lngSpan: 3.0,
    resolutionLabel: '2° × 3° (Kuadran Regional)',
    standardName: 'Sub-pembagian Kuadran IMW 1:1.000.000',
    parentFallbackScale: '1:1.000.000',
  },
  '1:250.000': {
    scale: '1:250.000',
    latSpan: 1.0,
    lngSpan: 1.5,
    resolutionLabel: "1° × 1°30' (NLP Induk)",
    standardName: 'SNI 6502 / Nomor Lembar Peta BIG (Origin 90° BT, 15° LS)',
    parentFallbackScale: '1:500.000',
  },
  '1:100.000': {
    scale: '1:100.000',
    latSpan: 0.5,
    lngSpan: 0.5,
    resolutionLabel: "30' × 30' (Pecahan 6)",
    standardName: 'SNI 6502 / NLP BIG (6 Lembar per Induk 1:250.000)',
    parentFallbackScale: '1:250.000',
  },
  '1:50.000': {
    scale: '1:50.000',
    latSpan: 0.25,
    lngSpan: 0.25,
    resolutionLabel: "15' × 15' (Kuadran 4)",
    standardName: 'SNI 6502 / NLP BIG (4 Kuadran per Lembar 1:100.000)',
    parentFallbackScale: '1:100.000',
  },
};

interface LandMaskPolygon {
  region: string;
  bbox: [number, number, number, number]; // south, west, north, east
  points: [number, number][]; // [lat, lng]
  coastalMarginDeg: number;
}

function makePolygon(
  region: string,
  points: [number, number][],
  coastalMarginDeg = 0.22,
): LandMaskPolygon {
  let south = 90;
  let north = -90;
  let west = 180;
  let east = -180;
  for (const [lat, lng] of points) {
    if (lat < south) south = lat;
    if (lat > north) north = lat;
    if (lng < west) west = lng;
    if (lng > east) east = lng;
  }
  return {
    region,
    bbox: [
      south - coastalMarginDeg,
      west - coastalMarginDeg,
      north + coastalMarginDeg,
      east + coastalMarginDeg,
    ],
    points,
    coastalMarginDeg,
  };
}

/** Poligon daratan & gugus pulau kepulauan Indonesia agar sel grid tidak memenuhi laut lepas */
const ARCHIPELAGO_LAND_MASKS: LandMaskPolygon[] = [
  // Jawa, Madura & Selat Sunda–Karimunjawa–Kangean
  makePolygon(
    'Jawa & Bali',
    [
      [-5.85, 105.85],
      [-5.95, 106.5],
      [-6.05, 107.2],
      [-6.25, 108.3],
      [-6.7, 108.7],
      [-6.85, 110.3],
      [-6.45, 111.0],
      [-6.95, 112.7],
      [-6.9, 114.1],
      [-7.75, 114.5],
      [-8.6, 114.4],
      [-8.35, 112.5],
      [-8.2, 110.9],
      [-7.95, 109.2],
      [-7.75, 107.6],
      [-7.1, 106.3],
      [-6.6, 105.3],
    ],
    0.26,
  ),
  // Karimunjawa & Bawean (Laut Jawa)
  makePolygon(
    'Jawa & Bali',
    [
      [-5.7, 110.2],
      [-5.7, 110.7],
      [-6.05, 110.7],
      [-6.05, 110.2],
    ],
    0.15,
  ),
  makePolygon(
    'Jawa & Bali',
    [
      [-5.65, 112.45],
      [-5.65, 112.85],
      [-5.95, 112.85],
      [-5.95, 112.45],
    ],
    0.15,
  ),
  // Bali - NTB - NTT - Timor - Rote
  makePolygon(
    'Nusa Tenggara',
    [
      [-8.05, 114.45],
      [-8.1, 116.5],
      [-8.3, 118.9],
      [-8.2, 123.5],
      [-8.4, 127.3],
      [-10.4, 125.0],
      [-10.85, 122.8],
      [-9.8, 119.2],
      [-8.85, 115.1],
    ],
    0.3,
  ),
  // Sumatera + Nias/Mentawai + Bangka-Belitung + Kep. Riau
  makePolygon(
    'Sumatera',
    [
      [5.95, 95.1],
      [4.5, 98.2],
      [2.8, 99.9],
      [1.1, 104.5],
      [-1.7, 106.2],
      [-2.8, 108.3],
      [-3.4, 106.2],
      [-5.95, 105.8],
      [-5.6, 103.7],
      [-3.2, 101.2],
      [-1.0, 99.0],
      [2.2, 97.2],
    ],
    0.35,
  ),
  // Natuna & Anambas
  makePolygon(
    'Sumatera',
    [
      [1.8, 105.5],
      [4.4, 107.6],
      [4.4, 108.6],
      [2.4, 109.1],
      [1.8, 106.2],
    ],
    0.35,
  ),
  // Kalimantan
  makePolygon(
    'Kalimantan',
    [
      [4.35, 117.9],
      [2.1, 118.8],
      [0.8, 118.9],
      [-1.3, 117.5],
      [-3.95, 116.3],
      [-3.45, 111.7],
      [-2.9, 109.9],
      [-0.8, 109.1],
      [1.9, 108.9],
      [2.1, 112.9],
      [4.2, 115.6],
    ],
    0.32,
  ),
  // Sulawesi + Talaud/Sangihe + Buton/Wakatobi
  makePolygon(
    'Sulawesi',
    [
      [5.6, 126.4],
      [1.7, 125.4],
      [0.3, 124.2],
      [-1.4, 123.6],
      [-4.9, 123.4],
      [-5.8, 122.7],
      [-5.7, 119.3],
      [-3.4, 118.9],
      [-0.7, 119.5],
      [1.4, 120.7],
      [1.6, 125.0],
      [4.7, 125.4],
    ],
    0.35,
  ),
  // Maluku & Maluku Utara (Halmahera, Morotai, Seram, Buru, Kei, Aru, Tanimbar)
  makePolygon(
    'Maluku',
    [
      [2.6, 128.4],
      [0.5, 129.0],
      [-3.0, 131.0],
      [-6.0, 134.9],
      [-8.3, 131.5],
      [-7.9, 126.0],
      [-3.8, 126.0],
      [1.0, 127.1],
    ],
    0.4,
  ),
  // Papua (Raja Ampat, Kepala Burung, Pegunungan Tengah, Biak, Merauke)
  makePolygon(
    'Papua',
    [
      [0.5, 130.0],
      [-0.7, 136.5],
      [-2.4, 141.1],
      [-9.1, 141.1],
      [-7.4, 138.2],
      [-5.2, 136.8],
      [-4.1, 133.5],
      [-2.5, 131.7],
      [-1.4, 129.7],
    ],
    0.35,
  ),
];

function pointInPolygon(lat: number, lng: number, pts: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [yi, xi] = pts[i];
    const [yj, xj] = pts[j];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointToSegmentDistSq(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return (px - ax) ** 2 + (py - ay) ** 2;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return (px - projX) ** 2 + (py - projY) ** 2;
}

function pointNearMask(lat: number, lng: number, mask: LandMaskPolygon): boolean {
  const [s, w, n, e] = mask.bbox;
  if (lat < s || lat > n || lng < w || lng > e) return false;
  if (pointInPolygon(lat, lng, mask.points)) return true;

  const thresholdSq = mask.coastalMarginDeg * mask.coastalMarginDeg;
  const pts = mask.points;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    if (
      pointToSegmentDistSq(lat, lng, pts[j][0], pts[j][1], pts[i][0], pts[i][1]) <=
      thresholdSq
    ) {
      return true;
    }
  }
  return false;
}

export const INDONESIA_GRID_ENVELOPE = {
  south: -11.5,
  north: 6.5,
  west: 94.5,
  east: 141.5,
} as const;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function roundDeg(val: number): number {
  return Number(val.toFixed(6));
}

export function formatDmsCoord(deg: number, axis: 'lat' | 'lng'): string {
  const abs = Math.abs(deg);
  const d = Math.floor(abs + 1e-9);
  const minFloat = (abs - d) * 60;
  const m = Math.floor(minFloat + 1e-6);
  const s = Math.round((minFloat - m) * 60);
  const adjustedM = s >= 60 ? m + 1 : m;
  const finalD = adjustedM >= 60 ? d + 1 : d;
  const finalM = adjustedM % 60;
  const dir =
    axis === 'lat' ? (deg >= 0 ? 'LU' : 'LS') : deg >= 0 ? 'BT' : 'BB';
  return `${finalD}°${pad2(finalM)}' ${dir}`;
}

export function inferIndonesiaRegion(
  south: number,
  west: number,
  north: number,
  east: number,
): string | null {
  const midLat = (south + north) / 2;
  const midLng = (west + east) / 2;
  // Uji 5 titik (tengah + 4 pojok dalam) sehingga sel pesisir tetap terjaring, tetapi laut lepas tersaring
  const insetLat = (north - south) * 0.12;
  const insetLng = (east - west) * 0.12;
  const probes: [number, number][] = [
    [midLat, midLng],
    [south + insetLat, west + insetLng],
    [south + insetLat, east - insetLng],
    [north - insetLat, west + insetLng],
    [north - insetLat, east - insetLng],
  ];

  for (const mask of ARCHIPELAGO_LAND_MASKS) {
    const [ms, mw, mn, me] = mask.bbox;
    if (east < mw || west > me || north < ms || south > mn) continue;
    for (const [pLat, pLng] of probes) {
      if (pointNearMask(pLat, pLng, mask)) {
        return mask.region;
      }
    }
  }
  return null;
}

/** Hitung Nomor Lembar Peta SNI 6502 (1:250.000, 1:100.000, 1:50.000) dari koordinat */
export function computeSniNlpCode(
  lat: number,
  lng: number,
  scale: '1:250.000' | '1:100.000' | '1:50.000',
): {
  code: string;
  parent250k: string;
  parent100k: string;
  col250: number;
  row250: number;
} {
  const col250 = Math.floor((lng - SNI_NLP_ORIGIN_LNG + 1e-9) / 1.5) + 1;
  const row250 = Math.floor((lat - SNI_NLP_ORIGIN_LAT + 1e-9) / 1.0) + 1;
  const parent250k = `${pad2(col250)}${pad2(row250)}`;

  if (scale === '1:250.000') {
    return { code: parent250k, parent250k, parent100k: parent250k, col250, row250 };
  }

  const baseWest = SNI_NLP_ORIGIN_LNG + (col250 - 1) * 1.5;
  const baseSouth = SNI_NLP_ORIGIN_LAT + (row250 - 1) * 1.0;

  const sc = Math.min(2, Math.max(0, Math.floor((lng - baseWest + 1e-9) / 0.5)));
  const sr = Math.min(1, Math.max(0, Math.floor((lat - baseSouth + 1e-9) / 0.5)));
  const sub100k = sr * 3 + sc + 1; // Bawah: 1,2,3 | Atas: 4,5,6
  const parent100k = `${parent250k}-${sub100k}`;

  if (scale === '1:100.000') {
    return { code: parent100k, parent250k, parent100k, col250, row250 };
  }

  const cellWest100 = baseWest + sc * 0.5;
  const cellSouth100 = baseSouth + sr * 0.5;
  const qc = Math.min(1, Math.max(0, Math.floor((lng - cellWest100 + 1e-9) / 0.25)));
  const qr = Math.min(1, Math.max(0, Math.floor((lat - cellSouth100 + 1e-9) / 0.25)));
  const quad50k = qr * 2 + qc + 1; // Bawah: 1,2 | Atas: 3,4

  return {
    code: `${parent100k}${quad50k}`,
    parent250k,
    parent100k,
    col250,
    row250,
  };
}

/** Hitung kode standar International Map of the World (1:1.000.000) & kuadran 1:500.000 */
export function computeImwCode(
  lat: number,
  lng: number,
  scale: '1:1.000.000' | '1:500.000',
): { code: string; parentCode: string } {
  const zone = Math.floor((lng + 180.0 + 1e-9) / 6.0) + 1;
  const isNorth = lat >= 0;
  const bandIndex = isNorth
    ? Math.floor((lat + 1e-9) / 4.0)
    : Math.floor((Math.abs(lat) - 1e-9) / 4.0);
  const letter = String.fromCharCode(65 + Math.max(0, bandIndex));
  const parentCode = `${isNorth ? 'N' : 'S'}${letter}-${zone}`;

  if (scale === '1:1.000.000') {
    return { code: parentCode, parentCode };
  }

  const imwWest = (zone - 1) * 6.0 - 180.0;
  const imwSouth = isNorth ? bandIndex * 4.0 : -(bandIndex + 1) * 4.0;
  const isEast = lng - imwWest >= 3.0 - 1e-9;
  const isUpper = lat - imwSouth >= 2.0 - 1e-9;
  const quad = `${isUpper ? 'N' : 'S'}${isEast ? 'E' : 'W'}`;

  return { code: `${parentCode}-${quad}`, parentCode };
}

const fallbackSlugCache = new Map<string, string>();

function findFallbackDatasetSlug(region: string, scale: MapScaleValue): string {
  const cacheKey = `${scale}::${region}`;
  const cached = fallbackSlugCache.get(cacheKey);
  if (cached) return cached;

  const regionPrefix = region.split(' ')[0].toLowerCase();
  const exactScaleAndRegion = DATASETS.find(
    (d) =>
      d.scale === scale &&
      d.region.toLowerCase().includes(regionPrefix),
  );
  if (exactScaleAndRegion) {
    fallbackSlugCache.set(cacheKey, exactScaleAndRegion.slug);
    return exactScaleAndRegion.slug;
  }

  const byRegion = DATASETS.find((d) =>
    d.region.toLowerCase().includes(regionPrefix),
  );
  const resolved = byRegion ? byRegion.slug : DATASETS[0].slug;
  fallbackSlugCache.set(cacheKey, resolved);
  return resolved;
}

export interface NlpViewportGenerationResult {
  requestedScale: MapScaleValue;
  renderedScale: MapScaleValue;
  isParentFallback: boolean;
  cells: QuadrangleFeature[];
  catalogMatches: QuadrangleFeature[];
  totalCount: number;
}

const catalogByScaleAndCode = new Map<string, QuadrangleFeature>();
const catalogMatchesByScale = new Map<MapScaleValue, QuadrangleFeature[]>();
for (const q of QUADRANGLE_GRIDS) {
  catalogByScaleAndCode.set(`${q.scale}::${q.code}`, q);
  const list = catalogMatchesByScale.get(q.scale);
  if (list) {
    list.push(q);
  } else {
    catalogMatchesByScale.set(q.scale, [q]);
  }
}

const computedGridCellCache = new Map<string, QuadrangleFeature | null>();
const MAX_CELL_CACHE_ENTRIES = 6000;

/**
 * Menghasilkan sel grid indeks peta resmi Indonesia yang masuk ke dalam viewport peta aktif
 * (Viewport-Culled Opsi 1) dengan fallback skala induk otomatis jika zoom terlalu jauh.
 */
export function generateNlpCellsInViewport(params: {
  scale: MapScaleValue;
  viewportBounds: { south: number; north: number; west: number; east: number };
  cellPixelWidth?: number;
  maxCells?: number;
}): NlpViewportGenerationResult {
  const { scale, viewportBounds, cellPixelWidth, maxCells = 480 } = params;

  let renderedScale: MapScaleValue = scale;
  let isParentFallback = false;

  if (typeof cellPixelWidth === 'number' && cellPixelWidth > 0 && cellPixelWidth < 14) {
    if (scale === '1:50.000') {
      renderedScale = cellPixelWidth < 7 ? '1:250.000' : '1:100.000';
      isParentFallback = true;
    } else if (scale === '1:100.000') {
      renderedScale = '1:250.000';
      isParentFallback = true;
    } else if (scale === '1:250.000' && cellPixelWidth < 8) {
      renderedScale = '1:500.000';
      isParentFallback = true;
    }
  }

  const spec = SCALE_GRID_SPECS[renderedScale];
  const catalogMatches = catalogMatchesByScale.get(scale) ?? [];

  // Skala 1:5.000.000 langsung menampilkan Lembar Sintesis Nasional Barat & Timur tanpa tumpang tindih
  if (renderedScale === '1:5.000.000') {
    const baratCatalog = catalogByScaleAndCode.get('1:5.000.000::NAS-BARAT');
    const timurCatalog = catalogByScaleAndCode.get('1:5.000.000::NAS-TIMUR');
    const nationalCells: QuadrangleFeature[] = [
      baratCatalog
        ? {
            ...baratCatalog,
            isComputedGrid: false,
            parentCode: 'Indonesia (Nasional)',
            gridResolution: spec.resolutionLabel,
            standardName: spec.standardName,
          }
        : {
            code: 'NAS-BARAT',
            name: 'Lembar Nasional Nusantara Barat',
            scale: '1:5.000.000',
            region: 'Nasional',
            year: 2025,
            hasShp: true,
            summary: `Peta tematik cakupan wilayah Indonesia Barat (${spec.resolutionLabel}).`,
            slug: 'peta-geologi-indonesia',
            bounds: [
              [-11.0, 94.5],
              [6.5, 119.5],
            ],
            center: [-2.25, 107.0],
            isComputedGrid: true,
            locationLabel: 'Indonesia Timur',
            parentCode: 'Indonesia (Nasional)',
            gridResolution: spec.resolutionLabel,
            standardName: spec.standardName,
          },
      timurCatalog
        ? {
            ...timurCatalog,
            isComputedGrid: false,
            parentCode: 'Indonesia (Nasional)',
            gridResolution: spec.resolutionLabel,
            standardName: spec.standardName,
          }
        : {
            code: 'NAS-TIMUR',
            name: 'Lembar NLP NAS-TIMUR',
            scale: '1:5.000.000',
            region: 'Nasional',
            year: 2025,
            hasShp: true,
            summary: `Grid lembar resmi ${spec.standardName} (${spec.resolutionLabel}) wilayah Sulawesi, Nusa Tenggara, Maluku, hingga Papua.`,
            slug: 'peta-tektonik-indonesia',
            bounds: [
              [-11.0, 119.5],
              [6.5, 141.5],
            ],
            center: [-2.25, 130.5],
            isComputedGrid: true,
            locationLabel: 'Indonesia Timur',
            parentCode: 'Indonesia (Nasional)',
            gridResolution: spec.resolutionLabel,
            standardName: spec.standardName,
          },
    ];
    return {
      requestedScale: scale,
      renderedScale,
      isParentFallback,
      cells: nationalCells,
      catalogMatches,
      totalCount: nationalCells.length,
    };
  }

  const originLat =
    renderedScale === '1:1.000.000' || renderedScale === '1:500.000'
      ? -12.0
      : SNI_NLP_ORIGIN_LAT;
  const originLng =
    renderedScale === '1:1.000.000' || renderedScale === '1:500.000'
      ? 90.0
      : SNI_NLP_ORIGIN_LNG;

  const sClip = Math.max(INDONESIA_GRID_ENVELOPE.south, viewportBounds.south);
  const nClip = Math.min(INDONESIA_GRID_ENVELOPE.north, viewportBounds.north);
  const wClip = Math.max(INDONESIA_GRID_ENVELOPE.west, viewportBounds.west);
  const eClip = Math.min(INDONESIA_GRID_ENVELOPE.east, viewportBounds.east);

  const cells: QuadrangleFeature[] = [];
  const renderedCatalogList = catalogMatchesByScale.get(renderedScale) ?? [];

  if (sClip < nClip && wClip < eClip) {
    const startRow = Math.floor((sClip - originLat) / spec.latSpan);
    const endRow = Math.floor((nClip - originLat - 1e-9) / spec.latSpan);
    const startCol = Math.floor((wClip - originLng) / spec.lngSpan);
    const endCol = Math.floor((eClip - originLng - 1e-9) / spec.lngSpan);

    outer: for (let r = startRow; r <= endRow; r += 1) {
      for (let c = startCol; c <= endCol; c += 1) {
        const cellKey = `${renderedScale}:${r}:${c}`;
        let cachedCell = computedGridCellCache.get(cellKey);

        if (cachedCell === undefined) {
          const south = roundDeg(originLat + r * spec.latSpan);
          const north = roundDeg(south + spec.latSpan);
          const cLat = roundDeg((south + north) / 2);
          const west = roundDeg(originLng + c * spec.lngSpan);
          const east = roundDeg(west + spec.lngSpan);
          const cLng = roundDeg((west + east) / 2);

          const region = inferIndonesiaRegion(south, west, north, east);
          if (!region) {
            cachedCell = null;
          } else {
            let code = '';
            let parentCode = '';

            if (
              renderedScale === '1:250.000' ||
              renderedScale === '1:100.000' ||
              renderedScale === '1:50.000'
            ) {
              const nlp = computeSniNlpCode(cLat, cLng, renderedScale);
              code = nlp.code;
              parentCode =
                renderedScale === '1:50.000'
                  ? nlp.parent100k
                  : renderedScale === '1:100.000'
                    ? nlp.parent250k
                    : 'Indonesia (SNI 6502)';
            } else {
              const imw = computeImwCode(
                cLat,
                cLng,
                renderedScale as '1:1.000.000' | '1:500.000',
              );
              code = imw.code;
              parentCode = imw.parentCode;
            }

            // Cocokkan langsung dengan lembar unggulan katalog di skala & kode yang sama
            const catalogExact = catalogByScaleAndCode.get(`${renderedScale}::${code}`);
            // Juga cek apakah ada lembar katalog di skala yang sama yang berpusat di dalam sel ini (mis. PSG-JB-500 di SB-48-SE)
            const catalogContained =
              catalogExact ??
              (renderedScale === '1:500.000' || renderedScale === '1:1.000.000'
                ? renderedCatalogList.find(
                    (q) =>
                      q.center[0] >= south &&
                      q.center[0] < north &&
                      q.center[1] >= west &&
                      q.center[1] < east,
                  )
                : undefined);

            if (catalogContained) {
              cachedCell = {
                ...catalogContained,
                bounds: [
                  [south, west],
                  [north, east],
                ],
                center: [cLat, cLng],
                parentCode,
                gridResolution: spec.resolutionLabel,
                standardName: spec.standardName,
                isComputedGrid: false,
              };
            } else {
              const locationLabel = resolveCellLocationLabel({
                south,
                west,
                north,
                east,
                centerLat: cLat,
                centerLng: cLng,
                region,
              });
              const boundsLabel = `${formatDmsCoord(south, 'lat')} – ${formatDmsCoord(north, 'lat')}, ${formatDmsCoord(west, 'lng')} – ${formatDmsCoord(east, 'lng')}`;
              cachedCell = {
                code,
                name: `Lembar ${locationLabel} (${code})`,
                scale: renderedScale,
                region,
                locationLabel,
                year: 2025,
                hasShp: renderedScale !== '1:50.000',
                summary: `Peta geospasial wilayah ${locationLabel}, ${region} pada indeks lembar ${code} skala ${renderedScale} (${boundsLabel}).`,
                slug: findFallbackDatasetSlug(region, renderedScale),
                bounds: [
                  [south, west],
                  [north, east],
                ],
                center: [cLat, cLng],
                isComputedGrid: true,
                parentCode,
                gridResolution: spec.resolutionLabel,
                standardName: spec.standardName,
              };
            }
          }

          if (computedGridCellCache.size >= MAX_CELL_CACHE_ENTRIES) {
            computedGridCellCache.clear();
          }
          computedGridCellCache.set(cellKey, cachedCell);
        }

        if (cachedCell) {
          cells.push(cachedCell);
          if (cells.length >= maxCells) {
            break outer;
          }
        }
      }
    }
  }

  return {
    requestedScale: scale,
    renderedScale,
    isParentFallback,
    cells,
    catalogMatches,
    totalCount: cells.length,
  };
}

const NICE_SCALE_DENOMINATORS = [
  50000, 100000, 250000, 500000, 1000000, 1500000, 2000000, 2500000, 5000000,
  10000000, 15000000, 20000000, 25000000, 35000000,
];

const NICE_METRIC_BAR_METERS = [
  500, 1000, 2000, 5000, 10000, 20000, 25000, 50000, 100000, 200000, 250000,
  500000, 1000000,
];

/** Hitung meter-per-piksel proyeksi Web Mercator pada lintang & zoom aktual */
export function getMetersPerPixel(lat: number, zoom: number): number {
  const safeLat = Math.max(-85, Math.min(85, lat));
  return (
    (40075016.686 * Math.cos((safeLat * Math.PI) / 180)) /
    (256 * Math.pow(2, zoom))
  );
}

/** Hitung rasio skala kartografis aktual (asumsi layar CSS 96 DPI ≈ 0.00026458 m/px) */
export function computeRealScaleRatioLabel(lat: number, zoom: number): string {
  const mpp = getMetersPerPixel(lat, zoom);
  const rawDenominator = mpp / 0.0002645833;
  let closest = NICE_SCALE_DENOMINATORS[0];
  let minDiff = Math.abs(rawDenominator - closest);

  for (const candidate of NICE_SCALE_DENOMINATORS) {
    const diff = Math.abs(rawDenominator - candidate);
    if (diff < minDiff) {
      minDiff = diff;
      closest = candidate;
    }
  }

  return `1:${closest.toLocaleString('id-ID')}`;
}

/** Hitung panjang piksel dan label jarak (m / km) geodesik akurat untuk bilah skala peta */
export function computeCartographicScaleBar(
  lat: number,
  zoom: number,
  maxWidthPx = 76,
): { widthPx: number; label: string } {
  const mpp = getMetersPerPixel(lat, zoom);
  const maxMeters = mpp * maxWidthPx;

  let chosenMeters = NICE_METRIC_BAR_METERS[0];
  for (const m of NICE_METRIC_BAR_METERS) {
    if (m <= maxMeters) {
      chosenMeters = m;
    }
  }

  const widthPx = Math.max(24, Math.min(88, Math.round(chosenMeters / mpp)));
  const label =
    chosenMeters >= 1000 ? `${chosenMeters / 1000} km` : `${chosenMeters} m`;

  return { widthPx, label };
}

export const MAP_SCALE_ZOOM_ORDER: MapScaleValue[] = [
  '1:5.000.000',
  '1:1.000.000',
  '1:500.000',
  '1:250.000',
  '1:100.000',
  '1:50.000',
];

/** Peta 1-to-1 antara level zoom Leaflet dengan tingkatan skala indeks peta resmi */
export function zoomToMapScaleValue(zoom: number): MapScaleValue {
  const z = Math.round(zoom);
  if (z <= 4) return '1:5.000.000';
  if (z === 5) return '1:1.000.000';
  if (z === 6) return '1:500.000';
  if (z === 7) return '1:250.000';
  if (z === 8) return '1:100.000';
  return '1:50.000';
}

/**
 * Sinkronisasi skala indeks secara monoton saat pengguna zoom masuk/keluar:
 * zoom masuk tidak pernah melompat ke skala lebih kasar, zoom keluar tidak pernah ke lebih detail.
 */
export function resolveMonotonicZoomScale(params: {
  currentScale: MapScaleValue | null;
  prevZoom: number;
  nextZoom: number;
}): MapScaleValue {
  const prevZ = Math.round(params.prevZoom);
  const nextZ = Math.round(params.nextZoom);
  const candidate = zoomToMapScaleValue(nextZ);

  if (!params.currentScale) return candidate;
  if (nextZ === prevZ) return params.currentScale;

  const currRank = MAP_SCALE_ZOOM_ORDER.indexOf(params.currentScale);
  const candRank = MAP_SCALE_ZOOM_ORDER.indexOf(candidate);

  if (nextZ > prevZ) {
    return candRank > currRank ? candidate : params.currentScale;
  }
  return candRank < currRank ? candidate : params.currentScale;
}

export interface ProjectedPoint2D {
  x: number;
  y: number;
}

export interface PopupAnchoredCenterParams {
  bounds: [[number, number], [number, number]];
  containerHeight: number;
  popupHeight: number;
  currentZoom: number;
  preferredZoom: number;
  preserveCurrentZoomIfVisible?: boolean;
  minPreserveCellPx?: number;
  maxPreserveCellPx?: number;
  isMobileViewport?: boolean;
  gapPx?: number;
  project: (lat: number, lng: number, zoom: number) => ProjectedPoint2D;
  unproject: (x: number, y: number, zoom: number) => { lat: number; lng: number };
}

/**
 * Hitung koordinat pusat peta agar sel indeks NLP tepat berada di atas kartu popup
 * yang terpusat di tengah layar web, sehingga popup tepat berada di bawah indeks terpilih.
 */
export function computePopupAnchoredMapCenter(
  params: PopupAnchoredCenterParams,
): { lat: number; lng: number; zoom: number } {
  const [[south, west], [north, east]] = params.bounds;
  const centerLng = (west + east) / 2;
  const centerLat = (south + north) / 2;
  const minCellPx = params.minPreserveCellPx ?? 40;
  const maxCellPx = params.maxPreserveCellPx ?? 420;
  const gapPx = params.gapPx ?? 20;

  let resolvedZoom = params.preferredZoom;
  if (params.preserveCurrentZoomIfVisible) {
    const pNorthCur = params.project(north, centerLng, params.currentZoom);
    const pSouthCur = params.project(south, centerLng, params.currentZoom);
    const curCellPxH = Math.abs(pSouthCur.y - pNorthCur.y);
    if (curCellPxH >= minCellPx && curCellPxH <= maxCellPx) {
      resolvedZoom = params.currentZoom;
    }
  }

  const pSouth = params.project(south, centerLng, resolvedZoom);
  const pCellCenter = params.project(centerLat, centerLng, resolvedZoom);

  // Web/desktop (sm+): popup terpusat di containerHeight / 2; mobile (<640px): bottom-24
  const popupTopScreenY = params.isMobileViewport
    ? Math.max(120, params.containerHeight - 96 - params.popupHeight)
    : params.containerHeight / 2 - params.popupHeight / 2;

  const desiredCellBottomScreenY = popupTopScreenY - gapPx;
  let desiredMapCenterY =
    pSouth.y + params.containerHeight / 2 - desiredCellBottomScreenY;

  // Jaga agar kode label di pusat sel tidak terdorong keluar batas atas layar peta
  const minCellCenterScreenY = params.isMobileViewport
    ? Math.min(140, desiredCellBottomScreenY - 24)
    : 56;
  const maxMapCenterY =
    pCellCenter.y + params.containerHeight / 2 - minCellCenterScreenY;
  if (desiredMapCenterY > maxMapCenterY) {
    desiredMapCenterY = maxMapCenterY;
  }

  const adjusted = params.unproject(
    pCellCenter.x,
    desiredMapCenterY,
    resolvedZoom,
  );
  return {
    lat: adjusted.lat,
    lng: adjusted.lng,
    zoom: resolvedZoom,
  };
}
