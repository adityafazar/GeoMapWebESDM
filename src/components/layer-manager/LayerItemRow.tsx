import React from 'react';
import type { MapLayerMeta } from '../../data/geomapData';

interface LayerItemRowProps {
  layer: MapLayerMeta;
  active: boolean;
  opacity: number;
  compact?: boolean;
  isLast?: boolean;
  onToggle: () => void;
  onOpacityChange: (value: number) => void;
}

/** Baris kontrol minimalis untuk satu lapisan data geospasial beserta slider opasitasnya. */
export const LayerItemRow: React.FC<LayerItemRowProps> = ({
  layer,
  active,
  opacity,
  compact = false,
  isLast = false,
  onToggle,
  onOpacityChange,
}) => {
  const sliderPct = Math.max(0, Math.min(100, ((opacity - 30) / 70) * 100));

  return (
    <li
      className="px-3.5 py-2.5 transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.04]"
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--s-hud-border)',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-semibold leading-snug tracking-[-0.01em]">
            {layer.name}
          </span>
          {!compact && (
            <span
              className="gm-micro mt-0.5 block truncate text-[11px] leading-snug"
              style={{ color: 'var(--s-hud-muted)' }}
            >
              {layer.desc}
            </span>
          )}
        </div>

        <button
          type="button"
          role="switch"
          data-vaul-no-drag=""
          aria-checked={active}
          aria-label={`Aktifkan ${layer.name}`}
          onClick={onToggle}
          className="gm-focus gm-press relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full cursor-pointer transition-colors"
          style={{
            backgroundColor: active ? '#00B473' : 'rgba(120, 120, 128, 0.28)',
          }}
        >
          <span
            aria-hidden="true"
            className="block h-[18px] w-[18px] rounded-full bg-white shadow"
            style={{
              transform: active ? 'translateX(18px)' : 'translateX(2px)',
              transition: 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </button>
      </div>

      {active && (
        <div
          data-vaul-no-drag=""
          className="mt-2 flex items-center gap-2.5"
        >
          <label
            htmlFor={`opacity-${layer.key}`}
            className="gm-micro text-[10.5px] font-medium whitespace-nowrap"
            style={{ color: 'var(--s-hud-muted)' }}
          >
            Opasitas
          </label>
          <input
            id={`opacity-${layer.key}`}
            data-vaul-no-drag=""
            type="range"
            min={30}
            max={100}
            step={5}
            value={opacity}
            onChange={(e) => onOpacityChange(Number(e.target.value))}
            style={{ '--val': `${sliderPct}%` } as React.CSSProperties}
            className="gm-range flex-1"
            aria-label={`Opasitas ${layer.name}`}
          />
          <span
            className="gm-micro tabular-nums w-8 text-right text-[11px] font-semibold"
            style={{ color: 'var(--s-hud-muted)' }}
          >
            {opacity}%
          </span>
        </div>
      )}
    </li>
  );
};
