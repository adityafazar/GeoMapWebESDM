import React from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import type { FormatFilter } from '../../context/GeoMapContext';
import type { ThemeCluster } from '../../data/geomapData';
import { FORMATS, SCALES, THEMES } from './constants';

interface CatalogFilterSidebarProps {
  activeFilterCount: number;
  catQuery: string;
  catTheme: 'Semua' | ThemeCluster;
  catScale: string;
  catFormat: FormatFilter;
  onChangeQuery: (query: string) => void;
  onChangeTheme: (theme: 'Semua' | ThemeCluster) => void;
  onChangeScale: (scale: string) => void;
  onChangeFormat: (format: FormatFilter) => void;
  onResetFilters: () => void;
  registerSearchInput: (el: HTMLInputElement | null) => void;
}

export const CatalogFilterSidebar: React.FC<CatalogFilterSidebarProps> = ({
  activeFilterCount,
  catQuery,
  catTheme,
  catScale,
  catFormat,
  onChangeQuery,
  onChangeTheme,
  onChangeScale,
  onChangeFormat,
  onResetFilters,
  registerSearchInput,
}) => {
  return (
    /* Left Sidebar Filters */
    <aside
      aria-label="Filter Spasial dan Taksonomi"
      className="gm-surface space-y-4 rounded-[20px] p-5 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.06)] lg:sticky lg:top-[74px] lg:max-h-[calc(100dvh-96px)] lg:overflow-y-auto"
    >
      <div className="flex items-center justify-between">
        <h2 className="gm-heading text-[15px] font-bold tracking-[-0.01em]">
          Filter Spasial
        </h2>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onResetFilters}
            className="gm-focus gm-press text-xs font-bold underline cursor-pointer"
            style={{ color: 'var(--s-text-brand)' }}
          >
            Reset ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Search Input */}
      <div>
        <label
          htmlFor="catalog-search-input"
          className="mb-1.5 block text-xs font-semibold"
          style={{ color: 'var(--s-text-secondary)' }}
        >
          Kata Kunci / Nomor Lembar
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2"
            style={{ color: 'var(--s-text-muted)' }}
            aria-hidden="true"
          />
          <input
            ref={(el) => registerSearchInput(el)}
            id="catalog-search-input"
            type="search"
            enterKeyHint="search"
            value={catQuery}
            onChange={(e) => onChangeQuery(e.target.value)}
            placeholder="Bandung, 1209-3, Sesar..."
            aria-label="Cari dataset dalam katalog peta"
            className="gm-focus w-full rounded-xl border py-2 pr-8 pl-9 text-xs outline-none"
            style={{
              backgroundColor: 'var(--s-bg-surface-muted)',
              borderColor: 'var(--s-border-strong)',
              color: 'var(--s-text-primary)',
            }}
          />
          {catQuery && (
            <button
              type="button"
              onClick={() => onChangeQuery('')}
              className="gm-focus absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 cursor-pointer"
              aria-label="Hapus kata kunci katalog"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Format Unduhan */}
      <div
        className="border-t pt-4"
        style={{ borderColor: 'var(--s-border-subtle)' }}
      >
        <span
          className="mb-1.5 block text-xs font-semibold"
          style={{ color: 'var(--s-text-secondary)' }}
        >
          Format Unduhan
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {FORMATS.map((fmt) => {
            const active = catFormat === fmt;
            return (
              <button
                key={fmt}
                type="button"
                aria-pressed={active}
                onClick={() => onChangeFormat(fmt)}
                className="gm-press gm-focus h-8 rounded-[10px] border px-2 text-[11px] font-semibold cursor-pointer"
                style={
                  active
                    ? {
                        backgroundColor: 'var(--s-accent-cta-bg)',
                        color: '#000000',
                        borderColor: '#D5B600',
                      }
                    : {
                        backgroundColor: 'var(--s-bg-surface-muted)',
                        borderColor: 'var(--s-border-subtle)',
                        color: 'var(--s-text-secondary)',
                      }
                }
              >
                {fmt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Skala Peta Resmi */}
      <div
        className="border-t pt-4"
        style={{ borderColor: 'var(--s-border-subtle)' }}
      >
        <label
          htmlFor="filter-scale"
          className="mb-1.5 block text-xs font-semibold"
          style={{ color: 'var(--s-text-secondary)' }}
        >
          Skala Peta Resmi
        </label>
        <div className="relative">
          <select
            id="filter-scale"
            value={catScale}
            onChange={(e) => onChangeScale(e.target.value)}
            className="gm-focus h-9 w-full appearance-none rounded-xl border pr-9 pl-3 text-xs font-semibold cursor-pointer"
            style={{
              backgroundColor: 'var(--s-bg-surface-muted)',
              borderColor: 'var(--s-border-strong)',
              color: 'var(--s-text-primary)',
            }}
          >
            {SCALES.map((s) => (
              <option key={s} value={s}>
                {s === 'Semua' ? 'Semua Skala (Nasional – Detail)' : `Skala ${s}`}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2"
            style={{ color: 'var(--s-text-muted)' }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* 6 Klaster Tematik Geospasial */}
      <div
        className="border-t pt-4"
        style={{ borderColor: 'var(--s-border-subtle)' }}
      >
        <span
          className="mb-2.5 block text-xs font-semibold"
          style={{ color: 'var(--s-text-secondary)' }}
        >
          6 Klaster Tematik Geospasial
        </span>
        <div className="flex flex-wrap gap-1.5">
          {THEMES.map((theme) => {
            const active = catTheme === theme;
            return (
              <button
                key={theme}
                type="button"
                aria-pressed={active}
                onClick={() => onChangeTheme(theme)}
                className="gm-press gm-focus min-h-[28px] rounded-[10px] border px-2.5 py-1 text-[11px] font-semibold cursor-pointer"
                style={
                  active
                    ? {
                        backgroundColor: 'var(--s-accent-cta-bg)',
                        color: '#000000',
                        borderColor: '#D5B600',
                      }
                    : {
                        backgroundColor: 'var(--s-bg-surface-muted)',
                        borderColor: 'var(--s-border-subtle)',
                        color: 'var(--s-text-secondary)',
                      }
                }
              >
                {theme}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

