import React from 'react';
import { ExternalLink, X } from 'lucide-react';
import { useGeoMap } from '../../context/GeoMapContext';
import { HIGHLIGHT_MAP_SCALES, buildDummySheetFiles } from '../../data/geomapData';
import { useLeafletDomIsolation } from '../../hooks/useLeafletDomIsolation';

export interface MapFeatureInspectorProps {
  variant?: 'center' | 'docked';
}

export const MapFeatureInspector: React.FC<MapFeatureInspectorProps> = ({
  variant = 'center',
}) => {
  const {
    mapPopup,
    setMapPopup,
    navigate,
    focusQuadrangle,
    setCatScale,
    mapFormatFilter,
    mapTypeFilterIds,
    resetMapDataFilter,
  } = useGeoMap();
  const isoRef = useLeafletDomIsolation<HTMLDivElement>();

  if (!mapPopup) return null;

  const isDocked = variant === 'docked';
  const headingCls = isDocked
    ? 'gm-heading mt-1.5 text-[13.5px] font-bold leading-snug'
    : 'gm-heading mt-1 text-sm font-bold leading-tight';
  const subtitleCls = isDocked
    ? 'mt-1 text-[11px] leading-relaxed'
    : 'mt-0.5 text-[11px] leading-snug';
  const bodyCls = isDocked
    ? 'mt-3 text-xs leading-relaxed'
    : 'mt-2 text-xs leading-relaxed';
  const btnRowCls = isDocked
    ? 'mt-3.5 flex flex-wrap gap-2'
    : 'mt-3 flex flex-wrap gap-2';
  const primaryBtnCls = isDocked
    ? 'gm-cta-primary gm-focus inline-flex flex-1 min-w-0 items-center justify-center px-3 py-1.5 text-center text-xs font-bold leading-tight cursor-pointer'
    : 'gm-cta-primary gm-focus inline-flex flex-1 items-center justify-center px-3 py-1.5 text-xs whitespace-nowrap cursor-pointer';
  const secondaryBtnCls = isDocked
    ? 'gm-press gm-focus inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-center text-xs font-bold leading-tight whitespace-nowrap cursor-pointer'
    : 'gm-press gm-focus inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer';

  return (
    <div
      ref={isoRef}
      id="map-feature-inspector"
      data-inspector-mode={variant}
      role="region"
      aria-label="Inspektor Fitur Peta Terpilih"
      className={
        isDocked
          ? 'gm-hud gm-scroll pointer-events-auto z-20 flex min-h-0 w-full flex-1 flex-col overflow-y-auto p-3 space-y-2'
          : 'gm-hud gm-popover-cb pointer-events-auto z-30 mx-auto w-full max-w-xs sm:w-80 p-3.5 space-y-2.5'
      }
    >
      {mapPopup.kind === 'volcano' && (
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <span
                className="gm-micro text-[10px] font-bold uppercase tracking-wider"
                style={{ color: '#EA580C' }}
              >
                Gunung Api Aktif
              </span>
              <h3 className={headingCls}>
                {mapPopup.item.name}
              </h3>
              <p className={subtitleCls} style={{ color: 'var(--s-hud-muted)' }}>
                {mapPopup.item.province} · {mapPopup.item.elevation}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMapPopup(null)}
              className="gm-press gm-focus gm-touch-target rounded-lg p-1 cursor-pointer"
              aria-label="Tutup inspektor gunung api"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            className={`${isDocked ? 'mt-3' : 'mt-2'} flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5`}
            style={{ backgroundColor: 'var(--s-hud-chip-bg)' }}
          >
            <span className="text-[11px] font-semibold">Status PVMBG</span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-extrabold text-white"
              style={{ backgroundColor: mapPopup.item.color }}
            >
              {mapPopup.item.level}
            </span>
          </div>

          <div className={btnRowCls}>
            <a
              href={mapPopup.item.magmaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${primaryBtnCls} gap-1.5`}
            >
              <span>MAGMA ESDM</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={() =>
                navigate('preview', { slug: 'peta-sebaran-gunung-api-indonesia' })
              }
              className={secondaryBtnCls}
              style={{ borderColor: 'var(--s-hud-border)' }}
            >
              Pratinjau
            </button>
          </div>
        </div>
      )}

      {mapPopup.kind === 'fault' && (
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <span
                className="gm-micro text-[10px] font-bold uppercase tracking-wider"
                style={{ color: '#DC2626' }}
              >
                Segmen Sesar Aktif
              </span>
              <h3 className={headingCls}>
                {mapPopup.item.name}
              </h3>
              <p className={subtitleCls} style={{ color: 'var(--s-hud-muted)' }}>
                Kinematika: {mapPopup.item.kinematics}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMapPopup(null)}
              className="gm-press gm-focus gm-touch-target rounded-lg p-1 cursor-pointer"
              aria-label="Tutup inspektor sesar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className={bodyCls}>
            Laju geser estimasi:{' '}
            <strong className="tabular-nums">{mapPopup.item.slipRate}</strong>
          </p>
          <button
            type="button"
            onClick={() => navigate('preview', { slug: mapPopup.item.slug })}
            className={`${primaryBtnCls} w-full ${isDocked ? 'mt-3.5' : 'mt-3'}`}
          >
            Buka Pratinjau Peta Patahan Aktif
          </button>
        </div>
      )}

      {mapPopup.kind === 'quadrangle' && (() => {
        const scaleMeta = HIGHLIGHT_MAP_SCALES.find(
          (m) => m.value === mapPopup.item.scale,
        );
        const focusZoom =
          mapPopup.item.scale === '1:50.000'
            ? 10
            : mapPopup.item.scale === '1:100.000'
              ? 9
              : mapPopup.item.scale === '1:250.000'
                ? 8
                : 7;

        const areaLabel = mapPopup.item.locationLabel || mapPopup.item.region;
        const dummyFiles = buildDummySheetFiles(
          mapPopup.item.code,
          areaLabel,
          mapFormatFilter,
          mapTypeFilterIds,
        );
        const hasFilter = mapFormatFilter !== 'Semua' || mapTypeFilterIds.length > 0;

        return (
          <div className={isDocked ? 'flex min-h-0 flex-1 flex-col' : ''}>
            <div className="flex shrink-0 items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className="gm-micro text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--s-hud-muted)' }}
                  >
                    Kode {mapPopup.item.code}
                  </span>
                  <span
                    className="gm-micro tabular-nums rounded px-1.5 py-0.5 text-[10px] font-extrabold text-white"
                    style={{ backgroundColor: scaleMeta?.strokeColor ?? '#233C5A' }}
                  >
                    Skala {mapPopup.item.scale}
                  </span>
                  {mapPopup.item.isRegionalIndex && mapPopup.item.themeCode && (
                    <span
                      className="gm-micro tabular-nums rounded px-1.5 py-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor: '#233C5A',
                        color: '#FFF500',
                      }}
                    >
                      {mapPopup.item.themeCode}
                    </span>
                  )}
                </div>
                <h3 className={headingCls}>
                  {mapPopup.item.name}
                </h3>
                <p className={subtitleCls} style={{ color: 'var(--s-hud-muted)' }}>
                  {mapPopup.item.locationLabel
                    ? `${mapPopup.item.locationLabel} · ${mapPopup.item.region}`
                    : mapPopup.item.region}{' '}
                  · {mapPopup.item.hasShp ? 'GeoTIFF & .SHP' : 'GeoTIFF'}
                  {mapPopup.item.year > 0 ? ` · ${mapPopup.item.year}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMapPopup(null)}
                className="gm-press gm-focus gm-touch-target shrink-0 rounded-lg p-1 cursor-pointer"
                aria-label="Tutup inspektor indeks lembar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className={`${bodyCls} shrink-0`}>
              {mapPopup.item.summary}
            </p>

            {mapPopup.item.isRegionalIndex && (
              <div
                className="mt-2 shrink-0 rounded-lg px-2.5 py-1.5 text-[10.5px] leading-snug"
                style={{
                  backgroundColor: 'var(--s-hud-chip-bg)',
                  color: 'var(--s-hud-muted)',
                }}
              >
                <span className="font-semibold" style={{ color: 'var(--s-hud-fg)' }}>
                  {mapPopup.item.publisher ?? 'Pusat Survei Geologi'}
                </span>
                {mapPopup.item.compilers ? (
                  <span> · Penyusun: {mapPopup.item.compilers}</span>
                ) : null}
              </div>
            )}

            {/* Simulasi Data Dummy 9 Jenis File (SHP & Raster) Tersinkron Filter */}
            <div
              className={
                isDocked
                  ? 'mt-2.5 flex min-h-0 flex-1 flex-col rounded-xl border p-2'
                  : 'mt-2.5 rounded-xl border p-2'
              }
              style={{
                borderColor: 'var(--s-hud-border)',
                backgroundColor: 'var(--s-hud-chip-bg)',
              }}
            >
              <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2">
                <span
                  className="gm-micro text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--s-hud-muted)' }}
                >
                  Berkas Lembar ({dummyFiles.length}/9)
                </span>
                {hasFilter && (
                  <button
                    type="button"
                    onClick={resetMapDataFilter}
                    className="gm-focus gm-micro text-[10px] font-semibold underline cursor-pointer"
                    style={{ color: 'var(--s-hud-fg)' }}
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              <div
                className={
                  isDocked
                    ? 'gm-scroll min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5'
                    : 'gm-scroll max-h-28 space-y-1 overflow-y-auto pr-0.5'
                }
              >
                {dummyFiles.length === 0 ? (
                  <p
                    className="py-2 text-center text-[11px]"
                    style={{ color: 'var(--s-hud-muted)' }}
                  >
                    Tidak ada berkas yang cocok dengan filter aktif.
                  </p>
                ) : (
                  dummyFiles.map((file) => (
                    <button
                      key={file.typeId}
                      type="button"
                      onClick={() => navigate('preview', { slug: file.previewSlug })}
                      className="gm-focus flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1 text-left cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-semibold leading-tight">
                          {file.title}
                        </span>
                        <span
                          className="gm-micro block truncate text-[9.5px]"
                          style={{ color: 'var(--s-hud-muted)' }}
                        >
                          {file.fileName} · {file.sizeLabel}
                        </span>
                      </span>
                      <span
                        className="gm-micro shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase"
                        style={
                          file.format === 'SHP'
                            ? {
                                backgroundColor: 'rgba(4, 120, 87, 0.14)',
                                color: '#047857',
                              }
                            : {
                                backgroundColor: 'rgba(35, 60, 90, 0.12)',
                                color: 'var(--s-hud-fg)',
                              }
                        }
                      >
                        {file.format}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className={`${btnRowCls} shrink-0`}>
              {mapPopup.item.isComputedGrid ? (
                <button
                  type="button"
                  onClick={() => {
                    setCatScale(mapPopup.item.scale);
                    navigate('catalog');
                  }}
                  className={primaryBtnCls}
                >
                  Cari Dataset {mapPopup.item.scale}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('preview', { slug: mapPopup.item.slug })}
                  className={primaryBtnCls}
                >
                  Buka Pratinjau Lembar
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  focusQuadrangle(mapPopup.item, {
                    zoom: focusZoom,
                    preserveCurrentZoomIfVisible: false,
                  })
                }
                className={secondaryBtnCls}
                style={{ borderColor: 'var(--s-hud-border)' }}
              >
                Fokus Peta
              </button>
            </div>
          </div>
        );
      })()}

      {(mapPopup.kind === 'basin' || mapPopup.kind === 'groundwater') && (
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <span
                className="gm-micro text-[10px] font-bold uppercase tracking-wider"
                style={{
                  color:
                    mapPopup.kind === 'groundwater' ? '#0284C7' : '#047857',
                }}
              >
                {mapPopup.kind === 'groundwater'
                  ? 'Cekungan Air Tanah'
                  : 'Cekungan Sedimen'}
              </span>
              <h3 className={headingCls}>
                {mapPopup.title}
              </h3>
              <p className={subtitleCls} style={{ color: 'var(--s-hud-muted)' }}>
                {mapPopup.subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMapPopup(null)}
              className="gm-press gm-focus gm-touch-target rounded-lg p-1 cursor-pointer"
              aria-label="Tutup inspektor cekungan"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className={bodyCls}>
            {mapPopup.detail}
          </p>
          <button
            type="button"
            onClick={() => navigate('preview', { slug: mapPopup.slug })}
            className={`${primaryBtnCls} w-full ${isDocked ? 'mt-3.5' : 'mt-3'}`}
          >
            Pratinjau &amp; Skema Data
          </button>
        </div>
      )}
    </div>
  );
};

