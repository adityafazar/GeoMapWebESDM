import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import type { SortMode } from '../../context/GeoMapContext';
import type { GeoDataset } from '../../data/geomapData';

interface CatalogTableViewProps {
  datasets: GeoDataset[];
  onSort: (sort: SortMode) => void;
  onPreviewDataset: (slug: string) => void;
  onOpenOnMap: (dataset: GeoDataset) => void;
}

export const CatalogTableView: React.FC<CatalogTableViewProps> = ({
  datasets,
  onSort,
  onPreviewDataset,
  onOpenOnMap,
}) => {
  return (
    /* Prototipe v3 Tabel Teknis */
    <div className="gm-surface overflow-hidden rounded-[20px]">
      <div className="overflow-x-auto">
        <table className="tabular-nums w-full border-collapse text-left text-xs">
          <thead>
            <tr
              className="border-b"
              style={{
                backgroundColor: 'var(--s-bg-surface-muted)',
                borderColor: 'var(--s-border-subtle)',
                color: 'var(--s-text-secondary)',
              }}
            >
              <th className="px-5 py-3.5 font-bold">
                <button
                  type="button"
                  onClick={() => onSort('judul')}
                  className="gm-focus gm-press inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Judul Dataset &amp; Nomor Lembar</span>
                  <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                </button>
              </th>
              <th className="px-3.5 py-3.5 font-bold">Tema</th>
              <th className="px-3.5 py-3.5 font-bold">
                <button
                  type="button"
                  onClick={() => onSort('skala')}
                  className="gm-focus gm-press inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Skala</span>
                  <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                </button>
              </th>
              <th className="px-3.5 py-3.5 font-bold">
                <button
                  type="button"
                  onClick={() => onSort('terbaru')}
                  className="gm-focus gm-press inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Tahun</span>
                  <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                </button>
              </th>
              <th className="px-3.5 py-3.5 font-bold">Format Unduh</th>
              <th className="px-5 py-3.5 text-right font-bold">Aksi</th>
            </tr>
          </thead>
          <tbody
            className="divide-y"
            style={{ borderColor: 'var(--s-border-subtle)' }}
          >
            {datasets.map((ds) => (
              <tr key={ds.id} className="hover:bg-black/[0.02]">
                <td className="px-5 py-3.5">
                  <div className="font-bold leading-snug">{ds.title}</div>
                  <div
                    className="mt-0.5 text-[11px]"
                    style={{ color: 'var(--s-text-muted)' }}
                  >
                    {ds.sheetCode} • {ds.region}
                  </div>
                </td>
                <td className="px-3.5 py-3.5 font-medium">{ds.theme}</td>
                <td className="px-3.5 py-3.5 font-mono font-semibold whitespace-nowrap">
                  {ds.scale}
                </td>
                <td className="px-3.5 py-3.5 whitespace-nowrap">{ds.year}</td>
                <td className="px-3.5 py-3.5 whitespace-nowrap">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: 'var(--s-status-public-bg)',
                      color: 'var(--s-status-public-fg)',
                    }}
                  >
                    GeoPDF
                  </span>
                  {ds.hasShp && (
                    <span
                      className="ml-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor: 'var(--s-status-lock-bg)',
                        color: 'var(--s-status-lock-fg)',
                      }}
                    >
                      SHP ({ds.fileSizeShp})
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenOnMap(ds)}
                      className="gm-press gm-focus inline-flex h-8 items-center rounded-lg border px-2.5 text-[11px] font-semibold cursor-pointer"
                      style={{ borderColor: 'var(--s-border-strong)' }}
                    >
                      Peta
                    </button>
                    <button
                      type="button"
                      onClick={() => onPreviewDataset(ds.slug)}
                      className="gm-cta-primary gm-focus inline-flex h-8 items-center px-3 text-[11px] cursor-pointer"
                    >
                      Pratinjau
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

