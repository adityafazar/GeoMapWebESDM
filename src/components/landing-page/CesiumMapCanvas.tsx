import React, { useEffect, useRef, useState } from 'react';
import type * as CesiumType from 'cesium';
import { Compass, Layers, Mountain, Eye } from 'lucide-react';
import { useGeoMap, type MapInspectorPopup } from '../../context/GeoMapContext';
import {
  ACTIVE_FAULTS,
  GROUNDWATER_BASINS,
  HIGHLIGHT_MAP_SCALES,
  INDONESIA_ISLANDS,
  SEDIMENT_BASINS,
  VOLCANOES,
  type BasemapId,
  type MapScaleValue,
  type QuadrangleFeature,
} from '../../data/geomapData';
import {
  ARCGIS_WORLD_ELEVATION_3D_URL,
  GEOLOGY_ZONES,
  LIGHT_GRAY_URL,
  DARK_GRAY_FALLBACK_URL,
  PROVINCE_DIVIDERS,
  RBI_BIG_PRIMARY_URL,
  SATELLITE_PRIMARY_URL,
  TERRAIN_SHADED_URL,
  TOPO_ARCGIS_FALLBACK_URL,
  TOPO_PRIMARY_URL,
} from '../../data/mapLayerGeometries';
import {
  SCALE_GRID_SPECS,
  computeRealScaleRatioLabel,
  generateNlpCellsInViewport,
  generateRegionalIndexCells,
} from '../../utils/indonesiaNlpGrid';
import {
  cesiumRangeAndLatToZoom,
  isWebGLAvailable,
  zoomAndLatToCesiumRange,
} from '../../utils/cesiumGeoServer';

export interface CesiumCanvasActions {
  zoomIn: () => void;
  zoomOut: () => void;
  resetNorth: () => void;
}

interface CesiumMapCanvasProps {
  actionsRef?: React.MutableRefObject<CesiumCanvasActions | null>;
}

/** Convert GeoMap `[lat, lng][]` coordinates into Cesium flat `[lng, lat, ...]` degree array. */
function toCesiumDegrees(coords: [number, number][], closeLoop = false): number[] {
  const flat: number[] = [];
  for (const [lat, lng] of coords) {
    flat.push(lng, lat);
  }
  if (closeLoop && coords.length > 0) {
    flat.push(coords[0][1], coords[0][0]);
  }
  return flat;
}

function buildVolcanoIconUri(color: string, isAlert: boolean): string {
  const pulseRing = isAlert
    ? `<circle cx="14" cy="14" r="12" fill="${color}" fill-opacity="0.32"/>`
    : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">${pulseRing}<polygon points="14,4 24,22 4,22" fill="${color}" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function resolveBasemapUrl(basemap: BasemapId, darkMode: boolean): string {
  if (basemap === 'sat') return SATELLITE_PRIMARY_URL;
  if (basemap === 'rbi') return RBI_BIG_PRIMARY_URL;
  if (basemap === 'terrain') return TERRAIN_SHADED_URL;
  if (basemap === 'minimal') return darkMode ? DARK_GRAY_FALLBACK_URL : LIGHT_GRAY_URL;
  return TOPO_PRIMARY_URL;
}

function getCameraGroundTarget(
  Cesium: typeof CesiumType,
  viewer: CesiumType.Viewer,
): { lat: number; lng: number; range: number; headingDeg: number } {
  const canvas = viewer.scene.canvas;
  const centerPx = new Cesium.Cartesian2(
    canvas.clientWidth / 2,
    canvas.clientHeight / 2,
  );
  const ray = viewer.camera.getPickRay(centerPx);
  const hit = ray ? viewer.scene.globe.pick(ray, viewer.scene) : undefined;
  const headingDeg = Cesium.Math.toDegrees(viewer.camera.heading);

  if (hit) {
    const carto = Cesium.Cartographic.fromCartesian(hit);
    const range = Cesium.Cartesian3.distance(viewer.camera.positionWC, hit);
    return {
      lat: Cesium.Math.toDegrees(carto.latitude),
      lng: Cesium.Math.toDegrees(carto.longitude),
      range: Math.max(800, range),
      headingDeg,
    };
  }

  const camCarto = viewer.camera.positionCartographic;
  return {
    lat: Cesium.Math.toDegrees(camCarto.latitude),
    lng: Cesium.Math.toDegrees(camCarto.longitude),
    range: Math.max(1200, camCarto.height),
    headingDeg,
  };
}

