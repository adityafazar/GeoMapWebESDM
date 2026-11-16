import React from 'react';
import { Box, Layers } from 'lucide-react';
import { useGeoMap } from '../../context/GeoMapContext';
import { useLeafletDomIsolation } from '../../hooks/useLeafletDomIsolation';

export const MapDimensionPill: React.FC = () => {
  const { mapDimension, setMapDimension, mapPitchDeg, setMapPitchDeg } =
    useGeoMap();
  const rootRef = useLeafletDomIsolation<HTMLDivElement>();
  const is3D = mapDimension === '3d';

  return (
    <div
      ref={rootRef}
      id="map-dimension-pill"
      className="pointer-events-none w-full shrink-0"
    >
      <div
        className="gm-hud pointer-events-auto flex h-[44px] w-full items-center gap-1.5 rounded-full p-1 transition-shadow duration-300"
        title="Pengalih tampilan 2D dan 3D Terrain (pratinjau kontrol UI)"
      >
        <div
          role="group"
          aria-label="Mode dimensi peta"
          className={[
            'h-[34px] items-center gap-1 rounded-full border p-0.5',
            is3D ? 'inline-flex shrink-0' : 'grid flex-1 grid-cols-2',
          ].join(' ')}
          style={{
            backgroundColor: 'var(--s-hud-chip-bg)',
            borderColor: 'var(--s-hud-border)',
          }}
        >
          <button
            type="button"
            aria-pressed={!is3D}
            onClick={() => setMapDimension('2d')}
            className={[
              'gm-press gm-focus gm-touch-target inline-flex h-7 items-center justify-center gap-1.5 rounded-full text-[11.5px] font-bold cursor-pointer transition-all',
              is3D ? 'px-2.5' : 'px-3.5',
            ].join(' ')}
            style={
              !is3D
                ? {
                    backgroundColor: 'var(--p-esdm-yellow)',
                    color: '#000000',
                    boxShadow: '0 2px 8px rgba(213, 182, 0, 0.34)',
                  }
                : {
                    backgroundColor: 'transparent',
                    color: 'var(--s-hud-muted)',
                  }
            }
          >
            <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>2D</span>
          </button>

          <button
            type="button"
            aria-pressed={is3D}
            onClick={() => setMapDimension('3d')}
            className={[
              'gm-press gm-focus gm-touch-target inline-flex h-7 items-center justify-center gap-1.5 rounded-full text-[11.5px] font-bold whitespace-nowrap cursor-pointer transition-all',
              is3D ? 'px-3' : 'px-3.5',
            ].join(' ')}
            style={
              is3D
                ? {
                    backgroundColor: 'var(--p-esdm-yellow)',
                    color: '#000000',
                    boxShadow: '0 2px 8px rgba(213, 182, 0, 0.34)',
                  }
                : {
                    backgroundColor: 'transparent',
                    color: 'var(--s-hud-fg)',
                  }
            }
          >
            <Box className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>3D Terrain</span>
          </button>
        </div>

        {is3D && (
          <div className="gm-popover-tl flex min-w-0 flex-1 items-center gap-2 pr-2.5 pl-1">
            <label
              htmlFor="map-pitch-slider"
              className="gm-micro shrink-0 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
              style={{ color: 'var(--s-hud-muted)' }}
            >
              Pitch
            </label>
            <input
              id="map-pitch-slider"
              type="range"
              min={25}
              max={75}
              value={mapPitchDeg}
              onChange={(e) => setMapPitchDeg(Number(e.target.value))}
              data-vaul-no-drag
              aria-label="Sudut kemiringan 3D (Pitch)"
              className="gm-range gm-focus min-w-0 flex-1 cursor-pointer"
            />
            <span className="tabular-nums shrink-0 text-right text-[11px] font-extrabold">
              {mapPitchDeg}°
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
