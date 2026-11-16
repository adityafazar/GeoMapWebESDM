import React from 'react';
import { LayoutGrid, Table as TableIcon } from 'lucide-react';
import type { ViewMode } from '../../context/GeoMapContext';

interface CatalogHeaderProps {
  totalDatasets: number;
  catViewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
}

export const CatalogHeader: React.FC<CatalogHeaderProps> = ({
  totalDatasets,
  catViewMode,
  onChangeViewMode,
}) => {
  return (
    /* Prototipe v3 Catalog Header Bar */
    <div
      className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end"
      style={{ borderColor: 'var(--s-border-subtle)' }}
    >
      <div className="space-y-1.5">
        <div
          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em]"
          style={{ color: 'var(--s-text-brand)' }}
        >
          <span>Taksonomi Terstruktur ESDM</span>
          <span aria-hidden="true">•</span>
          <span className="tabular-nums">{totalDatasets} Dataset Terindeks</span>
        </div>
        <h1 className="gm-heading text-2xl font-extrabold leading-[1.15] tracking-[-0.02em] sm:text-[26px]">
          Katalog Peta Geologi &amp; Data Vektor
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div
          role="group"
          aria-label="Mode tampilan daftar katalog"
          className="inline-flex h-9 items-center rounded-xl border p-1"
          style={{
            backgroundColor: 'var(--s-bg-surface-muted)',
            borderColor: 'var(--s-border-subtle)',
          }}
        >
          <button
            type="button"
            aria-pressed={catViewMode === 'card'}
            onClick={() => onChangeViewMode('card')}
            className="gm-focus gm-press inline-flex h-7 items-center gap-1.5 rounded-[9px] px-3 text-xs font-semibold cursor-pointer"
            style={{
              backgroundColor:
                catViewMode === 'card' ? 'var(--s-bg-surface)' : 'transparent',
              color:
                catViewMode === 'card'
                  ? 'var(--s-text-primary)'
                  : 'var(--s-text-muted)',
              boxShadow:
                catViewMode === 'card'
                  ? '0 1px 2px rgba(15, 23, 42, 0.08)'
                  : 'none',
            }}
          >
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Kartu</span>
          </button>
          <button
            type="button"
            aria-pressed={catViewMode === 'table'}
            onClick={() => onChangeViewMode('table')}
            className="gm-focus gm-press inline-flex h-7 items-center gap-1.5 rounded-[9px] px-3 text-xs font-semibold cursor-pointer"
            style={{
              backgroundColor:
                catViewMode === 'table' ? 'var(--s-bg-surface)' : 'transparent',
              color:
                catViewMode === 'table'
                  ? 'var(--s-text-primary)'
                  : 'var(--s-text-muted)',
              boxShadow:
                catViewMode === 'table'
                  ? '0 1px 2px rgba(15, 23, 42, 0.08)'
                  : 'none',
            }}
          >
            <TableIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Tabel Teknis</span>
          </button>
        </div>
      </div>
    </div>
  );
};

