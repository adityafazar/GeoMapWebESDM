import React from 'react';
import { OFFICIAL_ATTRIBUTION, type MapLayerMeta } from '../../data/geomapData';

interface MapRightHudFooterProps {
  lat: number;
  lng: number;
  scaleLabel: string;
  scaleBar: {
    widthPx: number;
    label: string;
  };
  activeLayerObjs: MapLayerMeta[];
}

export const MapRightHudFooter: React.FC<MapRightHudFooterProps> = ({
  lat,
  lng,
  scaleLabel,
  scaleBar,
  activeLayerObjs,
}) => {
  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      <div className="hidden max-w-md flex-col items-end gap-2 sm:flex">
        <div className="gm-hud pointer-events-auto flex flex-wrap items-center gap-2.5 px-3 py-2 text-[11px]">
          <div className="tabular-nums font-semibold">
            {lat >= 0
              ? `${lat.toFixed(2)}° LU`
              : `${Math.abs(lat).toFixed(2)}° LS`}
            , {lng.toFixed(2)}° BT
          </div>
          <span className="opacity-35">|</span>
          <div className="tabular-nums font-medium">Skala {scaleLabel}</div>
          <span className="opacity-35">|</span>
          <div className="flex items-center gap-1.5">
            <span
              className="h-1.5 border-x border-b"
              style={{
                width: `${scaleBar.widthPx}px`,
                borderColor: 'var(--s-hud-fg)',
              }}
              aria-hidden="true"
            />
            <span className="gm-micro tabular-nums text-[10px]">
              {scaleBar.label}
            </span>
          </div>
        </div>

        <div className="gm-hud pointer-events-auto flex flex-wrap items-center justify-end gap-2 px-3 py-2 text-[10px]">
          <span className="gm-micro font-bold uppercase tracking-wider opacity-75">
            Legenda:
          </span>
          {activeLayerObjs.length === 0 ? (
            <span className="opacity-65">Tidak ada lapisan aktif</span>
          ) : (
            activeLayerObjs.map((m, idx) => (
              <React.Fragment key={m.key}>
                {idx > 0 && <span className="opacity-30">•</span>}
                <span className="inline-flex items-center gap-1 font-medium">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: m.color }}
                    aria-hidden="true"
                  />
                  <span>{m.name.split(' (')[0]}</span>
                </span>
              </React.Fragment>
            ))
          )}
        </div>
      </div>

      {/* Subtle Bottom Official Attribution Pill (single DOM node: SR-accessible on mobile, HUD pill on lg+) */}
      <p
        className="sr-only lg:not-sr-only gm-hud pointer-events-auto px-2.5 py-1.5 text-[10px] font-medium opacity-85"
        style={{ color: 'var(--s-hud-muted)' }}
        title={OFFICIAL_ATTRIBUTION}
      >
        {OFFICIAL_ATTRIBUTION}
      </p>
    </div>
  );
};

