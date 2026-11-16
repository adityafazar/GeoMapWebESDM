import React from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { SortMode } from '../../context/GeoMapContext';
import type { ActiveCatalogFilter } from './constants';

interface CatalogResultsBarProps {
  filteredCount: number;
  totalCount: number;
  rawQuery: string;
  normalizedQuery: string;
  activeFilters: ActiveCatalogFilter[];
  catSort: SortMode;
  onChangeSort: (sort: SortMode) => void;
}

export const CatalogResultsBar: React.FC<CatalogResultsBarProps> = ({
  filteredCount,
  totalCount,
  rawQuery,
  normalizedQuery,
  activeFilters,
  catSort,
  onChangeSort,
}) => {
  return (
    <div
      className="gm-header-glass flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 lg:sticky lg:top-[74px] lg:z-10"
      style={{ borderColor: 'var(--s-border-subtle)' }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="tabular-nums text-xs font-bold">
          Menampilkan {filteredCount} dari {totalCount} peta resmi
        </span>

        {normalizedQuery && normalizedQuery !== rawQuery.trim().toLowerCase() && (
          <span
            className="inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold"
            style={{
              backgroundColor: 'var(--s-status-public-bg)',
              color: 'var(--s-status-public-fg)',
            }}
          >
            Normalisasi: &ldquo;{normalizedQuery}&rdquo;
          </span>
        )}

        {activeFilters.map((af) => (
          <button
            key={af.key}
            type="button"
            onClick={af.clear}
            className="gm-focus gm-press inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold cursor-pointer"
            style={{
              backgroundColor: 'var(--s-bg-surface-muted)',
              borderColor: 'var(--s-border-strong)',
              color: 'var(--s-text-secondary)',
            }}
          >
            <span>{af.label}</span>
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2.5">
        <label
          htmlFor="filter-sort"
          className="text-xs font-medium"
          style={{ color: 'var(--s-text-muted)' }}
        >
          Urutkan Hasil
        </label>
        <div className="relative">
          <select
            id="filter-sort"
            value={catSort}
            onChange={(e) => onChangeSort(e.target.value as SortMode)}
            className="gm-focus h-8 appearance-none rounded-xl border pr-8 pl-3 text-xs font-semibold cursor-pointer"
            style={{
              backgroundColor: 'var(--s-bg-surface-muted)',
              borderColor: 'var(--s-border-strong)',
              color: 'var(--s-text-primary)',
            }}
          >
            <option value="populer">Paling Dicari</option>
            <option value="terbaru">Tahun Terbaru</option>
            <option value="skala">Skala Paling Detail</option>
            <option value="judul">Judul (A–Z)</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2"
            style={{ color: 'var(--s-text-muted)' }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
};

