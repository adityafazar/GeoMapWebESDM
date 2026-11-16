import React from 'react';
import type { PreviewMode } from '../../data/geomapData';

const CATALOG_MAP_THUMBS = [
  '/assets/catalog-maps/map-1.jpg',
  '/assets/catalog-maps/map-2.jpg',
  '/assets/catalog-maps/map-3.jpg',
  '/assets/catalog-maps/map-4.jpg',
] as const;

const MODE_DEFAULT_THUMB: Record<PreviewMode, string> = {
  geology: CATALOG_MAP_THUMBS[0],
  hydro: CATALOG_MAP_THUMBS[1],
  fault: CATALOG_MAP_THUMBS[2],
  basin: CATALOG_MAP_THUMBS[3],
};

interface MiniCardGraphicProps {
  mode: PreviewMode;
  variantIndex?: number;
}

export const MiniCardGraphic: React.FC<MiniCardGraphicProps> = ({
  mode,
  variantIndex,
}) => {
  const src =
    mode === 'geology' && typeof variantIndex === 'number'
      ? CATALOG_MAP_THUMBS[variantIndex % CATALOG_MAP_THUMBS.length]
      : MODE_DEFAULT_THUMB[mode];

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      className="h-full w-full scale-[1.45] object-cover object-[28%_18%] transition-transform duration-300 ease-out group-hover:scale-[1.52]"
    />
  );
};
