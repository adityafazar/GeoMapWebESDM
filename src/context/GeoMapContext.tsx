import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DATASETS,
  HIGHLIGHT_MAP_SCALES,
  MAP_LAYERS,
  REGIONAL_INDEX_OPTIONS,
  REGIONAL_REGION_OPTIONS,
  type ActiveFaultFeature,
  type BasemapId,
  type GeoDataset,
  type LandingMapDataFormat,
  type LayerKey,
  type MapScaleFilter,
  type MapScaleValue,
  type QuadrangleFeature,
  type RegionalIndexFilter,
  type RegionalIndexMode,
  type RegionalIndexRegion,
  type ThemeCluster,
  type VolcanoItem,
} from '../data/geomapData';
import {
  matchesRegionalRegion,
  resolveMonotonicZoomScale,
} from '../utils/indonesiaNlpGrid';

export type RouteName = 'map' | 'catalog' | 'preview' | 'faq';
export type MapDimensionMode = '2d' | '3d';
export type BasemapType = BasemapId;
export type SheetDetent = 'minimal' | 'ringkas' | 'penuh';
export type RegionFilter =
  | 'Semua'
  | 'Nasional'
  | 'Jawa & Bali'
  | 'Kalimantan'
  | 'Sumatera'
  | 'Sulawesi';
export type FormatFilter = 'Semua' | 'Raster' | 'SHP';
export type SortMode = 'populer' | 'terbaru' | 'skala' | 'judul';
export type ViewMode = 'card' | 'table';

export type SearchHistoryItem =
  | {
    id: string;
    kind: 'quadrangle';
    label: string;
    subtitle: string;
    query: string;
    timestamp: number;
    quad: QuadrangleFeature;
  }
  | {
    id: string;
    kind: 'volcano';
    label: string;
    subtitle: string;
    query: string;
    timestamp: number;
    volcano: VolcanoItem;
  }
  | {
    id: string;
    kind: 'dataset';
    label: string;
    subtitle: string;
    query: string;
    timestamp: number;
    dataset: GeoDataset;
  };

export type SearchHistoryInput =
  | { kind: 'quadrangle'; quad: QuadrangleFeature; query?: string }
  | { kind: 'volcano'; volcano: VolcanoItem; query?: string }
  | { kind: 'dataset'; dataset: GeoDataset; query?: string };

const SEARCH_HISTORY_STORAGE_KEY = 'geomap_esdm_search_history_v1';
const MAX_SEARCH_HISTORY = 6;

function isValidSearchHistoryItem(item: unknown): item is SearchHistoryItem {
  if (!item || typeof item !== 'object') return false;
  const candidate = item as Record<string, unknown>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.kind !== 'string' ||
    typeof candidate.label !== 'string' ||
    typeof candidate.subtitle !== 'string' ||
    typeof candidate.query !== 'string' ||
    typeof candidate.timestamp !== 'number'
  ) {
    return false;
  }
  if (candidate.kind === 'quadrangle') {
    return Boolean(candidate.quad && typeof candidate.quad === 'object');
  }
  if (candidate.kind === 'volcano') {
    return Boolean(candidate.volcano && typeof candidate.volcano === 'object');
  }
  if (candidate.kind === 'dataset') {
    return Boolean(candidate.dataset && typeof candidate.dataset === 'object');
  }
  return false;
}

function loadSearchHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidSearchHistoryItem).slice(0, MAX_SEARCH_HISTORY);
  } catch {
    return [];
  }
}

function persistSearchHistory(items: SearchHistoryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      SEARCH_HISTORY_STORAGE_KEY,
      JSON.stringify(items),
    );
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

function buildSearchHistoryItem(input: SearchHistoryInput): SearchHistoryItem {
  const timestamp = Date.now();
  if (input.kind === 'quadrangle') {
    const { quad } = input;
    return {
      id: quad.isRegionalIndex
        ? `quadrangle:reg:${quad.code}`
        : `quadrangle:${quad.code}`,
      kind: 'quadrangle',
      label: `${quad.code} · ${quad.name}`,
      subtitle: quad.isRegionalIndex
        ? `Indeks Regional • ${quad.scale} • ${quad.region}`
        : `Indeks Lembar • ${quad.scale} • ${quad.region}`,
      query: input.query?.trim() || `${quad.code} ${quad.name}`,
      timestamp,
      quad,
    };
  }
  if (input.kind === 'volcano') {
    const { volcano } = input;
    return {
      id: `volcano:${volcano.id}`,
      kind: 'volcano',
      label: volcano.name,
      subtitle: `Gunung Api • ${volcano.level} • ${volcano.province}`,
      query: input.query?.trim() || volcano.name,
      timestamp,
      volcano,
    };
  }
  const { dataset } = input;
  return {
    id: `dataset:${dataset.id}`,
    kind: 'dataset',
    label: dataset.title,
    subtitle: `${dataset.theme} • ${dataset.scale} • ${dataset.sheetCode}`,
    query: input.query?.trim() || dataset.title,
    timestamp,
    dataset,
  };
}

