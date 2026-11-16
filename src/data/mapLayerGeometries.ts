/** Shared basemap tile URLs and core regional vector geometries for 2D Leaflet & 3D Cesium. */

export const TOPO_PRIMARY_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TOPO_ARCGIS_FALLBACK_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
export const DARK_GRAY_FALLBACK_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
export const LIGHT_GRAY_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
export const SATELLITE_PRIMARY_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
export const RBI_BIG_PRIMARY_URL =
  'https://geoservices.big.go.id/rbi/rest/services/BASEMAP/Rupabumi_Indonesia/MapServer/tile/{z}/{y}/{x}';
export const TERRAIN_SHADED_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}';

export const ARCGIS_WORLD_ELEVATION_3D_URL =
  'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer';

export const PROVINCE_DIVIDERS: [number, number][][] = [
  // Sumatera (Aceh – Sumut – Sumbar/Riau – Jambi – Sumsel – Bengkulu/Lampung)
  [[4.3, 96.4], [3.5, 98.1], [2.4, 98.8]],
  [[1.8, 98.8], [0.9, 100.3], [0.2, 101.9]],
  [[-0.9, 101.2], [-1.3, 102.6], [-1.0, 104.2]],
  [[-2.3, 101.6], [-2.7, 103.5], [-2.5, 105.0]],
  [[-4.1, 103.5], [-4.5, 104.8], [-4.1, 105.8]],
  // Jawa (Banten – DKI – Jawa Barat – Jawa Tengah – DIY – Jawa Timur)
  [[-6.05, 106.42], [-6.55, 106.48], [-7.0, 106.42]],
  [[-6.12, 106.68], [-6.25, 107.02]],
  [[-6.78, 108.82], [-7.25, 108.62], [-7.72, 108.78]],
  [[-7.55, 110.12], [-7.82, 110.48], [-8.18, 110.75]],
  [[-6.72, 111.58], [-7.28, 111.15], [-8.18, 111.08]],
  // Kalimantan (Kalbar – Kalteng – Kalsel – Kaltim – Kaltara)
  [[1.3, 113.8], [-0.4, 112.1], [-2.9, 110.8]],
  [[1.4, 114.6], [0.2, 115.4], [-1.8, 115.6], [-3.2, 114.6]],
  [[-1.6, 115.6], [-2.3, 116.4]],
  [[2.5, 115.4], [2.0, 117.7]],
  // Sulawesi (Sulsel – Sulbar – Sulteng – Sultra – Gorontalo – Sulut)
  [[-2.5, 118.9], [-3.2, 119.5], [-2.6, 121.2]],
  [[-2.5, 121.2], [-3.8, 122.4]],
  [[0.4, 121.4], [0.9, 122.2]],
  [[0.5, 123.3], [1.1, 124.2]],
  // Bali – NTB & Papua (Papua Barat / Tengah / Selatan)
  [[-8.3, 115.7], [-8.8, 115.7]],
  [[-1.9, 134.8], [-3.6, 135.2], [-5.2, 136.5]],
];

export interface GeologyZoneFeature {
  name: string;
  formation: string;
  color: string;
  coords: [number, number][];
}

export const GEOLOGY_ZONES: GeologyZoneFeature[] = [
  {
    name: 'Zona Busur Vulkanik Jawa Barat',
    formation: 'Batuan Gunung Api Kuarter (Qvu) & Sedimen Miosen',
    color: '#D5B600',
    coords: [
      [-6.55, 106.45],
      [-6.62, 108.15],
      [-7.35, 108.05],
      [-7.25, 106.45],
    ],
  },
  {
    name: 'Zona Pegunungan Tengah Jawa Timur–DIY',
    formation: 'Kompleks Vulkanik Merapi–Semeru & Batugamping Wonosari',
    color: '#EAB308',
    coords: [
      [-7.25, 109.9],
      [-7.45, 113.2],
      [-8.3, 113.1],
      [-8.1, 109.95],
    ],
  },
  {
    name: 'Lajur Barisan Sumatera',
    formation: 'Granit Kapur & Formasi Paleogen–Neogen',
    color: '#CA8A04',
    coords: [
      [3.5, 97.6],
      [0.4, 99.6],
      [-3.5, 102.0],
      [-4.1, 103.3],
      [2.8, 98.9],
    ],
  },
  {
    name: 'Paparan Sunda & Cekungan Barito Kalimantan',
    formation: 'Endapan Aluvial Kuarter & Formasi Tanjung–Warukin',
    color: '#D5B600',
    coords: [
      [-1.0, 114.4],
      [-1.2, 116.5],
      [-3.4, 116.2],
      [-3.1, 114.2],
    ],
  },
];
