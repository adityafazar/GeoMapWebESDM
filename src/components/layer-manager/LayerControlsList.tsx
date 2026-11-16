import React from 'react';
import { useGeoMap } from '../../context/GeoMapContext';
import { MAP_LAYERS } from '../../data/geomapData';
import { BasemapSelector } from './BasemapSelector';
import { LayerItemRow } from './LayerItemRow';

interface LayerControlsListProps {
  compact?: boolean;
}

/** Daftar kontrol Peta Dasar dan Lapisan Data Geospasial untuk panel desktop maupun sheet mobile. */
export const LayerControlsList: React.FC<LayerControlsListProps> = ({
  compact = false,
}) => {
  const { mapLayers, layerOpacity, toggleLayer, setLayerOpacity } = useGeoMap();

  return (
    <div>
      <BasemapSelector />

      <section aria-label="Lapisan Data Geospasial">
        <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1">
          <span
            className="gm-micro text-[10.5px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--s-hud-muted)' }}
          >
            Lapisan Data Geospasial
          </span>
          <span
            className="gm-micro tabular-nums text-[11px] font-medium"
            style={{ color: 'var(--s-hud-muted)' }}
          >
            {MAP_LAYERS.length} layer
          </span>
        </div>

        <ul className="m-0 list-none p-0">
          {MAP_LAYERS.map((layer, index) => (
            <LayerItemRow
              key={layer.key}
              layer={layer}
              active={mapLayers[layer.key]}
              opacity={layerOpacity[layer.key]}
              compact={compact}
              isLast={index === MAP_LAYERS.length - 1}
              onToggle={() => toggleLayer(layer.key)}
              onOpacityChange={(val) => setLayerOpacity(layer.key, val)}
            />
          ))}
        </ul>
      </section>
    </div>
  );
};
