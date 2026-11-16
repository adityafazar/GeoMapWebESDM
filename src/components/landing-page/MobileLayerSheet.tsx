import React from 'react';
import { Drawer } from 'vaul';
import { ChevronUp, X } from 'lucide-react';
import { useGeoMap, type SheetDetent } from '../../context/GeoMapContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { LayerControlsList } from '../layer-manager';

const SNAP_POINTS: (number | string)[] = [0.24, 0.56, 0.88];

function detentToSnap(detent: SheetDetent): number {
  if (detent === 'minimal') return 0.24;
  if (detent === 'ringkas') return 0.56;
  return 0.88;
}

function snapToDetent(snap: number | string | null): SheetDetent {
  if (snap === 0.88) return 'penuh';
  if (snap === 0.56) return 'ringkas';
  return 'minimal';
}

export const MobileLayerSheet: React.FC = () => {
  const {
    route,
    darkMode,
    basemap,
    mapLayers,
    mobileSheetOpen,
    setMobileSheetOpen,
    mobileSheetDetent,
    setMobileSheetDetent,
  } = useGeoMap();

  const isMobile = useMediaQuery('(max-width: 767px)');
  const isSatOnMap = route === 'map' && basemap === 'sat';

  if (!isMobile) return null;

  const activeCount = Object.values(mapLayers).filter(Boolean).length;
  const activeSnap = detentToSnap(mobileSheetDetent);

  if (!mobileSheetOpen) {
    return (
      <div
        className="pointer-events-auto fixed left-1/2 z-[900] -translate-x-1/2 md:hidden"
        style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          type="button"
          onClick={() => setMobileSheetOpen(true)}
          className="gm-hud gm-press gm-focus gm-touch-target inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold shadow-lg whitespace-nowrap cursor-pointer"
          aria-label="Buka Panel Layer Peta Seluler"
        >
          <span>Manajer Layer</span>
          <span
            className="gm-micro tabular-nums rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors"
            style={
              activeCount > 0
                ? { backgroundColor: '#E6F8F1', color: '#064E3B' }
                : {
                    backgroundColor: 'var(--s-hud-chip-bg)',
                    color: 'var(--s-hud-muted)',
                  }
            }
          >
            {activeCount} Aktif
          </span>
          <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <Drawer.Root
      open={mobileSheetOpen}
      onOpenChange={setMobileSheetOpen}
      snapPoints={SNAP_POINTS}
      activeSnapPoint={activeSnap}
      setActiveSnapPoint={(val) => setMobileSheetDetent(snapToDetent(val))}
      modal={false}
      dismissible
      noBodyStyles
      disablePreventScroll
    >
      <Drawer.Portal>
        <Drawer.Content
          aria-label="Panel Layer Peta Seluler"
          className={[
            'geomap-stage map-hud-zone gm-sheet-glass fixed inset-x-0 bottom-0 z-[900] flex h-[100dvh] max-h-[100dvh] flex-col rounded-t-[20px] border-t outline-none md:hidden',
            darkMode ? 'is-dark' : '',
            isSatOnMap ? 'is-sat' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            backgroundColor: 'var(--s-hud-bg)',
            borderColor: 'var(--s-hud-border)',
            color: 'var(--s-hud-fg)',
            backdropFilter: 'var(--c-hud-blur)',
            WebkitBackdropFilter: 'var(--c-hud-blur)',
            boxShadow:
              'var(--s-hud-specular), 0 -16px 40px -10px rgba(15, 23, 42, 0.25)',
          }}
        >
          <div className="touch-none pt-2.5 pb-1">
            <div className="mx-auto h-1.5 w-11 shrink-0 rounded-full bg-slate-400/50" />
          </div>

          {/* Header + 1-Tap Accessible Detent Alternatives + Close */}
          <div
            className="flex items-center justify-between gap-2 border-b px-4 py-2.5"
            style={{ borderColor: 'var(--s-hud-border)' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Drawer.Title className="gm-heading text-xs font-extrabold uppercase truncate">
                Layer ({activeCount}/7)
              </Drawer.Title>
            </div>

            <div className="flex items-center gap-2 shrink-0" role="group" aria-label="Tinggi panel layer">
              {(['minimal', 'ringkas', 'penuh'] as SheetDetent[]).map((mode) => {
                const selected = mobileSheetDetent === mode;
                const label =
                  mode === 'minimal'
                    ? 'Minimal'
                    : mode === 'ringkas'
                      ? 'Ringkas'
                      : 'Penuh';
                return (
                  <button
                    key={mode}
                    type="button"
                    data-vaul-no-drag=""
                    aria-pressed={selected}
                    onClick={() => setMobileSheetDetent(mode)}
                    className="gm-press gm-focus gm-micro rounded-full px-2.5 py-1.5 text-[11px] font-bold"
                    style={
                      selected
                        ? { backgroundColor: '#FFF500', color: '#000000' }
                        : {
                            backgroundColor: 'var(--s-hud-chip-bg)',
                            color: 'var(--s-hud-muted)',
                          }
                    }
                  >
                    {label}
                  </button>
                );
              })}

              <button
                type="button"
                data-vaul-no-drag=""
                onClick={() => setMobileSheetOpen(false)}
                className="gm-press gm-focus gm-touch-target ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full border"
                style={{ borderColor: 'var(--s-hud-border)' }}
                aria-label="Tutup panel layer seluler"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div
            className="gm-scroll gm-scroll-mask flex-1 overflow-y-auto px-4 py-3"
            style={{
              paddingBottom: 'calc(18dvh + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <LayerControlsList compact />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
