export interface GazetteerPlace {
  name: string;
  region:
    | 'Jawa & Bali'
    | 'Sumatera'
    | 'Kalimantan'
    | 'Sulawesi'
    | 'Nusa Tenggara'
    | 'Maluku'
    | 'Papua';
  lat: number;
  lng: number;
  /** 3 = ibu kota provinsi / kota besar, 2 = kota / kabupaten utama, 1 = kota kecamatan pengisi sel 1:100k */
  priority: 1 | 2 | 3;
}

/**
 * Daftar kota, ibu kota kabupaten, dan simpul wilayah Indonesia untuk melabeli sel indeks NLP/IMW.
 */
export const INDONESIA_GAZETTEER: GazetteerPlace[] = [
  // === JAWA & BALI ===
  { name: 'Jakarta', region: 'Jawa & Bali', lat: -6.175, lng: 106.827, priority: 3 },
  { name: 'Serang', region: 'Jawa & Bali', lat: -6.12, lng: 106.15, priority: 3 },
  { name: 'Cilegon', region: 'Jawa & Bali', lat: -6.002, lng: 106.011, priority: 2 },
  { name: 'Tangerang', region: 'Jawa & Bali', lat: -6.178, lng: 106.63, priority: 2 },
  { name: 'Pandeglang', region: 'Jawa & Bali', lat: -6.308, lng: 106.107, priority: 2 },
  { name: 'Rangkasbitung', region: 'Jawa & Bali', lat: -6.359, lng: 106.25, priority: 2 },
  { name: 'Labuan', region: 'Jawa & Bali', lat: -6.378, lng: 105.83, priority: 1 },
  { name: 'Bayah', region: 'Jawa & Bali', lat: -6.925, lng: 106.261, priority: 1 },
  { name: 'Bekasi', region: 'Jawa & Bali', lat: -6.238, lng: 106.975, priority: 2 },
  { name: 'Bogor', region: 'Jawa & Bali', lat: -6.597, lng: 106.806, priority: 3 },
  { name: 'Sukabumi', region: 'Jawa & Bali', lat: -6.923, lng: 106.929, priority: 2 },
  { name: 'Pelabuhanratu', region: 'Jawa & Bali', lat: -6.987, lng: 106.551, priority: 1 },
  { name: 'Jampang', region: 'Jawa & Bali', lat: -7.262, lng: 106.794, priority: 1 },
  { name: 'Karawang', region: 'Jawa & Bali', lat: -6.306, lng: 107.302, priority: 2 },
  { name: 'Cianjur', region: 'Jawa & Bali', lat: -6.817, lng: 107.143, priority: 2 },
  { name: 'Ciwidey', region: 'Jawa & Bali', lat: -7.099, lng: 107.46, priority: 1 },
  { name: 'Cidaun', region: 'Jawa & Bali', lat: -7.49, lng: 107.35, priority: 1 },
  { name: 'Pamanukan', region: 'Jawa & Bali', lat: -6.283, lng: 107.817, priority: 2 },
  { name: 'Subang', region: 'Jawa & Bali', lat: -6.571, lng: 107.759, priority: 2 },
  { name: 'Bandung', region: 'Jawa & Bali', lat: -6.917, lng: 107.619, priority: 3 },
  { name: 'Garut', region: 'Jawa & Bali', lat: -7.22, lng: 107.901, priority: 2 },
  { name: 'Pameungpeuk', region: 'Jawa & Bali', lat: -7.652, lng: 107.688, priority: 1 },
  { name: 'Indramayu', region: 'Jawa & Bali', lat: -6.327, lng: 108.32, priority: 2 },
  { name: 'Majalengka', region: 'Jawa & Bali', lat: -6.836, lng: 108.227, priority: 2 },
  { name: 'Tasikmalaya', region: 'Jawa & Bali', lat: -7.327, lng: 108.221, priority: 2 },
  { name: 'Cipatujah', region: 'Jawa & Bali', lat: -7.751, lng: 108.015, priority: 1 },
  { name: 'Cirebon', region: 'Jawa & Bali', lat: -6.706, lng: 108.557, priority: 3 },
  { name: 'Banjar', region: 'Jawa & Bali', lat: -7.37, lng: 108.54, priority: 2 },
  { name: 'Pangandaran', region: 'Jawa & Bali', lat: -7.684, lng: 108.65, priority: 2 },
  { name: 'Tegal', region: 'Jawa & Bali', lat: -6.869, lng: 109.14, priority: 2 },
  { name: 'Purwokerto', region: 'Jawa & Bali', lat: -7.424, lng: 109.23, priority: 2 },
  { name: 'Cilacap', region: 'Jawa & Bali', lat: -7.727, lng: 109.008, priority: 2 },
  { name: 'Pekalongan', region: 'Jawa & Bali', lat: -6.889, lng: 109.675, priority: 2 },
  { name: 'Banjarnegara', region: 'Jawa & Bali', lat: -7.397, lng: 109.696, priority: 2 },
  { name: 'Kebumen', region: 'Jawa & Bali', lat: -7.669, lng: 109.652, priority: 2 },
  { name: 'Kendal', region: 'Jawa & Bali', lat: -6.926, lng: 110.204, priority: 2 },
  { name: 'Magelang', region: 'Jawa & Bali', lat: -7.479, lng: 110.217, priority: 2 },
  { name: 'Purworejo', region: 'Jawa & Bali', lat: -7.713, lng: 110.008, priority: 2 },
  { name: 'Semarang', region: 'Jawa & Bali', lat: -6.966, lng: 110.417, priority: 3 },
  { name: 'Salatiga', region: 'Jawa & Bali', lat: -7.33, lng: 110.508, priority: 2 },
  { name: 'Yogyakarta', region: 'Jawa & Bali', lat: -7.796, lng: 110.369, priority: 3 },
  { name: 'Kudus', region: 'Jawa & Bali', lat: -6.805, lng: 110.84, priority: 2 },
  { name: 'Jepara', region: 'Jawa & Bali', lat: -6.588, lng: 110.668, priority: 2 },
  { name: 'Surakarta', region: 'Jawa & Bali', lat: -7.575, lng: 110.824, priority: 3 },
  { name: 'Wonogiri', region: 'Jawa & Bali', lat: -7.814, lng: 110.924, priority: 2 },
  { name: 'Pacitan', region: 'Jawa & Bali', lat: -8.194, lng: 111.104, priority: 2 },
  { name: 'Rembang', region: 'Jawa & Bali', lat: -6.709, lng: 111.341, priority: 2 },
  { name: 'Blora', region: 'Jawa & Bali', lat: -6.97, lng: 111.418, priority: 2 },
  { name: 'Madiun', region: 'Jawa & Bali', lat: -7.629, lng: 111.523, priority: 2 },
  { name: 'Ponorogo', region: 'Jawa & Bali', lat: -7.868, lng: 111.462, priority: 2 },
  { name: 'Tuban', region: 'Jawa & Bali', lat: -6.897, lng: 112.065, priority: 2 },
  { name: 'Bojonegoro', region: 'Jawa & Bali', lat: -7.15, lng: 111.881, priority: 2 },
  { name: 'Kediri', region: 'Jawa & Bali', lat: -7.848, lng: 112.018, priority: 2 },
  { name: 'Tulungagung', region: 'Jawa & Bali', lat: -8.065, lng: 111.902, priority: 2 },
  { name: 'Lamongan', region: 'Jawa & Bali', lat: -7.119, lng: 112.416, priority: 2 },
  { name: 'Mojokerto', region: 'Jawa & Bali', lat: -7.472, lng: 112.434, priority: 2 },
  { name: 'Blitar', region: 'Jawa & Bali', lat: -8.098, lng: 112.168, priority: 2 },
  { name: 'Surabaya', region: 'Jawa & Bali', lat: -7.257, lng: 112.752, priority: 3 },
  { name: 'Bangkalan', region: 'Jawa & Bali', lat: -7.045, lng: 112.735, priority: 2 },
  { name: 'Malang', region: 'Jawa & Bali', lat: -7.979, lng: 112.63, priority: 3 },
  { name: 'Pasuruan', region: 'Jawa & Bali', lat: -7.645, lng: 112.907, priority: 2 },
  { name: 'Pamekasan', region: 'Jawa & Bali', lat: -7.156, lng: 113.474, priority: 2 },
  { name: 'Probolinggo', region: 'Jawa & Bali', lat: -7.754, lng: 113.216, priority: 2 },
  { name: 'Lumajang', region: 'Jawa & Bali', lat: -8.133, lng: 113.224, priority: 2 },
  { name: 'Sumenep', region: 'Jawa & Bali', lat: -7.01, lng: 113.861, priority: 2 },
  { name: 'Situbondo', region: 'Jawa & Bali', lat: -7.706, lng: 114.009, priority: 2 },
  { name: 'Jember', region: 'Jawa & Bali', lat: -8.172, lng: 113.7, priority: 2 },
  { name: 'Banyuwangi', region: 'Jawa & Bali', lat: -8.219, lng: 114.369, priority: 2 },
  { name: 'Singaraja', region: 'Jawa & Bali', lat: -8.112, lng: 115.088, priority: 2 },
  { name: 'Negara', region: 'Jawa & Bali', lat: -8.356, lng: 114.629, priority: 2 },
  { name: 'Denpasar', region: 'Jawa & Bali', lat: -8.65, lng: 115.217, priority: 3 },

  // === SUMATERA ===
  { name: 'Banda Aceh', region: 'Sumatera', lat: 5.548, lng: 95.324, priority: 3 },
  { name: 'Sabang', region: 'Sumatera', lat: 5.893, lng: 95.319, priority: 2 },
  { name: 'Meulaboh', region: 'Sumatera', lat: 4.136, lng: 96.128, priority: 2 },
  { name: 'Lhokseumawe', region: 'Sumatera', lat: 5.18, lng: 97.141, priority: 2 },
  { name: 'Takengon', region: 'Sumatera', lat: 4.624, lng: 96.849, priority: 2 },
  { name: 'Langsa', region: 'Sumatera', lat: 4.468, lng: 97.968, priority: 2 },
  { name: 'Tapaktuan', region: 'Sumatera', lat: 3.259, lng: 97.181, priority: 2 },
  { name: 'Medan', region: 'Sumatera', lat: 3.595, lng: 98.672, priority: 3 },
  { name: 'Pematangsiantar', region: 'Sumatera', lat: 2.959, lng: 99.069, priority: 2 },
  { name: 'Sibolga', region: 'Sumatera', lat: 1.74, lng: 98.779, priority: 2 },
  { name: 'Gunungsitoli', region: 'Sumatera', lat: 1.283, lng: 97.617, priority: 2 },
  { name: 'Padangsidempuan', region: 'Sumatera', lat: 1.377, lng: 99.272, priority: 2 },
  { name: 'Rantauprapat', region: 'Sumatera', lat: 2.1, lng: 99.83, priority: 2 },
  { name: 'Dumai', region: 'Sumatera', lat: 1.667, lng: 101.445, priority: 2 },
  { name: 'Pekanbaru', region: 'Sumatera', lat: 0.507, lng: 101.448, priority: 3 },
  { name: 'Bukittinggi', region: 'Sumatera', lat: -0.305, lng: 100.369, priority: 2 },
  { name: 'Padang', region: 'Sumatera', lat: -0.947, lng: 100.417, priority: 3 },
  { name: 'Solok', region: 'Sumatera', lat: -0.793, lng: 100.654, priority: 2 },
  { name: 'Rengat', region: 'Sumatera', lat: -0.371, lng: 102.548, priority: 2 },
  { name: 'Batam', region: 'Sumatera', lat: 1.046, lng: 104.03, priority: 3 },
  { name: 'Tanjungpinang', region: 'Sumatera', lat: 0.918, lng: 104.458, priority: 2 },
  { name: 'Natuna', region: 'Sumatera', lat: 3.94, lng: 108.38, priority: 2 },
  { name: 'Jambi', region: 'Sumatera', lat: -1.61, lng: 103.613, priority: 3 },
  { name: 'Muarabungo', region: 'Sumatera', lat: -1.495, lng: 102.116, priority: 2 },
  { name: 'Sungaipenuh', region: 'Sumatera', lat: -2.063, lng: 101.391, priority: 2 },
  { name: 'Lubuklinggau', region: 'Sumatera', lat: -3.297, lng: 102.861, priority: 2 },
  { name: 'Bengkulu', region: 'Sumatera', lat: -3.793, lng: 102.261, priority: 3 },
  { name: 'Palembang', region: 'Sumatera', lat: -2.976, lng: 104.775, priority: 3 },
  { name: 'Lahat', region: 'Sumatera', lat: -3.786, lng: 103.542, priority: 2 },
  { name: 'Pangkalpinang', region: 'Sumatera', lat: -2.131, lng: 106.117, priority: 3 },
  { name: 'Tanjungpandan', region: 'Sumatera', lat: -2.741, lng: 107.638, priority: 2 },
  { name: 'Baturaja', region: 'Sumatera', lat: -4.129, lng: 104.167, priority: 2 },
  { name: 'Kotabumi', region: 'Sumatera', lat: -4.826, lng: 104.88, priority: 2 },
  { name: 'Bandar Lampung', region: 'Sumatera', lat: -5.429, lng: 105.261, priority: 3 },

  // === KALIMANTAN ===
  { name: 'Sambas', region: 'Kalimantan', lat: 1.362, lng: 109.305, priority: 2 },
  { name: 'Singkawang', region: 'Kalimantan', lat: 0.909, lng: 108.985, priority: 2 },
  { name: 'Pontianak', region: 'Kalimantan', lat: -0.026, lng: 109.342, priority: 3 },
  { name: 'Sanggau', region: 'Kalimantan', lat: 0.132, lng: 110.588, priority: 2 },
  { name: 'Sintang', region: 'Kalimantan', lat: 0.072, lng: 111.498, priority: 2 },
  { name: 'Putussibau', region: 'Kalimantan', lat: 0.858, lng: 112.927, priority: 2 },
  { name: 'Ketapang', region: 'Kalimantan', lat: -1.853, lng: 109.974, priority: 2 },
  { name: 'Pangkalan Bun', region: 'Kalimantan', lat: -2.683, lng: 111.625, priority: 2 },
  { name: 'Sampit', region: 'Kalimantan', lat: -2.539, lng: 112.953, priority: 2 },
  { name: 'Palangka Raya', region: 'Kalimantan', lat: -2.21, lng: 113.921, priority: 3 },
  { name: 'Muara Teweh', region: 'Kalimantan', lat: -0.955, lng: 114.896, priority: 2 },
  { name: 'Banjarmasin', region: 'Kalimantan', lat: -3.319, lng: 114.59, priority: 3 },
  { name: 'Amuntai', region: 'Kalimantan', lat: -2.417, lng: 115.249, priority: 2 },
  { name: 'Kotabaru', region: 'Kalimantan', lat: -3.237, lng: 116.225, priority: 2 },
  { name: 'Balikpapan', region: 'Kalimantan', lat: -1.238, lng: 116.853, priority: 3 },
  { name: 'Samarinda', region: 'Kalimantan', lat: -0.502, lng: 117.154, priority: 3 },
  { name: 'Bontang', region: 'Kalimantan', lat: 0.132, lng: 117.479, priority: 2 },
  { name: 'Tanjung Redeb', region: 'Kalimantan', lat: 2.154, lng: 117.496, priority: 2 },
  { name: 'Tanjung Selor', region: 'Kalimantan', lat: 2.838, lng: 117.365, priority: 3 },
  { name: 'Tarakan', region: 'Kalimantan', lat: 3.3, lng: 117.633, priority: 2 },
  { name: 'Malinau', region: 'Kalimantan', lat: 3.584, lng: 116.638, priority: 2 },

  // === SULAWESI ===
  { name: 'Manado', region: 'Sulawesi', lat: 1.475, lng: 124.842, priority: 3 },
  { name: 'Tahuna', region: 'Sulawesi', lat: 3.609, lng: 125.495, priority: 2 },
  { name: 'Kotamobagu', region: 'Sulawesi', lat: 0.733, lng: 124.316, priority: 2 },
  { name: 'Gorontalo', region: 'Sulawesi', lat: 0.541, lng: 123.06, priority: 3 },
  { name: 'Tolitoli', region: 'Sulawesi', lat: 1.038, lng: 120.818, priority: 2 },
  { name: 'Palu', region: 'Sulawesi', lat: -0.892, lng: 119.871, priority: 3 },
  { name: 'Poso', region: 'Sulawesi', lat: -1.396, lng: 120.752, priority: 2 },
  { name: 'Luwuk', region: 'Sulawesi', lat: -0.951, lng: 122.787, priority: 2 },
  { name: 'Mamuju', region: 'Sulawesi', lat: -2.677, lng: 118.886, priority: 3 },
  { name: 'Palopo', region: 'Sulawesi', lat: -3.001, lng: 120.198, priority: 2 },
  { name: 'Parepare', region: 'Sulawesi', lat: -4.01, lng: 119.623, priority: 2 },
  { name: 'Makassar', region: 'Sulawesi', lat: -5.148, lng: 119.433, priority: 3 },
  { name: 'Bulukumba', region: 'Sulawesi', lat: -5.556, lng: 120.194, priority: 2 },
  { name: 'Kolaka', region: 'Sulawesi', lat: -4.065, lng: 121.6, priority: 2 },
  { name: 'Kendari', region: 'Sulawesi', lat: -3.998, lng: 122.513, priority: 3 },
  { name: 'Baubau', region: 'Sulawesi', lat: -5.463, lng: 122.615, priority: 2 },

  // === NUSA TENGGARA ===
  { name: 'Mataram', region: 'Nusa Tenggara', lat: -8.583, lng: 116.117, priority: 3 },
  { name: 'Sumbawa Besar', region: 'Nusa Tenggara', lat: -8.493, lng: 117.42, priority: 2 },
  { name: 'Bima', region: 'Nusa Tenggara', lat: -8.46, lng: 118.727, priority: 2 },
  { name: 'Labuan Bajo', region: 'Nusa Tenggara', lat: -8.496, lng: 119.887, priority: 2 },
  { name: 'Ende', region: 'Nusa Tenggara', lat: -8.843, lng: 121.662, priority: 2 },
  { name: 'Maumere', region: 'Nusa Tenggara', lat: -8.619, lng: 122.212, priority: 2 },
  { name: 'Larantuka', region: 'Nusa Tenggara', lat: -8.342, lng: 122.981, priority: 2 },
  { name: 'Waingapu', region: 'Nusa Tenggara', lat: -9.654, lng: 120.264, priority: 2 },
  { name: 'Kupang', region: 'Nusa Tenggara', lat: -10.177, lng: 123.607, priority: 3 },
  { name: 'Atambua', region: 'Nusa Tenggara', lat: -9.106, lng: 124.892, priority: 2 },

  // === MALUKU ===
  { name: 'Morotai', region: 'Maluku', lat: 2.049, lng: 128.299, priority: 2 },
  { name: 'Ternate', region: 'Maluku', lat: 0.789, lng: 127.367, priority: 3 },
  { name: 'Sofifi', region: 'Maluku', lat: 0.737, lng: 127.558, priority: 2 },
  { name: 'Sanana', region: 'Maluku', lat: -2.056, lng: 125.978, priority: 2 },
  { name: 'Namlea', region: 'Maluku', lat: -3.255, lng: 127.097, priority: 2 },
  { name: 'Ambon', region: 'Maluku', lat: -3.695, lng: 128.181, priority: 3 },
  { name: 'Masohi', region: 'Maluku', lat: -3.298, lng: 128.96, priority: 2 },
  { name: 'Bula', region: 'Maluku', lat: -3.112, lng: 130.493, priority: 2 },
  { name: 'Tual', region: 'Maluku', lat: -5.63, lng: 132.75, priority: 2 },
  { name: 'Dobo', region: 'Maluku', lat: -5.764, lng: 134.22, priority: 2 },
  { name: 'Saumlaki', region: 'Maluku', lat: -7.981, lng: 131.304, priority: 2 },

  // === PAPUA ===
  { name: 'Sorong', region: 'Papua', lat: -0.876, lng: 131.255, priority: 3 },
  { name: 'Manokwari', region: 'Papua', lat: -0.861, lng: 134.062, priority: 3 },
  { name: 'Fakfak', region: 'Papua', lat: -2.927, lng: 132.299, priority: 2 },
  { name: 'Kaimana', region: 'Papua', lat: -3.661, lng: 133.764, priority: 2 },
  { name: 'Biak', region: 'Papua', lat: -1.177, lng: 136.082, priority: 2 },
  { name: 'Serui', region: 'Papua', lat: -1.883, lng: 136.24, priority: 2 },
  { name: 'Nabire', region: 'Papua', lat: -3.364, lng: 135.496, priority: 3 },
  { name: 'Timika', region: 'Papua', lat: -4.547, lng: 136.889, priority: 2 },
  { name: 'Wamena', region: 'Papua', lat: -4.098, lng: 138.952, priority: 3 },
  { name: 'Jayapura', region: 'Papua', lat: -2.592, lng: 140.669, priority: 3 },
  { name: 'Merauke', region: 'Papua', lat: -8.499, lng: 140.405, priority: 3 },
];