export const CesiumMapCanvas: React.FC<CesiumMapCanvasProps> = ({
  actionsRef,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<CesiumType.Viewer | null>(null);
  const cesiumModRef = useRef<typeof CesiumType | null>(null);
  const entityPopupMapRef = useRef<Map<string, MapInspectorPopup>>(new Map());
  const quadLookupRef = useRef<Map<string, QuadrangleFeature>>(new Map());
  const baseImageryLayerRef = useRef<CesiumType.ImageryLayer | null>(null);
  const lastSeqRef = useRef<number>(0);

  const [status, setStatus] = useState<'loading' | 'ready' | 'unsupported'>(() =>
    isWebGLAvailable() ? 'loading' : 'unsupported',
  );
  const [renderErrorMsg, setRenderErrorMsg] = useState<string | null>(null);
  const [terrainSourceLabel, setTerrainSourceLabel] = useState<string>('DEM 3D');
  const [exaggeration, setExaggeration] = useState<number>(1.6);
  const [subsurfaceMode, setSubsurfaceMode] = useState<boolean>(false);

  const {
    basemap,
    darkMode,
    mapLayers,
    layerOpacity,
    mapScaleFilter,
    regionalIndexFilter,
    regionalRegionFilter,
    mapFocusTarget,
    mapStats,
    mapPitchDeg,
    setMapStats,
    setNlpGridStats,
    setMapPopup,
    dockMapPopupForManeuver,
    focusQuadrangle,
  } = useGeoMap();

  const initialCameraRef = useRef({
    lat: mapStats.lat,
    lng: mapStats.lng,
    zoom: mapStats.zoom,
    pitchDeg: mapPitchDeg,
  });

  const callbacksRef = useRef({
    setMapStats,
    setNlpGridStats,
    setMapPopup,
    dockMapPopupForManeuver,
    focusQuadrangle,
  });
  callbacksRef.current = {
    setMapStats,
    setNlpGridStats,
    setMapPopup,
    dockMapPopupForManeuver,
    focusQuadrangle,
  };

  // Mount CesiumJS Viewer once when entering 3D mode
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isWebGLAvailable()) {
      setStatus('unsupported');
      return;
    }

    let cancelled = false;
    let handler: CesiumType.ScreenSpaceEventHandler | null = null;
    let removeCameraListener: (() => void) | null = null;

    const init = async () => {
      try {
        if (typeof window !== 'undefined') {
          (window as { CESIUM_BASE_URL?: string }).CESIUM_BASE_URL =
            '/cesiumStatic';
        }
        if (
          typeof document !== 'undefined' &&
          !document.querySelector('link[data-cesium-widgets="true"]')
        ) {
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = '/cesiumStatic/Widgets/widgets.css';
          cssLink.dataset.cesiumWidgets = 'true';
          document.head.appendChild(cssLink);
        }
        const Cesium = await import('cesium');
        if (cancelled || !containerRef.current) return;

        cesiumModRef.current = Cesium;

        const viewer = new Cesium.Viewer(containerRef.current, {
          animation: false,
          baseLayerPicker: false,
          fullscreenButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          navigationHelpButton: false,
          baseLayer: false,
          terrainProvider: new Cesium.EllipsoidTerrainProvider(),
          requestRenderMode: false,
          showRenderLoopErrors: false,
        });

        viewer.scene.renderError.addEventListener(
          (_scene: unknown, err: unknown) => {
            if (!cancelled) {
              setRenderErrorMsg(
                err instanceof Error ? err.message : String(err),
              );
            }
          },
        );

        // Hide default Cesium credit container visually (ESDM portal shows official attribution in HUD)
        const creditEl = viewer.cesiumWidget.creditContainer as HTMLElement | null;
        if (creditEl) {
          creditEl.style.display = 'none';
        }

        viewer.scene.globe.depthTestAgainstTerrain = true;
        viewer.scene.verticalExaggeration = 1.6;
        viewer.scene.globe.enableLighting = false;
        if (viewer.scene.skyAtmosphere) {
          viewer.scene.skyAtmosphere.show = true;
        }

        // Position camera smoothly at current Leaflet viewport center & zoom
        const { lat, lng, zoom, pitchDeg } = initialCameraRef.current;
        const range = zoomAndLatToCesiumRange(lat, zoom, el.clientHeight);
        const target = Cesium.Cartesian3.fromDegrees(lng, lat, 0);
        viewer.camera.lookAt(
          target,
          new Cesium.HeadingPitchRange(
            0,
            Cesium.Math.toRadians(-(90 - pitchDeg)),
            range,
          ),
        );
        viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

        viewerRef.current = viewer;
        setStatus('ready');

        // Load public Esri World Elevation 3D DEM asynchronously (no Ion token needed)
        Cesium.ArcGISTiledElevationTerrainProvider.fromUrl(
          ARCGIS_WORLD_ELEVATION_3D_URL,
        )
          .then((terrainProvider) => {
            if (cancelled || viewer.isDestroyed()) return;
            viewer.terrainProvider = terrainProvider;
            setTerrainSourceLabel('World DEM 3D');
          })
          .catch(() => {
            if (!cancelled) {
              setTerrainSourceLabel('Elipsoid 3D');
            }
          });

        // Emit telemetry on camera movement
        const emitStats = () => {
          if (viewer.isDestroyed()) return;
          const ground = getCameraGroundTarget(Cesium, viewer);
          const nextZoom = cesiumRangeAndLatToZoom(
            ground.lat,
            ground.range,
            el.clientHeight,
          );
          callbacksRef.current.setMapStats({
            lat: Number(ground.lat.toFixed(3)),
            lng: Number(ground.lng.toFixed(3)),
            zoom: Math.round(nextZoom),
            scaleLabel: computeRealScaleRatioLabel(ground.lat, nextZoom),
          });
        };

        removeCameraListener = viewer.camera.changed.addEventListener(emitStats);

        // Pick clicked GeoMap 3D entities & open MapFeatureInspector
        handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction(
          (movement: { position: CesiumType.Cartesian2 }) => {
            const picked = viewer.scene.pick(movement.position) as
              | { id?: CesiumType.Entity }
              | undefined;
            const entityId = picked?.id?.id;
            if (!entityId) return;

            const quad = quadLookupRef.current.get(entityId);
            if (quad) {
              callbacksRef.current.focusQuadrangle(quad, {
                preserveCurrentZoomIfVisible: true,
                maxPreserveCellPx: 420,
              });
              return;
            }

            const popup = entityPopupMapRef.current.get(entityId);
            if (popup) {
              callbacksRef.current.setMapPopup(popup);
            }
          },
          Cesium.ScreenSpaceEventType.LEFT_CLICK,
        );

        handler.setInputAction(() => {
          callbacksRef.current.dockMapPopupForManeuver();
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        if (actionsRef) {
          actionsRef.current = {
            zoomIn: () => {
              if (viewer.isDestroyed()) return;
              const ground = getCameraGroundTarget(Cesium, viewer);
              const nextRange = Math.max(850, ground.range * 0.58);
              const centerPt = Cesium.Cartesian3.fromDegrees(
                ground.lng,
                ground.lat,
                0,
              );
              viewer.camera.flyToBoundingSphere(
                new Cesium.BoundingSphere(centerPt, nextRange * 0.45),
                {
                  offset: new Cesium.HeadingPitchRange(
                    viewer.camera.heading,
                    viewer.camera.pitch,
                    nextRange,
                  ),
                  duration: 0.45,
                },
              );
            },
            zoomOut: () => {
              if (viewer.isDestroyed()) return;
              const ground = getCameraGroundTarget(Cesium, viewer);
              const nextRange = Math.min(8_500_000, ground.range * 1.65);
              const centerPt = Cesium.Cartesian3.fromDegrees(
                ground.lng,
                ground.lat,
                0,
              );
              viewer.camera.flyToBoundingSphere(
                new Cesium.BoundingSphere(centerPt, nextRange * 0.45),
                {
                  offset: new Cesium.HeadingPitchRange(
                    viewer.camera.heading,
                    viewer.camera.pitch,
                    nextRange,
                  ),
                  duration: 0.45,
                },
              );
            },
            resetNorth: () => {
              if (viewer.isDestroyed()) return;
              const ground = getCameraGroundTarget(Cesium, viewer);
              const centerPt = Cesium.Cartesian3.fromDegrees(
                ground.lng,
                ground.lat,
                0,
              );
              viewer.camera.flyToBoundingSphere(
                new Cesium.BoundingSphere(centerPt, ground.range * 0.45),
                {
                  offset: new Cesium.HeadingPitchRange(
                    0,
                    viewer.camera.pitch,
                    ground.range,
                  ),
                  duration: 0.45,
                },
              );
            },
          };
        }
      } catch {
        if (!cancelled) {
          setStatus('unsupported');
        }
      }
    };

    void init();

    return () => {
      cancelled = true;
      if (actionsRef) actionsRef.current = null;
      if (removeCameraListener) removeCameraListener();
      if (handler && !handler.isDestroyed()) handler.destroy();
      const v = viewerRef.current;
      if (v && !v.isDestroyed()) {
        v.destroy();
      }
      viewerRef.current = null;
      cesiumModRef.current = null;
      baseImageryLayerRef.current = null;
    };
  }, [actionsRef]);

  // Sync Basemap Imagery Layer
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumModRef.current;
    if (!viewer || !Cesium || viewer.isDestroyed() || status !== 'ready') return;

    if (baseImageryLayerRef.current) {
      viewer.imageryLayers.remove(baseImageryLayerRef.current, true);
      baseImageryLayerRef.current = null;
    }

    const url = resolveBasemapUrl(basemap, darkMode);
    let provider: CesiumType.UrlTemplateImageryProvider;
    try {
      provider = new Cesium.UrlTemplateImageryProvider({
        url,
        maximumLevel: 18,
      });
    } catch {
      provider = new Cesium.UrlTemplateImageryProvider({
        url: TOPO_ARCGIS_FALLBACK_URL,
        maximumLevel: 18,
      });
    }

    const layer = viewer.imageryLayers.addImageryProvider(provider, 0);
    if (darkMode && basemap !== 'sat' && basemap !== 'minimal') {
      layer.brightness = 0.72;
      layer.contrast = 1.15;
    }
    baseImageryLayerRef.current = layer;
  }, [basemap, darkMode, status]);

  // Sync Pitch Slider (25°–75° tilt from nadir) smoothly around current target point
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumModRef.current;
    if (!viewer || !Cesium || viewer.isDestroyed() || status !== 'ready') return;

    const ground = getCameraGroundTarget(Cesium, viewer);
    const target = Cesium.Cartesian3.fromDegrees(ground.lng, ground.lat, 0);
    const desiredPitchRad = Cesium.Math.toRadians(-(90 - mapPitchDeg));
    if (Math.abs(viewer.camera.pitch - desiredPitchRad) < 0.015) return;

    viewer.camera.lookAt(
      target,
      new Cesium.HeadingPitchRange(
        viewer.camera.heading,
        desiredPitchRad,
        ground.range,
      ),
    );
    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  }, [mapPitchDeg, status]);

  // Sync Vertical Exaggeration & Subsurface Globe Translucency
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumModRef.current;
    if (!viewer || !Cesium || viewer.isDestroyed() || status !== 'ready') return;

    viewer.scene.verticalExaggeration = exaggeration;
    viewer.scene.globe.translucency.enabled = subsurfaceMode;
    viewer.scene.globe.translucency.frontFaceAlpha = subsurfaceMode ? 0.56 : 1.0;
    if (subsurfaceMode) {
      viewer.scene.globe.translucency.frontFaceAlphaByDistance =
        new Cesium.NearFarScalar(1500, 0.42, 4_000_000, 0.82);
    }
    viewer.scene.screenSpaceCameraController.enableCollisionDetection =
      !subsurfaceMode;
  }, [exaggeration, status, subsurfaceMode]);

  // Sync Search / Reset Nusantara / Volcano / Quadrangle FlyTo
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumModRef.current;
    if (
      !viewer ||
      !Cesium ||
      viewer.isDestroyed() ||
      status !== 'ready' ||
      mapFocusTarget.seq === 0 ||
      mapFocusTarget.seq === lastSeqRef.current
    ) {
      return;
    }
    lastSeqRef.current = mapFocusTarget.seq;

    const ground = getCameraGroundTarget(Cesium, viewer);
    const targetLat = mapFocusTarget.preserveCurrentCenter
      ? ground.lat
      : mapFocusTarget.lat;
    const targetLng = mapFocusTarget.preserveCurrentCenter
      ? ground.lng
      : mapFocusTarget.lng;
    const range = zoomAndLatToCesiumRange(
      targetLat,
      mapFocusTarget.zoom,
      containerRef.current?.clientHeight ?? 800,
    );
    const dest = Cesium.Cartesian3.fromDegrees(targetLng, targetLat, 0);

    viewer.camera.flyToBoundingSphere(
      new Cesium.BoundingSphere(dest, range * 0.42),
      {
        offset: new Cesium.HeadingPitchRange(
          viewer.camera.heading,
          Cesium.Math.toRadians(-(90 - mapPitchDeg)),
          range,
        ),
        duration: 0.75,
      },
    );
  }, [mapFocusTarget, mapPitchDeg, status]);

  // Sync GeoMap Thematic Layers & Subsurface Demo Volumes onto Cesium 3D Entities
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumModRef.current;
    if (!viewer || !Cesium || viewer.isDestroyed() || status !== 'ready') return;

    viewer.entities.removeAll();
    entityPopupMapRef.current.clear();
    quadLookupRef.current.clear();

    // 1. Batas Provinsi & Kepulauan (Clamped to Terrain)
    if (mapLayers.province) {
      const op = layerOpacity.province / 100;
      const strokeCss =
        basemap === 'sat' || darkMode ? '#93C5FD' : '#233C5A';
      const lineColor = Cesium.Color.fromCssColorString(strokeCss).withAlpha(
        0.85 * op,
      );

      for (const divider of PROVINCE_DIVIDERS) {
        viewer.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(
              toCesiumDegrees(divider),
            ),
            width: 2,
            clampToGround: true,
            material: new Cesium.PolylineDashMaterialProperty({
              color: lineColor,
              dashLength: 14,
            }),
          },
        });
      }

      for (const island of INDONESIA_ISLANDS) {
        viewer.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(
              toCesiumDegrees(island, true),
            ),
            width: 1.2,
            clampToGround: true,
            material: Cesium.Color.fromCssColorString(strokeCss).withAlpha(
              0.38 * op,
            ),
          },
        });
      }
    }

    // 2. Peta Geologi Indonesia (Draped over 3D Terrain)
    if (mapLayers.geology) {
      const op = layerOpacity.geology / 100;
      for (const zone of GEOLOGY_ZONES) {
        const entity = viewer.entities.add({
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(
              toCesiumDegrees(zone.coords),
            ),
            material: Cesium.Color.fromCssColorString(zone.color).withAlpha(
              0.42 * op,
            ),
            classificationType: Cesium.ClassificationType.TERRAIN,
          },
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(
              toCesiumDegrees(zone.coords, true),
            ),
            width: 2,
            clampToGround: true,
            material: Cesium.Color.fromCssColorString('#A16207').withAlpha(
              0.88 * op,
            ),
          },
        });
        entityPopupMapRef.current.set(entity.id, {
          kind: 'basin',
          title: zone.name,
          subtitle: 'Satuan Geologi & Litologi Regional',
          detail: zone.formation,
          slug: 'peta-geologi-indonesia',
        });
      }
    }

    // 3. Cekungan Sedimen Indonesia (Emerald #00B473, Draped)
    if (mapLayers.basin) {
      const op = layerOpacity.basin / 100;
      for (const b of SEDIMENT_BASINS) {
        const entity = viewer.entities.add({
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(
              toCesiumDegrees(b.polygon),
            ),
            material: Cesium.Color.fromCssColorString('#00B473').withAlpha(
              0.36 * op,
            ),
            classificationType: Cesium.ClassificationType.TERRAIN,
          },
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(
              toCesiumDegrees(b.polygon, true),
            ),
            width: 2.2,
            clampToGround: true,
            material: Cesium.Color.fromCssColorString('#047857').withAlpha(
              0.9 * op,
            ),
          },
        });
        entityPopupMapRef.current.set(entity.id, {
          kind: 'basin',
          title: b.name,
          subtitle: `Status: ${b.status}`,
          detail: `Ketebalan sedimen estimasi ${b.thickness}`,
          slug: 'peta-cekungan-sedimen-indonesia',
        });
      }
    }

    // 4. Cekungan Air Tanah (Azure #0284C7, Draped)
    if (mapLayers.groundwater) {
      const op = layerOpacity.groundwater / 100;
      for (const cat of GROUNDWATER_BASINS) {
        const entity = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(cat.center[1], cat.center[0]),
          ellipse: {
            semiMajorAxis: cat.radiusKm * 1000,
            semiMinorAxis: cat.radiusKm * 1000,
            material: Cesium.Color.fromCssColorString('#38BDF8').withAlpha(
              0.34 * op,
            ),
            classificationType: Cesium.ClassificationType.TERRAIN,
          },
        });
        entityPopupMapRef.current.set(entity.id, {
          kind: 'groundwater',
          title: cat.name,
          subtitle: 'Cekungan Air Tanah (CAT)',
          detail: cat.potential,
          slug: 'peta-hidrogeologi-lembar-jakarta-bekasi',
        });
      }
    }

    // 5. Patahan Aktif / Sesar (#DC2626, Clamped to Terrain)
    if (mapLayers.fault) {
      const op = layerOpacity.fault / 100;
      for (const fault of ACTIVE_FAULTS) {
        const entity = viewer.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(
              toCesiumDegrees(fault.coords),
            ),
            width: 4,
            clampToGround: true,
            material: new Cesium.PolylineDashMaterialProperty({
              color: Cesium.Color.fromCssColorString('#DC2626').withAlpha(
                0.95 * op,
              ),
              dashLength: 16,
            }),
          },
        });
        entityPopupMapRef.current.set(entity.id, {
          kind: 'fault',
          item: fault,
        });
      }
    }

    // 6. Sebaran Gunung Api PVMBG (Clamped to Terrain)
    if (mapLayers.volcano) {
      const op = layerOpacity.volcano / 100;
      for (const v of VOLCANOES) {
        const isAlert = v.level.includes('Siaga') || v.level.includes('Awas');
        const entity = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(v.lng, v.lat),
          billboard: {
            image: buildVolcanoIconUri(v.color, isAlert),
            width: 26,
            height: 26,
            color: Cesium.Color.WHITE.withAlpha(op),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: v.name,
            font: '700 11px Poppins, sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, 18),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
              0,
              2_200_000,
            ),
          },
        });
        entityPopupMapRef.current.set(entity.id, {
          kind: 'volcano',
          item: v,
        });
      }
    }

    // 7. Indeks Lembar Peta / Indeks Regional (Clamped to Terrain)
    if (mapLayers.grid) {
      const op = layerOpacity.grid / 100;
      const isRegionalMode = regionalIndexFilter !== null;

      if (isRegionalMode) {
        const regResult = generateRegionalIndexCells({
          mode: regionalIndexFilter,
          regionFilter: regionalRegionFilter,
        });
        callbacksRef.current.setNlpGridStats({
          requestedScale: regResult.renderedScale,
          renderedScale: regResult.renderedScale,
          isParentFallback: false,
          isRegional: true,
          visibleCount: regResult.cells.length,
          visibleCells: regResult.cells,
        });
        for (const quad of regResult.cells) {
          const strokeHex =
            quad.scale === '1:100.000' ? '#D97706' : '#0284C7';
          const [[s, w], [n, e]] = quad.bounds;
          const entity = viewer.entities.add({
            rectangle: {
              coordinates: Cesium.Rectangle.fromDegrees(w, s, e, n),
              material: Cesium.Color.fromCssColorString(strokeHex).withAlpha(
                0.16 * op,
              ),
              classificationType: Cesium.ClassificationType.TERRAIN,
            },
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArray([
                w, s, e, s, e, n, w, n, w, s,
              ]),
              width: 1.6,
              clampToGround: true,
              material: Cesium.Color.fromCssColorString(strokeHex).withAlpha(
                0.85 * op,
              ),
            },
          });
          quadLookupRef.current.set(entity.id, quad);
        }
      } else {
        const activeScale: MapScaleValue =
          mapScaleFilter && mapScaleFilter in SCALE_GRID_SPECS
            ? mapScaleFilter
            : '1:250.000';
        const scaleMeta = HIGHLIGHT_MAP_SCALES.find(
          (m) => m.value === activeScale,
        );
        const strokeColor = scaleMeta?.strokeColor ?? '#0284C7';
        const fillColor = scaleMeta?.fillColor ?? '#38BDF8';
        const ground = getCameraGroundTarget(Cesium, viewer);
        const eqZoom = cesiumRangeAndLatToZoom(
          ground.lat,
          ground.range,
          containerRef.current?.clientHeight ?? 800,
        );
        const halfLatSpan = Math.max(
          0.45,
          Math.min(9.5, 11 / Math.pow(1.48, Math.max(0, eqZoom - 5))),
        );
        const halfLngSpan = halfLatSpan * 1.45;
        const generated = generateNlpCellsInViewport({
          scale: activeScale,
          viewportBounds: {
            south: Math.max(-11.5, ground.lat - halfLatSpan),
            north: Math.min(6.5, ground.lat + halfLatSpan),
            west: Math.max(94.5, ground.lng - halfLngSpan),
            east: Math.min(141.5, ground.lng + halfLngSpan),
          },
          maxCells: 64,
        });
        callbacksRef.current.setNlpGridStats({
          requestedScale: activeScale,
          renderedScale: generated.renderedScale,
          isParentFallback: generated.isParentFallback,
          visibleCount: generated.cells.length,
          visibleCells: generated.cells,
        });

        for (const quad of generated.cells) {
          const [[s, w], [n, e]] = quad.bounds;
          const entity = viewer.entities.add({
            rectangle: {
              coordinates: Cesium.Rectangle.fromDegrees(w, s, e, n),
              material: Cesium.Color.fromCssColorString(fillColor).withAlpha(
                0.14 * op,
              ),
              classificationType: Cesium.ClassificationType.TERRAIN,
            },
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArray([
                w, s, e, s, e, n, w, n, w, s,
              ]),
              width: 1.4,
              clampToGround: true,
              material: Cesium.Color.fromCssColorString(strokeColor).withAlpha(
                0.78 * op,
              ),
            },
          });
          quadLookupRef.current.set(entity.id, quad);
        }
      }
    } else {
      callbacksRef.current.setNlpGridStats(null);
    }

    // 8. Volume Subsurface Ilustratif (Muncul saat mode Transparan Subsurface aktif)
    if (subsurfaceMode) {
      const merapiChamber = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(110.446, -7.54, -4500),
        ellipsoid: {
          radii: new Cesium.Cartesian3(4200, 4200, 2600),
          material: Cesium.Color.fromCssColorString('#EF4444').withAlpha(0.68),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#FFF500'),
        },
        label: {
          text: 'Dapur Magma Merapi (−4.5 km)',
          font: '700 11px Poppins, sans-serif',
          fillColor: Cesium.Color.fromCssColorString('#FFF500'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -16),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      entityPopupMapRef.current.set(merapiChamber.id, {
        kind: 'basin',
        title: 'Penampang Subsurface G. Merapi',
        subtitle: 'Simulasi Zona Magmatik Bawah Permukaan (−4,5 km)',
        detail:
          'Contoh volume 3D bawah permukaan pada mode Transparan Subsurface CesiumJS (siap dihubungkan ke 3D Tiles / data sumur & geofisika ESDM).',
        slug: 'peta-geologi-lembar-yogyakarta-jawa',
      });
    }
  }, [
    basemap,
    darkMode,
    layerOpacity,
    mapLayers,
    mapScaleFilter,
    regionalIndexFilter,
    regionalRegionFilter,
    status,
    subsurfaceMode,
  ]);

  return (
    <div
      id="cesium-map-canvas"
      className="relative h-full w-full overflow-hidden bg-[#08111F]"
      aria-label="Kanvas Peta 3D CesiumJS"
    >
      <div ref={containerRef} className="h-full w-full" />

      {/* Toolbar ringkas Cesium 3D (Tengah Atas pada Desktop — area terbuka karena Pill 3D di Opsi 2) */}
      {status === 'ready' && (
        <div className="pointer-events-none absolute top-3 left-1/2 z-20 hidden -translate-x-1/2 md:flex">
          <div className="gm-hud pointer-events-auto flex h-9 items-center gap-1 rounded-full px-2 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1.5 px-1.5 whitespace-nowrap">
              <Mountain className="h-3.5 w-3.5 text-[#D5B600]" aria-hidden="true" />
              <span>{terrainSourceLabel}</span>
            </span>

            <span
              className="h-4 w-px opacity-30"
              style={{ backgroundColor: 'var(--s-hud-fg)' }}
            />

            <button
              type="button"
              onClick={() =>
                setExaggeration((prev) =>
                  prev === 1.0 ? 1.6 : prev === 1.6 ? 2.6 : 1.0,
                )
              }
              title="Ubah tingkat eksagerasi relief elevasi 3D"
              className="gm-press gm-focus rounded-full px-2 py-1 text-[10.5px] font-bold whitespace-nowrap cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            >
              Relief {exaggeration.toFixed(1)}×
            </button>

            <button
              type="button"
              aria-pressed={subsurfaceMode}
              onClick={() => setSubsurfaceMode((v) => !v)}
              title="Aktifkan transparansi permukaan bumi untuk melihat struktur subsurface 3D"
              className="gm-press gm-focus inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-bold whitespace-nowrap cursor-pointer transition-colors"
              style={
                subsurfaceMode
                  ? {
                      backgroundColor: 'var(--p-esdm-yellow)',
                      color: '#000000',
                    }
                  : {
                      backgroundColor: 'var(--s-hud-chip-bg)',
                      color: 'var(--s-hud-fg)',
                    }
              }
            >
              <Eye className="h-3 w-3" aria-hidden="true" />
              <span>Subsurface</span>
            </button>

            <button
              type="button"
              onClick={() => actionsRef?.current?.resetNorth()}
              title="Luruskan arah kompas ke Utara"
              className="gm-press gm-focus inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10.5px] font-bold whitespace-nowrap cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Compass className="h-3 w-3" aria-hidden="true" />
              <span>Utara</span>
            </button>
          </div>
        </div>
      )}

      {status === 'loading' && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#091526]/70 backdrop-blur-xs">
          <div className="gm-hud flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-xs font-semibold">
            <Layers className="h-4 w-4 animate-pulse text-[#FFF500]" />
            <span>Memuat Globe &amp; Terrain 3D CesiumJS...</span>
          </div>
        </div>
      )}

      {renderErrorMsg && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#091526]/85 p-4">
          <div className="gm-hud pointer-events-auto max-w-md rounded-2xl p-4 text-center text-xs">
            <p className="font-bold text-red-400">
              Terjadi kendala saat merender kanvas 3D CesiumJS
            </p>
            <p className="mt-1 font-mono text-[11px] opacity-85 break-words">
              {renderErrorMsg}
            </p>
          </div>
        </div>
      )}

      {status === 'unsupported' && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#091526]/80 p-4">
          <div className="gm-hud pointer-events-auto max-w-sm rounded-2xl p-4 text-center text-xs">
            <p className="font-bold">Mode 3D CesiumJS siap, WebGL tidak tersedia di lingkungan ini</p>
            <p className="mt-1 opacity-75">
              Aktifkan akselerasi hardware WebGL di browser Anda atau kembali ke mode 2D.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
