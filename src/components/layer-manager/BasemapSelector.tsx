import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useGeoMap } from '../../context/GeoMapContext';
import { BASEMAP_OPTIONS } from '../../data/geomapData';

/** Pemilih Peta Dasar ringkas 1 baris dengan drawer multi-basemap yang dapat diperluas. */
export const BasemapSelector: React.FC = () => {
  const { basemap, setBasemap, darkMode } = useGeoMap();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeBasemap =
    BASEMAP_OPTIONS.find((item) => item.id === basemap) ?? BASEMAP_OPTIONS[0];
  const isDarkSurface = darkMode;

  return (
    <section
      aria-label="Peta Dasar"
      className="border-b pb-3"
      style={{ borderColor: 'var(--s-hud-border)' }}
    >
      <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1.5">
        <span
          className="gm-micro text-[10.5px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--s-hud-muted)' }}
        >
          Peta Dasar
        </span>
        <span
          className="gm-micro tabular-nums text-[11px] font-medium"
          style={{ color: 'var(--s-hud-muted)' }}
        >
          {BASEMAP_OPTIONS.length} tersedia
        </span>
      </div>

      <div className="px-3.5">
        <button
          type="button"
          data-vaul-no-drag=""
          onClick={() => setDrawerOpen((prev) => !prev)}
          aria-expanded={drawerOpen}
          aria-controls="gm-basemap-drawer"
          aria-label={`Peta dasar aktif: ${activeBasemap.fullName}. Klik untuk mengganti peta dasar`}
          className="gm-focus gm-press flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left cursor-pointer transition-colors"
          style={{
            backgroundColor: 'var(--s-hud-chip-bg)',
            borderColor: 'var(--s-hud-border)',
          }}
        >
          <span
            aria-hidden="true"
            className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-900/15 shadow-inner ${activeBasemap.swatchClass}`}
          >
            <img
              src={activeBasemap.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-semibold leading-tight">
              {activeBasemap.fullName}
            </span>
            <span
              className="gm-micro block truncate text-[11px] leading-tight mt-0.5"
              style={{ color: 'var(--s-hud-muted)' }}
            >
              {activeBasemap.desc}
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
              drawerOpen ? 'rotate-180' : ''
            }`}
            style={{ color: 'var(--s-hud-muted)' }}
            aria-hidden="true"
          />
        </button>

        {drawerOpen && (
          <div
            id="gm-basemap-drawer"
            role="radiogroup"
            aria-label="Pilihan peta dasar"
            data-vaul-no-drag=""
            className="mt-2 grid grid-cols-3 gap-1.5 rounded-xl border p-1.5"
            style={{
              backgroundColor: 'var(--s-hud-chip-bg)',
              borderColor: 'var(--s-hud-border)',
            }}
          >
            {BASEMAP_OPTIONS.map((item) => {
              const selected = item.id === basemap;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  data-vaul-no-drag=""
                  onClick={() => setBasemap(item.id)}
                  title={item.fullName}
                  className="gm-focus gm-press flex flex-col items-center gap-1.5 rounded-lg border px-1 py-1.5 text-center cursor-pointer transition-colors"
                  style={{
                    borderColor: selected
                      ? isDarkSurface
                        ? '#D5B600'
                        : '#D5B600'
                      : 'transparent',
                    backgroundColor: selected
                      ? isDarkSurface
                        ? 'rgba(255, 245, 0, 0.16)'
                        : 'rgba(255, 245, 0, 0.26)'
                      : 'transparent',
                  }}
                >
                  <span
                    className={`relative block h-9 w-full overflow-hidden rounded-md border border-slate-900/15 ${item.swatchClass}`}
                  >
                    <img
                      src={item.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {selected && (
                      <span
                        className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full shadow"
                        style={{
                          backgroundColor: '#FFF500',
                          color: '#000000',
                          border: '1px solid #D5B600',
                        }}
                      >
                        <Check className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <span className="gm-micro block w-full truncate text-[11px] font-medium leading-tight">
                    {item.shortName}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
