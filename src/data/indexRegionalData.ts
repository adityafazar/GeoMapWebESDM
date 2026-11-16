import {
  INDEX_100K_SHEETS,
  INDEX_250K_SHEETS,
  type RegionalIndexTuple,
} from './regionalIndexData';

export type IndexRegionalTemaCode =
  | 'GL-JW 100'
  | 'GL-SM 250'
  | 'GL-KL 250'
  | 'GL-PP 250'
  | 'GL-SL 250'
  | 'GL-ML 250'
  | 'GL-BN 250';

export interface IndexRegionalSheet {
  Kode_Tema: IndexRegionalTemaCode;
  Tema: string;
  Wilayah: string;
  Skala: 100000 | 250000;
  Nama_Lembar_PSG: string;
  No_Lembar_BIG: string;
  Penyusun: string;
  Tahun: string;
  Instansi: string;
  bounds: [[number, number], [number, number]];
  center: [number, number];
  /** Nomor lembar peta SNI 6502 / kode label kanvas */
  nlpCode: string;
}

/** Titik label asli MapInfo (.MAP) untuk lembar multi-pulau agar label tidak jatuh di laut terbuka */
const MAPINFO_LABEL_CENTERS: Record<string, [number, number]> = {
  'Moa, Damar & Bandanaira': [-7.713194, 127.925],
  Talaud: [4.25, 127.0],
  Tukangbesi: [-5.616667, 123.75],
  'Sangihe & Siau': [3.474305, 125.5],
  'Bawean & Masalembo': [-5.833333, 112.75],
};

function roundCoord(val: number): number {
  return Number(val.toFixed(6));
}

function mapTupleToOfficialSheet([
  code,
  sheetName,
  scaleDenom,
  themeCode,
  region,
  southLat,
  westLng,
  northLat,
  eastLng,
  compilers,
  year,
]: RegionalIndexTuple): IndexRegionalSheet {
  const fallbackCenter: [number, number] = [
    roundCoord((southLat + northLat) / 2),
    roundCoord((westLng + eastLng) / 2),
  ];
  return {
    Kode_Tema: themeCode as IndexRegionalTemaCode,
    Tema: 'Geologi',
    Wilayah: region,
    Skala: scaleDenom,
    Nama_Lembar_PSG: sheetName,
    No_Lembar_BIG: themeCode === 'GL-JW 100' ? '' : code,
    Penyusun: compilers,
    Tahun: year > 0 ? String(year) : '',
    Instansi: 'Pusat Survei Geologi',
    bounds: [
      [southLat, westLng],
      [northLat, eastLng],
    ],
    center: MAPINFO_LABEL_CENTERS[sheetName] ?? fallbackCenter,
    nlpCode: code,
  };
}

/** 57 lembar resmi skala 1:100.000 (Jawa — GL-JW 100) dari 100-250.zip */
export const INDEX_100K_OFFICIAL_SHEETS: readonly IndexRegionalSheet[] =
  INDEX_100K_SHEETS.map(mapTupleToOfficialSheet);

/** 177 lembar resmi skala 1:250.000 (Luar Jawa — GL-SM/KL/PP/SL/ML/BN 250) dari 100-250.zip */
export const INDEX_250K_OFFICIAL_SHEETS: readonly IndexRegionalSheet[] =
  INDEX_250K_SHEETS.map(mapTupleToOfficialSheet);

export const INDEX_REGIONAL_SHEETS: readonly IndexRegionalSheet[] = [
  ...INDEX_100K_OFFICIAL_SHEETS,
  ...INDEX_250K_OFFICIAL_SHEETS,
];