export type MapInspectorPopup =
  | { kind: 'volcano'; item: VolcanoItem }
  | { kind: 'fault'; item: ActiveFaultFeature }
  | { kind: 'quadrangle'; item: QuadrangleFeature }
  | {
    kind: 'basin' | 'groundwater';
    title: string;
    subtitle: string;
    detail: string;
    slug: string;
  };

export interface AuthUser {
  name: string;
  email: string;
  role: string;
  quotaUsed: number;
  quotaLimit: number;
}

export interface PendingDownload {
  dataset: GeoDataset;
  format: 'GeoPDF' | 'SHP';
}

export interface MapFocusTarget {
  lat: number;
  lng: number;
  zoom: number;
  label?: string;
  seq: number;
  anchorBounds?: [[number, number], [number, number]];
  preserveCurrentZoomIfVisible?: boolean;
  maxPreserveCellPx?: number;
  preserveCurrentCenter?: boolean;
}

export interface NlpGridTelemetry {
  requestedScale: MapScaleValue;
  renderedScale: MapScaleValue;
  isParentFallback: boolean;
  isRegional?: boolean;
  visibleCount: number;
  visibleCells: QuadrangleFeature[];
}

interface ParsedHash {
  route: RouteName;
  slug: string;
}

function parseLocationHash(): ParsedHash {
  if (typeof window === 'undefined') {
    return { route: 'map', slug: DATASETS[0].slug };
  }
  const raw = window.location.hash.replace(/^#/, '') || '/';
  if (raw === '/katalog' || raw.startsWith('/katalog?')) {
    return { route: 'catalog', slug: DATASETS[0].slug };
  }
  if (raw === '/panduan' || raw.startsWith('/panduan#')) {
    return { route: 'faq', slug: DATASETS[0].slug };
  }
  if (raw.startsWith('/peta/')) {
    const slug = decodeURIComponent(raw.slice('/peta/'.length).split('?')[0]);
    const exists = DATASETS.some((d) => d.slug === slug);
    return {
      route: 'preview',
      slug: exists ? slug : DATASETS[0].slug,
    };
  }
  return { route: 'map', slug: DATASETS[0].slug };
}

function buildInitialLayers(): Record<LayerKey, boolean> {
  const rec = {} as Record<LayerKey, boolean>;
  for (const l of MAP_LAYERS) {
    rec[l.key] = l.defaultOn;
  }
  return rec;
}

function buildInitialOpacity(): Record<LayerKey, number> {
  const rec = {} as Record<LayerKey, number>;
  for (const l of MAP_LAYERS) {
    rec[l.key] = l.defaultOpacity;
  }
  return rec;
}

interface GeoMapContextValue {
  route: RouteName;
  previewSlug: string;
  activeDataset: GeoDataset;
  navigate: (route: RouteName, opts?: { slug?: string }) => void;

  darkMode: boolean;
  toggleDarkMode: () => void;
  basemap: BasemapType;
  setBasemap: (b: BasemapType) => void;
  isInstantKeyMode: boolean;

  mapLayers: Record<LayerKey, boolean>;
  layerOpacity: Record<LayerKey, number>;
  activeThematicCount: number;
  toggleLayer: (key: LayerKey, forceState?: boolean) => void;
  setLayerOpacity: (key: LayerKey, val: number) => void;
  resetAllLayers: () => void;

  mapScaleFilter: MapScaleFilter;
  selectMapScaleFilter: (scale: MapScaleFilter) => void;
  regionalIndexFilter: RegionalIndexFilter;
  regionalRegionFilter: RegionalIndexRegion;
  selectRegionalIndexFilter: (
    mode: RegionalIndexFilter,
    region?: RegionalIndexRegion,
  ) => void;
  selectRegionalRegionFilter: (region: RegionalIndexRegion) => void;
  syncScaleFromZoom: (nextZoom: number, prevZoom: number) => void;

  mapFormatFilter: LandingMapDataFormat;
  setMapFormatFilter: (fmt: LandingMapDataFormat) => void;
  mapTypeFilterIds: string[];
  toggleMapTypeFilter: (id: string) => void;
  resetMapDataFilter: () => void;

  mapFocusTarget: MapFocusTarget;
  focusLocation: (
    lat: number,
    lng: number,
    zoom: number,
    label?: string,
    enableLayer?: LayerKey,
  ) => void;
  focusQuadrangle: (
    quad: QuadrangleFeature,
    options?: {
      zoom?: number;
      preserveCurrentZoomIfVisible?: boolean;
      maxPreserveCellPx?: number;
    },
  ) => void;
  openDatasetOnMainMap: (ds: GeoDataset) => void;
  resetIndonesiaExtent: () => void;

  mapStats: { lat: number; lng: number; zoom: number; scaleLabel: string };
  setMapStats: (stats: {
    lat: number;
    lng: number;
    zoom: number;
    scaleLabel: string;
  }) => void;

  mapDimension: MapDimensionMode;
  setMapDimension: (mode: MapDimensionMode) => void;
  mapPitchDeg: number;
  setMapPitchDeg: (deg: number) => void;

  nlpGridStats: NlpGridTelemetry | null;
  setNlpGridStats: (next: NlpGridTelemetry | null) => void;

  mapPopup: MapInspectorPopup | null;
  setMapPopup: (popup: MapInspectorPopup | null) => void;
  mapPopupDocked: boolean;
  setMapPopupDocked: (docked: boolean) => void;
  dockMapPopupForManeuver: () => void;

  layerPanelOpen: boolean;
  setLayerPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mobileNavOpen: boolean;
  setMobileNavOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mobileSheetOpen: boolean;
  setMobileSheetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mobileSheetDetent: SheetDetent;
  setMobileSheetDetent: (detent: SheetDetent) => void;

  mapSearchQuery: string;
  setMapSearchQuery: (q: string) => void;
  registerSearchInput: (el: HTMLInputElement | null) => void;
  searchHistory: SearchHistoryItem[];
  recordSearchHistory: (entry: SearchHistoryInput) => void;
  removeSearchHistoryItem: (id: string) => void;
  clearSearchHistory: () => void;

  catQuery: string;
  setCatQuery: (q: string) => void;
  catRegion: RegionFilter;
  setCatRegion: (r: RegionFilter) => void;
  catTheme: 'Semua' | ThemeCluster;
  setCatTheme: (t: 'Semua' | ThemeCluster) => void;
  catScale: string;
  setCatScale: (s: string) => void;
  catFormat: FormatFilter;
  setCatFormat: (f: FormatFilter) => void;
  catSort: SortMode;
  setCatSort: (s: SortMode) => void;
  catViewMode: ViewMode;
  setCatViewMode: (v: ViewMode) => void;
  resetCatalogFilters: () => void;
  triggerEmptyStateTest: () => void;

  user: AuthUser | null;
  authModalOpen: boolean;
  authContextMsg: string;
  pendingDownload: PendingDownload | null;
  openAuthModal: (msg?: string) => void;
  closeAuthModal: () => void;
  loginUser: (profile: { name: string; email: string; role: string }) => void;
  logoutUser: () => void;
  requestDownload: (dataset: GeoDataset, format: 'GeoPDF' | 'SHP') => void;
}

const GeoMapContext = createContext<GeoMapContextValue | null>(null);

export const GeoMapProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const initialHash = useMemo(() => parseLocationHash(), []);
  const [route, setRoute] = useState<RouteName>(initialHash.route);
  const [previewSlug, setPreviewSlug] = useState<string>(initialHash.slug);

  const [darkMode, setDarkMode] = useState(false);
  const [basemap, setBasemapState] = useState<BasemapType>('sat');
  const [isInstantKeyMode, setIsInstantKeyMode] = useState(false);
  const [mapDimension, setMapDimensionState] = useState<MapDimensionMode>('2d');
  const [mapPitchDeg, setMapPitchDegState] = useState<number>(60);

  const setMapDimension = useCallback((mode: MapDimensionMode) => {
    setMapDimensionState(mode);
  }, []);

  const setMapPitchDeg = useCallback((deg: number) => {
    const clamped = Math.max(25, Math.min(75, Math.round(deg)));
    setMapPitchDegState(clamped);
  }, []);

  const [mapLayers, setMapLayers] = useState<Record<LayerKey, boolean>>(
    buildInitialLayers,
  );
  const [layerOpacity, setLayerOpacityState] = useState<
    Record<LayerKey, number>
  >(buildInitialOpacity);
  const [mapFormatFilter, setMapFormatFilter] =
    useState<LandingMapDataFormat>('Semua');
  const [mapTypeFilterIds, setMapTypeFilterIds] = useState<string[]>([]);

  const [mapFocusTarget, setMapFocusTarget] = useState<MapFocusTarget>({
    lat: -2.5,
    lng: 118.0,
    zoom: 5,
    label: 'Indonesia (Nasional)',
    seq: 0,
  });

  const [mapStats, setMapStatsState] = useState({
    lat: -2.5,
    lng: 118.0,
    zoom: 5,
    scaleLabel: '1:20.000.000',
  });
  const setMapStats = useCallback(
    (next: { lat: number; lng: number; zoom: number; scaleLabel: string }) => {
      setMapStatsState((prev) => {
        if (
          prev.zoom === next.zoom &&
          prev.scaleLabel === next.scaleLabel &&
          Math.round(prev.lat * 100) === Math.round(next.lat * 100) &&
          Math.round(prev.lng * 100) === Math.round(next.lng * 100)
        ) {
          return prev;
        }
        return next;
      });
    },
    [],
  );
  const [nlpGridStats, setNlpGridStatsState] = useState<NlpGridTelemetry | null>(null);
  const setNlpGridStats = useCallback((next: NlpGridTelemetry | null) => {
    setNlpGridStatsState((prev) => {
      if (prev === next) return prev;
      if (!prev || !next) return next;
      if (
        prev.requestedScale === next.requestedScale &&
        prev.renderedScale === next.renderedScale &&
        prev.isParentFallback === next.isParentFallback &&
        Boolean(prev.isRegional) === Boolean(next.isRegional) &&
        prev.visibleCount === next.visibleCount &&
        prev.visibleCells.length === next.visibleCells.length &&
        prev.visibleCells.every((c, i) => c.code === next.visibleCells[i]?.code)
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const [mapPopup, setMapPopupState] = useState<MapInspectorPopup | null>(null);
  const [mapPopupDocked, setMapPopupDocked] = useState(false);
  const mapPopupRef = useRef<MapInspectorPopup | null>(mapPopup);
  mapPopupRef.current = mapPopup;
  const mapPopupDockedRef = useRef<boolean>(mapPopupDocked);
  mapPopupDockedRef.current = mapPopupDocked;
  const [mapScaleFilter, setMapScaleFilter] = useState<MapScaleFilter>(null);
  const [regionalIndexFilter, setRegionalIndexFilter] =
    useState<RegionalIndexFilter>(null);
  const [regionalRegionFilter, setRegionalRegionFilter] =
    useState<RegionalIndexRegion>('Semua');
  const lastScaleRef = useRef<MapScaleValue>('1:250.000');
  const lastRegionalModeRef = useRef<RegionalIndexMode>('all');
  const lastIndexKindRef = useRef<'scale' | 'regional'>('scale');
  const mapLayersGridRef = useRef<boolean>(mapLayers.grid);
  mapLayersGridRef.current = mapLayers.grid;
  const mapScaleFilterRef = useRef<MapScaleFilter>(mapScaleFilter);
  mapScaleFilterRef.current = mapScaleFilter;
  const regionalIndexFilterRef = useRef<RegionalIndexFilter>(regionalIndexFilter);
  regionalIndexFilterRef.current = regionalIndexFilter;
  const regionalRegionFilterRef = useRef<RegionalIndexRegion>(regionalRegionFilter);
  regionalRegionFilterRef.current = regionalRegionFilter;
  const [layerPanelOpen, setLayerPanelOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mobileSheetDetent, setMobileSheetDetent] =
    useState<SheetDetent>('ringkas');

  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const activeSearchInputRef = useRef<HTMLInputElement | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(
    loadSearchHistory,
  );

  useEffect(() => {
    persistSearchHistory(searchHistory);
  }, [searchHistory]);

  const recordSearchHistory = useCallback((entry: SearchHistoryInput) => {
    const nextItem = buildSearchHistoryItem(entry);
    setSearchHistory((prev) =>
      [nextItem, ...prev.filter((item) => item.id !== nextItem.id)].slice(
        0,
        MAX_SEARCH_HISTORY,
      ),
    );
  }, []);

  const removeSearchHistoryItem = useCallback((id: string) => {
    setSearchHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  const [catQuery, setCatQuery] = useState('');
  const [catRegion, setCatRegion] = useState<RegionFilter>('Semua');
  const [catTheme, setCatTheme] = useState<'Semua' | ThemeCluster>('Semua');
  const [catScale, setCatScale] = useState('Semua');
  const [catFormat, setCatFormat] = useState<FormatFilter>('Semua');
  const [catSort, setCatSort] = useState<SortMode>('populer');
  const [catViewMode, setCatViewMode] = useState<ViewMode>('card');

  const [user, setUser] = useState<AuthUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authContextMsg, setAuthContextMsg] = useState(
    'Masuk untuk mengakses unduhan GeoPDF resolusi penuh & paket vektor (.SHP). Status peta, filter, dan layer Anda tetap tersimpan.',
  );
  const [pendingDownload, setPendingDownload] =
    useState<PendingDownload | null>(null);

  const registerSearchInput = useCallback((el: HTMLInputElement | null) => {
    activeSearchInputRef.current = el;
  }, []);

  const navigate = useCallback(
    (targetRoute: RouteName, opts?: { slug?: string }) => {
      setMobileNavOpen(false);
      let nextHash = '#/';
      if (targetRoute === 'catalog') {
        nextHash = '#/katalog';
      } else if (targetRoute === 'faq') {
        nextHash = '#/panduan';
      } else if (targetRoute === 'preview') {
        const slug = opts?.slug ?? previewSlug;
        setPreviewSlug(slug);
        nextHash = `#/peta/${encodeURIComponent(slug)}`;
      }
      setRoute(targetRoute);
      if (typeof window !== 'undefined' && window.location.hash !== nextHash) {
        window.location.hash = nextHash;
      }
      if (targetRoute !== 'map' && typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    },
    [previewSlug],
  );

  // Sync browser back/forward hash navigation
  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseLocationHash();
      setRoute(parsed.route);
      if (parsed.route === 'preview') {
        setPreviewSlug(parsed.slug);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const setMapPopup = useCallback((popup: MapInspectorPopup | null) => {
    setMapPopupState(popup);
    setMapPopupDocked(false);
  }, []);

  const shortcutStateRef = useRef({
    route,
    navigate,
    authModalOpen,
    mobileNavOpen,
    mapPopup,
    setMapPopup,
  });
  shortcutStateRef.current = {
    route,
    navigate,
    authModalOpen,
    mobileNavOpen,
    mapPopup,
    setMapPopup,
  };

  // Global keyboard shortcuts (Cmd+K / Ctrl+K / '/' to focus search; instant key mode tracking)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      setIsInstantKeyMode(true);
      const {
        route: currRoute,
        navigate: nav,
        authModalOpen: isAuthOpen,
        mobileNavOpen: isMobNavOpen,
        mapPopup: currPopup,
        setMapPopup: updatePopup,
      } = shortcutStateRef.current;

      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (currRoute === 'preview') {
          nav('catalog');
          setTimeout(() => activeSearchInputRef.current?.focus(), 40);
        } else {
          activeSearchInputRef.current?.focus();
          activeSearchInputRef.current?.select();
        }
        return;
      }

      if (e.key === '/' && !isTyping && !isAuthOpen) {
        e.preventDefault();
        if (currRoute === 'preview') {
          nav('catalog');
          setTimeout(() => activeSearchInputRef.current?.focus(), 40);
        } else {
          activeSearchInputRef.current?.focus();
        }
        return;
      }

      if (e.key === 'Escape') {
        if (isAuthOpen) {
          setAuthModalOpen(false);
          setPendingDownload(null);
        } else if (isMobNavOpen) {
          setMobileNavOpen(false);
        } else if (currPopup) {
          updatePopup(null);
        }
      }
    };

    const onPointerDown = () => {
      setIsInstantKeyMode((prev) => (prev ? false : prev));
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  const setBasemap = useCallback((b: BasemapType) => {
    setBasemapState(b);
  }, []);

  const clearQuadranglePopup = useCallback(() => {
    setMapPopupState((p) => (p?.kind === 'quadrangle' ? null : p));
    if (mapPopupRef.current?.kind === 'quadrangle') {
      setMapPopupDocked(false);
    }
  }, []);

  const dockMapPopupForManeuver = useCallback(() => {
    if (!mapPopupRef.current) return;
    const isNarrowMobile =
      typeof window !== 'undefined' && window.innerWidth < 640;
    if (isNarrowMobile) {
      setMapPopupState(null);
      setMapPopupDocked(false);
      return;
    }
    if (mapPopupDockedRef.current) return;
    setMapPopupDocked(true);
  }, []);

  const toggleLayer = useCallback(
    (key: LayerKey, forceState?: boolean) => {
      if (key === 'grid') {
        const nextVal =
          forceState !== undefined ? forceState : !mapLayersGridRef.current;
        if (nextVal) {
          if (lastIndexKindRef.current === 'regional') {
            setMapScaleFilter(null);
            setRegionalIndexFilter((curr) => curr ?? lastRegionalModeRef.current);
          } else {
            setRegionalIndexFilter(null);
            setMapScaleFilter((curr) => curr ?? lastScaleRef.current);
          }
        } else {
          setMapScaleFilter(null);
          setRegionalIndexFilter(null);
          setRegionalRegionFilter('Semua');
          clearQuadranglePopup();
        }
        setMapLayers((prev) => ({ ...prev, grid: nextVal }));
        return;
      }

      setMapLayers((prev) => {
        const nextVal = forceState !== undefined ? forceState : !prev[key];
        return { ...prev, [key]: nextVal };
      });
    },
    [clearQuadranglePopup],
  );

  const setLayerOpacity = useCallback((key: LayerKey, val: number) => {
    const clamped = Math.max(20, Math.min(100, val));
    setLayerOpacityState((prev) => ({ ...prev, [key]: clamped }));
  }, []);

  const resetIndonesiaExtent = useCallback(() => {
    dockMapPopupForManeuver();
    setMapFocusTarget((prev) => ({
      lat: -2.5,
      lng: 118.0,
      zoom: 5,
      label: 'Nasional Indonesia',
      seq: prev.seq + 1,
    }));
  }, [dockMapPopupForManeuver]);

  const selectMapScaleFilter = useCallback(
    (scale: MapScaleFilter) => {
      const resolved: MapScaleFilter =
        scale !== null && mapScaleFilter === scale ? null : scale;
      setMapScaleFilter(resolved);

      if (resolved === null) {
        setRegionalIndexFilter(null);
        setRegionalRegionFilter('Semua');
        setMapLayers((prev) => ({ ...prev, grid: false }));
        clearQuadranglePopup();
        return;
      }

      lastIndexKindRef.current = 'scale';
      lastScaleRef.current = resolved;
      setRegionalIndexFilter(null);
      setRegionalRegionFilter('Semua');
      const meta = HIGHLIGHT_MAP_SCALES.find((m) => m.value === resolved);
      const activeCenteredQuad =
        !mapPopupDockedRef.current && mapPopupRef.current?.kind === 'quadrangle'
          ? mapPopupRef.current.item
          : null;
      setMapLayers((prev) => ({ ...prev, grid: true }));
      clearQuadranglePopup();

      if (meta) {
        setMapFocusTarget((prev) => ({
          lat: activeCenteredQuad ? activeCenteredQuad.center[0] : prev.lat,
          lng: activeCenteredQuad ? activeCenteredQuad.center[1] : prev.lng,
          zoom: meta.targetZoom,
          label: `Indeks Skala ${resolved}`,
          seq: prev.seq + 1,
          preserveCurrentCenter: !activeCenteredQuad,
        }));
      }
    },
    [clearQuadranglePopup, mapScaleFilter],
  );

  const selectRegionalIndexFilter = useCallback(
    (mode: RegionalIndexFilter, explicitRegion?: RegionalIndexRegion) => {
      if (mode === null) {
        setRegionalIndexFilter(null);
        setRegionalRegionFilter('Semua');
        setMapScaleFilter(null);
        setMapLayers((prev) => ({ ...prev, grid: false }));
        clearQuadranglePopup();
        return;
      }

      const isSameToggleOff =
        explicitRegion === undefined && regionalIndexFilterRef.current === mode;
      if (isSameToggleOff) {
        setRegionalIndexFilter(null);
        setRegionalRegionFilter('Semua');
        setMapLayers((prev) => ({ ...prev, grid: false }));
        clearQuadranglePopup();
        return;
      }

      const nextRegion: RegionalIndexRegion =
        mode === '100k'
          ? 'Semua'
          : explicitRegion ?? 'Semua';

      lastIndexKindRef.current = 'regional';
      lastRegionalModeRef.current = mode;
      setMapScaleFilter(null);
      setRegionalIndexFilter(mode);
      setRegionalRegionFilter(nextRegion);
      setMapLayers((prev) => ({ ...prev, grid: true }));
      clearQuadranglePopup();

      const regionMeta =
        nextRegion !== 'Semua'
          ? REGIONAL_REGION_OPTIONS.find((r) => r.value === nextRegion)
          : null;
      const modeMeta = REGIONAL_INDEX_OPTIONS.find((o) => o.value === mode);

      if (regionMeta) {
        setMapFocusTarget((prev) => ({
          lat: regionMeta.targetCenter[0],
          lng: regionMeta.targetCenter[1],
          zoom: regionMeta.targetZoom,
          label: `Indeks Regional · ${regionMeta.label}`,
          seq: prev.seq + 1,
        }));
      } else if (modeMeta) {
        setMapFocusTarget((prev) => ({
          lat: modeMeta.targetCenter[0],
          lng: modeMeta.targetCenter[1],
          zoom: modeMeta.targetZoom,
          label: modeMeta.badgeLabel,
          seq: prev.seq + 1,
        }));
      }
    },
    [clearQuadranglePopup],
  );

  const selectRegionalRegionFilter = useCallback(
    (region: RegionalIndexRegion) => {
      const currentMode = regionalIndexFilterRef.current ?? 'all';
      const nextMode: RegionalIndexMode =
        region === 'Jawa' && currentMode === '250k' ? 'all' : currentMode;
      selectRegionalIndexFilter(nextMode, region);
    },
    [selectRegionalIndexFilter],
  );

  const syncScaleFromZoom = useCallback((nextZoom: number, prevZoom: number) => {
    if (!mapLayersGridRef.current || regionalIndexFilterRef.current !== null) return;
    const nextScale = resolveMonotonicZoomScale({
      currentScale: mapScaleFilterRef.current,
      prevZoom,
      nextZoom,
    });
    if (nextScale !== mapScaleFilterRef.current) {
      lastScaleRef.current = nextScale;
      setMapScaleFilter(nextScale);
    }
  }, []);

  const toggleMapTypeFilter = useCallback((id: string) => {
    setMapTypeFilterIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const resetMapDataFilter = useCallback(() => {
    setMapFormatFilter('Semua');
    setMapTypeFilterIds([]);
  }, []);

  const resetAllLayers = useCallback(() => {
    setBasemap('sat');
    setMapLayers(buildInitialLayers());
    setLayerOpacityState(buildInitialOpacity());
    lastIndexKindRef.current = 'scale';
    lastScaleRef.current = '1:250.000';
    lastRegionalModeRef.current = 'all';
    setMapScaleFilter(null);
    setRegionalIndexFilter(null);
    setRegionalRegionFilter('Semua');
    setMapFormatFilter('Semua');
    setMapTypeFilterIds([]);
    setMapPopup(null);
    resetIndonesiaExtent();
  }, [resetIndonesiaExtent, setMapPopup]);

  const focusLocation = useCallback(
    (
      lat: number,
      lng: number,
      zoom: number,
      label?: string,
      enableLayer?: LayerKey,
    ) => {
      if (enableLayer) {
        setMapLayers((prev) => ({ ...prev, [enableLayer]: true }));
      }
      setMapFocusTarget((prev) => ({
        lat,
        lng,
        zoom,
        label,
        seq: prev.seq + 1,
      }));
    },
    [],
  );

  const focusQuadrangle = useCallback(
    (
      quad: QuadrangleFeature,
      options?: {
        zoom?: number;
        preserveCurrentZoomIfVisible?: boolean;
        maxPreserveCellPx?: number;
      },
    ) => {
      const targetZoom =
        options?.zoom ??
        HIGHLIGHT_MAP_SCALES.find((m) => m.value === quad.scale)?.targetZoom ??
        7;
      setMapLayers((prev) => (prev.grid ? prev : { ...prev, grid: true }));
      if (quad.isRegionalIndex) {
        setMapScaleFilter(null);
        lastIndexKindRef.current = 'regional';
        const curMode = regionalIndexFilterRef.current;
        const incompatibleScale =
          (curMode === '100k' && quad.scale !== '1:100.000') ||
          (curMode === '250k' && quad.scale !== '1:250.000');
        if (!curMode || incompatibleScale) {
          lastRegionalModeRef.current = 'all';
          setRegionalIndexFilter('all');
        }
        if (!matchesRegionalRegion(quad.region, regionalRegionFilterRef.current)) {
          setRegionalRegionFilter('Semua');
        }
      } else {
        if (regionalIndexFilterRef.current !== null) {
          setRegionalIndexFilter(null);
          setRegionalRegionFilter('Semua');
        }
        lastIndexKindRef.current = 'scale';
        if (!mapScaleFilterRef.current) {
          lastScaleRef.current = quad.scale;
          setMapScaleFilter(quad.scale);
        }
      }
      setMapPopup({ kind: 'quadrangle', item: quad });
      setMapFocusTarget((prev) => ({
        lat: quad.center[0],
        lng: quad.center[1],
        zoom: targetZoom,
        label: quad.name,
        seq: prev.seq + 1,
        anchorBounds: quad.bounds,
        preserveCurrentZoomIfVisible:
          options?.preserveCurrentZoomIfVisible ?? false,
        maxPreserveCellPx: options?.maxPreserveCellPx,
      }));
    },
    [setMapPopup],
  );

  const openDatasetOnMainMap = useCallback(
    (ds: GeoDataset) => {
      setMapLayers((prev) => ({
        ...prev,
        [ds.layerKey]: true,
      }));
      setMapFocusTarget((prev) => ({
        lat: ds.lat,
        lng: ds.lng,
        zoom: ds.zoom,
        label: ds.title,
        seq: prev.seq + 1,
      }));
      setMapPopup(null);
      navigate('map');
    },
    [navigate, setMapPopup],
  );

  const resetCatalogFilters = useCallback(() => {
    setCatQuery('');
    setCatRegion('Semua');
    setCatTheme('Semua');
    setCatScale('Semua');
    setCatFormat('Semua');
  }, []);

  const triggerEmptyStateTest = useCallback(() => {
    setCatQuery('Sesar Lembang Batu Alam Fiktif 2099');
  }, []);

  const executeDownload = useCallback(
    (currentUser: AuthUser, _dataset: GeoDataset, _format: 'GeoPDF' | 'SHP') => {
      if (currentUser.quotaUsed >= currentUser.quotaLimit) {
        return currentUser;
      }
      const nextUsed = currentUser.quotaUsed + 1;
      return { ...currentUser, quotaUsed: nextUsed };
    },
    [],
  );

  const openAuthModal = useCallback((msg?: string) => {
    if (msg) {
      setAuthContextMsg(msg);
    } else {
      setAuthContextMsg(
        'Masuk untuk membuka kuota 20 unduhan/hari (GeoPDF & Vektor .SHP). Pilihan halaman & layer Anda tidak akan hilang.',
      );
    }
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    setPendingDownload(null);
  }, []);

  const loginUser = useCallback(
    (profile: { name: string; email: string; role: string }) => {
      let nextUser: AuthUser = {
        name: profile.name,
        email: profile.email,
        role: profile.role,
        quotaUsed: 0,
        quotaLimit: 20,
      };
      const pending = pendingDownload;
      setPendingDownload(null);
      setAuthModalOpen(false);

      if (pending) {
        nextUser = executeDownload(nextUser, pending.dataset, pending.format);
      }
      setUser(nextUser);
    },
    [executeDownload, pendingDownload],
  );

  const logoutUser = useCallback(() => {
    setUser(null);
  }, []);

  const requestDownload = useCallback(
    (dataset: GeoDataset, format: 'GeoPDF' | 'SHP') => {
      if (format === 'SHP' && !dataset.hasShp) {
        return;
      }

      if (!user) {
        const size =
          format === 'SHP' ? dataset.fileSizeShp : dataset.fileSizeRaster;
        setPendingDownload({ dataset, format });
        setAuthContextMsg(
          `Masuk untuk mengunduh paket ${format} (${size}) "${dataset.title}". Peta, lembar aktif, dan filter Anda tetap tersimpan.`,
        );
        setAuthModalOpen(true);
        return;
      }

      setUser((prev) => (prev ? executeDownload(prev, dataset, format) : prev));
    },
    [executeDownload, user],
  );

  const activeDataset = useMemo(
    () => DATASETS.find((d) => d.slug === previewSlug) ?? DATASETS[0],
    [previewSlug],
  );

  const activeThematicCount = useMemo(
    () =>
      Object.entries(mapLayers).filter(
        ([k, v]) => v && k !== 'province',
      ).length,
    [mapLayers],
  );

  const value = useMemo<GeoMapContextValue>(
    () => ({
      route,
      previewSlug,
      activeDataset,
      navigate,
      darkMode,
      toggleDarkMode,
      basemap,
      setBasemap,
      isInstantKeyMode,
      mapLayers,
      layerOpacity,
      activeThematicCount,
      toggleLayer,
      setLayerOpacity,
      resetAllLayers,
      mapScaleFilter,
      selectMapScaleFilter,
      regionalIndexFilter,
      regionalRegionFilter,
      selectRegionalIndexFilter,
      selectRegionalRegionFilter,
      syncScaleFromZoom,
      mapFormatFilter,
      setMapFormatFilter,
      mapTypeFilterIds,
      toggleMapTypeFilter,
      resetMapDataFilter,
      mapFocusTarget,
      focusLocation,
      focusQuadrangle,
      openDatasetOnMainMap,
      resetIndonesiaExtent,
      mapStats,
      setMapStats,
      mapDimension,
      setMapDimension,
      mapPitchDeg,
      setMapPitchDeg,
      nlpGridStats,
      setNlpGridStats,
      mapPopup,
      setMapPopup,
      mapPopupDocked,
      setMapPopupDocked,
      dockMapPopupForManeuver,
      layerPanelOpen,
      setLayerPanelOpen,
      mobileNavOpen,
      setMobileNavOpen,
      mobileSheetOpen,
      setMobileSheetOpen,
      mobileSheetDetent,
      setMobileSheetDetent,
      mapSearchQuery,
      setMapSearchQuery,
      registerSearchInput,
      searchHistory,
      recordSearchHistory,
      removeSearchHistoryItem,
      clearSearchHistory,
      catQuery,
      setCatQuery,
      catRegion,
      setCatRegion,
      catTheme,
      setCatTheme,
      catScale,
      setCatScale,
      catFormat,
      setCatFormat,
      catSort,
      setCatSort,
      catViewMode,
      setCatViewMode,
      resetCatalogFilters,
      triggerEmptyStateTest,
      user,
      authModalOpen,
      authContextMsg,
      pendingDownload,
      openAuthModal,
      closeAuthModal,
      loginUser,
      logoutUser,
      requestDownload,
    }),
    [
      activeDataset,
      activeThematicCount,
      authContextMsg,
      authModalOpen,
      basemap,
      catFormat,
      catQuery,
      catRegion,
      catScale,
      catSort,
      catTheme,
      catViewMode,
      clearSearchHistory,
      closeAuthModal,
      darkMode,
      dockMapPopupForManeuver,
      focusLocation,
      focusQuadrangle,
      isInstantKeyMode,
      layerOpacity,
      layerPanelOpen,
      loginUser,
      logoutUser,
      mapFocusTarget,
      mapFormatFilter,
      mapLayers,
      mapDimension,
      mapPitchDeg,
      mapPopup,
      mapPopupDocked,
      mapScaleFilter,
      regionalIndexFilter,
      regionalRegionFilter,
      mapSearchQuery,
      mapStats,
      mapTypeFilterIds,
      nlpGridStats,
      resetMapDataFilter,
      mobileNavOpen,
      mobileSheetDetent,
      mobileSheetOpen,
      navigate,
      toggleMapTypeFilter,
      openAuthModal,
      openDatasetOnMainMap,
      pendingDownload,
      previewSlug,
      recordSearchHistory,
      registerSearchInput,
      removeSearchHistoryItem,
      requestDownload,
      resetAllLayers,
      resetCatalogFilters,
      resetIndonesiaExtent,
      route,
      searchHistory,
      selectMapScaleFilter,
      selectRegionalIndexFilter,
      selectRegionalRegionFilter,
      setBasemap,
      setLayerOpacity,
      setMapDimension,
      setMapPitchDeg,
      syncScaleFromZoom,
      toggleDarkMode,
      toggleLayer,
      triggerEmptyStateTest,
      user,
    ],
  );

  return (
    <GeoMapContext.Provider value={value}>{children}</GeoMapContext.Provider>
  );
};

export function useGeoMap(): GeoMapContextValue {
  const ctx = useContext(GeoMapContext);
  if (!ctx) {
    throw new Error('useGeoMap must be used inside GeoMapProvider');
  }
  return ctx;
}

