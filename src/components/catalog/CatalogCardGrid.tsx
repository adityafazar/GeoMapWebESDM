import React from 'react';
import type { GeoDataset } from '../../data/geomapData';
import { MiniCardGraphic } from './MiniCardGraphic';

interface CatalogCardGridProps {
  datasets: GeoDataset[];
  onPreviewDataset: (slug: string) => void;
  onOpenOnMap: (dataset: GeoDataset) => void;
}

export const CatalogCardGrid: React.FC<CatalogCardGridProps> = ({
  datasets,
  onPreviewDataset,
  onOpenOnMap,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:gap-5">
      {datasets.map((ds, i) => (
        <article
          key={ds.id}
          style={i < 6 ? { animationDelay: `${i * 35}ms` } : undefined}
          className={`${
            i < 6 ? 'gm-stagger-item ' : ''
          }gm-surface gm-card-hover flex flex-col justify-between gap-4 rounded-[20px] p-5`}
        >
          <div className="flex items-start gap-4">
            <div
              className="group h-[68px] w-[112px] shrink-0 overflow-hidden rounded-xl border"
              style={{ borderColor: 'var(--s-border-subtle)' }}
            >
              <MiniCardGraphic mode={ds.previewMode} variantIndex={i} />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: 'var(--s-status-public-bg)',
                    color: 'var(--s-status-public-fg)',
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--s-status-public-dot)' }}
                    aria-hidden="true"
                  />
                  Akses Publik
                </span>
                {ds.hasShp && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: 'var(--s-status-lock-bg)',
                      color: 'var(--s-status-lock-fg)',
                    }}
                  >
                    SHP + GeoPDF
                  </span>
                )}
                {ds.isNational && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ backgroundColor: '#FFF500', color: '#000000' }}
                  >
                    Nasional
                  </span>
                )}
              </div>

              <h2 className="gm-heading line-clamp-2 text-[15px] font-bold leading-[1.3] tracking-[-0.01em]">
                {ds.title}
              </h2>
            </div>
          </div>

          <p
            className="gm-prose line-clamp-2 text-xs leading-[1.55]"
            style={{ color: 'var(--s-text-muted)' }}
          >
            {ds.summary}
          </p>

          <dl
            className="tabular-nums grid grid-cols-3 gap-3 rounded-xl px-3.5 py-2.5 text-xs"
            style={{ backgroundColor: 'var(--s-bg-surface-muted)' }}
          >
            <div>
              <dt
                className="mb-0.5 text-[10px] font-semibold tracking-[0.03em]"
                style={{ color: 'var(--s-text-muted)' }}
              >
                Skala
              </dt>
              <dd className="font-bold">{ds.scale}</dd>
            </div>
            <div>
              <dt
                className="mb-0.5 text-[10px] font-semibold tracking-[0.03em]"
                style={{ color: 'var(--s-text-muted)' }}
              >
                Wilayah
              </dt>
              <dd className="truncate font-bold">{ds.region}</dd>
            </div>
            <div>
              <dt
                className="mb-0.5 text-[10px] font-semibold tracking-[0.03em]"
                style={{ color: 'var(--s-text-muted)' }}
              >
                Tahun
              </dt>
              <dd className="font-bold">{ds.year}</dd>
            </div>
          </dl>

          <div className="flex items-center gap-2.5 pt-0.5">
            <button
              type="button"
              onClick={() => onPreviewDataset(ds.slug)}
              className="gm-cta-primary gm-focus inline-flex h-9 flex-1 items-center justify-center px-3.5 text-xs cursor-pointer"
            >
              Pratinjau &amp; Unduh
            </button>
            <button
              type="button"
              onClick={() => onOpenOnMap(ds)}
              className="gm-focus gm-press inline-flex h-9 shrink-0 items-center rounded-xl border px-3.5 text-xs font-semibold cursor-pointer"
              style={{
                borderColor: 'var(--s-border-strong)',
                color: 'var(--s-text-secondary)',
              }}
            >
              Lihat di Peta
            </button>
          </div>
        </article>
      ))}
    </div>
  );
};

