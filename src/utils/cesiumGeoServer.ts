import type * as CesiumType from 'cesium';

/** Check whether WebGL is supported in the current browser context. */
export function isWebGLAvailable(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') || canvas.getContext('webgl'),
    );
  } catch {
    return false;
  }
}

/**
 * Convert a Web Mercator zoom level + latitude into an equivalent Cesium slant range (meters)
 * assuming ~60° vertical FOV so 2D ↔ 3D transitions stay at matching scale.
 */
export function zoomAndLatToCesiumRange(
  lat: number,
  zoom: number,
  viewportHeightPx = 800,
): number {
  const safeHeight = Math.max(viewportHeightPx, 420);
  const clampedZoom = Math.max(3, Math.min(17, zoom));
  const cosLat = Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  const metersPerPixel = (156543.03392 * cosLat) / Math.pow(2, clampedZoom);
  const verticalSpanMeters = safeHeight * metersPerPixel;
  // 2 * tan(30deg) = 1.154700538
  return Math.max(800, verticalSpanMeters / 1.154700538);
}

/** Convert Cesium camera slant range back to equivalent Web Mercator zoom level. */
export function cesiumRangeAndLatToZoom(
  lat: number,
  rangeMeters: number,
  viewportHeightPx = 800,
): number {
  const safeHeight = Math.max(viewportHeightPx, 420);
  const cosLat = Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  const verticalSpanMeters = Math.max(800, rangeMeters) * 1.154700538;
  const metersPerPixel = verticalSpanMeters / safeHeight;
  const rawZoom = Math.log2((156543.03392 * cosLat) / metersPerPixel);
  return Math.max(4, Math.min(16, Number(rawZoom.toFixed(2))));
}

export interface GeoServerWmsLayerConfig {
  url: string;
  layers: string;
  opacity?: number;
  cqlFilter?: string;
}

/**
 * Attach a GeoServer WMS layer (e.g. rasterized SHP geologi / patahan / tata ruang)
 * onto Cesium's globe imagery stack so it drapes natively over 3D terrain.
 */
export function addGeoServerWmsImageryLayer(
  Cesium: typeof CesiumType,
  viewer: CesiumType.Viewer,
  config: GeoServerWmsLayerConfig,
): CesiumType.ImageryLayer {
  const parameters: Record<string, string> = {
    service: 'WMS',
    format: 'image/png',
    transparent: 'true',
  };
  if (config.cqlFilter) {
    parameters.CQL_FILTER = config.cqlFilter;
  }

  const provider = new Cesium.WebMapServiceImageryProvider({
    url: config.url,
    layers: config.layers,
    parameters,
  });

  const layer = viewer.imageryLayers.addImageryProvider(provider);
  layer.alpha = config.opacity ?? 0.85;
  return layer;
}

/**
 * Load an OGC 3D Tileset (LiDAR point clouds, subsurface fault planes, or borehole models)
 * into a Cesium scene.
 */
export async function addCesium3DTileset(
  Cesium: typeof CesiumType,
  viewer: CesiumType.Viewer,
  tilesetUrl: string,
): Promise<CesiumType.Cesium3DTileset> {
  const tileset = await Cesium.Cesium3DTileset.fromUrl(tilesetUrl);
  viewer.scene.primitives.add(tileset);
  return tileset;
}
