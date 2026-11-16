import React, { Suspense, lazy, useEffect, useMemo, useRef } from 'react';
import type L from 'leaflet';
import { useGeoMap } from '../../context/GeoMapContext';
import { MAP_LAYERS } from '../../data/geomapData';
import { computeCartographicScaleBar } from '../../utils/indonesiaNlpGrid';
import { LayerManagerPanel } from '../layer-manager';
import type { CesiumCanvasActions } from './CesiumMapCanvas';
import { LeafletMapCanvas } from './LeafletMapCanvas';
import { MapFeatureInspector } from './MapFeatureInspector';
import { MapHudOverlay } from './MapHudOverlay';
import { MapRightHudFooter } from './MapRightHudFooter';
import { MobileLayerSheet } from './MobileLayerSheet';

const LazyCesiumMapCanvas = lazy(() =>
  import('./CesiumMapCanvas').then((m) => ({ default: m.CesiumMapCanvas })),
);

export const InteractiveMapWorkspace: React.FC = () => {
  const {
    mapLayers,
    mapStats,
    mapDimension,
    mapPitchDeg,
    mapPopup,
    mapPopupDocked,
  } = useGeoMap();
  const mapInstanceRef = useRef<L.Map | null>(null);
  const cesiumActionsRef = useRef<CesiumCanvasActions | null>(null);
  const prevDimensionRef = useRef(mapDimension);
  const latestStatsRef = useRef(mapStats);
  latestStatsRef.current = mapStats;

  useEffect(() => {
    if (prevDimensionRef.current === '3d' && mapDimension === '2d') {
      const stats = latestStatsRef.current;
      try {
        mapInstanceRef.current?.setView(
          [stats.lat, stats.lng],
          Math.max(4, Math.min(14, Math.round(stats.zoom))),
          { animate: false },
        );
      } catch {
        // Safe fallback in headless mocks
      }
    }
    prevDimensionRef.current = mapDimension;
  }, [mapDimension]);

  const activeLayerObjs = useMemo(
    () => MAP_LAYERS.filter((layer) => mapLayers[layer.key]),
    [mapLayers],
  );

  const scaleBar = useMemo(
    () => computeCartographicScaleBar(mapStats.lat, mapStats.zoom),
    [mapStats.lat, mapStats.zoom],
  );

  const handleZoomIn = () => {
    if (mapDimension === '3d') {
      cesiumActionsRef.current?.zoomIn();
      return;
    }
    try {
      mapInstanceRef.current?.zoomIn();
    } catch {
      // Safe fallback in headless mocks
    }
  };

  const handleZoomOut = () => {
    if (mapDimension === '3d') {
      cesiumActionsRef.current?.zoomOut();
      return;
    }
    try {
      mapInstanceRef.current?.zoomOut();
    } catch {
      // Safe fallback in headless mocks
    }
  };

  return (
    <section
      aria-label="Eksplorasi Peta Interaktif Indonesia"
      className="map-hud-zone relative isolate z-0 h-[calc(100dvh-96px)] md:h-[calc(100dvh-58px)] min-h-[420px] w-full overflow-hidden"
    >
      {/* Underlying Real Leaflet Canvas (tetap siap saat kembali ke 2D) */}
      <div
        className={
          mapDimension === '3d'
            ? 'pointer-events-none invisible absolute inset-0 z-0'
            : 'absolute inset-0 z-0'
        }
      >
        <LeafletMapCanvas mapRefOut={mapInstanceRef} />
      </div>

      {/* Lazy-Loaded CesiumJS 3D Terrain & Subsurface Globe */}
      {mapDimension === '3d' && (
        <div className="absolute inset-0 z-0">
          <Suspense fallback={null}>
            <LazyCesiumMapCanvas actionsRef={cesiumActionsRef} />
          </Suspense>
        </div>
      )}

      {/* Floating Search + Filter Skala + Left Zoom Controls + Right Manajer Layer HUD */}
      <MapHudOverlay onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />

      {/* Feature Inspector Modal/HUD (centered on canvas like Prototipe v3, auto-docks to bottom-left while maneuvering) */}
      {mapPopup && !mapPopupDocked && (
        <div className="pointer-events-none fixed sm:absolute bottom-24 left-3 right-3 z-30 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2">
          <MapFeatureInspector variant="center" />
        </div>
      )}

      {/* RIGHT HUD COLUMN: Manajer Layer + Telemetri + Legenda + Atribusi (Responsif Anti-Tumpang Tindih) */}
      <div className="pointer-events-none absolute top-3 right-3 bottom-3 z-20 flex flex-col items-end justify-end gap-2 md:justify-between">
        <LayerManagerPanel />
        <MapRightHudFooter
          lat={mapStats.lat}
          lng={mapStats.lng}
          scaleLabel={mapStats.scaleLabel}
          scaleBar={scaleBar}
          activeLayerObjs={activeLayerObjs}
          mapDimension={mapDimension}
          mapPitchDeg={mapPitchDeg}
        />
      </div>

      {/* Mobile Vaul 3-Detent Bottom Sheet */}
      <MobileLayerSheet />
    </section>
  );
};

