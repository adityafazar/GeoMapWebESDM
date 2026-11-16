import React, { useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useGeoMap } from '../../context/GeoMapContext';
import { MAP_LAYERS } from '../../data/geomapData';
import { useLeafletDomIsolation } from '../../hooks/useLeafletDomIsolation';
import { LayerControlsList } from './LayerControlsList';

/** Panel HUD kanan-atas (desktop) untuk mengelola Basemap dan Lapisan Data Geospasial. */
export const LayerManagerPanel: React.FC = () => {
  const {
    mapLayers,
    layerPanelOpen,
    setLayerPanelOpen,
    resetAllLayers,
    darkMode,
  } = useGeoMap();
  const panelRef = useLeafletDomIsolation<HTMLDivElement>();

  const activeCount = useMemo(
    () => MAP_LAYERS.filter((l) => mapLayers[l.key]).length,
    [mapLayers],
  );

  const badgeStyle: React.CSSProperties =
    activeCount > 0
      ? darkMode
        ? {
            backgroundColor: 'rgba(255, 245, 0, 0.20)',
            color: '#FFF500',
            border: '1px solid rgba(213, 182, 0, 0.45)',
          }
        : {
            backgroundColor: '#FFF500',
            color: '#000000',
            border: '1px solid #D5B600',
          }
      : {
          backgroundColor: 'var(--s-hud-chip-bg)',
          color: 'var(--s-hud-muted)',
        };

  return (
    <aside
      ref={panelRef}
      aria-label="Manajer Layer Peta"
      className="pointer-events-auto hidden min-h-0 flex-initial md:w-[316px] lg:w-[348px] flex-col overflow-hidden gm-hud md:flex transition-[width] duration-200"
    >
      <div
        className="flex shrink-0 items-center justify-between gap-2 border-b px-3.5 py-2.5"
        style={{ borderColor: 'var(--s-hud-border)' }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13.5px] font-semibold tracking-tight">
            Manajer Layer
          </span>
          <span
            className="gm-micro tabular-nums shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold transition-colors"
            style={badgeStyle}
          >
            {activeCount} Aktif
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={resetAllLayers}
            className="gm-focus gm-press gm-micro rounded-md px-2 py-1 text-[11px] font-medium cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            style={{ color: 'var(--s-hud-muted)' }}
            title="Kembalikan ke setelan awal"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setLayerPanelOpen((o) => !o)}
            aria-expanded={layerPanelOpen}
            aria-label={
              layerPanelOpen ? 'Ciutkan panel layer' : 'Bentangkan panel layer'
            }
            className="gm-focus gm-press gm-touch-target inline-flex h-7 w-7 items-center justify-center rounded-lg cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            {layerPanelOpen ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {layerPanelOpen && (
        <div className="gm-scroll gm-scroll-mask min-h-0 flex-1 overflow-y-auto">
          <LayerControlsList />
        </div>
      )}
    </aside>
  );
};
