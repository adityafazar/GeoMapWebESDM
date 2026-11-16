import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useGeoMap } from '../../context/GeoMapContext';
import {
  ACTIVE_FAULTS,
  GROUNDWATER_BASINS,
  HIGHLIGHT_MAP_SCALES,
  INDONESIA_ISLANDS,
  QUADRANGLE_GRIDS,
  SEDIMENT_BASINS,
  VOLCANOES,
  type QuadrangleFeature,
} from '../../data/geomapData';
import {
  SCALE_GRID_SPECS,
  computePopupAnchoredMapCenter,
  computeRealScaleRatioLabel,
  generateNlpCellsInViewport,
} from '../../utils/indonesiaNlpGrid';

const TOPO_PRIMARY_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TOPO_ARCGIS_FALLBACK_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
const DARK_GRAY_FALLBACK_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const LIGHT_GRAY_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_PRIMARY_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const RBI_BIG_PRIMARY_URL =
  'https://geoservices.big.go.id/rbi/rest/services/BASEMAP/Rupabumi_Indonesia/MapServer/tile/{z}/{y}/{x}';
const TERRAIN_SHADED_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}';

const PROVINCE_DIVIDERS: [number, number][][] = [
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

const GEOLOGY_ZONES: {
  name: string;
  formation: string;
  color: string;
  coords: [number, number][];
}[] = [
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

interface LeafletMapCanvasProps {
  mapRefOut?: React.MutableRefObject<L.Map | null>;
}

export const LeafletMapCanvas: React.FC<LeafletMapCanvasProps> = ({
  mapRefOut,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const gridCanvasRendererRef = useRef<L.Canvas | null>(null);
  const labelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const visibleGridCellsRef = useRef<{
    cells: QuadrangleFeature[];
    layerBoxes: {
      code: string;
      swX: number;
      swY: number;
      neX: number;
      neY: number;
      wPx: number;
      hPx: number;
    }[];
    layerZoom: number;
    pillCodes: Set<string>;
    opacity: number;
    selectedCode: string | null;
    strokeColor: string;
    isDarkSurface: boolean;
    activeScale: keyof typeof SCALE_GRID_SPECS;
  } | null>(null);
  const renderedGridEntriesRef = useRef<
    Map<
      string,
      {
        rect: L.Rectangle;
        quad: QuadrangleFeature;
        isCatalog: boolean;
        baseStroke: string;
        baseFill: string;
        baseWeight: number;
        baseOpacity: number;
        baseFillOp: number;
        op: number;
        marker?: L.Marker;
      }
    >
  >(new Map());
  const prevSelectedQuadCodeRef = useRef<string | null>(null);
  const isMapMovingRef = useRef(false);
  const renderGridRef = useRef<(() => void) | null>(null);
  const renderLabelsRef = useRef<(() => void) | null>(null);
  const lastZoomRef = useRef<number>(5);
  const programmaticFocusRef = useRef<{
    seq: number;
    zoom: number;
    until: number;
    moving: boolean;
  }>({ seq: 0, zoom: 5, until: 0, moving: false });

  const layersRef = useRef<{
    decor: L.LayerGroup;
    province: L.LayerGroup;
    geology: L.LayerGroup;
    fault: L.LayerGroup;
    volcano: L.LayerGroup;
    groundwater: L.LayerGroup;
    basin: L.LayerGroup;
    grid: L.LayerGroup;
  } | null>(null);

  const {
    basemap,
    darkMode,
    mapLayers,
    layerOpacity,
    mapScaleFilter,
    mapFocusTarget,
    mapPopup,
    setMapStats,
    setNlpGridStats,
    setMapPopup,
    dockMapPopupForManeuver,
    focusQuadrangle,
    syncScaleFromZoom,
  } = useGeoMap();

  const selectedQuadCode = mapPopup?.kind === 'quadrangle' ? mapPopup.item.code : null;
  const selectedQuadCodeRef = useRef<string | null>(selectedQuadCode);
  selectedQuadCodeRef.current = selectedQuadCode;

  const setMapStatsRef = useRef(setMapStats);
  setMapStatsRef.current = setMapStats;
  const setNlpGridStatsRef = useRef(setNlpGridStats);
  setNlpGridStatsRef.current = setNlpGridStats;
  const setMapPopupRef = useRef(setMapPopup);
  setMapPopupRef.current = setMapPopup;
  const dockMapPopupForManeuverRef = useRef(dockMapPopupForManeuver);
  dockMapPopupForManeuverRef.current = dockMapPopupForManeuver;
  const focusQuadrangleRef = useRef(focusQuadrangle);
  focusQuadrangleRef.current = focusQuadrangle;
  const syncScaleFromZoomRef = useRef(syncScaleFromZoom);
  syncScaleFromZoomRef.current = syncScaleFromZoom;

  // Initialize Leaflet Map once on mount
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      center: [-2.5, 118.0],
      zoom: 5,
      minZoom: 4,
      maxZoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    const groups = {
      decor: L.layerGroup(),
      province: L.layerGroup(),
      geology: L.layerGroup(),
      fault: L.layerGroup(),
      volcano: L.layerGroup(),
      groundwater: L.layerGroup(),
      basin: L.layerGroup(),
      grid: L.layerGroup(),
    };

    layersRef.current = groups;
    mapRef.current = map;
    gridCanvasRendererRef.current = L.canvas({ padding: 0.35 });
    if (mapRefOut) mapRefOut.current = map;

    // Dedicated canvas pane above vector polygons (400) & below marker badges (600) for crisp NLP code labels
    try {
      const labelPane = map.createPane('gm-nlp-labels');
      labelPane.style.zIndex = '460';
      labelPane.style.pointerEvents = 'none';
      const labelCanvas = document.createElement('canvas');
      labelCanvas.style.position = 'absolute';
      labelCanvas.style.top = '0';
      labelCanvas.style.left = '0';
      labelCanvas.style.pointerEvents = 'none';
      labelCanvas.style.transition = 'opacity 120ms ease';
      labelPane.appendChild(labelCanvas);
      labelCanvasRef.current = labelCanvas;
    } catch {
      // Safe fallback in headless jsdom
    }

    const emitTelemetry = (latlng?: L.LatLng) => {
      try {
        const center = latlng ?? map.getCenter();
        const zoom = map.getZoom();
        setMapStatsRef.current({
          lat: Number(center.lat.toFixed(3)),
          lng: Number(center.lng.toFixed(3)),
          zoom,
          scaleLabel: computeRealScaleRatioLabel(center.lat, zoom),
        });
      } catch {
        // Ignore in headless 0x0 size mocks
      }
    };

    emitTelemetry();

    const isProgrammaticMotion = () => {
      const prog = programmaticFocusRef.current;
      return prog.moving && Date.now() < prog.until;
    };

    let mouseMoveRafId: number | null = null;
    let pendingMouseLatLng: L.LatLng | null = null;
    let labelMoveRafId: number | null = null;

    const scheduleMoveLabelRender = () => {
      if (typeof requestAnimationFrame !== 'function') {
        renderLabelsRef.current?.();
        return;
      }
      if (labelMoveRafId !== null) return;
      labelMoveRafId = requestAnimationFrame(() => {
        labelMoveRafId = null;
        renderLabelsRef.current?.();
      });
    };

    map.on('dragstart', () => {
      isMapMovingRef.current = true;
      programmaticFocusRef.current.moving = false;
      dockMapPopupForManeuverRef.current();
    });
    map.on('movestart', () => {
      isMapMovingRef.current = true;
      if (!isProgrammaticMotion()) {
        dockMapPopupForManeuverRef.current();
      }
    });
    map.on('zoomstart', () => {
      isMapMovingRef.current = true;
      if (labelCanvasRef.current) {
        labelCanvasRef.current.style.opacity = '0';
      }
      if (!isProgrammaticMotion()) {
        dockMapPopupForManeuverRef.current();
      }
    });
    map.on('move', () => {
      scheduleMoveLabelRender();
    });
    map.on('zoomend', () => {
      isMapMovingRef.current = false;
      try {
        const nextZoom = Math.round(map.getZoom());
        const prevZoom = lastZoomRef.current;
        lastZoomRef.current = nextZoom;

        const prog = programmaticFocusRef.current;
        const isProgrammaticArrival =
          Date.now() < prog.until && Math.abs(nextZoom - prog.zoom) <= 1;

        if (isProgrammaticArrival) {
          programmaticFocusRef.current = {
            seq: prog.seq,
            zoom: nextZoom,
            until: 0,
            moving: prog.moving,
          };
        } else if (nextZoom !== prevZoom) {
          syncScaleFromZoomRef.current(nextZoom, prevZoom);
        }
      } catch {
        // Ignore in headless 0x0 size mocks
      }
    });
    map.on('moveend zoomend viewreset resize', () => {
      isMapMovingRef.current = false;
      if (labelCanvasRef.current) {
        labelCanvasRef.current.style.opacity = '1';
      }
      emitTelemetry();
      renderGridRef.current?.();
    });
    map.on('moveend', () => {
      isMapMovingRef.current = false;
      programmaticFocusRef.current.moving = false;
    });
    map.on('mousemove', (ev: L.LeafletMouseEvent) => {
      if (isMapMovingRef.current) return;
      pendingMouseLatLng = ev.latlng;
      if (typeof requestAnimationFrame !== 'function') {
        emitTelemetry(pendingMouseLatLng);
        return;
      }
      if (mouseMoveRafId !== null) return;
      mouseMoveRafId = requestAnimationFrame(() => {
        mouseMoveRafId = null;
        if (!isMapMovingRef.current && pendingMouseLatLng) {
          emitTelemetry(pendingMouseLatLng);
        }
      });
    });

    return () => {
      if (mouseMoveRafId !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(mouseMoveRafId);
      }
      if (labelMoveRafId !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(labelMoveRafId);
      }
      map.remove();
      mapRef.current = null;
      if (mapRefOut) mapRefOut.current = null;
      layersRef.current = null;
      tileLayerRef.current = null;
      gridCanvasRendererRef.current = null;
      labelCanvasRef.current = null;
    };
  }, [mapRefOut]);

  // Manage Online Tile Layer + Clean Multi-Provider Fallback on basemap/darkMode changes
  useEffect(() => {
    const map = mapRef.current;
    const containerEl = containerRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const getSources = () => {
      if (basemap === 'sat') {
        return [{ url: SATELLITE_PRIMARY_URL, useDarkFilter: false }];
      }
      if (basemap === 'rbi') {
        return [
          { url: RBI_BIG_PRIMARY_URL, useDarkFilter: darkMode },
          { url: TOPO_ARCGIS_FALLBACK_URL, useDarkFilter: darkMode },
        ];
      }
      if (basemap === 'terrain') {
        return [
          { url: TERRAIN_SHADED_URL, useDarkFilter: darkMode },
          { url: TOPO_ARCGIS_FALLBACK_URL, useDarkFilter: darkMode },
        ];
      }
      if (basemap === 'minimal') {
        return darkMode
          ? [
              { url: DARK_GRAY_FALLBACK_URL, useDarkFilter: false },
              { url: TOPO_ARCGIS_FALLBACK_URL, useDarkFilter: true },
            ]
          : [
              { url: LIGHT_GRAY_URL, useDarkFilter: false },
              { url: TOPO_ARCGIS_FALLBACK_URL, useDarkFilter: false },
            ];
      }
      // osm (default vector/street tile with dark-mode fallback)
      return darkMode
        ? [
            { url: TOPO_PRIMARY_URL, useDarkFilter: true },
            { url: TOPO_ARCGIS_FALLBACK_URL, useDarkFilter: true },
            { url: DARK_GRAY_FALLBACK_URL, useDarkFilter: false },
          ]
        : [
            { url: TOPO_PRIMARY_URL, useDarkFilter: false },
            { url: TOPO_ARCGIS_FALLBACK_URL, useDarkFilter: false },
          ];
    };

    const sources = getSources();

    let sourceIdx = 0;
    let errorStreak = 0;
    let loadedAnyTile = false;

    const applyFilterAttr = (useFilter: boolean) => {
      if (containerEl) {
        containerEl.dataset.topoDarkFilter = useFilter ? 'true' : 'false';
      }
    };

    applyFilterAttr(sources[0].useDarkFilter);

    const tl = L.tileLayer(sources[0].url, {
      maxZoom: 18,
    });

    const onTileLoad = () => {
      loadedAnyTile = true;
      errorStreak = 0;
    };

    const onTileError = () => {
      errorStreak += 1;
      if (!loadedAnyTile && errorStreak >= 2 && sourceIdx + 1 < sources.length) {
        sourceIdx += 1;
        errorStreak = 0;
        const nextSource = sources[sourceIdx];
        applyFilterAttr(nextSource.useDarkFilter);
        tl.setUrl(nextSource.url);
      }
    };

    tl.on('tileload', onTileLoad);
    tl.on('tileerror', onTileError);
    tl.addTo(map);
    tl.bringToBack();
    tileLayerRef.current = tl;

    return () => {
      tl.off('tileload', onTileLoad);
      tl.off('tileerror', onTileError);
      if (tileLayerRef.current === tl) {
        try {
          map.removeLayer(tl);
        } catch {
          // Map may already be torn down on unmount
        }
        tileLayerRef.current = null;
      }
    };
  }, [basemap, darkMode]);

  // Sync FlyTo/PanTo when user picks a quadrangle index / dataset / search hit / volcano / reset extent
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapFocusTarget.seq === 0) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    try {
      const size = map.getSize();
      const curCenter = map.getCenter();
      let targetLat = mapFocusTarget.preserveCurrentCenter
        ? curCenter.lat
        : mapFocusTarget.lat;
      let targetLng = mapFocusTarget.preserveCurrentCenter
        ? curCenter.lng
        : mapFocusTarget.lng;
      let resolvedZoom = mapFocusTarget.zoom;

      if (mapFocusTarget.anchorBounds && size.x > 0 && size.y > 0) {
        const inspectorEl =
          typeof document !== 'undefined'
            ? (document.querySelector<HTMLElement>(
                '#map-feature-inspector[data-inspector-mode="center"]',
              ) ?? document.getElementById('map-feature-inspector'))
            : null;
        const measuredPopupH = inspectorEl
          ? Math.max(
              inspectorEl.offsetHeight,
              inspectorEl.getBoundingClientRect().height,
            )
          : 0;
        const popupHeight = measuredPopupH > 0 ? measuredPopupH : 272;
        const isMobileViewport =
          typeof window !== 'undefined' && window.innerWidth < 640;

        const anchored = computePopupAnchoredMapCenter({
          bounds: mapFocusTarget.anchorBounds,
          containerHeight: size.y,
          popupHeight,
          currentZoom: map.getZoom(),
          preferredZoom: mapFocusTarget.zoom,
          preserveCurrentZoomIfVisible:
            mapFocusTarget.preserveCurrentZoomIfVisible,
          maxPreserveCellPx: mapFocusTarget.maxPreserveCellPx,
          isMobileViewport,
          project: (lat, lng, zoom) => map.project([lat, lng], zoom),
          unproject: (x, y, zoom) => map.unproject(L.point(x, y), zoom),
        });
        targetLat = anchored.lat;
        targetLng = anchored.lng;
        resolvedZoom = anchored.zoom;
      }

      const targetZoom = Math.round(resolvedZoom);
      const isSameCenter =
        Math.abs(targetLat - curCenter.lat) < 1e-5 &&
        Math.abs(targetLng - curCenter.lng) < 1e-5;
      const isSameView =
        isSameCenter && Math.abs(resolvedZoom - map.getZoom()) < 0.01;

      programmaticFocusRef.current = {
        seq: mapFocusTarget.seq,
        zoom: targetZoom,
        until: Date.now() + 1400,
        moving: !isSameView,
      };
      lastZoomRef.current = targetZoom;

      if (reduceMotion || size.x === 0 || size.y === 0) {
        map.setView([targetLat, targetLng], resolvedZoom, {
          animate: false,
        });
        programmaticFocusRef.current.moving = false;
      } else if (!isSameView) {
        if (Math.abs(resolvedZoom - map.getZoom()) < 0.01) {
          map.panTo([targetLat, targetLng], {
            animate: true,
            duration: 0.45,
          });
        } else if (isSameCenter) {
          map.setZoom(resolvedZoom, {
            animate: true,
          });
        } else {
          map.flyTo([targetLat, targetLng], resolvedZoom, {
            duration: 0.65,
          });
        }
      }

      const seqAtDispatch = mapFocusTarget.seq;
      const safetyTimer = window.setTimeout(() => {
        if (programmaticFocusRef.current.seq === seqAtDispatch) {
          programmaticFocusRef.current.moving = false;
        }
      }, 900);
      return () => window.clearTimeout(safetyTimer);
    } catch {
      // Safe fallback in jsdom
    }
  }, [mapFocusTarget]);

  // Sync LayerGroups contents, visibility, and opacity with React state
  useEffect(() => {
    const map = mapRef.current;
    const groups = layersRef.current;
    if (!map || !groups) return;

    // 0. Cartographic Graticule, Equator & Landmass Base (crisp both offline & online)
    groups.decor.clearLayers();
    const isSat = basemap === 'sat';
    const gridStroke = isSat
      ? 'rgba(148, 163, 184, 0.22)'
      : darkMode
        ? 'rgba(148, 163, 184, 0.16)'
        : 'rgba(35, 60, 90, 0.13)';
    const gridLabelColor = isSat
      ? 'rgba(203, 213, 225, 0.72)'
      : darkMode
        ? 'rgba(148, 163, 184, 0.65)'
        : 'rgba(35, 60, 90, 0.52)';

    for (const lng of [95, 105, 115, 125, 135]) {
      L.polyline(
        [
          [-12, lng],
          [8, lng],
        ],
        {
          color: gridStroke,
          weight: 1,
          dashArray: '3 4',
          interactive: false,
        },
      ).addTo(groups.decor);

      L.marker([4.8, lng], {
        interactive: false,
        icon: L.divIcon({
          className: 'gm-graticule-label',
          iconSize: [52, 14],
          iconAnchor: [4, 7],
          html: `<span style="font-size:9px;font-weight:700;color:${gridLabelColor};white-space:nowrap;pointer-events:none;font-variant-numeric:tabular-nums;">${lng}° BT</span>`,
        }),
      }).addTo(groups.decor);
    }

    L.polyline(
      [
        [0, 92],
        [0, 143],
      ],
      {
        color: isSat
          ? 'rgba(255, 245, 0, 0.24)'
          : darkMode
            ? 'rgba(148, 163, 184, 0.28)'
            : 'rgba(35, 60, 90, 0.22)',
        weight: 1.1,
        interactive: false,
      },
    ).addTo(groups.decor);

    L.marker([0.35, 94.5], {
      interactive: false,
      icon: L.divIcon({
        className: 'gm-graticule-label',
        iconSize: [110, 14],
        iconAnchor: [0, 7],
        html: `<span style="font-size:9px;font-weight:700;color:${gridLabelColor};letter-spacing:0.04em;white-space:nowrap;pointer-events:none;">0° KHATULISTIWA</span>`,
      }),
    }).addTo(groups.decor);
    groups.decor.addTo(map);

    // 1. Batas Administrasi Provinsi (garis batas antardaerah bersih tanpa poligon menutupi basemap)
    groups.province.clearLayers();
    if (mapLayers.province) {
      const op = layerOpacity.province / 100;
      const strokeColor =
        basemap === 'sat' || darkMode ? '#93C5FD' : '#233C5A';

      for (const divider of PROVINCE_DIVIDERS) {
        L.polyline(divider, {
          color: strokeColor,
          weight: 1.7,
          opacity: 0.85 * op,
          dashArray: '5 4',
          interactive: false,
        }).addTo(groups.province);
      }

      // Garis tepi luar nusantara sangat tipis (tanpa fill buram agar basemap & grid tetap jernih)
      for (const island of INDONESIA_ISLANDS) {
        L.polygon(island, {
          color: strokeColor,
          weight: 0.9,
          opacity: 0.35 * op,
          dashArray: '3 4',
          fill: false,
          interactive: false,
        }).addTo(groups.province);
      }
      groups.province.addTo(map);
    } else {
      map.removeLayer(groups.province);
    }

    // 2. Peta Geologi Indonesia (Lithology Polygons)
    groups.geology.clearLayers();
    if (mapLayers.geology) {
      const op = layerOpacity.geology / 100;
      for (const zone of GEOLOGY_ZONES) {
        L.polygon(zone.coords, {
          color: '#A16207',
          weight: 1.4,
          opacity: 0.9 * op,
          fillColor: zone.color,
          fillOpacity: 0.42 * op,
        })
          .on('click', () => {
            setMapPopupRef.current({
              kind: 'basin',
              title: zone.name,
              subtitle: 'Satuan Geologi & Litologi Regional',
              detail: zone.formation,
              slug: 'peta-geologi-indonesia',
            });
          })
          .addTo(groups.geology);
      }
      groups.geology.addTo(map);
    } else {
      map.removeLayer(groups.geology);
    }

    // 3. Cekungan Sedimen Indonesia (Emerald #00B473)
    groups.basin.clearLayers();
    if (mapLayers.basin) {
      const op = layerOpacity.basin / 100;
      for (const b of SEDIMENT_BASINS) {
        L.polygon(b.polygon, {
          color: '#047857',
          weight: 1.8,
          opacity: 0.9 * op,
          fillColor: '#00B473',
          fillOpacity: 0.36 * op,
        })
          .on('click', () => {
            setMapPopupRef.current({
              kind: 'basin',
              title: b.name,
              subtitle: `Status: ${b.status}`,
              detail: `Ketebalan sedimen estimasi ${b.thickness}`,
              slug: 'peta-cekungan-sedimen-indonesia',
            });
          })
          .addTo(groups.basin);
      }
      groups.basin.addTo(map);
    } else {
      map.removeLayer(groups.basin);
    }

    // 4. Air Tanah & Hidrogeologi (Azure #0284C7)
    groups.groundwater.clearLayers();
    if (mapLayers.groundwater) {
      const op = layerOpacity.groundwater / 100;
      for (const cat of GROUNDWATER_BASINS) {
        L.circle(cat.center, {
          radius: cat.radiusKm * 1000,
          color: '#0284C7',
          weight: 1.8,
          opacity: 0.95 * op,
          fillColor: '#38BDF8',
          fillOpacity: 0.34 * op,
        })
          .on('click', () => {
            setMapPopupRef.current({
              kind: 'groundwater',
              title: cat.name,
              subtitle: 'Cekungan Air Tanah (CAT)',
              detail: cat.potential,
              slug: 'peta-hidrogeologi-lembar-jakarta-bekasi',
            });
          })
          .addTo(groups.groundwater);
      }
      groups.groundwater.addTo(map);
    } else {
      map.removeLayer(groups.groundwater);
    }

    // 5. Patahan Aktif / Sesar (#DC2626)
    groups.fault.clearLayers();
    if (mapLayers.fault) {
      const op = layerOpacity.fault / 100;
      for (const fault of ACTIVE_FAULTS) {
        L.polyline(fault.coords, {
          color: '#DC2626',
          weight: 3.4,
          opacity: 0.95 * op,
          dashArray: '8 5',
        })
          .on('click', () => {
            setMapPopupRef.current({ kind: 'fault', item: fault });
          })
          .addTo(groups.fault);
      }
      groups.fault.addTo(map);
    } else {
      map.removeLayer(groups.fault);
    }

    // 7. Sebaran Gunung Api PVMBG (#EA580C + pulse + MAGMA link)
    groups.volcano.clearLayers();
    if (mapLayers.volcano) {
      const op = layerOpacity.volcano / 100;
      for (const v of VOLCANOES) {
        const isAlert = v.level.includes('Siaga') || v.level.includes('Awas');
        const icon = L.divIcon({
          className: 'gm-volcano-divicon',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          html: `
            <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;opacity:${op};cursor:pointer;">
              ${
                isAlert
                  ? `<span class="gm-volcano-ring" style="position:absolute;inset:2px;border-radius:999px;background:${v.color};opacity:0.45;"></span>`
                  : ''
              }
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style="position:relative;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.45));">
                <polygon points="12,3 22,20 2,20" fill="${v.color}" stroke="#FFFFFF" stroke-width="1.8" stroke-linejoin="round" />
              </svg>
            </div>
          `,
        });

        L.marker([v.lat, v.lng], {
          icon,
          title: `${v.name} — ${v.level}`,
        })
          .on('click', () => {
            setMapPopupRef.current({ kind: 'volcano', item: v });
          })
          .addTo(groups.volcano);
      }
      groups.volcano.addTo(map);
    } else {
      map.removeLayer(groups.volcano);
    }
  }, [basemap, darkMode, layerOpacity, mapLayers]);

  const buildCatalogBadgeIcon = (
    code: string,
    isSelected: boolean,
    strokeColor: string,
    op: number,
  ) =>
    L.divIcon({
      className: 'gm-quad-label',
      iconSize: [86, 22],
      iconAnchor: [43, 11],
      html: `
        <div style="cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:${op};">
          <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:0;line-height:1.25;background:${isSelected ? '#FFF500' : 'rgba(21,37,59,0.92)'};color:${isSelected ? '#000000' : '#FFFFFF'};border:1.5px solid ${strokeColor};box-shadow:0 2px 6px rgba(0,0,0,0.28);white-space:nowrap;">
            ${code}
          </span>
        </div>
      `,
    });

  // 6. Indeks Lembar Peta Interaktif (Opsi 1: Generator NLP Nasional SNI 6502 / IMW di Viewport + Canvas Renderer)
  useEffect(() => {
    const map = mapRef.current;
    const groups = layersRef.current;
    if (!map || !groups) return;

    const rebuildLayerBoxes = (
      cells: QuadrangleFeature[],
      zoom: number,
    ) => {
      const boxes: {
        code: string;
        swX: number;
        swY: number;
        neX: number;
        neY: number;
        wPx: number;
        hPx: number;
      }[] = [];
      for (const cell of cells) {
        const pSW = map.latLngToLayerPoint(cell.bounds[0]);
        const pNE = map.latLngToLayerPoint(cell.bounds[1]);
        boxes.push({
          code: cell.code,
          swX: pSW.x,
          swY: pSW.y,
          neX: pNE.x,
          neY: pNE.y,
          wPx: Math.abs(pNE.x - pSW.x),
          hPx: Math.abs(pSW.y - pNE.y),
        });
      }
      return { boxes, zoom };
    };

    const renderLabels = () => {
      const canvas = labelCanvasRef.current;
      const state = visibleGridCellsRef.current;
      if (!canvas) return;

      let size: L.Point;
      try {
        size = map.getSize();
      } catch {
        return;
      }
      if (size.x <= 0 || size.y <= 0) {
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (!state) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      let topLeftLayer: L.Point;
      let currentZoom: number;
      try {
        topLeftLayer = map.containerPointToLayerPoint([0, 0]);
        currentZoom = map.getZoom();
        L.DomUtil.setPosition(canvas, topLeftLayer);
      } catch {
        return;
      }

      if (
        state.layerZoom !== currentZoom ||
        state.layerBoxes.length !== state.cells.length
      ) {
        const rebuilt = rebuildLayerBoxes(state.cells, currentZoom);
        state.layerBoxes = rebuilt.boxes;
        state.layerZoom = rebuilt.zoom;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.round(size.x * dpr);
      const targetH = Math.round(size.y * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        canvas.style.width = `${size.x}px`;
        canvas.style.height = `${size.y}px`;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size.x, size.y);
      ctx.globalAlpha = Math.max(0.25, state.opacity);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font =
        '700 10.5px "Poppins", -apple-system, BlinkMacSystemFont, sans-serif';

      const defaultStroke = state.isDarkSurface
        ? 'rgba(11, 25, 44, 0.88)'
        : 'rgba(255, 255, 255, 0.9)';
      const defaultFill = state.isDarkSurface ? '#E2E8F0' : '#0F172A';
      const offsetX = topLeftLayer.x;
      const offsetY = topLeftLayer.y;
      ctx.lineWidth = 3.2;

      for (let i = 0; i < state.layerBoxes.length; i += 1) {
        const box = state.layerBoxes[i];
        if (box.wPx < 40 || box.hPx < 22) continue;
        if (state.pillCodes.has(box.code)) continue;

        const cx = (box.swX + box.neX) * 0.5 - offsetX;
        const cy = (box.swY + box.neY) * 0.5 - offsetY;
        if (cx < -36 || cx > size.x + 36 || cy < -20 || cy > size.y + 20) {
          continue;
        }

        const isSel = state.selectedCode === box.code;
        ctx.strokeStyle = isSel ? 'rgba(15, 23, 42, 0.92)' : defaultStroke;
        ctx.strokeText(box.code, cx, cy);

        ctx.fillStyle = isSel ? '#FFF500' : defaultFill;
        ctx.fillText(box.code, cx, cy);
      }
    };

    const renderGrid = () => {
      groups.grid.clearLayers();
      renderedGridEntriesRef.current.clear();
      const currentSelectedCode = selectedQuadCodeRef.current;
      prevSelectedQuadCodeRef.current = currentSelectedCode;

      if (!mapLayers.grid) {
        visibleGridCellsRef.current = null;
        setNlpGridStatsRef.current(null);
        renderLabels();
        map.removeLayer(groups.grid);
        return;
      }

      const op = layerOpacity.grid / 100;
      const activeScale = mapScaleFilter ?? '1:250.000';
      const isDarkSurface = basemap === 'sat' || darkMode;
      const renderer = gridCanvasRendererRef.current ?? undefined;

      let size = L.point(0, 0);
      try {
        size = map.getSize();
      } catch {
        size = L.point(0, 0);
      }

      const handleGridQuadClick = (
        quad: QuadrangleFeature,
        ev?: L.LeafletMouseEvent,
      ) => {
        if (ev?.originalEvent) {
          L.DomEvent.stopPropagation(ev);
        }
        focusQuadrangleRef.current(quad, {
          preserveCurrentZoomIfVisible: true,
          maxPreserveCellPx: 420,
        });
      };

      const addCatalogBadgeMarker = (
        quad: QuadrangleFeature,
        baseStrokeColor: string,
      ) => {
        const isSelected = currentSelectedCode === quad.code;
        const strokeColor = isSelected ? '#FFF500' : baseStrokeColor;
        const marker = L.marker(quad.center, {
          interactive: true,
          title: `${quad.code} — ${quad.name} (${quad.scale})`,
          icon: buildCatalogBadgeIcon(quad.code, isSelected, strokeColor, op),
        })
          .on('click', (ev: L.LeafletMouseEvent) => handleGridQuadClick(quad, ev))
          .addTo(groups.grid);

        const existing = renderedGridEntriesRef.current.get(quad.code);
        if (existing) {
          existing.marker = marker;
          existing.baseStroke = baseStrokeColor;
        }
        return marker;
      };

      // Headless jsdom fallback (0x0 container): keep deterministic catalog highlights testable
      if (size.x <= 0 || size.y <= 0) {
        const visibleQuads = QUADRANGLE_GRIDS.filter(
          (q) => q.scale === activeScale,
        );
        for (const quad of visibleQuads) {
          const meta = HIGHLIGHT_MAP_SCALES.find((m) => m.value === quad.scale);
          const baseStroke = meta?.strokeColor ?? '#D5B600';
          const baseFill = meta?.fillColor ?? '#233C5A';
          const isSelected = currentSelectedCode === quad.code;
          const strokeColor = isSelected ? '#FFF500' : baseStroke;
          const fillColor = isSelected ? '#FFF500' : baseFill;
          const baseWeight = 2.1;
          const baseOpacity = 0.96 * op;
          const baseFillOp = 0.22 * op;
          const rect = L.rectangle(quad.bounds, {
            className: 'gm-quad-rect',
            color: strokeColor,
            weight: isSelected ? 3.2 : baseWeight,
            opacity: baseOpacity,
            fillColor,
            fillOpacity: isSelected ? 0.36 * op : baseFillOp,
            interactive: true,
          })
            .on('click', (ev: L.LeafletMouseEvent) => handleGridQuadClick(quad, ev))
            .addTo(groups.grid);

          renderedGridEntriesRef.current.set(quad.code, {
            rect,
            quad,
            isCatalog: true,
            baseStroke,
            baseFill,
            baseWeight,
            baseOpacity,
            baseFillOp,
            op,
          });
          addCatalogBadgeMarker(quad, baseStroke);
        }
        setNlpGridStatsRef.current({
          requestedScale: activeScale,
          renderedScale: activeScale,
          isParentFallback: false,
          visibleCount: visibleQuads.length,
          visibleCells: visibleQuads,
        });
        groups.grid.addTo(map);
        return;
      }

      // Browser interactive mode: viewport-culled real Indonesian SNI 6502 / IMW NLP Grid on Canvas
      const bounds = map.getBounds();
      const center = map.getCenter();
      const spec = SCALE_GRID_SPECS[activeScale];
      const cellPxW = Math.abs(
        map.latLngToContainerPoint([center.lat, center.lng + spec.lngSpan]).x -
          map.latLngToContainerPoint(center).x,
      );

      const generated = generateNlpCellsInViewport({
        scale: activeScale,
        viewportBounds: {
          south: bounds.getSouth(),
          north: bounds.getNorth(),
          west: bounds.getWest(),
          east: bounds.getEast(),
        },
        cellPixelWidth: cellPxW,
      });

      const scaleMeta = HIGHLIGHT_MAP_SCALES.find(
        (m) => m.value === generated.renderedScale,
      );
      const renderedStroke = scaleMeta?.strokeColor ?? '#D5B600';
      const renderedFill = scaleMeta?.fillColor ?? '#233C5A';
      const drawnCodes = new Set<string>();
      const pillCodes = new Set<string>();

      // 1. Draw all real NLP tessellation rectangles on L.canvas
      for (const cell of generated.cells) {
        drawnCodes.add(cell.code);
        const isCatalogCell = !cell.isComputedGrid;
        const isSelected = currentSelectedCode === cell.code;
        const strokeColor = isSelected ? '#FFF500' : renderedStroke;
        const fillColor = isSelected ? '#FFF500' : renderedFill;
        const baseWeight = isCatalogCell ? 2.1 : 1.05;
        const baseOpacity = (isCatalogCell ? 0.95 : 0.65) * op;
        const baseFillOp = (isCatalogCell ? 0.16 : 0.045) * op;

        const rect = L.rectangle(cell.bounds, {
          renderer,
          color: strokeColor,
          weight: isSelected ? 3.0 : baseWeight,
          opacity: isSelected ? 0.95 * op : baseOpacity,
          dashArray:
            generated.renderedScale === '1:5.000.000'
              ? '8 5'
              : generated.renderedScale === '1:1.000.000'
                ? '6 4'
                : undefined,
          fillColor,
          fillOpacity: isSelected ? 0.32 * op : baseFillOp,
          interactive: true,
        })
          .on('mouseover', () => {
            if (isMapMovingRef.current) return;
            rect.setStyle({
              weight: isCatalogCell ? 3.2 : 2.3,
              fillOpacity: Math.min(0.42, baseFillOp + 0.16),
            });
          })
          .on('mouseout', () => {
            if (isMapMovingRef.current) return;
            const currentlySel = selectedQuadCodeRef.current === cell.code;
            rect.setStyle({
              weight: currentlySel ? 3.0 : baseWeight,
              fillOpacity: currentlySel ? 0.32 * op : baseFillOp,
            });
          })
          .on('click', (ev: L.LeafletMouseEvent) => handleGridQuadClick(cell, ev))
          .addTo(groups.grid);

        renderedGridEntriesRef.current.set(cell.code, {
          rect,
          quad: cell,
          isCatalog: isCatalogCell,
          baseStroke: renderedStroke,
          baseFill: renderedFill,
          baseWeight,
          baseOpacity,
          baseFillOp,
          op,
        });
      }

      // 2. Render badge unggulan hanya pada sel yang memang berada di viewport aktif (tanpa menumpuk kotak ganda)
      const requestedMeta = HIGHLIGHT_MAP_SCALES.find(
        (m) => m.value === activeScale,
      );
      const requestedStroke = requestedMeta?.strokeColor ?? '#D5B600';
      const requestedFill = requestedMeta?.fillColor ?? '#233C5A';

      for (const quad of generated.catalogMatches) {
        const isSelected = currentSelectedCode === quad.code;
        const strokeColor = isSelected ? '#FFF500' : requestedStroke;
        const fillColor = isSelected ? '#FFF500' : requestedFill;

        if (drawnCodes.has(quad.code)) {
          pillCodes.add(quad.code);
          addCatalogBadgeMarker(quad, requestedStroke);
        } else if (generated.isParentFallback && bounds.contains(quad.center)) {
          const baseFillOp = 0.2 * op;
          const baseWeight = 1.8;
          const baseOpacity = 0.94 * op;
          const rect = L.rectangle(quad.bounds, {
            renderer,
            color: strokeColor,
            weight: isSelected ? 2.8 : baseWeight,
            opacity: baseOpacity,
            fillColor,
            fillOpacity: isSelected ? 0.34 * op : baseFillOp,
            interactive: true,
          })
            .on('mouseover', () => {
              if (isMapMovingRef.current) return;
              rect.setStyle({
                weight: 3.0,
                fillOpacity: Math.min(0.45, baseFillOp + 0.14),
              });
            })
            .on('mouseout', () => {
              if (isMapMovingRef.current) return;
              const currentlySel = selectedQuadCodeRef.current === quad.code;
              rect.setStyle({
                weight: currentlySel ? 2.8 : baseWeight,
                fillOpacity: currentlySel ? 0.34 * op : baseFillOp,
              });
            })
            .on('click', (ev: L.LeafletMouseEvent) => handleGridQuadClick(quad, ev))
            .addTo(groups.grid);

          renderedGridEntriesRef.current.set(quad.code, {
            rect,
            quad,
            isCatalog: true,
            baseStroke: requestedStroke,
            baseFill: requestedFill,
            baseWeight,
            baseOpacity,
            baseFillOp,
            op,
          });
          pillCodes.add(quad.code);
          addCatalogBadgeMarker(quad, requestedStroke);
        }
      }

      const catalogVisible = generated.cells.filter((c) => !c.isComputedGrid);
      const computedNearest = generated.cells
        .filter((c) => c.isComputedGrid)
        .sort((a, b) => {
          const da =
            (a.center[0] - center.lat) ** 2 + (a.center[1] - center.lng) ** 2;
          const db =
            (b.center[0] - center.lat) ** 2 + (b.center[1] - center.lng) ** 2;
          return da - db;
        });

      const currentZoom = map.getZoom();
      const rebuilt = rebuildLayerBoxes(generated.cells, currentZoom);

      visibleGridCellsRef.current = {
        cells: generated.cells,
        layerBoxes: rebuilt.boxes,
        layerZoom: rebuilt.zoom,
        pillCodes,
        opacity: op,
        selectedCode: currentSelectedCode,
        strokeColor: renderedStroke,
        isDarkSurface,
        activeScale: generated.renderedScale,
      };
      setNlpGridStatsRef.current({
        requestedScale: generated.requestedScale,
        renderedScale: generated.renderedScale,
        isParentFallback: generated.isParentFallback,
        visibleCount: generated.totalCount,
        visibleCells: [...catalogVisible, ...computedNearest].slice(0, 14),
      });

      groups.grid.addTo(map);
      renderLabels();
    };

    renderLabelsRef.current = renderLabels;
    renderGridRef.current = renderGrid;
    renderGrid();
  }, [basemap, darkMode, layerOpacity.grid, mapLayers.grid, mapScaleFilter]);

  // Fast O(1) style update when only selectedQuadCode changes (avoids recreating 480 grid layers on click)
  useEffect(() => {
    const prevCode = prevSelectedQuadCodeRef.current;
    if (prevCode === selectedQuadCode) return;
    prevSelectedQuadCodeRef.current = selectedQuadCode;

    const entries = renderedGridEntriesRef.current;
    if (prevCode) {
      const prevEntry = entries.get(prevCode);
      if (prevEntry) {
        prevEntry.rect.setStyle({
          color: prevEntry.baseStroke,
          fillColor: prevEntry.baseFill,
          weight: prevEntry.baseWeight,
          opacity: prevEntry.baseOpacity,
          fillOpacity: prevEntry.baseFillOp,
        });
        if (prevEntry.marker) {
          prevEntry.marker.setIcon(
            buildCatalogBadgeIcon(
              prevCode,
              false,
              prevEntry.baseStroke,
              prevEntry.op,
            ),
          );
        }
      }
    }

    if (selectedQuadCode) {
      const nextEntry = entries.get(selectedQuadCode);
      if (nextEntry) {
        nextEntry.rect.setStyle({
          color: '#FFF500',
          fillColor: '#FFF500',
          weight: 3.0,
          opacity: 0.95 * nextEntry.op,
          fillOpacity: 0.32 * nextEntry.op,
        });
        if (nextEntry.marker) {
          nextEntry.marker.setIcon(
            buildCatalogBadgeIcon(
              selectedQuadCode,
              true,
              '#FFF500',
              nextEntry.op,
            ),
          );
        }
      }
    }

    if (visibleGridCellsRef.current) {
      visibleGridCellsRef.current.selectedCode = selectedQuadCode;
      renderLabelsRef.current?.();
    }
  }, [selectedQuadCode]);

  return (
    <div
      ref={containerRef}
      id="leaflet-map-canvas"
      data-topo-dark-filter={
        basemap !== 'sat' && basemap !== 'minimal' && darkMode ? 'true' : 'false'
      }
      className="geomap-leaflet-root absolute inset-0 h-full w-full"
      aria-label="Kanvas Peta Interaktif GeoMap Indonesia"
    />
  );
};

