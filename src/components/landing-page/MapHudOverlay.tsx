import React, { useId, useMemo, useState } from 'react';
import { Check, ChevronDown, Clock, Home, Minus, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { type SearchHistoryItem, useGeoMap } from '../../context/GeoMapContext';
import {
  DATASETS,
  HIGHLIGHT_MAP_SCALES,
  LANDING_MAP_TYPE_FILTERS,
  QUADRANGLE_GRIDS,
  REGIONAL_INDEX_OPTIONS,
  REGIONAL_REGION_OPTIONS,
  VOLCANOES,
  matchesLandingTypeFilter,
  normalizeGeoQuery,
  type QuadrangleFeature,
} from '../../data/geomapData';
import {
  REGIONAL_INDEX_QUADRANGLES,
  generateRegionalIndexCells,
} from '../../utils/indonesiaNlpGrid';
import { useLeafletDomIsolation } from '../../hooks/useLeafletDomIsolation';
import { MapDimensionPill } from './MapDimensionPill';
import { MapFeatureInspector } from './MapFeatureInspector';

const ACTIVE_GRID_PATH =
  'M1.5 1.5H22.5V22.5H1.5V1.5ZM3.5 3.5V6.7H6.7V3.5H3.5ZM8.3 3.5V6.7H11.5V3.5H8.3ZM13.1 3.5V6.7H16.3V3.5H13.1ZM17.9 3.5V6.7H20.5V3.5H17.9ZM3.5 8.3V11.5H6.7V8.3H3.5ZM8.3 8.3V11.5H11.5V8.3H8.3ZM13.1 8.3V11.5H16.3V8.3H13.1ZM17.9 8.3V11.5H20.5V8.3H17.9ZM3.5 13.1V16.3H6.7V13.1H3.5ZM8.3 13.1V16.3H11.5V13.1H8.3ZM13.1 13.1V16.3H16.3V13.1H13.1ZM17.9 13.1V16.3H20.5V13.1H17.9ZM3.5 17.9V20.5H6.7V17.9H3.5ZM8.3 17.9V20.5H11.5V17.9H8.3ZM13.1 17.9V20.5H16.3V17.9H13.1ZM17.9 17.9V20.5H20.5V17.9H17.9Z';

const HIDE_GRID_PATH =
  'M1 1H20.2V20.2H1V1ZM2.6 2.6V5.4H5.4V2.6H2.6ZM7 2.6V5.4H9.8V2.6H7ZM11.4 2.6V5.4H14.2V2.6H11.4ZM15.8 2.6V5.4H18.6V2.6H15.8ZM2.6 7V9.8H5.4V7H2.6ZM7 7V9.8H9.8V7H7ZM11.4 7V9.8H14.2V7H11.4ZM15.8 7V9.8H18.6V7H15.8ZM2.6 11.4V14.2H5.4V11.4H2.6ZM7 11.4V14.2H9.8V11.4H7ZM11.4 11.4V14.2H14.2V11.4H11.4ZM15.8 11.4V14.2H18.6V11.4H15.8ZM2.6 15.8V18.6H5.4V15.8H2.6ZM7 15.8V18.6H9.8V15.8H7ZM11.4 15.8V18.6H14.2V15.8H11.4ZM15.8 15.8V18.6H18.6V15.8H15.8Z';

/** Alternating 4x4 grid icon: eye-slashed grid when hidden, full 4x4 grid when active. */
const GridIndexStateIcon: React.FC<{ active: boolean }> = ({ active }) => {
  const maskBaseId = useId();
  const gridCutId = `${maskBaseId}-grid-cut`;
  const slashCutId = `${maskBaseId}-slash-cut`;

  if (active) {
    return (
      <svg
        key="grid-active"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="gm-grid-icon-swap h-4 w-4 shrink-0"
      >
        <path fill="currentColor" fillRule="evenodd" d={ACTIVE_GRID_PATH} />
      </svg>
    );
  }

  return (
    <svg
      key="grid-hide"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
    >
      <defs>
        <mask id={gridCutId} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <path
            d="M8.8 17.5C11.4 13.1 21 13.1 23.6 17.5C21 21.9 11.4 21.9 8.8 17.5Z"
            fill="black"
            stroke="black"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <line x1="21.5" y1="11.4" x2="11.3" y2="23.2" stroke="black" strokeWidth="4.4" />
        </mask>
        <mask id={slashCutId} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <line x1="21.5" y1="11.4" x2="11.3" y2="23.2" stroke="black" strokeWidth="3.6" />
        </mask>
      </defs>
      <path mask={`url(#${gridCutId})`} fill="currentColor" fillRule="evenodd" d={HIDE_GRID_PATH} />
      <g mask={`url(#${slashCutId})`}>
        <path
          d="M9.6 17.5C11.9 13.7 20.5 13.7 22.8 17.5C20.5 21.3 11.9 21.3 9.6 17.5Z"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="16.2" cy="17.5" r="2.15" fill="currentColor" />
      </g>
      <line
        x1="21.2"
        y1="11.8"
        x2="11.6"
        y2="22.8"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="butt"
      />
    </svg>
  );
};

interface MapHudOverlayProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export const MapHudOverlay: React.FC<MapHudOverlayProps> = ({
  onZoomIn,
  onZoomOut,
}) => {
  const {
    mapLayers,
    toggleLayer,
    mapSearchQuery,
    setMapSearchQuery,
    registerSearchInput,
    searchHistory,
    recordSearchHistory,
    removeSearchHistoryItem,
    clearSearchHistory,
    openDatasetOnMainMap,
    focusLocation,
    focusQuadrangle,
    resetIndonesiaExtent,
    mapPopup,
    setMapPopup,
    mapPopupDocked,
    mapScaleFilter,
    regionalIndexFilter,
    regionalRegionFilter,
    nlpGridStats,
    selectMapScaleFilter,
    selectRegionalIndexFilter,
    selectRegionalRegionFilter,
    mapFormatFilter,
    setMapFormatFilter,
    mapTypeFilterIds,
    toggleMapTypeFilter,
    resetMapDataFilter,
    setCatScale,
    navigate,
    darkMode,
  } = useGeoMap();

  const leftHudRef = useLeafletDomIsolation<HTMLDivElement>();
  const [searchFocused, setSearchFocused] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [indexPanelOpen, setIndexPanelOpen] = useState(true);

  const rawLower = mapSearchQuery.trim().toLowerCase();
  const normalized = normalizeGeoQuery(mapSearchQuery);

  const effectiveActiveScale =
    mapScaleFilter && mapLayers.grid
      ? nlpGridStats && !nlpGridStats.isRegional
        ? nlpGridStats.renderedScale
        : mapScaleFilter
      : mapScaleFilter;
  const activeRegionalMeta =
    regionalIndexFilter && mapLayers.grid
      ? REGIONAL_INDEX_OPTIONS.find((o) => o.value === regionalIndexFilter) ?? null
      : null;
  const isGridIndexActive = Boolean(
    mapLayers.grid && (effectiveActiveScale || activeRegionalMeta),
  );
  const headerIndexBadgeLabel = !isGridIndexActive
    ? 'Nonaktif'
    : activeRegionalMeta
      ? activeRegionalMeta.badgeLabel
      : effectiveActiveScale;

  const visibleRegionalCount = useMemo(() => {
    if (!regionalIndexFilter) return REGIONAL_INDEX_QUADRANGLES.length;
    return generateRegionalIndexCells({
      mode: regionalIndexFilter,
      regionFilter: regionalRegionFilter,
    }).totalCatalogCount;
  }, [regionalIndexFilter, regionalRegionFilter]);

  const filteredTypeOptions = useMemo(
    () =>
      LANDING_MAP_TYPE_FILTERS.filter(
        (item) => mapFormatFilter === 'Semua' || item.format === mapFormatFilter,
      ),
    [mapFormatFilter],
  );

  const filteredCatalogDatasets = useMemo(
    () =>
      DATASETS.filter((d) => {
        const matchesScale = regionalIndexFilter
          ? regionalIndexFilter === '100k'
            ? d.scale === '1:100.000'
            : regionalIndexFilter === '250k'
              ? d.scale === '1:250.000'
              : d.scale === '1:100.000' || d.scale === '1:250.000'
          : !mapScaleFilter || d.scale === mapScaleFilter;
        return (
          matchesScale &&
          matchesLandingTypeFilter(d, mapFormatFilter, mapTypeFilterIds)
        );
      }),
    [mapScaleFilter, regionalIndexFilter, mapFormatFilter, mapTypeFilterIds],
  );

  const hasActiveDataFilter =
    mapFormatFilter !== 'Semua' || mapTypeFilterIds.length > 0;

  const searchMatches = useMemo(() => {
    if (!rawLower && !normalized) {
      return { quadrangles: [], datasets: [], volcanoes: [] };
    }

    const matchesQuadQuery = (q: QuadrangleFeature) => {
      const hay = `${q.code} ${q.name} ${q.scale} ${q.region} ${q.themeCode ?? ''} ${q.locationLabel ?? ''} ${q.compilers ?? ''}`.toLowerCase();
      return hay.includes(normalized) || (rawLower ? hay.includes(rawLower) : false);
    };

    const catalogQuads = QUADRANGLE_GRIDS.filter((q) => {
      if (mapScaleFilter && q.scale !== mapScaleFilter) return false;
      if (regionalIndexFilter === '100k' && q.scale !== '1:100.000') return false;
      if (regionalIndexFilter === '250k' && q.scale !== '1:250.000') return false;
      if (
        regionalIndexFilter === 'all' &&
        q.scale !== '1:100.000' &&
        q.scale !== '1:250.000'
      ) {
        return false;
      }
      return matchesQuadQuery(q);
    });

    const regionalQuads = REGIONAL_INDEX_QUADRANGLES.filter((q) => {
      if (mapScaleFilter && q.scale !== mapScaleFilter) return false;
      if (regionalIndexFilter === '100k' && q.scale !== '1:100.000') return false;
      if (regionalIndexFilter === '250k' && q.scale !== '1:250.000') return false;
      return matchesQuadQuery(q);
    });

    const primaryPool = regionalIndexFilter
      ? [...regionalQuads, ...catalogQuads]
      : [...catalogQuads, ...regionalQuads];

    const seenQuads = new Set<string>();
    const quads: QuadrangleFeature[] = [];
    for (const q of primaryPool) {
      const dedupeKey = `${q.scale}::${q.code}`;
      if (seenQuads.has(dedupeKey)) continue;
      seenQuads.add(dedupeKey);
      quads.push(q);
      if (quads.length >= 3) break;
    }

    const ds = DATASETS.filter((d) => {
      if (mapScaleFilter && d.scale !== mapScaleFilter) return false;
      if (regionalIndexFilter === '100k' && d.scale !== '1:100.000') return false;
      if (regionalIndexFilter === '250k' && d.scale !== '1:250.000') return false;
      if (!matchesLandingTypeFilter(d, mapFormatFilter, mapTypeFilterIds)) {
        return false;
      }
      const text = `${d.title} ${d.theme} ${d.region} ${d.sheetCode}`.toLowerCase();
      return text.includes(normalized) || (rawLower ? text.includes(rawLower) : false);
    }).slice(0, 4);

    const exactVols = VOLCANOES.filter(
      (v) =>
        rawLower &&
        (v.name.toLowerCase().includes(rawLower) ||
          v.province.toLowerCase().includes(rawLower)),
    );
    const broadVols =
      exactVols.length > 0
        ? exactVols
        : VOLCANOES.filter(
            (v) =>
              v.name.toLowerCase().includes(normalized) ||
              v.province.toLowerCase().includes(normalized) ||
              normalized.includes('gunung api'),
          );

    return { quadrangles: quads, datasets: ds, volcanoes: broadVols.slice(0, 3) };
  }, [
    mapFormatFilter,
    mapScaleFilter,
    regionalIndexFilter,
    mapTypeFilterIds,
    normalized,
    rawLower,
  ]);

  const handleSelectQuad = (quad: QuadrangleFeature) => {
    focusQuadrangle(quad, {
      preserveCurrentZoomIfVisible: true,
      maxPreserveCellPx: 220,
    });
  };

  const handlePickQuadrangle = (quad: QuadrangleFeature, query?: string) => {
    handleSelectQuad(quad);
    recordSearchHistory({ kind: 'quadrangle', quad, query });
    setSearchFocused(false);
  };

  const handlePickVolcano = (
    v: (typeof VOLCANOES)[number],
    query?: string,
  ) => {
    focusLocation(v.lat, v.lng, 9, v.name, 'volcano');
    setMapPopup({ kind: 'volcano', item: v });
    recordSearchHistory({ kind: 'volcano', volcano: v, query });
    setSearchFocused(false);
  };

  const handlePickDataset = (
    ds: (typeof DATASETS)[number],
    query?: string,
  ) => {
    openDatasetOnMainMap(ds);
    recordSearchHistory({ kind: 'dataset', dataset: ds, query });
    setSearchFocused(false);
  };

  const handleRestoreHistoryItem = (item: SearchHistoryItem) => {
    if (item.kind === 'quadrangle') {
      handlePickQuadrangle(item.quad, item.query);
    } else if (item.kind === 'volcano') {
      handlePickVolcano(item.volcano, item.query);
    } else {
      handlePickDataset(item.dataset, item.query);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFocused(true);
    if (searchMatches.quadrangles.length > 0) {
      handlePickQuadrangle(searchMatches.quadrangles[0], mapSearchQuery);
    } else if (searchMatches.volcanoes.length > 0) {
      handlePickVolcano(searchMatches.volcanoes[0], mapSearchQuery);
    } else if (searchMatches.datasets.length > 0) {
      handlePickDataset(searchMatches.datasets[0], mapSearchQuery);
    }
  };

  return (
    <>
      {/* TOP-LEFT HUD (Opsi 1): Pencarian Terpisah + Indeks Skala Akordion (Buka–Tutup) + Dock Zoom */}
      <div
        ref={leftHudRef}
        className={[
          'pointer-events-none absolute top-3 left-3 right-3 z-20 flex max-h-[calc(100%-24px)] flex-col items-start gap-2 sm:right-auto sm:w-[320px] md:w-[332px] lg:w-[348px] transition-[width] duration-200',
          mapPopup && mapPopupDocked ? 'sm:h-[calc(100%-24px)]' : '',
        ].join(' ')}
      >
        {/* KELOMPOK ATAS: Pencarian + Indeks Skala Peta + Filter Popover sejajar tinggi */}
        <div className="relative flex w-full shrink-0 flex-col gap-2 pointer-events-none">
          {/* 1) KARTU PENCARIAN TERPISAH */}
          <div className="relative w-full pointer-events-none">
            <div
              id="map-search-card"
              className="gm-hud gm-scroll pointer-events-auto w-full max-h-[42vh] flex-initial overflow-y-auto p-2"
            >
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            className="flex items-center gap-1.5"
          >
            <label htmlFor="map-smart-search" className="sr-only">
              Cari lokasi atau koleksi peta
            </label>
            <span className="pl-1.5 shrink-0" style={{ color: 'var(--s-hud-muted)' }}>
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <input
              ref={(el) => registerSearchInput(el)}
              id="map-smart-search"
              type="search"
              enterKeyHint="search"
              value={mapSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 160)}
              onChange={(e) => setMapSearchQuery(e.target.value)}
              placeholder="Cari lokasi, lembar, atau tema..."
              aria-label="Cari lokasi atau koleksi peta"
              className="gm-focus min-w-0 flex-1 border-0 bg-transparent px-1 py-1 text-xs focus:outline-none"
              style={{ color: 'var(--s-hud-fg)' }}
            />
            {mapSearchQuery && (
              <button
                type="button"
                onClick={() => setMapSearchQuery('')}
                className="gm-focus gm-press gm-touch-target shrink-0 rounded-lg p-1 cursor-pointer"
                style={{ color: 'var(--s-hud-muted)' }}
                aria-label="Hapus kata kunci pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setFilterOpen((prev) => !prev);
                setSearchFocused(false);
              }}
              aria-expanded={filterOpen}
              aria-controls="map-search-filter-panel"
              aria-label="Filter jenis peta SHP dan Raster"
              className="gm-focus gm-press inline-flex shrink-0 items-center gap-1 rounded-[9px] border px-2 py-1 text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors"
              style={
                hasActiveDataFilter || filterOpen
                  ? {
                      backgroundColor: '#233C5A',
                      borderColor: '#233C5A',
                      color: '#FFFFFF',
                    }
                  : {
                      backgroundColor: 'var(--s-hud-chip-bg)',
                      borderColor: 'var(--s-hud-border)',
                      color: 'var(--s-hud-fg)',
                    }
              }
            >
              <SlidersHorizontal className="h-3 w-3" aria-hidden="true" />
              <span>Filter</span>
              {hasActiveDataFilter && (
                <span className="gm-micro tabular-nums rounded-full bg-white/20 px-1.5 text-[10px] font-bold">
                  {mapTypeFilterIds.length > 0
                    ? mapTypeFilterIds.length
                    : mapFormatFilter}
                </span>
              )}
            </button>
            <button
              type="submit"
              className="gm-cta-primary gm-focus shrink-0 rounded-[9px] px-2.5 py-1 text-[11px] whitespace-nowrap cursor-pointer"
            >
              Cari
            </button>
          </form>

          {/* Zero-State Search History: Muncul bersih hanya saat fokus pencarian kosong */}
          {!filterOpen && searchFocused && !normalized && (
            <div
              role="region"
              aria-label="History Pencarian Saya"
              className="gm-popover-tl mt-2 border-t pt-2.5 px-1 pb-1"
              style={{ borderColor: 'var(--s-hud-border)' }}
            >
              <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
                <span
                  className="gm-micro text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--s-hud-muted)' }}
                >
                  History Pencarian Saya
                </span>
                {searchHistory.length > 0 ? (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={clearSearchHistory}
                    aria-label="Hapus semua riwayat pencarian"
                    className="gm-focus gm-press gm-micro rounded px-1.5 py-0.5 text-[10px] font-semibold cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
                    style={{ color: 'var(--s-hud-muted)' }}
                  >
                    Hapus semua
                  </button>
                ) : (
                  <span
                    className="gm-micro text-[10px]"
                    style={{ color: 'var(--s-hud-muted)' }}
                  >
                    0 tersimpan
                  </span>
                )}
              </div>

              {searchHistory.length === 0 ? (
                <div
                  className="rounded-[10px] px-2.5 py-2.5 text-center"
                  style={{
                    backgroundColor: 'var(--s-hud-chip-bg)',
                    boxShadow: 'inset 0 0 0 1px var(--s-hud-border)',
                  }}
                >
                  <p className="text-[11px] font-semibold">
                    Belum ada riwayat pencarian
                  </p>
                  <p
                    className="mt-0.5 text-[10px]"
                    style={{ color: 'var(--s-hud-muted)' }}
                  >
                    Cari lokasi, lembar peta, atau gunung api untuk menyimpannya di sini.
                  </p>
                </div>
              ) : (
                <div className="gm-scroll max-h-52 space-y-1 overflow-y-auto">
                  {searchHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1 rounded-[9px] pr-1 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleRestoreHistoryItem(item)}
                        className="gm-focus gm-press flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs cursor-pointer"
                      >
                        <Clock
                          className="h-3.5 w-3.5 shrink-0 opacity-60"
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold">
                            {item.label}
                          </div>
                          <div className="truncate tabular-nums text-[10px] opacity-75">
                            {item.subtitle}
                          </div>
                        </div>
                        {item.kind === 'volcano' && (
                          <span
                            className="shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-bold text-white"
                            style={{ backgroundColor: item.volcano.color }}
                          >
                            {item.volcano.level}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => removeSearchHistoryItem(item.id)}
                        aria-label={`Hapus ${item.label} dari riwayat`}
                        title="Hapus item riwayat"
                        className="gm-focus gm-press shrink-0 rounded-md p-1.5 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
                        style={{ color: 'var(--s-hud-muted)' }}
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Live Search Suggestions */}
          {searchFocused && normalized && (
            <div
              className="gm-popover-tl gm-scroll gm-scroll-mask mt-2 max-h-56 space-y-1 overflow-y-auto border-t pt-2"
              style={{ borderColor: 'var(--s-hud-border)' }}
            >
              {searchMatches.quadrangles.length === 0 &&
              searchMatches.datasets.length === 0 &&
              searchMatches.volcanoes.length === 0 ? (
                <div className="space-y-1.5 px-2.5 py-2 text-xs">
                  <p className="font-semibold">
                    Tidak ada lembar cocok untuk &ldquo;{mapSearchQuery}&rdquo;
                    {mapScaleFilter
                      ? ` pada skala ${mapScaleFilter}`
                      : activeRegionalMeta
                        ? ` pada ${activeRegionalMeta.badgeLabel}`
                        : ''}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mapScaleFilter && (
                      <button
                        type="button"
                        onClick={() => selectMapScaleFilter(null)}
                        className="gm-focus gm-press text-[11px] font-semibold underline cursor-pointer"
                      >
                        Reset filter skala
                      </button>
                    )}
                    {regionalIndexFilter && (
                      <button
                        type="button"
                        onClick={() => selectRegionalIndexFilter(null)}
                        className="gm-focus gm-press text-[11px] font-semibold underline cursor-pointer"
                      >
                        Reset filter regional
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (mapScaleFilter) {
                          setCatScale(mapScaleFilter);
                        } else if (regionalIndexFilter === '100k') {
                          setCatScale('1:100.000');
                        } else if (regionalIndexFilter === '250k') {
                          setCatScale('1:250.000');
                        }
                        navigate('catalog');
                      }}
                      className="gm-focus gm-press text-[11px] font-semibold underline cursor-pointer"
                      style={{
                        color: darkMode ? '#FFF500' : '#233C5A',
                      }}
                    >
                      Buka filter lanjutan di Katalog Peta
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {searchMatches.quadrangles.map((q) => (
                    <button
                      key={`q-${q.isRegionalIndex ? 'reg-' : ''}${q.code}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handlePickQuadrangle(q, mapSearchQuery)}
                      className="gm-focus gm-press flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs cursor-pointer hover:bg-black/5"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold">
                          {q.code} · {q.name}
                        </div>
                        <div className="tabular-nums text-[10px] opacity-75">
                          {q.isRegionalIndex
                            ? q.themeCode
                              ? `Indeks Regional (${q.themeCode})`
                              : 'Indeks Regional'
                            : 'Indeks Lembar'}{' '}
                          • {q.scale} • {q.region}
                        </div>
                      </div>
                    </button>
                  ))}

                  {searchMatches.volcanoes.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handlePickVolcano(v, mapSearchQuery)}
                      className="gm-focus gm-press flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs cursor-pointer hover:bg-black/5"
                    >
                      <span className="truncate font-semibold">{v.name}</span>
                      <span
                        className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                        style={{ backgroundColor: v.color }}
                      >
                        {v.level}
                      </span>
                    </button>
                  ))}

                  {searchMatches.datasets.map((ds) => (
                    <button
                      key={ds.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handlePickDataset(ds, mapSearchQuery)}
                      className="gm-focus gm-press flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs cursor-pointer hover:bg-black/5"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{ds.title}</div>
                        <div className="tabular-nums text-[10px] opacity-75">
                          {ds.theme} • {ds.scale} • {ds.sheetCode}
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
          </div>
        </div>

        {/* 2) KAPSUL 2D / 3D TERRAIN + SLIDER PITCH (Di bawah Search Bar, lebar & tinggi sejajar) */}
        <MapDimensionPill />

        {/* 3) KARTU INDEKS SKALA PETA AKORDION (Terpisah, Buka–Tutup + Ikon Grid Hide/Aktif) */}
        <div
          id="map-scale-index-card"
          className="gm-hud pointer-events-auto flex min-h-0 w-full shrink-0 flex-col overflow-hidden transition-[width] duration-200"
        >
          <div className="flex items-center gap-1.5 px-2 py-1.5">
            <button
              type="button"
              id="map-index-grid-toggle"
              onClick={(e) => {
                e.stopPropagation();
                toggleLayer('grid');
              }}
              aria-pressed={isGridIndexActive}
              aria-label={
                isGridIndexActive
                  ? 'Sembunyikan grid Indeks Skala Peta'
                  : 'Aktifkan grid Indeks Skala Peta'
              }
              title={
                isGridIndexActive
                  ? 'Indeks Grid Aktif (klik untuk Hide)'
                  : 'Indeks Grid Hide (klik untuk Aktifkan)'
              }
              className="gm-press gm-focus gm-touch-target inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-transparent bg-transparent cursor-pointer hover:bg-[var(--s-track-bg)]"
              style={{ color: 'var(--s-hud-muted)' }}
            >
              <GridIndexStateIcon active={isGridIndexActive} />
            </button>

            <button
              type="button"
              id="map-index-accordion-toggle"
              onClick={() => setIndexPanelOpen((o) => !o)}
              aria-expanded={indexPanelOpen}
              aria-controls="map-scale-index-body"
              className="gm-focus gm-press flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-1 py-1 text-left cursor-pointer hover:bg-[var(--s-track-bg)]"
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-[11.5px] font-bold tracking-tight">
                  Indeks Skala Peta
                </span>
                <span
                  className="gm-micro tabular-nums shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold transition-colors"
                  style={
                    isGridIndexActive
                      ? {
                          backgroundColor: 'var(--s-hud-scale-badge-bg)',
                          color: 'var(--s-hud-scale-badge-fg)',
                          borderColor: 'var(--s-hud-scale-badge-border)',
                        }
                      : {
                          backgroundColor: 'var(--s-hud-chip-bg)',
                          color: 'var(--s-hud-muted)',
                          borderColor: 'transparent',
                        }
                  }
                >
                  {headerIndexBadgeLabel}
                </span>
              </span>
              <ChevronDown
                className={[
                  'h-4 w-4 shrink-0 transition-transform duration-200',
                  indexPanelOpen ? 'rotate-180' : 'rotate-0',
                ].join(' ')}
                style={{ color: 'var(--s-hud-muted)' }}
                aria-hidden="true"
              />
            </button>
          </div>

          <div
            id="map-scale-index-body"
            aria-hidden={!indexPanelOpen}
            className={['gm-accordion-collapse', indexPanelOpen ? 'is-open' : ''].join(' ')}
          >
            <div className="gm-accordion-inner">
              <div
                className="gm-scroll max-h-[38vh] overflow-y-auto border-t px-2.5 pt-2 pb-2.5"
                style={{ borderColor: 'var(--s-hud-border)' }}
              >
                <div className="mb-1 flex items-baseline justify-between gap-2 px-0.5">
                  <div className="flex items-baseline gap-1.5 min-w-0">
                    <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
                      Filter Skala Peta
                    </span>
                    <span
                      className="gm-micro tabular-nums text-[10px] font-medium truncate"
                      style={{ color: 'var(--s-hud-muted)' }}
                    >
                      1:1.000.000 – 1:50.000
                    </span>
                  </div>
                  {mapScaleFilter && (
                    <button
                      type="button"
                      onClick={() => selectMapScaleFilter(null)}
                      className="gm-press gm-focus gm-micro text-[10px] font-semibold cursor-pointer opacity-80 hover:opacity-100 shrink-0"
                      style={{ color: 'var(--s-hud-fg)' }}
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div
                  role="group"
                  aria-label="Filter Skala Peta 1:5.000.000 sampai 1:50.000"
                  className="grid grid-cols-2 gap-0.5 rounded-[10px] p-1"
                  style={{
                    backgroundColor: 'var(--s-hud-chip-bg)',
                    boxShadow: 'inset 0 0 0 1px var(--s-hud-border)',
                  }}
                >
                  {HIGHLIGHT_MAP_SCALES.map((m) => {
                    const active = effectiveActiveScale === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => selectMapScaleFilter(m.value)}
                        title={`${m.value} — ${m.desc}`}
                        className="gm-press gm-focus gm-touch-target tabular-nums rounded-[7px] px-1 py-1 text-center text-[10.5px] font-semibold whitespace-nowrap cursor-pointer"
                        style={
                          active
                            ? {
                                backgroundColor: 'var(--p-esdm-yellow)',
                                color: '#000000',
                                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.16)',
                              }
                            : {
                                backgroundColor: 'transparent',
                                color: 'var(--s-hud-muted)',
                              }
                        }
                      >
                        {m.shortLabel}
                      </button>
                    );
                  })}
                </div>

                {/* Filter Indeks Regional (Ndx GL-ID 100-250: 1:100.000 Jawa & 1:250.000 Luar Jawa) */}
                <div
                  className="mt-2 border-t pt-2"
                  style={{ borderColor: 'var(--s-hud-border)' }}
                >
                  <div className="mb-1 flex items-baseline justify-between gap-2 px-0.5">
                    <div className="flex items-baseline gap-1.5 min-w-0">
                      <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
                        Indeks Regional
                      </span>
                      <span
                        className="gm-micro tabular-nums text-[10px] font-medium truncate"
                        style={{ color: 'var(--s-hud-muted)' }}
                      >
                        1:100.000 &amp; 1:250.000
                      </span>
                    </div>
                    {regionalIndexFilter && (
                      <button
                        type="button"
                        onClick={() => selectRegionalIndexFilter(null)}
                        className="gm-press gm-focus gm-micro text-[10px] font-semibold cursor-pointer opacity-80 hover:opacity-100 shrink-0"
                        style={{ color: 'var(--s-hud-fg)' }}
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div
                    role="group"
                    aria-label="Filter Indeks Regional 1:100.000 dan 1:250.000"
                    className="grid grid-cols-3 gap-0.5 rounded-[10px] p-1"
                    style={{
                      backgroundColor: 'var(--s-hud-chip-bg)',
                      boxShadow: 'inset 0 0 0 1px var(--s-hud-border)',
                    }}
                  >
                    {REGIONAL_INDEX_OPTIONS.map((opt) => {
                      const active =
                        mapLayers.grid && regionalIndexFilter === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => selectRegionalIndexFilter(opt.value)}
                          title={opt.desc}
                          className="gm-press gm-focus gm-touch-target tabular-nums rounded-[7px] px-1 py-1 text-center text-[10.5px] font-semibold whitespace-nowrap cursor-pointer"
                          style={
                            active
                              ? {
                                  backgroundColor: 'var(--p-esdm-yellow)',
                                  color: '#000000',
                                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.16)',
                                }
                              : {
                                  backgroundColor: 'transparent',
                                  color: 'var(--s-hud-muted)',
                                }
                          }
                        >
                          {opt.shortLabel}
                        </button>
                      );
                    })}
                  </div>

                  {mapLayers.grid &&
                    regionalIndexFilter &&
                    regionalIndexFilter !== '100k' && (
                      <div className="mt-1.5 space-y-1 px-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="gm-micro text-[9.5px] font-semibold uppercase tracking-wider"
                            style={{ color: 'var(--s-hud-muted)' }}
                          >
                            Wilayah Regional
                          </span>
                          <span
                            className="gm-micro tabular-nums text-[9.5px] font-semibold"
                            style={{ color: 'var(--s-hud-muted)' }}
                          >
                            {visibleRegionalCount} lembar
                          </span>
                        </div>
                        <div
                          role="group"
                          aria-label="Filter wilayah Indeks Regional"
                          className="flex flex-wrap gap-1"
                        >
                          {REGIONAL_REGION_OPTIONS.filter(
                            (r) =>
                              regionalIndexFilter === 'all' ||
                              r.value !== 'Jawa',
                          ).map((reg) => {
                            const active = regionalRegionFilter === reg.value;
                            return (
                              <button
                                key={reg.value}
                                type="button"
                                aria-pressed={active}
                                onClick={() =>
                                  selectRegionalRegionFilter(reg.value)
                                }
                                className="gm-press gm-focus rounded-md px-1.5 py-0.5 text-[10px] font-semibold cursor-pointer transition-colors"
                                style={
                                  active
                                    ? {
                                        backgroundColor: '#233C5A',
                                        color: '#FFFFFF',
                                      }
                                    : {
                                        backgroundColor: 'var(--s-hud-chip-bg)',
                                        color: 'var(--s-hud-muted)',
                                        boxShadow:
                                          'inset 0 0 0 1px var(--s-hud-border)',
                                      }
                                }
                              >
                                {reg.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* OPSI 2: Filter Jenis Peta (SHP & Raster) sejajar tinggi dengan Pencarian + Indeks Skala Peta */}
          {filterOpen && (
            <div
              id="map-search-filter-panel"
              role="region"
              aria-label="Filter Jenis Peta"
              className={[
                'gm-hud gm-popover-tl pointer-events-auto w-full p-3 sm:absolute sm:left-full sm:top-0 sm:z-30 sm:ml-2 sm:w-[332px] lg:w-[348px] sm:flex sm:flex-col',
                indexPanelOpen ? 'sm:bottom-0' : 'sm:max-h-[calc(100vh-140px)]',
              ].join(' ')}
            >
              <div className="mb-2 flex shrink-0 items-center justify-between gap-2 px-0.5">
                <span className="text-[11.5px] font-bold">Filter Jenis Peta</span>
                <div className="flex items-center gap-1.5">
                  {hasActiveDataFilter && (
                    <button
                      type="button"
                      onClick={resetMapDataFilter}
                      className="gm-focus gm-micro rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
                      style={{ color: 'var(--s-hud-muted)' }}
                    >
                      Reset
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setFilterOpen(false)}
                    aria-label="Tutup filter jenis peta"
                    className="gm-focus gm-press rounded-md p-1 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
                    style={{ color: 'var(--s-hud-muted)' }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mb-2 flex shrink-0 items-center justify-between gap-2 px-0.5">
                <div
                  role="group"
                  aria-label="Filter format data peta"
                  className="inline-flex rounded-lg border p-0.5"
                  style={{
                    backgroundColor: 'var(--s-hud-chip-bg)',
                    borderColor: 'var(--s-hud-border)',
                  }}
                >
                  {(['Semua', 'SHP', 'Raster'] as const).map((fmt) => {
                    const pressed = mapFormatFilter === fmt;
                    return (
                      <button
                        key={fmt}
                        type="button"
                        aria-pressed={pressed}
                        onClick={() => setMapFormatFilter(fmt)}
                        className="gm-focus gm-micro rounded-md px-2.5 py-0.5 text-[10.5px] font-semibold cursor-pointer transition-colors"
                        style={
                          pressed
                            ? { backgroundColor: '#233C5A', color: '#FFFFFF' }
                            : { color: 'var(--s-hud-muted)' }
                        }
                      >
                        {fmt}
                      </button>
                    );
                  })}
                </div>
                <span
                  className="gm-micro text-[10px] font-medium"
                  style={{ color: 'var(--s-hud-muted)' }}
                >
                  {mapTypeFilterIds.length > 0
                    ? `${mapTypeFilterIds.length} dipilih`
                    : `${filteredTypeOptions.length} jenis`}
                </span>
              </div>

              <div
                className="gm-scroll max-h-56 min-h-0 flex-1 overflow-y-auto rounded-[10px] border sm:max-h-none"
                style={{
                  borderColor: 'var(--s-hud-border)',
                  backgroundColor: 'var(--s-hud-chip-bg)',
                }}
              >
                {filteredTypeOptions.map((item, idx) => {
                  const checked = mapTypeFilterIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => toggleMapTypeFilter(item.id)}
                      className="gm-focus flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left cursor-pointer transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                      style={{
                        borderBottom:
                          idx === filteredTypeOptions.length - 1
                            ? 'none'
                            : '1px solid var(--s-hud-border)',
                      }}
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors"
                          style={
                            checked
                              ? {
                                  backgroundColor: '#047857',
                                  borderColor: '#047857',
                                  color: '#FFFFFF',
                                }
                              : {
                                  backgroundColor: 'transparent',
                                  borderColor: 'var(--s-hud-muted)',
                                }
                          }
                        >
                          {checked && <Check className="h-3 w-3 stroke-[3]" />}
                        </span>
                        <span className="truncate text-[11.5px] font-medium">
                          {item.label}
                        </span>
                      </span>
                      <span
                        className="gm-micro shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase"
                        style={
                          item.format === 'SHP'
                            ? {
                                backgroundColor: 'rgba(4, 120, 87, 0.14)',
                                color: '#047857',
                              }
                            : {
                                backgroundColor: 'rgba(35, 60, 90, 0.12)',
                                color: 'var(--s-hud-fg)',
                              }
                        }
                      >
                        {item.format}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 flex shrink-0 items-center justify-end px-0.5">
                <button
                  type="button"
                  onClick={() => navigate('catalog')}
                  className="gm-focus gm-micro text-[10px] font-semibold underline cursor-pointer"
                  style={{ color: 'var(--s-hud-fg)' }}
                >
                  Lihat Katalog ({filteredCatalogDatasets.length})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DOK INSPEKTOR + NAVIGASI ZOOM (Opsi 4: Vertikal saat belum manuver, Horizontal di bawah Dok saat manuver) */}
        {(() => {
          const hasDockedInspector = Boolean(mapPopup && mapPopupDocked);
          return (
            <div className="pointer-events-none hidden w-full min-h-0 flex-1 flex-col items-start gap-2 sm:flex">
              {hasDockedInspector && (
                <div
                  id="map-docked-inspector-slot"
                  className="gm-popover-tl pointer-events-auto flex min-h-0 flex-1 w-full flex-col"
                >
                  <MapFeatureInspector variant="docked" />
                </div>
              )}

              <div
                id="map-zoom-controls"
                data-zoom-orientation={hasDockedInspector ? 'horizontal' : 'vertical'}
                className="pointer-events-auto flex shrink-0 flex-col gap-1.5"
              >
                <div
                  className={
                    hasDockedInspector
                      ? 'gm-hud flex flex-row items-center gap-1 p-1'
                      : 'gm-hud flex flex-col items-center gap-1 p-1'
                  }
                >
                  <button
                    type="button"
                    onClick={onZoomIn}
                    className={`gm-press gm-focus gm-touch-target inline-flex h-9 w-9 items-center justify-center rounded-lg cursor-pointer ${
                      hasDockedInspector ? 'order-3' : 'order-1'
                    }`}
                    aria-label="Perbesar Peta"
                    title="Perbesar (+)"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  {hasDockedInspector && (
                    <div
                      className="order-2 my-1 h-5 w-px shrink-0 opacity-60"
                      style={{ backgroundColor: 'var(--s-hud-border)' }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={onZoomOut}
                    className={`gm-press gm-focus gm-touch-target inline-flex h-9 w-9 items-center justify-center rounded-lg cursor-pointer ${
                      hasDockedInspector ? 'order-1' : 'order-2'
                    }`}
                    aria-label="Perkecil Peta"
                    title="Perkecil (-)"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div
                    className={
                      hasDockedInspector
                        ? 'order-4 my-1 h-5 w-px shrink-0'
                        : 'order-3 mx-1 h-px w-5 shrink-0'
                    }
                    style={{ backgroundColor: 'var(--s-hud-border)' }}
                  />
                  <button
                    type="button"
                    onClick={resetIndonesiaExtent}
                    className={`gm-press gm-focus gm-touch-target inline-flex h-9 w-9 items-center justify-center rounded-lg cursor-pointer ${
                      hasDockedInspector ? 'order-5' : 'order-4'
                    }`}
                    aria-label="Kembalikan Cakupan Nasional Indonesia"
                    title="Reset Nusantara"
                  >
                    <Home className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
};
