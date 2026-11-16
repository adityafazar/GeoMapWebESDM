import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { useGeoMap, type RouteName } from '../context/GeoMapContext';
import { DATASETS } from '../data/geomapData';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { EsdmLogo } from './EsdmLogo';

interface NavTabDef {
  id: RouteName;
  label: string;
  badge?: number;
}

const NAV_TABS: NavTabDef[] = [
  { id: 'map', label: 'Peta Interaktif' },
  {
    id: 'catalog',
    label: 'Katalog Peta',
    badge: DATASETS.length,
  },
  { id: 'faq', label: 'Panduan & FAQ' },
];

export const PortalHeader: React.FC = () => {
  const {
    route,
    navigate,
    darkMode,
    toggleDarkMode,
    user,
    openAuthModal,
    logoutUser,
    mobileNavOpen,
    setMobileNavOpen,
  } = useGeoMap();

  const isCompactViewport = useMediaQuery('(max-width: 767px)');
  const activeTabId: RouteName = route === 'preview' ? 'catalog' : route;
  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pillRect, setPillRect] = useState({ left: 0, width: 0, ready: false });

  const recomputePill = useCallback(() => {
    const activeEl = tabRefs.current[activeTabId];
    if (!activeEl || activeEl.offsetWidth <= 0) return;

    setPillRect({
      left: activeEl.offsetLeft,
      width: activeEl.offsetWidth,
      ready: true,
    });
  }, [activeTabId]);

  useLayoutEffect(() => {
    recomputePill();
    const raf =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame(() => recomputePill())
        : 0;
    return () => {
      if (raf && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(raf);
      }
    };
  }, [recomputePill, isCompactViewport, DATASETS.length]);

  useEffect(() => {
    const container = navContainerRef.current;
    if (!container || isCompactViewport) return;

    recomputePill();
    const onResize = () => recomputePill();
    window.addEventListener('resize', onResize);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => recomputePill());
      ro.observe(container);
      Object.values(tabRefs.current).forEach((el) => {
        if (el) ro?.observe(el);
      });
    }

    document.fonts?.ready?.then(() => recomputePill()).catch(() => {});

    return () => {
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
    };
  }, [recomputePill, isCompactViewport]);

  const remainingQuota = user ? user.quotaLimit - user.quotaUsed : 0;

  return (
    <header
      className="gm-header-glass sticky top-0 z-[1100] transition-colors duration-200"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Top 58px Apple Liquid Glass Row (Logo ujung kiri · Section tepat di tengah · Dark Mode & Masuk ujung kanan) */}
      <div className="flex h-[58px] w-full items-center justify-between gap-2.5 px-3 sm:px-4 md:grid md:grid-cols-[1fr_auto_1fr]">
        <div className="min-w-0 justify-self-start">
          <EsdmLogo onClick={() => navigate('map')} darkMode={darkMode} />
        </div>

        {/* Primary Horizontal Liquid Glass Capsule (Visible from md: 768px+, tepat di tengah layar) */}
        {!isCompactViewport && (
          <nav
            aria-label="Navigasi Utama GeoMap ESDM"
            className="hidden md:flex min-w-0 items-center justify-center justify-self-center shrink-0"
          >
            <div
              ref={navContainerRef}
              id="apple-nav-track"
              className="relative inline-flex items-center rounded-full p-1"
              style={{
                backgroundColor: 'var(--s-track-bg)',
                boxShadow: 'var(--s-track-ring)',
              }}
            >
              {/* Spring-Animated Kuning ESDM (#FFF500) Pill Indicator */}
              <div
                id="apple-nav-pill"
                aria-hidden="true"
                className="gm-spring-pill pointer-events-none absolute top-1 bottom-1 left-0 rounded-full"
                style={{
                  backgroundColor: '#FFF500',
                  boxShadow: 'var(--s-nav-pill-shadow)',
                  width: `${pillRect.width}px`,
                  transform: `translateX(${pillRect.left}px)`,
                  opacity: pillRect.ready ? 1 : 0,
                }}
              />

              {NAV_TABS.map((tab) => {
                const isActive = activeTabId === tab.id;
                return (
                  <button
                    key={tab.id}
                    ref={(el) => {
                      tabRefs.current[tab.id] = el;
                    }}
                    type="button"
                    onClick={() => navigate(tab.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`gm-focus gm-press relative z-10 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[12.5px] tracking-[-0.01em] whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive ? 'font-semibold' : 'font-medium'
                    }`}
                    style={{
                      color: isActive ? '#000000' : 'var(--s-text-nav)',
                      backgroundColor: !pillRect.ready && isActive ? '#FFF500' : 'transparent',
                    }}
                  >
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span
                        className="tabular-nums rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none transition-colors"
                        style={
                          isActive
                            ? { backgroundColor: 'rgba(0, 0, 0, 0.14)', color: '#000000' }
                            : {
                                backgroundColor: 'var(--s-nav-badge-bg)',
                                color: 'var(--s-nav-badge-fg)',
                              }
                        }
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* Utility & Contextual Auth Actions (ujung kanan) */}
        <div className="flex items-center justify-end gap-1.5 justify-self-end shrink-0">
          <button
            type="button"
            onClick={toggleDarkMode}
            className={`gm-press gm-focus gm-touch-target inline-flex h-8 w-8 items-center justify-center rounded-full cursor-pointer ${
              darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
            style={{
              color: 'var(--s-text-primary)',
            }}
            aria-label={darkMode ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
            title={darkMode ? 'Mode Terang Resmi' : 'Mode Gelap'}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user ? (
            <div className="hidden md:flex items-center gap-1.5">
              <div
                className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
                style={{
                  backgroundColor: 'var(--s-status-public-bg)',
                  borderColor: 'var(--p-esdm-green)',
                  color: 'var(--s-status-public-fg)',
                }}
              >
                <span className="font-bold max-w-[72px] lg:max-w-[130px] truncate">
                  {user.name}
                </span>
                <span className="tabular-nums rounded-full px-1.5 py-0.5 text-[11px] font-extrabold bg-white/85 text-black">
                  {remainingQuota}/{user.quotaLimit}
                </span>
              </div>
              <button
                type="button"
                onClick={logoutUser}
                className={`gm-press gm-focus inline-flex h-8 w-8 items-center justify-center rounded-full cursor-pointer ${
                  darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'
                }`}
                style={{
                  backgroundColor: 'var(--s-track-bg)',
                  boxShadow: 'var(--s-track-ring)',
                  color: 'var(--s-text-primary)',
                }}
                aria-label="Keluar Akun"
                title="Keluar Akun"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal()}
              className="gm-press gm-focus hidden md:inline-flex items-center rounded-full bg-[#FFF500] hover:bg-[#F2E800] px-4 py-1.5 text-[12px] font-semibold tracking-[-0.01em] text-black whitespace-nowrap shrink-0 cursor-pointer"
              style={{
                boxShadow: 'var(--s-nav-pill-shadow)',
              }}
            >
              Masuk
            </button>
          )}

          {/* Compact Viewport Drawer Trigger (< 768px) */}
          <button
            type="button"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            className="gm-press gm-focus gm-touch-target md:hidden inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold cursor-pointer"
            style={{
              backgroundColor: 'var(--s-track-bg)',
              boxShadow: 'var(--s-track-ring)',
              color: 'var(--s-text-primary)',
            }}
            aria-label={mobileNavOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-nav-drawer"
          >
            {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span>Menu</span>
          </button>
        </div>
      </div>

      {/* Compact Viewport Always-Visible 3-Route Quick Capsules (< 768px) */}
      {isCompactViewport && (
        <nav
          aria-label="Navigasi Seluler GeoMap ESDM"
          className="md:hidden flex items-center gap-1 px-3 pb-2 overflow-x-auto"
        >
          {NAV_TABS.map((tab) => {
            const isActive = activeTabId === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigate(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className="gm-press gm-focus gm-touch-target inline-flex flex-1 items-center justify-center gap-1 rounded-full px-2.5 py-1.5 text-[11.5px] font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                style={
                  isActive
                    ? {
                        backgroundColor: '#FFF500',
                        color: '#000000',
                        boxShadow: 'var(--s-nav-pill-shadow)',
                      }
                    : {
                        color: 'var(--s-text-nav)',
                        backgroundColor: 'var(--s-track-bg)',
                        boxShadow: 'var(--s-track-ring)',
                      }
                }
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className="tabular-nums rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
                    style={
                      isActive
                        ? { backgroundColor: 'rgba(0, 0, 0, 0.14)', color: '#000000' }
                        : {
                            backgroundColor: 'var(--s-nav-badge-bg)',
                            color: 'var(--s-nav-badge-fg)',
                          }
                    }
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}

      {/* Compact Viewport Navigation Drawer (< 768px, anchored cleanly above Leaflet) */}
      {mobileNavOpen && (
        <div
          id="mobile-nav-drawer"
          className="gm-popover-tc md:hidden absolute inset-x-0 top-full z-[1150] border-b px-4 py-3 shadow-xl"
          style={{
            backgroundColor: 'var(--s-bg-surface)',
            borderColor: 'var(--s-border-subtle)',
          }}
        >
          <div className="flex flex-col gap-1.5">
            {NAV_TABS.map((tab) => {
              const isActive = activeTabId === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => navigate(tab.id)}
                  className="gm-focus flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold cursor-pointer"
                  style={
                    isActive
                      ? { backgroundColor: '#FFF500', color: '#000000' }
                      : { color: 'var(--s-text-primary)' }
                  }
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className="tabular-nums rounded-full px-2 py-0.5 text-xs font-bold"
                      style={
                        isActive
                          ? { backgroundColor: 'rgba(0, 0, 0, 0.14)', color: '#000000' }
                          : {
                              backgroundColor: 'var(--s-nav-badge-bg)',
                              color: 'var(--s-nav-badge-fg)',
                            }
                      }
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div
            className="mt-3 flex items-center justify-between border-t pt-3"
            style={{ borderColor: 'var(--s-border-subtle)' }}
          >
            {user ? (
              <>
                <div className="text-xs">
                  <p className="font-bold" style={{ color: 'var(--s-text-primary)' }}>
                    {user.name}
                  </p>
                  <p style={{ color: 'var(--s-text-muted)' }}>
                    Kuota: {remainingQuota}/{user.quotaLimit} paket
                  </p>
                </div>
                <button
                  type="button"
                  onClick={logoutUser}
                  className="gm-press rounded-full border px-3 py-1.5 text-xs font-semibold cursor-pointer"
                  style={{ borderColor: 'var(--s-border-strong)' }}
                >
                  Keluar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  openAuthModal();
                }}
                className="gm-cta-primary w-full rounded-full py-2.5 text-xs cursor-pointer"
                style={{ boxShadow: 'var(--s-nav-pill-shadow)' }}
              >
                Masuk untuk Unduh GeoPDF &amp; .SHP (Kuota 20/hari)
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
