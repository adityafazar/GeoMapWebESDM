import React from 'react';

interface CatalogEmptyStateProps {
  onSelectNationalScale: () => void;
  onSelectBandungQuery: () => void;
  onResetAll: () => void;
}

export const CatalogEmptyState: React.FC<CatalogEmptyStateProps> = ({
  onSelectNationalScale,
  onSelectBandungQuery,
  onResetAll,
}) => {
  return (
    <div
      id="catalog-empty-state"
      role="status"
      className="gm-surface mx-auto my-4 max-w-xl space-y-5 rounded-[24px] p-8 text-center sm:p-10"
    >
      <div className="space-y-2">
        <span
          className="gm-micro text-[10px] font-bold uppercase tracking-[0.08em]"
          style={{ color: 'var(--s-text-muted)' }}
        >
          Hasil Pencarian Kosong
        </span>
        <h2 className="gm-heading text-base font-bold tracking-[-0.015em]">
          Tidak ada peta yang cocok dengan kombinasi filter saat ini
        </h2>
        <p
          className="gm-prose mx-auto text-xs leading-[1.6]"
          style={{ color: 'var(--s-text-muted)' }}
        >
          Alih-alih jalan buntu, Anda dapat melonggarkan parameter dengan satu klik saran di bawah ini:
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={onSelectNationalScale}
          className="gm-focus gm-press inline-flex h-9 items-center rounded-xl border px-3.5 text-xs font-semibold cursor-pointer"
          style={{
            backgroundColor: 'var(--s-bg-surface-muted)',
            borderColor: 'var(--s-border-strong)',
          }}
        >
          11 Peta Skala Nasional
        </button>
        <button
          type="button"
          onClick={onSelectBandungQuery}
          className="gm-focus gm-press inline-flex h-9 items-center rounded-xl border px-3.5 text-xs font-semibold cursor-pointer"
          style={{
            backgroundColor: 'var(--s-bg-surface-muted)',
            borderColor: 'var(--s-border-strong)',
          }}
        >
          Cari &ldquo;Lembar Bandung&rdquo;
        </button>
        <button
          type="button"
          onClick={onResetAll}
          className="gm-cta-primary gm-focus inline-flex h-9 items-center px-4 text-xs cursor-pointer"
        >
          Reset Semua Filter Katalog
        </button>
      </div>
    </div>
  );
};

