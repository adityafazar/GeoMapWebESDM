import React, { useMemo } from 'react';
import { useGeoMap } from '../../context/GeoMapContext';
import { DATASETS, normalizeGeoQuery } from '../../data/geomapData';
import type { ActiveCatalogFilter } from './constants';
import { CatalogCardGrid } from './CatalogCardGrid';
import { CatalogEmptyState } from './CatalogEmptyState';
import { CatalogFilterSidebar } from './CatalogFilterSidebar';
import { CatalogHeader } from './CatalogHeader';
import { CatalogResultsBar } from './CatalogResultsBar';
import { CatalogTableView } from './CatalogTableView';

export const CatalogWorkspace: React.FC = () => {
  const {
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
    registerSearchInput,
    navigate,
    openDatasetOnMainMap,
  } = useGeoMap();

  const rawLower = catQuery.trim().toLowerCase();
  const normalizedQuery = normalizeGeoQuery(catQuery);

  const filtered = useMemo(() => {
    const list = DATASETS.filter((d) => {
      if (catRegion !== 'Semua' && d.region !== catRegion) return false;
      if (catTheme !== 'Semua' && d.theme !== catTheme) return false;
      if (catScale !== 'Semua' && d.scale !== catScale) return false;
      if (catFormat === 'SHP' && !d.hasShp) return false;
      if (normalizedQuery || rawLower) {
        const hay =
          `${d.title} ${d.theme} ${d.region} ${d.sheetCode} ${d.summary}`.toLowerCase();
        if (
          !hay.includes(normalizedQuery) &&
          !(rawLower && hay.includes(rawLower))
        ) {
          return false;
        }
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (catSort === 'populer') {
        const pa = a.popularRank ?? 999;
        const pb = b.popularRank ?? 999;
        if (pa !== pb) return pa - pb;
        return a.isNational === b.isNational
          ? b.year - a.year
          : a.isNational
            ? -1
            : 1;
      }
      if (catSort === 'terbaru') return b.year - a.year;
      if (catSort === 'skala') return a.scaleRank - b.scaleRank;
      return a.title.localeCompare(b.title, 'id');
    });
  }, [
    catFormat,
    catRegion,
    catScale,
    catSort,
    catTheme,
    normalizedQuery,
    rawLower,
  ]);

  const activeFilters: ActiveCatalogFilter[] = [];
  if (catQuery.trim()) {
    activeFilters.push({
      key: 'query',
      label: `Kata kunci: "${catQuery.trim()}"`,
      clear: () => setCatQuery(''),
    });
  }
  if (catRegion !== 'Semua') {
    activeFilters.push({
      key: 'region',
      label: `Wilayah: ${catRegion}`,
      clear: () => setCatRegion('Semua'),
    });
  }
  if (catTheme !== 'Semua') {
    activeFilters.push({
      key: 'theme',
      label: `Tema: ${catTheme}`,
      clear: () => setCatTheme('Semua'),
    });
  }
  if (catScale !== 'Semua') {
    activeFilters.push({
      key: 'scale',
      label: `Skala: ${catScale}`,
      clear: () => setCatScale('Semua'),
    });
  }
  if (catFormat !== 'Semua') {
    activeFilters.push({
      key: 'format',
      label: `Format: ${catFormat}`,
      clear: () => setCatFormat('Semua'),
    });
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <CatalogHeader
        totalDatasets={DATASETS.length}
        catViewMode={catViewMode}
        onChangeViewMode={setCatViewMode}
      />

      {/* Prototipe v3 Asymmetric Workspace: Left Sticky Spatial Filter Sidebar + Right Catalog Results */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[312px_minmax(0,1fr)] lg:gap-7">
        <CatalogFilterSidebar
          activeFilterCount={activeFilters.length}
          catQuery={catQuery}
          catTheme={catTheme}
          catScale={catScale}
          catFormat={catFormat}
          onChangeQuery={setCatQuery}
          onChangeTheme={setCatTheme}
          onChangeScale={setCatScale}
          onChangeFormat={setCatFormat}
          onResetFilters={resetCatalogFilters}
          registerSearchInput={registerSearchInput}
        />

        {/* Right Column: Results Summary + Card/Table Views */}
        <div className="min-w-0 space-y-4">
          <CatalogResultsBar
            filteredCount={filtered.length}
            totalCount={DATASETS.length}
            rawQuery={catQuery}
            normalizedQuery={normalizedQuery}
            activeFilters={activeFilters}
            catSort={catSort}
            onChangeSort={setCatSort}
          />

          <div key={catViewMode} className="gm-blur-swap">
            {filtered.length === 0 ? (
              <CatalogEmptyState
                onSelectNationalScale={() => {
                  resetCatalogFilters();
                  setCatScale('1:5.000.000');
                }}
                onSelectBandungQuery={() => {
                  resetCatalogFilters();
                  setCatQuery('Bandung');
                }}
                onResetAll={resetCatalogFilters}
              />
            ) : catViewMode === 'card' ? (
              <CatalogCardGrid
                datasets={filtered}
                onPreviewDataset={(slug) => navigate('preview', { slug })}
                onOpenOnMap={openDatasetOnMainMap}
              />
            ) : (
              <CatalogTableView
                datasets={filtered}
                onSort={setCatSort}
                onPreviewDataset={(slug) => navigate('preview', { slug })}
                onOpenOnMap={openDatasetOnMainMap}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