/**
 * Tentukan nama kota/lokasi yang paling mewakili batas sel grid [south..north, west..east].
 * Memprioritaskan kota/kabupaten yang berada di dalam sel; jika kosong (sel pesisir/kecil), jatuh ke kota terdekat pada gugus pulau yang sama.
 */
export function resolveCellLocationLabel(params: {
  south: number;
  west: number;
  north: number;
  east: number;
  centerLat: number;
  centerLng: number;
  region: string;
}): string {
  const { south, west, north, east, centerLat, centerLng, region } = params;

  const distSq = (p: GazetteerPlace): number => {
    const dLat = p.lat - centerLat;
    const dLng = p.lng - centerLng;
    return dLat * dLat + dLng * dLng;
  };

  let bestInside: GazetteerPlace | null = null;
  let bestInsideDist = Infinity;

  for (const place of INDONESIA_GAZETTEER) {
    if (
      place.lat >= south &&
      place.lat <= north &&
      place.lng >= west &&
      place.lng <= east
    ) {
      const d = distSq(place);
      if (
        !bestInside ||
        place.priority > bestInside.priority ||
        (place.priority === bestInside.priority && d < bestInsideDist)
      ) {
        bestInside = place;
        bestInsideDist = d;
      }
    }
  }

  if (bestInside) {
    return bestInside.name;
  }

  let nearestInRegion: GazetteerPlace | null = null;
  let nearestDist = Infinity;

  for (const place of INDONESIA_GAZETTEER) {
    if (place.region !== region) continue;
    const d = distSq(place);
    if (d < nearestDist) {
      nearestInRegion = place;
      nearestDist = d;
    }
  }

  return nearestInRegion ? nearestInRegion.name : region;
}

