import { describe, expect, it, beforeEach, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import L from 'leaflet';
import { App } from './App';
import {
  DATASETS,
  HIGHLIGHT_MAP_SCALES,
  MAP_LAYERS,
  OFFICIAL_ATTRIBUTION,
  QUADRANGLE_GRIDS,
} from './data/geomapData';
import { INDEX_REGIONAL_SHEETS } from './data/indexRegionalData';
import { projectMomentum, rubberbandClamp, stepAppleSpring } from './utils/applePhysics';
import {
  REGIONAL_INDEX_QUADRANGLES,
  computeCartographicScaleBar,
  computeImwCode,
  computePopupAnchoredMapCenter,
  computeRealScaleRatioLabel,
  computeSniNlpCode,
  generateNlpCellsInViewport,
  generateRegionalIndexCells,
  resolveMonotonicZoomScale,
  zoomToMapScaleValue,
} from './utils/indonesiaNlpGrid';

describe('GeoMap ESDM Portal — Master Blueprint Verification', () => {
  beforeEach(() => {
    cleanup();
    window.localStorage.clear();
    window.location.hash = '#/';
  });

  it('memastikan 11 Peta Skala Nasional unik tanpa duplikasi dan 10 Pencarian Terbanyak memiliki slug 1:1', () => {
    const national = DATASETS.filter((d) => d.isNational);
    expect(national).toHaveLength(11);
    const nationalSlugs = new Set(national.map((d) => d.slug));
    expect(nationalSlugs.size).toBe(11);

    const popular = DATASETS.filter((d) => d.isPopular);
    expect(popular).toHaveLength(10);
    const bandung = popular.find((d) => d.title.includes('Bandung'));
    const yogya = popular.find((d) => d.title.includes('Yogyakarta'));
    expect(bandung?.slug).toBe('peta-geologi-lembar-bandung-jawa');
    expect(yogya?.slug).toBe('peta-geologi-lembar-yogyakarta-jawa');
    expect(popular.every((d) => !d.slug.includes('//'))).toBe(true);
  });

  it('menerapkan Clean Startup, atribusi resmi ESDM, dan header tab anti-wrapping', () => {
    render(<App />);

    // Header primary tabs must keep whitespace-nowrap + shrink-0 (prevent wrap regression)
    const mapTab = screen.getByRole('button', { name: 'Peta Interaktif' });
    const catalogTab = screen.getByRole('button', {
      name: new RegExp(`Katalog Peta.*${DATASETS.length}`),
    });
    const faqTab = screen.getByRole('button', { name: 'Panduan & FAQ' });

    expect(mapTab.className).toContain('whitespace-nowrap');
    expect(catalogTab.className).toContain('whitespace-nowrap');
    expect(faqTab.className).toContain('whitespace-nowrap');

    // Clean Startup (0 Aktif): tidak ada satupun Lapisan Data Geospasial yang aktif saat awal dibuka
    expect(MAP_LAYERS).toHaveLength(7);
    expect(MAP_LAYERS.every((l) => !l.defaultOn)).toBe(true);
    const allLayerSwitches = screen.getAllByRole('switch');
    expect(allLayerSwitches).toHaveLength(MAP_LAYERS.length);
    for (const sw of allLayerSwitches) {
      expect(sw).toHaveAttribute('aria-checked', 'false');
    }
    expect(screen.getByText('0 Aktif')).toBeInTheDocument();
    expect(screen.getByText('Tidak ada lapisan aktif')).toBeInTheDocument();

    // Aktifkan satu layer secara eksplisit -> menjadi aktif dan muncul di Legenda
    const provSwitch = screen.getByRole('switch', {
      name: /Batas Administrasi Provinsi/i,
    });
    fireEvent.click(provSwitch);
    expect(provSwitch).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('1 Aktif')).toBeInTheDocument();

    expect(screen.getByText(OFFICIAL_ATTRIBUTION)).toBeInTheDocument();
    expect(screen.getByText('Legenda:')).toBeInTheDocument();
    expect(screen.queryByText(/Peta Skala Nasional \(1:5\.000\.000\)/i)).toBeNull();
  });

  it('mengganti Koleksi Kurasi Cepat dengan History Pencarian Saya (empty state, catat, 1-click restore, deduplikasi, hapus per item & hapus semua, serta persistensi localStorage)', () => {
    // Guard corrupted localStorage JSON gracefully
    window.localStorage.setItem('geomap_esdm_search_history_v1', '{invalid-json');
    render(<App />);

    expect(screen.queryByText(/Koleksi Kurasi Cepat/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /11 Peta Skala Nasional/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /10 Pencarian Terbanyak/i })).toBeNull();
    expect(screen.queryByRole('region', { name: 'History Pencarian Saya' })).toBeNull();

    const smartSearch = screen.getByLabelText('Cari lokasi atau koleksi peta');
    fireEvent.focus(smartSearch);

    // Empty state saat riwayat kosong
    const historyRegion = screen.getByRole('region', { name: 'History Pencarian Saya' });
    expect(within(historyRegion).getByText('History Pencarian Saya')).toBeInTheDocument();
    expect(within(historyRegion).getByText('Belum ada riwayat pencarian')).toBeInTheDocument();

    // 1) Catat dataset dari klik Live Search Suggestion
    fireEvent.change(smartSearch, { target: { value: 'Patahan Aktif' } });
    fireEvent.click(screen.getByRole('button', { name: /Peta Patahan Aktif Indonesia/i }));

    // 2) Catat dari klik Live Search Suggestion (volcano: G. Merapi)
    fireEvent.focus(smartSearch);
    fireEvent.change(smartSearch, { target: { value: 'Merapi' } });
    fireEvent.click(screen.getByRole('button', { name: /G\. Merapi/i }));
    expect(document.getElementById('map-feature-inspector')).not.toBeNull();

    // Tutup inspector agar verifikasi 1-click restore jelas
    fireEvent.click(screen.getByRole('button', { name: /Tutup inspektor gunung api/i }));
    expect(document.getElementById('map-feature-inspector')).toBeNull();

    // 3) Catat dari handleSearchSubmit (quadrangle: 1209-3 Bandung)
    fireEvent.focus(smartSearch);
    fireEvent.change(smartSearch, { target: { value: '1209-3' } });
    const searchForm = smartSearch.closest('form')!;
    fireEvent.submit(searchForm);
    expect(within(document.getElementById('map-feature-inspector')!).getByText('Lembar Bandung')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Tutup inspektor indeks lembar/i }));

    // 4) Deduplikasi: cari Merapi lagi -> pindah ke urutan teratas tanpa duplikat
    fireEvent.focus(smartSearch);
    fireEvent.change(smartSearch, { target: { value: 'Merapi' } });
    fireEvent.click(
      within(document.getElementById('map-search-card')!).getByRole('button', {
        name: /G\. Merapi/i,
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: /Tutup inspektor gunung api/i }));

    // Kosongkan input dan fokus -> tampilkan 3 item riwayat terbaru di atas
    fireEvent.change(smartSearch, { target: { value: '' } });
    fireEvent.focus(smartSearch);
    const populatedRegion = screen.getByRole('region', { name: 'History Pencarian Saya' });
    const restoreButtons = within(populatedRegion)
      .getAllByRole('button')
      .filter(
        (btn) =>
          btn.getAttribute('aria-label') !== 'Hapus semua riwayat pencarian' &&
          !btn.getAttribute('aria-label')?.startsWith('Hapus '),
      );
    expect(restoreButtons).toHaveLength(3);
    expect(restoreButtons[0].textContent).toContain('G. Merapi');
    expect(restoreButtons[1].textContent).toContain('1209-3 · Lembar Bandung');
    expect(restoreButtons[2].textContent).toContain('Peta Patahan Aktif Indonesia');

    // Pastikan tombol hapus per item bersaudara (bukan nested button)
    const deleteMerapiBtn = within(populatedRegion).getByRole('button', {
      name: 'Hapus G. Merapi dari riwayat',
    });
    expect(restoreButtons[0].contains(deleteMerapiBtn)).toBe(false);

    // 1-Click restore dengan mouseDown + blur + click (simulasi klik nyata pada input terfokus)
    const bandungHistoryBtn = restoreButtons[1];
    fireEvent.mouseDown(bandungHistoryBtn);
    fireEvent.blur(smartSearch);
    fireEvent.click(bandungHistoryBtn);
    const restoredInspector = document.getElementById('map-feature-inspector');
    expect(restoredInspector).not.toBeNull();
    expect(within(restoredInspector!).getByText('Lembar Bandung')).toBeInTheDocument();

    // Hapus per item
    fireEvent.focus(smartSearch);
    fireEvent.click(
      within(screen.getByRole('region', { name: 'History Pencarian Saya' })).getByRole(
        'button',
        { name: 'Hapus G. Merapi dari riwayat' },
      ),
    );
    expect(
      within(screen.getByRole('region', { name: 'History Pencarian Saya' })).queryByText(
        'G. Merapi',
      ),
    ).toBeNull();

    // Persistensi localStorage terisi
    const savedRaw = window.localStorage.getItem('geomap_esdm_search_history_v1');
    expect(savedRaw).not.toBeNull();
    expect(JSON.parse(savedRaw!)).toHaveLength(2);

    // Hapus semua riwayat
    fireEvent.click(
      within(screen.getByRole('region', { name: 'History Pencarian Saya' })).getByRole(
        'button',
        { name: 'Hapus semua riwayat pencarian' },
      ),
    );
    expect(screen.getByText('Belum ada riwayat pencarian')).toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem('geomap_esdm_search_history_v1')!),
    ).toHaveLength(0);

    // 5) Batas maksimal 6 item: catat 7 item berbeda -> item terlama ter-evict, tersisa 6 terbaru
    const capQueries = ['Merapi', 'Semeru', 'Rinjani', 'Sinabung', 'Krakatau', 'Lokon', '1209-3'];
    for (const q of capQueries) {
      fireEvent.focus(smartSearch);
      fireEvent.change(smartSearch, { target: { value: q } });
      fireEvent.submit(searchForm);
    }
    const afterCapSaved = JSON.parse(
      window.localStorage.getItem('geomap_esdm_search_history_v1')!,
    ) as Array<{ label: string }>;
    expect(afterCapSaved).toHaveLength(6);
    expect(afterCapSaved[0].label).toContain('1209-3 · Lembar Bandung');
    expect(afterCapSaved.some((item) => item.label.includes('Merapi'))).toBe(false);

    // 6) Hydrate ulang dari localStorage (simulasi reload) + saring payload parsial yang korup
    const withCorruptInnerPayload = [
      ...afterCapSaved,
      {
        id: 'quadrangle:broken',
        kind: 'quadrangle',
        label: 'Lembar Rusak',
        subtitle: 'Korup',
        query: 'rusak',
        timestamp: 1,
        quad: {},
      },
    ];
    window.localStorage.setItem(
      'geomap_esdm_search_history_v1',
      JSON.stringify(withCorruptInnerPayload),
    );
    cleanup();
    render(<App />);
    const reloadedSearch = screen.getByLabelText('Cari lokasi atau koleksi peta');
    fireEvent.focus(reloadedSearch);
    const reloadedRegion = screen.getByRole('region', { name: 'History Pencarian Saya' });
    expect(within(reloadedRegion).queryByText('Lembar Rusak')).toBeNull();
    expect(within(reloadedRegion).getByText('1209-3 · Lembar Bandung')).toBeInTheDocument();
    fireEvent.mouseDown(within(reloadedRegion).getByText('1209-3 · Lembar Bandung').closest('button')!);
    fireEvent.click(within(reloadedRegion).getByText('1209-3 · Lembar Bandung').closest('button')!);
    expect(
      within(document.getElementById('map-feature-inspector')!).getByText('Lembar Bandung'),
    ).toBeInTheDocument();
  });

  it('menjalankan pencarian katalog dengan normalisasi istilah serta 1-Click Empty State Recovery', () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole('button', {
        name: new RegExp(`Katalog Peta.*${DATASETS.length}`),
      }),
    );

    const searchInput = screen.getByLabelText('Cari dataset dalam katalog peta');
    fireEvent.change(searchInput, { target: { value: 'sesar' } });
    expect(screen.getByText('Peta Patahan Aktif Indonesia')).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /Uji Mitigasi Hasil Kosong/i })).toBeNull();
    fireEvent.change(searchInput, { target: { value: 'xyz-tidak-ada-dataset-999' } });
    const emptyState = document.getElementById('catalog-empty-state');
    expect(emptyState).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Reset Semua Filter Katalog/i }));
    expect(document.getElementById('catalog-empty-state')).toBeNull();
    expect(
      screen.getByText((_, node) =>
        Boolean(
          node?.tagName === 'SPAN' &&
            node.textContent?.includes(`Menampilkan ${DATASETS.length} dari ${DATASETS.length}`),
        ),
      ),
    ).toBeInTheDocument();
  });

  it('membuka pratinjau publik Bandung tanpa login, lalu otentikasi kontekstual & mengurangi kuota 19/20', () => {
    window.location.hash = '#/peta/peta-geologi-lembar-bandung-jawa';
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Peta Geologi Lembar Bandung, Jawa' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Pratinjau Skema Tabel Atribut/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Unduh GeoPDF Penuh/i }));
    const authModal = document.getElementById('auth-modal');
    expect(authModal).not.toBeNull();
    expect(within(authModal!).getByText(/Unduhan tertunda:/i)).toBeInTheDocument();

    // 1-Click persona sign-in preserves route and decrements daily quota from 20 -> 19
    fireEvent.click(within(authModal!).getByRole('button', { name: /Peneliti Geologi/i }));
    expect(document.getElementById('auth-modal')).toBeNull();
    expect(window.location.hash).toBe('#/peta/peta-geologi-lembar-bandung-jawa');
    expect(screen.getByText('Kuota: 19/20')).toBeInTheDocument();
  });

  it('menangani inspeksi PVMBG MAGMA, mode Satelit .is-sat, serta mode keyboard data-instant', () => {
    render(<App />);

    // Smart search -> select G. Merapi -> opens PVMBG + MAGMA inspector
    const smartSearch = screen.getByLabelText('Cari lokasi atau koleksi peta');
    fireEvent.focus(smartSearch);
    fireEvent.change(smartSearch, { target: { value: 'Merapi' } });
    fireEvent.click(screen.getByRole('button', { name: /G\. Merapi/i }));

    const inspector = document.getElementById('map-feature-inspector');
    expect(inspector).not.toBeNull();
    const magmaLink = within(inspector!).getByRole('link', { name: /MAGMA ESDM/i });
    expect(magmaLink).toHaveAttribute('href', 'https://magma.esdm.go.id');

    // Landing page defaults to Citra Satelit (.is-sat without forcing .is-dark) & drawer lists all 5 basemaps
    const stage = document.querySelector('.geomap-stage');
    expect(stage?.className).toContain('is-sat');
    expect(stage?.className).not.toContain('is-dark');
    fireEvent.click(
      screen.getByRole('button', {
        name: /Peta dasar aktif: Citra Satelit Resolusi Tinggi/i,
      }),
    );
    const basemapGroup = screen.getByRole('radiogroup', {
      name: 'Pilihan peta dasar',
    });
    expect(within(basemapGroup).getAllByRole('radio')).toHaveLength(5);
    fireEvent.click(within(basemapGroup).getByRole('radio', { name: /Jalan \(OSM\)/i }));
    expect(stage?.className).not.toContain('is-sat');
    fireEvent.click(within(basemapGroup).getByRole('radio', { name: /Satelit/i }));
    expect(stage?.className).toContain('is-sat');
    expect(stage?.className).not.toContain('is-dark');

    // Keyboard vs Pointer mode sets data-instant accurately
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(stage).toHaveAttribute('data-instant', 'true');
    fireEvent.pointerDown(window);
    expect(stage).toHaveAttribute('data-instant', 'false');
  });

  it('menampilkan halaman Panduan & FAQ serta memfilter kategori dan pencarian', () => {
    window.location.hash = '#/panduan';
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /Panduan & Pertanyaan Umum/i }),
    ).toBeInTheDocument();

    const faqSearch = screen.getByLabelText('Cari pertanyaan panduan GeoMap');
    fireEvent.change(faqSearch, { target: { value: 'PVMBG' } });
    expect(
      screen.getByText(/Dari mana sumber tingkat aktivitas/i),
    ).toBeInTheDocument();

    fireEvent.change(faqSearch, { target: { value: '' } });
    fireEvent.click(screen.getByRole('tab', { name: 'Format, CRS & SHP' }));
    expect(
      screen.getByText(/Sistem koordinat dan datum apa/i),
    ).toBeInTheDocument();
  });

  it('mendukung pengurutan kolom Tabel Teknis, toggle Provinsi & zoom di Pratinjau, serta Mode Gelap', () => {
    window.location.hash = '#/katalog';
    render(<App />);

    // Dark Mode toggle adds .is-dark on .geomap-stage
    fireEvent.click(screen.getByRole('button', { name: 'Aktifkan Mode Gelap' }));
    expect(document.querySelector('.geomap-stage')?.className).toContain('is-dark');

    // Tabel Teknis & clickable column sort headers
    fireEvent.click(screen.getByRole('button', { name: 'Tabel Teknis' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skala' }));
    const sortSelect = screen.getByLabelText('Urutkan Hasil') as HTMLSelectElement;
    expect(sortSelect.value).toBe('skala');

    // Pratinjau controls: Provinsi toggle, zoom in/out, and reset
    fireEvent.click(screen.getAllByRole('button', { name: 'Pratinjau' })[0]);
    const provToggle = screen.getByRole('button', { name: 'Provinsi' });
    expect(provToggle).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(provToggle);
    expect(provToggle).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Perbesar pratinjau lembar peta' }));
    expect(screen.getByText('Zoom 125%')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset zoom dan posisi pratinjau' }));
    expect(screen.getByText('Zoom 100%')).toBeInTheDocument();
  });

  it('menampilkan seluruh tab navigasi dan drawer z-[1150] pada viewport sempit (< 768px)', () => {
    const prevMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(max-width: 767px)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    try {
      render(<App />);
      const mobileNav = screen.getByRole('navigation', {
        name: 'Navigasi Seluler GeoMap ESDM',
      });
      expect(within(mobileNav).getByRole('button', { name: 'Peta Interaktif' })).toBeInTheDocument();
      expect(
        within(mobileNav).getByRole('button', {
          name: new RegExp(`Katalog Peta.*${DATASETS.length}`),
        }),
      ).toBeInTheDocument();
      expect(within(mobileNav).getByRole('button', { name: 'Panduan & FAQ' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Buka menu navigasi' }));
      const drawer = document.getElementById('mobile-nav-drawer');
      expect(drawer).not.toBeNull();
      expect(drawer?.className).toContain('z-[1150]');

      // Verify header & nav stay interactive and not locked behind Vaul aria-hidden
      expect(document.querySelector('header')).not.toHaveAttribute('aria-hidden', 'true');
      expect(document.body.style.pointerEvents).not.toBe('none');

      // Open Vaul bottom sheet with explicit 1-tap detents, inherited theme classes, and clean dismiss
      fireEvent.click(screen.getByRole('button', { name: 'Aktifkan Mode Gelap' }));
      fireEvent.click(screen.getByRole('button', { name: 'Buka Panel Layer Peta Seluler' }));
      const sheet = screen.getByLabelText('Panel Layer Peta Seluler');
      expect(sheet.className).toContain('geomap-stage');
      expect(sheet.className).toContain('map-hud-zone');
      expect(sheet.className).toContain('is-dark');
      expect(screen.getByRole('button', { name: 'Minimal' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ringkas' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Penuh' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Tutup panel layer seluler' }));
    } finally {
      window.matchMedia = prevMatchMedia;
    }
  });

  it('menyajikan header Apple Liquid Glass (Opsi 1) dan Logo Primer Resmi Kementerian ESDM', () => {
    render(<App />);

    // Official Logo Primer ESDM (FA LOGO ESDM 2025 SVG) + GeoMap Badan Geologi lockup
    const esdmLogoSvg = screen.getByRole('img', { name: 'Kementerian ESDM' });
    expect(esdmLogoSvg).toHaveAttribute('viewBox', '0 0 259.91 104.86');
    expect(esdmLogoSvg.getAttribute('class')).toContain('md:h-[41px]');
    expect(screen.getAllByText('GeoMap').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('geologi.esdm.go.id/geomap')).toBeInTheDocument();

    // Positive mode renders Kuning ESDM #FFF500 shield interior + 3 foreground paths
    expect(esdmLogoSvg.querySelectorAll('path')).toHaveLength(4);

    // Liquid Glass Capsule & Spring Indicator Pill
    const navTrack = document.getElementById('apple-nav-track');
    const springPill = document.getElementById('apple-nav-pill');
    expect(navTrack).not.toBeNull();
    expect(navTrack?.className).toContain('rounded-full');
    expect(springPill).not.toBeNull();
    expect(springPill?.className).toContain('gm-spring-pill');
    expect(springPill?.className).toContain('rounded-full');

    // Consistent Kuning ESDM Masuk pill CTA + tata letak 3 kolom ujung-tengah-ujung
    const loginBtn = screen.getByRole('button', { name: 'Masuk' });
    expect(loginBtn.className).toContain('rounded-full');
    expect(loginBtn.className).toContain('bg-[#FFF500]');

    const headerRow = document.querySelector('header > div');
    expect(headerRow?.className).toContain('w-full');
    expect(headerRow?.className).toContain('md:grid-cols-[1fr_auto_1fr]');
    expect(
      esdmLogoSvg.closest('.justify-self-start'),
    ).not.toBeNull();
    expect(
      navTrack?.closest('nav')?.className,
    ).toContain('justify-self-center');
    expect(
      loginBtn.closest('.justify-self-end'),
    ).not.toBeNull();

    // Switching to Dark Mode switches Logo ESDM to Negative Kuning (#FFF500 outline/type, transparent shield bg)
    fireEvent.click(screen.getByRole('button', { name: 'Aktifkan Mode Gelap' }));
    const darkPaths = esdmLogoSvg.querySelectorAll('path');
    expect(darkPaths).toHaveLength(3);
    expect(darkPaths[0]).toHaveAttribute('fill', '#FFF500');
  });

  it('menyoroti filter skala 1:1.000.000–1:50.000, menyambungkannya ke Indeks Lembar basemap, dan mendukung klik indeks', () => {
    render(<App />);

    // Search bar has submit CTA and concise non-truncating placeholder
    const smartSearch = screen.getByLabelText('Cari lokasi atau koleksi peta') as HTMLInputElement;
    expect(smartSearch.placeholder.length).toBeLessThan(48);
    expect(screen.getByRole('button', { name: 'Cari' })).toBeInTheDocument();
    expect(screen.getByText('1:1.000.000 – 1:50.000')).toBeInTheDocument();

    // Verify symmetric HUD column width (320px/348px) matching right-side Manajer Layer
    const leftHud = smartSearch.closest('.sm\\:w-\\[320px\\]');
    expect(leftHud).not.toBeNull();
    expect(leftHud?.className).toContain('lg:w-[348px]');

    // Scale filter group highlights 1:1.000.000 to 1:50.000 across 2x2 matrix (5M and 500K removed)
    const scaleGroup = screen.getByRole('group', {
      name: 'Filter Skala Peta 1:5.000.000 sampai 1:50.000',
    });
    expect(within(scaleGroup).queryByRole('button', { name: '1:5.000.000' })).toBeNull();
    expect(within(scaleGroup).queryByRole('button', { name: '1:500.000' })).toBeNull();
    const btn1m = within(scaleGroup).getByRole('button', { name: '1:1.000.000' });
    fireEvent.click(btn1m);
    expect(btn1m).toHaveAttribute('aria-pressed', 'true');
    const expected1mCount = QUADRANGLE_GRIDS.filter((q) => q.scale === '1:1.000.000').length;
    expect(
      document.querySelectorAll('#leaflet-map-canvas .gm-quad-label'),
    ).toHaveLength(expected1mCount);

    const btn100k = within(scaleGroup).getByRole('button', { name: '1:100.000' });
    fireEvent.click(btn100k);

    expect(btn100k).toHaveAttribute('aria-pressed', 'true');
    // Connected automatically to Indeks Lembar layer & base map markers
    expect(
      screen.getByRole('switch', { name: /Indeks Lembar Peta \(1:5\.000\.000 – 1:50\.000\)/i }),
    ).toHaveAttribute('aria-checked', 'true');

    const expected100kCount = QUADRANGLE_GRIDS.filter((q) => q.scale === '1:100.000').length;
    const markers100k = document.querySelectorAll('#leaflet-map-canvas .gm-quad-label');
    expect(markers100k).toHaveLength(expected100kCount);

    // Pastikan section daftar INDEKS NLP / Klik lembar yang dihapus tidak dirender di kartu Indeks Skala Peta
    const indexCardEl = document.getElementById('map-scale-index-card')!;
    expect(within(indexCardEl).queryByText(/Indeks NLP/i)).toBeNull();
    expect(within(indexCardEl).queryByText(/Indeks Basemap/i)).toBeNull();
    expect(within(indexCardEl).queryByText('Klik lembar')).toBeNull();
    expect(within(indexCardEl).queryByRole('button', { name: /1209-3 · Bandung/i })).toBeNull();

    // Click interactive quadrangle index on base map
    fireEvent.click(markers100k[0]);

    const inspector = document.getElementById('map-feature-inspector');
    expect(inspector).not.toBeNull();
    expect(within(inspector!).getByText('Skala 1:100.000')).toBeInTheDocument();
    expect(within(inspector!).getByText('Lembar Bandung')).toBeInTheDocument();

    // Switching scale to 1:50.000 updates base map index shapes dynamically and supports direct click on base map marker
    const btn50k = within(scaleGroup).getByRole('button', { name: '1:50.000' });
    fireEvent.click(btn50k);
    const expected50kCount = QUADRANGLE_GRIDS.filter((q) => q.scale === '1:50.000').length;
    const basemapQuads = document.querySelectorAll('#leaflet-map-canvas .gm-quad-label');
    expect(basemapQuads).toHaveLength(expected50kCount);

    fireEvent.click(basemapQuads[0]);
    const inspectorAfterBasemapClick = document.getElementById('map-feature-inspector');
    expect(inspectorAfterBasemapClick).not.toBeNull();
    expect(within(inspectorAfterBasemapClick!).getByText('Skala 1:50.000')).toBeInTheDocument();
  });

  it('menerapkan Apple fluid physics (momentum, rubber-band, spring), header glass, scroll-mask, dan Vaul data-vaul-no-drag', () => {
    // 1. Verify Apple momentum projection & progressive rubberband math
    const projected = projectMomentum(1000, 0.99);
    expect(projected).toBeCloseTo(99, 2);

    const clamped = rubberbandClamp(150, -100, 100, 200, 0.55);
    expect(clamped).toBeGreaterThan(100);
    expect(clamped).toBeLessThan(150);

    let spring = { value: 0, velocity: 0, settled: false };
    for (let i = 0; i < 60 && !spring.settled; i += 1) {
      spring = stepAppleSpring(spring, 100, 0.016, { response: 0.32, dampingRatio: 1.0 });
    }
    expect(spring.settled).toBe(true);
    expect(spring.value).toBe(100);

    // 2. Verify DOM Apple materials & Vaul drag isolation attributes
    render(<App />);
    expect(document.querySelector('header.gm-header-glass')).not.toBeNull();
    expect(document.querySelector('.gm-scroll-mask')).not.toBeNull();

    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBeGreaterThan(0);
    expect(switches[0]).toHaveAttribute('data-vaul-no-drag');
    if (switches[0].getAttribute('aria-checked') !== 'true') {
      fireEvent.click(switches[0]);
    }

    const opacitySlider = document.querySelector('input[type="range"].gm-range');
    expect(opacitySlider).not.toBeNull();
    expect(opacitySlider).toHaveAttribute('data-vaul-no-drag');

    // 3. Verify Apple Typographic 2-Row 6-Scale Matrix (1:5.000.000–1:50.000), no "Semua", no duplicate panels/icons
    const scaleGroup = screen.getByRole('group', {
      name: 'Filter Skala Peta 1:5.000.000 sampai 1:50.000',
    });
    expect(within(scaleGroup).queryByRole('button', { name: 'Semua' })).toBeNull();
    expect(within(scaleGroup).getAllByRole('button')).toHaveLength(4);
    expect(scaleGroup.className).toContain('grid-cols-2');
    expect(scaleGroup.querySelector('svg')).toBeNull();
    expect(screen.queryByRole('group', { name: 'Akses cepat layer tematik' })).toBeNull();
    expect(screen.queryByTitle(/Fokus Cepat Pencarian/i)).toBeNull();

    // Zero-state History Pencarian Saya only renders on focused empty search
    const smartSearch = screen.getByLabelText('Cari lokasi atau koleksi peta');
    expect(screen.queryByRole('region', { name: 'History Pencarian Saya' })).toBeNull();
    fireEvent.focus(smartSearch);
    expect(screen.getByRole('region', { name: 'History Pencarian Saya' })).toBeInTheDocument();
    fireEvent.change(smartSearch, { target: { value: 'Merapi' } });
    expect(screen.queryByRole('region', { name: 'History Pencarian Saya' })).toBeNull();

    // Toggling Indeks Lembar Peta in Manajer Layer picks single default non-overlapping scale (1:250.000)
    const gridSwitch = screen.getByRole('switch', { name: /Indeks Lembar Peta/i });
    if (gridSwitch.getAttribute('aria-checked') !== 'true') {
      fireEvent.click(gridSwitch);
    }
    expect(
      within(scaleGroup).getByRole('button', { name: '1:250.000' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('menghitung Nomor Lembar Peta resmi SNI 6502 & IMW beserta viewport culling dan skala geodesik (Opsi 1)', () => {
    // 1. Verifikasi rumus SNI 6502 (Origin 90 BT, 15 LS) terhadap kota/fitur nyata
    expect(computeSniNlpCode(-6.91, 107.61, '1:250.000').code).toBe('1209');
    expect(computeSniNlpCode(-6.91, 107.61, '1:100.000').code).toBe('1209-3');
    expect(computeSniNlpCode(-6.91, 107.61, '1:50.000').code).toBe('1209-31');

    expect(computeSniNlpCode(-7.54, 110.44, '1:250.000').code).toBe('1408');
    expect(computeSniNlpCode(-7.54, 110.44, '1:100.000').code).toBe('1408-2');
    expect(computeSniNlpCode(-7.54, 110.44, '1:50.000').code).toBe('1408-24');

    expect(computeSniNlpCode(3.59, 98.67, '1:250.000').code).toBe('0619');
    expect(computeSniNlpCode(-0.5, 117.15, '1:250.000').code).toBe('1915');
    expect(computeSniNlpCode(-0.9, 119.87, '1:250.000').code).toBe('2015');

    // 2. Verifikasi kode IMW 1:1.000.000 & kuadran 1:500.000
    expect(computeImwCode(2.0, 99.0, '1:1.000.000').code).toBe('NA-47');
    expect(computeImwCode(-6.9, 107.6, '1:1.000.000').code).toBe('SB-48');
    expect(computeImwCode(-6.9, 107.6, '1:500.000').code).toBe('SB-48-SE');

    // 3. Verifikasi generator viewport menghasilkan seluruh sel Jawa Barat pada 1:100.000
    const jabarViewport = generateNlpCellsInViewport({
      scale: '1:100.000',
      viewportBounds: { south: -7.5, north: -6.0, west: 106.5, east: 108.5 },
      cellPixelWidth: 80,
    });
    expect(jabarViewport.renderedScale).toBe('1:100.000');
    expect(jabarViewport.isParentFallback).toBe(false);
    expect(jabarViewport.cells.length).toBeGreaterThanOrEqual(9);

    const bandungCell = jabarViewport.cells.find((c) => c.code === '1209-3');
    const cianjurCell = jabarViewport.cells.find((c) => c.code === '1209-2');
    expect(bandungCell).toBeDefined();
    expect(bandungCell?.isComputedGrid).toBe(false);
    expect(cianjurCell).toBeDefined();
    expect(cianjurCell?.isComputedGrid).toBe(false);
    expect(cianjurCell?.locationLabel).toBe('Cianjur');
    expect(cianjurCell?.parentCode).toBe('1209');

    // Verifikasi 1:100.000 & 1:250.000 terpisah langsung menggunakan data 100-250.zip
    const all100kScale = generateNlpCellsInViewport({
      scale: '1:100.000',
      viewportBounds: { south: -12, north: 6, west: 95, east: 142 },
      cellPixelWidth: 80,
    });
    expect(all100kScale.cells).toHaveLength(57);
    expect(all100kScale.cells.every((c) => c.scale === '1:100.000')).toBe(true);

    const all250kScale = generateNlpCellsInViewport({
      scale: '1:250.000',
      viewportBounds: { south: -12, north: 6, west: 95, east: 142 },
      cellPixelWidth: 80,
    });
    expect(all250kScale.cells).toHaveLength(177);
    expect(all250kScale.cells.every((c) => c.scale === '1:250.000')).toBe(true);
    expect(all250kScale.cells.find((c) => c.code === '0619')?.locationLabel).toBe('Medan');
    expect(all250kScale.cells.find((c) => c.code === '1915,1815')?.locationLabel).toBe('Samarinda');

    // Samudera Hindia jauh di selatan Jawa tidak boleh dipenuhi kotak grid laut kosong
    const deepIndianOcean = generateNlpCellsInViewport({
      scale: '1:100.000',
      viewportBounds: { south: -10.5, north: -9.0, west: 105.0, east: 112.0 },
      cellPixelWidth: 80,
    });
    expect(deepIndianOcean.cells).toHaveLength(0);

    // 4. Verifikasi auto-fallback skala induk saat zoom sangat jauh (cellPixelWidth < 14 px)
    const zoomedOut50k = generateNlpCellsInViewport({
      scale: '1:50.000',
      viewportBounds: { south: -11, north: 6, west: 95, east: 141 },
      cellPixelWidth: 5,
    });
    expect(zoomedOut50k.isParentFallback).toBe(true);
    expect(zoomedOut50k.renderedScale).toBe('1:250.000');
    expect(zoomedOut50k.cells.length).toBeLessThanOrEqual(480);

    // 4b. Pastikan 1:5.000.000 tetap merender NAS-BARAT & NAS-TIMUR meskipun badge katalog hanya di NAS-BARAT
    const national5m = generateNlpCellsInViewport({
      scale: '1:5.000.000',
      viewportBounds: { south: -11, north: 6, west: 95, east: 141 },
    });
    expect(national5m.cells.map((c) => c.code)).toEqual(['NAS-BARAT', 'NAS-TIMUR']);
    expect(national5m.cells[0].isComputedGrid).toBe(true);
    expect(national5m.cells[1].isComputedGrid).toBe(true);
    expect(national5m.cells[1].locationLabel).toBe('Indonesia Timur');

    // 4c. Verifikasi 1:50.000 menggunakan data resmi shapefile INDEX_50K (3.903 lembar)
    const bandung50k = generateNlpCellsInViewport({
      scale: '1:50.000',
      viewportBounds: { south: -7.1, north: -6.4, west: 107.4, east: 108.1 },
      cellPixelWidth: 80,
    });
    expect(bandung50k.renderedScale).toBe('1:50.000');
    expect(bandung50k.cells.find((c) => c.code === '1209-31')?.locationLabel).toBe('Bandung');
    expect(bandung50k.cells.find((c) => c.code === '1209-32')?.locationLabel).toBe('Sumedang');
    expect(bandung50k.cells.find((c) => c.code === '1209-33')?.locationLabel).toBe('Kalijati');
    expect(bandung50k.cells.find((c) => c.code === '1209-34')?.locationLabel).toBe('Subang');

    const sunda50k = generateNlpCellsInViewport({
      scale: '1:50.000',
      viewportBounds: { south: -6.1, north: -5.7, west: 105.6, east: 105.9 },
      cellPixelWidth: 80,
    });
    expect(sunda50k.cells.find((c) => c.code === '1110-22')?.locationLabel).toBe('Bakauhuni');
    expect(sunda50k.cells.find((c) => c.code === '1110-22')?.year).toBe(2014);

    // 4d. Verifikasi 1:1.000.000 menggunakan 16 lembar resmi Ndx GL-ID 1M (I–XVI)
    const national1m = generateNlpCellsInViewport({
      scale: '1:1.000.000',
      viewportBounds: { south: -12, north: 6, west: 95, east: 142 },
    });
    expect(national1m.renderedScale).toBe('1:1.000.000');
    expect(national1m.cells).toHaveLength(16);
    expect(national1m.cells.find((c) => c.code === 'I')?.locationLabel).toBe('Medan');
    expect(national1m.cells.find((c) => c.code === 'XII')?.locationLabel).toBe('Jakarta');
    expect(national1m.cells.find((c) => c.code === 'XIII')?.locationLabel).toBe('Surabaya');
    expect(national1m.cells.find((c) => c.code === 'XVI')?.locationLabel).toBe('Merauke');
    expect(national1m.cells.every((c) => c.isComputedGrid === false)).toBe(true);

    // 4d. Pastikan sel NLP komputasi resolved ke nama kota/lokasi perwakilan, bukan mengulang nama pulau besar
    const westJava100k = generateNlpCellsInViewport({
      scale: '1:100.000',
      viewportBounds: { south: -7.6, north: -6.0, west: 107.4, east: 108.9 },
      cellPixelWidth: 60,
    });
    const byCode = new Map(westJava100k.cells.map((c) => [c.code, c]));
    expect(byCode.get('1309-1')?.locationLabel).toBe('Arjawinangun');
    expect(byCode.get('1309-4')?.locationLabel).toBe('Indramayu');
    expect(byCode.get('1308-4')?.locationLabel).toBe('Tasikmalaya');
    expect(byCode.get('1209-6')?.locationLabel).toBe('Pamanukan');
    expect(byCode.get('1208-6')?.locationLabel).toBe('Garut & Pameungpeuk');

    // 5. Verifikasi skala geodesik dan scale bar real-time
    const scaleZoom5 = computeRealScaleRatioLabel(-2.5, 5);
    const scaleZoom10 = computeRealScaleRatioLabel(-6.9, 10);
    expect(scaleZoom5).not.toBe(scaleZoom10);
    const bar = computeCartographicScaleBar(-6.9, 8);
    expect(bar.widthPx).toBeGreaterThanOrEqual(24);
    expect(bar.label).toMatch(/\d+\s*(km|m)$/);
  });

  it('menjaga pemetaan zoom peta ↔ Filter Skala yang sinkron tanpa menambah pill baru di Navbar', () => {
    // 1. Pastikan pemetaan 1:1 antara targetZoom HIGHLIGHT_MAP_SCALES dan zoomToMapScaleValue
    for (const meta of HIGHLIGHT_MAP_SCALES) {
      expect(zoomToMapScaleValue(meta.targetZoom)).toBe(meta.value);
    }

    // 2. Pastikan resolveMonotonicZoomScale menjaga arah skala tetap konsisten saat zoom in/out
    expect(
      resolveMonotonicZoomScale({
        currentScale: '1:250.000',
        prevZoom: 5,
        nextZoom: 6,
      }),
    ).toBe('1:250.000');
    expect(
      resolveMonotonicZoomScale({
        currentScale: '1:250.000',
        prevZoom: 7,
        nextZoom: 8,
      }),
    ).toBe('1:100.000');
    expect(
      resolveMonotonicZoomScale({
        currentScale: '1:100.000',
        prevZoom: 8,
        nextZoom: 7,
      }),
    ).toBe('1:250.000');

    // 3. Pastikan Navbar tetap bersih tanpa pill indeks tambahan dan kontrol zoom berada di kolom kiri
    render(<App />);
    expect(document.getElementById('navbar-scale-index-pill')).toBeNull();
    expect(document.getElementById('mobile-navbar-scale-index-pill')).toBeNull();

    const zoomControls = document.getElementById('map-zoom-controls');
    expect(zoomControls).not.toBeNull();
    expect(within(zoomControls!).getByRole('button', { name: 'Perbesar Peta' })).toBeInTheDocument();
    expect(within(zoomControls!).getByRole('button', { name: 'Perkecil Peta' })).toBeInTheDocument();
    expect(
      within(zoomControls!).getByRole('button', { name: 'Kembalikan Cakupan Nasional Indonesia' }),
    ).toBeInTheDocument();
    // Kontrol zoom berbagi kolom flex kiri yang sama dengan kotak pencarian
    const leftColumn = screen.getByLabelText('Cari lokasi atau koleksi peta').closest('.sm\\:w-\\[320px\\]');
    expect(leftColumn?.contains(zoomControls)).toBe(true);

    // 4. Pastikan kartu Pencarian dan Indeks Skala Peta terpisah (Opsi 1), bisa buka–tutup, dan ikon Hide/Aktif bergantian
    const searchCard = document.getElementById('map-search-card');
    const indexCard = document.getElementById('map-scale-index-card');
    expect(searchCard).not.toBeNull();
    expect(indexCard).not.toBeNull();
    expect(searchCard?.contains(indexCard)).toBe(false);

    const accordionBtn = document.getElementById('map-index-accordion-toggle') as HTMLButtonElement;
    const indexBody = document.getElementById('map-scale-index-body') as HTMLElement;
    expect(accordionBtn).toHaveAttribute('aria-expanded', 'true');
    expect(indexBody.className).toContain('is-open');

    // Tutup panel indeks -> menciut & aria-expanded=false
    fireEvent.click(accordionBtn);
    expect(accordionBtn).toHaveAttribute('aria-expanded', 'false');
    expect(indexBody.className).not.toContain('is-open');
    expect(indexCard?.className).toContain('w-full');

    // Buka kembali panel indeks -> membesar penuh lagi
    fireEvent.click(accordionBtn);
    expect(accordionBtn).toHaveAttribute('aria-expanded', 'true');
    expect(indexBody.className).toContain('is-open');

    // Ikon grid 4x4 bergantian Hide (<mask> eye-slash) <-> Aktif (.gm-grid-icon-swap) dan sinkron dgn Manajer Layer
    const gridIconToggle = document.getElementById('map-index-grid-toggle') as HTMLButtonElement;
    expect(gridIconToggle).toHaveAttribute('aria-pressed', 'false');
    expect(gridIconToggle.querySelector('mask')).not.toBeNull();
    expect(within(indexCard!).getByText('Nonaktif')).toBeInTheDocument();

    fireEvent.click(gridIconToggle);
    expect(gridIconToggle).toHaveAttribute('aria-pressed', 'true');
    expect(gridIconToggle.querySelector('.gm-grid-icon-swap')).not.toBeNull();
    expect(within(accordionBtn).getByText('1:250.000')).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: /Indeks Lembar Peta/i }),
    ).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(gridIconToggle);
    expect(gridIconToggle).toHaveAttribute('aria-pressed', 'false');
    expect(gridIconToggle.querySelector('mask')).not.toBeNull();
    expect(
      screen.getByRole('switch', { name: /Indeks Lembar Peta/i }),
    ).toHaveAttribute('aria-checked', 'false');

    // 5. Pastikan tidak ada kontainer notifikasi toast/Sonner yang muncul saat interaksi
    fireEvent.click(screen.getByRole('button', { name: 'Aktifkan Mode Gelap' }));
    expect(document.querySelector('[data-sonner-toaster]')).toBeNull();
  });

  it('memastikan Peta Topografi tetap dapat diakses di Dark Mode tanpa bergantung ke host cartocdn yang terblokir + mendukung fallback tileerror', () => {
    const tileLayerSpy = vi.spyOn(L, 'tileLayer');
    try {
      render(<App />);

      const mapCanvas = document.getElementById('leaflet-map-canvas');
      expect(mapCanvas).toHaveAttribute('data-topo-dark-filter', 'false');

      // Buka drawer peta dasar dan beralih dari Satelit (default) ke Jalan (OSM)
      fireEvent.click(
        screen.getByRole('button', {
          name: /Peta dasar aktif: Citra Satelit Resolusi Tinggi/i,
        }),
      );
      const basemapRadiogroup = screen.getByRole('radiogroup', {
        name: 'Pilihan peta dasar',
      });
      fireEvent.click(
        within(basemapRadiogroup).getByRole('radio', { name: /Jalan \(OSM\)/i }),
      );

      // Mode Gelap aktif pada Jalan (OSM): gunakan tile aktif + filter gelap pada pane tile (tanpa cartocdn)
      fireEvent.click(screen.getByRole('button', { name: 'Aktifkan Mode Gelap' }));
      expect(mapCanvas).toHaveAttribute('data-topo-dark-filter', 'true');

      const darkTopoCall = tileLayerSpy.mock.calls[tileLayerSpy.mock.calls.length - 1];
      const darkTopoUrl = darkTopoCall[0] as string;
      const darkTopoOpts = darkTopoCall[1];
      expect(darkTopoUrl).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
      expect(darkTopoUrl).not.toContain('cartocdn.com');
      expect(darkTopoOpts?.crossOrigin).toBeUndefined();

      // Uji fallback otomatis saat tileerror beruntun: OSM -> ArcGIS World_Topo_Map -> ArcGIS World_Dark_Gray_Base
      const darkTopoLayer = tileLayerSpy.mock.results[tileLayerSpy.mock.results.length - 1].value as L.TileLayer;
      const setUrlSpy = vi.spyOn(darkTopoLayer, 'setUrl');

      darkTopoLayer.fire('tileerror', {} as L.TileErrorEvent);
      darkTopoLayer.fire('tileerror', {} as L.TileErrorEvent);
      expect(setUrlSpy).toHaveBeenNthCalledWith(
        1,
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      );
      expect(mapCanvas).toHaveAttribute('data-topo-dark-filter', 'true');

      darkTopoLayer.fire('tileerror', {} as L.TileErrorEvent);
      darkTopoLayer.fire('tileerror', {} as L.TileErrorEvent);
      expect(setUrlSpy).toHaveBeenNthCalledWith(
        2,
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      );
      expect(mapCanvas).toHaveAttribute('data-topo-dark-filter', 'false');

      // Beralih ke Citra Satelit di Dark Mode mematikan filter gelap, kembali ke Jalan (OSM) menyalakannya lagi
      fireEvent.click(
        within(basemapRadiogroup).getByRole('radio', { name: /Satelit/i }),
      );
      expect(mapCanvas).toHaveAttribute('data-topo-dark-filter', 'false');

      const osmBtn = within(basemapRadiogroup).getByRole('radio', {
        name: /Jalan \(OSM\)/i,
      });
      fireEvent.click(osmBtn);
      expect(osmBtn).toHaveAttribute('aria-checked', 'true');
      expect(mapCanvas).toHaveAttribute('data-topo-dark-filter', 'true');
    } finally {
      tileLayerSpy.mockRestore();
    }
  });

  it('memposisikan sel indeks tepat di atas pop-up tengah layar saat indeks diklik di peta, panel kiri, atau Fokus Peta', () => {
    const projectPoint = (lat: number, lng: number, zoom: number) =>
      L.CRS.EPSG3857.latLngToPoint(L.latLng(lat, lng), zoom);
    const unprojectPoint = (x: number, y: number, zoom: number) => {
      const ll = L.CRS.EPSG3857.pointToLatLng(L.point(x, y), zoom);
      return { lat: ll.lat, lng: ll.lng };
    };

    // 1. Verifikasi proyeksi 1:100.000 (1209-3 Bandung, zoom 8) menempatkan batas selatan sel tepat 20px di atas tepi atas pop-up terpusat
    const bandungQuad = QUADRANGLE_GRIDS.find((q) => q.code === '1209-3')!;
    const anchored100k = computePopupAnchoredMapCenter({
      bounds: bandungQuad.bounds,
      containerHeight: 760,
      popupHeight: 200,
      currentZoom: 8,
      preferredZoom: 8,
      preserveCurrentZoomIfVisible: true,
      isMobileViewport: false,
      project: projectPoint,
      unproject: unprojectPoint,
    });
    expect(anchored100k.zoom).toBe(8);
    expect(anchored100k.lng).toBeCloseTo(bandungQuad.center[1], 6);
    expect(anchored100k.lat).toBeLessThan(bandungQuad.center[0]);

    const centerPx = projectPoint(anchored100k.lat, anchored100k.lng, 8);
    const southEdgePx = projectPoint(bandungQuad.bounds[0][0], bandungQuad.center[1], 8);
    const southScreenY = 760 / 2 + (southEdgePx.y - centerPx.y);
    const popupTopScreenY = 760 / 2 - 200 / 2; // 280px
    expect(popupTopScreenY - southScreenY).toBeCloseTo(20, 1);

    // 2. Verifikasi 1:50.000 (1209-32 Bandung) menjaga zoom nyaman (z=10) saat klik langsung & clamp menjaga label tidak keluar atas layar pada zoom ekstrem (z=12)
    const detail50k = QUADRANGLE_GRIDS.find((q) => q.code === '1209-32')!;
    const anchored50kComfort = computePopupAnchoredMapCenter({
      bounds: detail50k.bounds,
      containerHeight: 760,
      popupHeight: 200,
      currentZoom: 10,
      preferredZoom: 9,
      preserveCurrentZoomIfVisible: true,
      maxPreserveCellPx: 420,
      isMobileViewport: false,
      project: projectPoint,
      unproject: unprojectPoint,
    });
    expect(anchored50kComfort.zoom).toBe(10);

    const clampedExtremeZoom = computePopupAnchoredMapCenter({
      bounds: detail50k.bounds,
      containerHeight: 760,
      popupHeight: 200,
      currentZoom: 12,
      preferredZoom: 12,
      preserveCurrentZoomIfVisible: true,
      maxPreserveCellPx: 900,
      isMobileViewport: false,
      project: projectPoint,
      unproject: unprojectPoint,
    });
    const extremeMapCenterPx = projectPoint(
      clampedExtremeZoom.lat,
      clampedExtremeZoom.lng,
      12,
    );
    const extremeCellCenterPx = projectPoint(
      detail50k.center[0],
      detail50k.center[1],
      12,
    );
    const cellCenterScreenY = 760 / 2 + (extremeCellCenterPx.y - extremeMapCenterPx.y);
    expect(cellCenterScreenY).toBeGreaterThanOrEqual(55.5);

    // 3. Verifikasi integrasi UI: wrapper inspector berada di tengah layar web, dan klik chip daftar / marker peta / Fokus Peta memanggil pemusatan bergeser ke selatan sel
    const noop = () => {};
    const mockCtx2d = {
      save: noop,
      restore: noop,
      translate: noop,
      scale: noop,
      clearRect: noop,
      setTransform: noop,
      beginPath: noop,
      moveTo: noop,
      lineTo: noop,
      closePath: noop,
      rect: noop,
      arc: noop,
      clip: noop,
      fill: noop,
      stroke: noop,
      fillText: noop,
      strokeText: noop,
      setLineDash: noop,
    } as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx2d);
    vi.spyOn(
      L.Canvas.prototype as unknown as { _requestRedraw: () => void },
      '_requestRedraw',
    ).mockImplementation(noop);

    const panToSpy = vi.spyOn(L.Map.prototype, 'panTo').mockImplementation(function (
      this: L.Map,
    ) {
      return this;
    });
    const flyToSpy = vi.spyOn(L.Map.prototype, 'flyTo').mockImplementation(function (
      this: L.Map,
    ) {
      return this;
    });
    const getSizeSpy = vi.spyOn(L.Map.prototype, 'getSize').mockReturnValue(L.point(0, 0));
    try {
      render(<App />);

      const scaleGroup = screen.getByRole('group', {
        name: 'Filter Skala Peta 1:5.000.000 sampai 1:50.000',
      });
      fireEvent.click(within(scaleGroup).getByRole('button', { name: '1:100.000' }));

      // Simulasikan ukuran viewport desktop 1280x760 untuk verifikasi panTo/flyTo sesungguhnya saat fokus indeks
      const bandungMarker = document.querySelector('#leaflet-map-canvas .gm-quad-label');
      expect(bandungMarker).not.toBeNull();
      getSizeSpy.mockReturnValue(L.point(1280, 760));
      vi.spyOn(L.Map.prototype, 'getZoom').mockReturnValue(8);

      fireEvent.click(bandungMarker!);

      const inspector = document.getElementById('map-feature-inspector');
      expect(inspector).not.toBeNull();
      expect(inspector).toHaveAttribute('data-inspector-mode', 'center');
      expect(document.getElementById('map-docked-inspector-slot')).toBeNull();
      expect(inspector?.parentElement?.className).toContain('sm:top-1/2');
      expect(inspector?.parentElement?.className).toContain('sm:left-1/2');
      expect(panToSpy).toHaveBeenCalled();

      const lastPanTarget = panToSpy.mock.calls[panToSpy.mock.calls.length - 1][0] as [
        number,
        number,
      ];
      expect(lastPanTarget[1]).toBeCloseTo(bandungQuad.center[1], 5);
      expect(lastPanTarget[0]).toBeLessThan(bandungQuad.center[0]);

      // 3b. Bermanuver menggeser peta (dragstart) -> pop-up hilang dari tengah layar dan bergeser ke dok kiri penuh, sedangkan zoom menjadi horizontal di bawahnya
      const zoomBeforeManeuver = document.getElementById('map-zoom-controls');
      expect(zoomBeforeManeuver).toHaveAttribute('data-zoom-orientation', 'vertical');
      expect(zoomBeforeManeuver?.firstElementChild?.className).toContain('flex-col');

      const activeMap = panToSpy.mock.instances[0] as L.Map;
      act(() => {
        activeMap.fire('dragstart');
      });

      const dockedSlot = document.getElementById('map-docked-inspector-slot');
      expect(dockedSlot).not.toBeNull();
      const dockedInspector = document.getElementById('map-feature-inspector');
      expect(dockedInspector).toHaveAttribute('data-inspector-mode', 'docked');
      expect(dockedSlot?.contains(dockedInspector)).toBe(true);
      expect(dockedSlot?.className).toContain('w-full');
      expect(dockedSlot?.nextElementSibling?.id).toBe('map-zoom-controls');

      // Opsi 4: saat dok aktif, navigasi zoom berubah horizontal di bawah kartu dok dan kartu dok tampil lega tanpa terpotong
      const zoomControlsBar = document.getElementById('map-zoom-controls');
      expect(zoomControlsBar).toHaveAttribute('data-zoom-orientation', 'horizontal');
      expect(zoomControlsBar?.firstElementChild?.className).toContain('flex-row');
      expect(within(zoomControlsBar!).getByRole('button', { name: 'Perbesar Peta' }).className).toContain('h-9');
      expect(dockedInspector?.className).toContain('p-3');
      expect(dockedInspector?.querySelector('.line-clamp-2')).toBeNull();
      expect(within(dockedInspector!).getByRole('button', { name: 'Fokus Peta' }).parentElement?.className).toContain('flex-wrap');

      // 3c. Klik tombol "Fokus Peta" di dalam dok -> pop-up kembali ke tengah layar & zoom kembali vertikal seperti awal
      fireEvent.click(within(dockedInspector!).getByRole('button', { name: 'Fokus Peta' }));
      expect(document.getElementById('map-docked-inspector-slot')).toBeNull();
      expect(zoomControlsBar).toHaveAttribute('data-zoom-orientation', 'vertical');
      expect(zoomControlsBar?.firstElementChild?.className).toContain('flex-col');
      expect(document.getElementById('map-feature-inspector')).toHaveAttribute(
        'data-inspector-mode',
        'center',
      );
      expect(flyToSpy).toHaveBeenCalled();
      const lastFlyArgs = flyToSpy.mock.calls[flyToSpy.mock.calls.length - 1];
      const flyTarget = lastFlyArgs[0] as [number, number];
      expect(lastFlyArgs[1]).toBe(9);
      expect(flyTarget[1]).toBeCloseTo(bandungQuad.center[1], 5);
      expect(flyTarget[0]).toBeLessThan(bandungQuad.center[0]);

      // Akhiri animasi flyTo lalu uji klik Reset Nusantara -> pop-up kembali masuk ke dok samping zoom
      act(() => {
        activeMap.fire('moveend');
      });
      fireEvent.click(screen.getByRole('button', { name: 'Kembalikan Cakupan Nasional Indonesia' }));
      expect(document.getElementById('map-docked-inspector-slot')).not.toBeNull();

      // Klik langsung marker indeks di atas peta -> mengembalikan pop-up ke tengah layar
      panToSpy.mockClear();
      getSizeSpy.mockReturnValue(L.point(0, 0));
      fireEvent.click(within(scaleGroup).getByRole('button', { name: '1:100.000' }));
      fireEvent.click(within(scaleGroup).getByRole('button', { name: '1:100.000' }));
      const directMarker = document.querySelector('#leaflet-map-canvas .gm-quad-label');
      expect(directMarker).not.toBeNull();
      getSizeSpy.mockReturnValue(L.point(1280, 760));
      fireEvent.click(directMarker!);
      expect(document.getElementById('map-feature-inspector')).toHaveAttribute(
        'data-inspector-mode',
        'center',
      );
      expect(panToSpy).toHaveBeenCalled();

      // Uji manuver zoom pengguna (zoomstart setelah selesai fokus) -> memindahkan pop-up ke dok kiri bawah
      act(() => {
        activeMap.fire('moveend');
        activeMap.fire('zoomstart');
      });
      const zoomedDockedInspector = document.getElementById('map-feature-inspector');
      expect(zoomedDockedInspector).toHaveAttribute('data-inspector-mode', 'docked');
      expect(document.getElementById('map-zoom-controls')).toHaveAttribute('data-zoom-orientation', 'horizontal');
      fireEvent.click(within(zoomedDockedInspector!).getByRole('button', { name: 'Tutup inspektor indeks lembar' }));
      expect(document.getElementById('map-feature-inspector')).toBeNull();
      expect(document.getElementById('map-zoom-controls')).toHaveAttribute('data-zoom-orientation', 'vertical');

      // Mengganti skala indeks (mis. dari 1:250.000 di Kalimantan ke 1:50.000) wajib mempertahankan posisi terakhir di Kalimantan (tidak lompat ke Jawa)
      fireEvent.click(within(scaleGroup).getByRole('button', { name: '1:250.000' }));
      act(() => {
        activeMap.setView([-1.2, 114.5], 6, { animate: false });
        activeMap.fire('moveend');
      });
      expect(activeMap.getCenter().lat).toBeCloseTo(-1.2, 3);
      expect(activeMap.getCenter().lng).toBeCloseTo(114.5, 3);

      fireEvent.click(within(scaleGroup).getByRole('button', { name: '1:50.000' }));
      expect(activeMap.getCenter().lat).toBeCloseTo(-1.2, 3);
      expect(activeMap.getCenter().lng).toBeCloseTo(114.5, 3);
    } finally {
      cleanup();
      vi.restoreAllMocks();
    }
  });

  it('mengintegrasikan Indeks Regional (Ndx GL-ID 100-250) beserta filter skala regional, filter wilayah, pencarian, dan interaksi peta', () => {
    // 1. Verifikasi integritas dataset Ndx GL-ID 100-250 (234 lembar resmi PSG)
    expect(INDEX_REGIONAL_SHEETS).toHaveLength(234);
    expect(INDEX_REGIONAL_SHEETS.filter((s) => s.Skala === 100000)).toHaveLength(57);
    expect(INDEX_REGIONAL_SHEETS.filter((s) => s.Skala === 250000)).toHaveLength(177);
    expect(
      INDEX_REGIONAL_SHEETS.every(
        (s) =>
          Boolean(s.Kode_Tema) &&
          s.Tema === 'Geologi' &&
          Boolean(s.Wilayah) &&
          Boolean(s.Nama_Lembar_PSG) &&
          s.Instansi === 'Pusat Survei Geologi' &&
          s.bounds.length === 2 &&
          s.center.length === 2,
      ),
    ).toBe(true);
    const baweanRaw = INDEX_REGIONAL_SHEETS.find(
      (s) => s.Nama_Lembar_PSG === 'Bawean & Masalembo',
    );
    expect(baweanRaw?.No_Lembar_BIG).toBe('');
    expect(baweanRaw?.nlpCode).toBe('1610-1');
    expect(baweanRaw?.center).toEqual([-5.833333, 112.75]);
    expect(
      computeSniNlpCode(baweanRaw!.center[0], baweanRaw!.center[1], '1:100.000').code,
    ).toBe('1610-1');

    // Verifikasi popup anchoring untuk lembar multi-pulau tinggi (Moa, Damar & Bandanaira) agar tidak tertutup kartu tengah
    const moaRaw = INDEX_REGIONAL_SHEETS.find(
      (s) => s.Nama_Lembar_PSG === 'Moa, Damar & Bandanaira',
    )!;
    const anchoredMoa = computePopupAnchoredMapCenter({
      bounds: moaRaw.bounds,
      anchorCenter: moaRaw.center,
      containerHeight: 760,
      popupHeight: 320,
      currentZoom: 8,
      preferredZoom: 8,
      preserveCurrentZoomIfVisible: false,
      isMobileViewport: false,
      project: (lat, lng, zoom) =>
        L.CRS.EPSG3857.latLngToPoint(L.latLng(lat, lng), zoom),
      unproject: (x, y, zoom) => {
        const ll = L.CRS.EPSG3857.pointToLatLng(L.point(x, y), zoom);
        return { lat: ll.lat, lng: ll.lng };
      },
    });
    expect(anchoredMoa.zoom).toBeLessThanOrEqual(6);
    expect(anchoredMoa.lng).toBeCloseTo(moaRaw.center[1], 5);

    expect(REGIONAL_INDEX_QUADRANGLES).toHaveLength(234);

    const allRegional = generateRegionalIndexCells({ mode: 'all' });
    const jawa100k = generateRegionalIndexCells({ mode: '100k' });
    const luarJawa250k = generateRegionalIndexCells({ mode: '250k' });
    expect(allRegional.totalCatalogCount).toBe(234);
    expect(jawa100k.totalCatalogCount).toBe(57);
    expect(luarJawa250k.totalCatalogCount).toBe(177);

    const bandaAceh = allRegional.cells.find((c) => c.code === '0421');
    expect(bandaAceh).toBeDefined();
    expect(bandaAceh?.locationLabel).toBe('Banda Aceh');
    expect(bandaAceh?.scale).toBe('1:250.000');
    expect(bandaAceh?.themeCode).toBe('GL-SM 250');
    expect(bandaAceh?.year).toBe(1981);
    expect(bandaAceh?.compilers).toContain('J.D. Bennett');
    expect(bandaAceh?.bounds).toEqual([
      [5.0, 95.0],
      [6.0, 96.25],
    ]);

    const bandungRegional = jawa100k.cells.find(
      (c) => c.locationLabel === 'Bandung',
    );
    expect(bandungRegional?.code).toBe('1209-3');
    expect(bandungRegional?.themeCode).toBe('GL-JW 100');

    const baliNusra = generateRegionalIndexCells({
      mode: 'all',
      regionFilter: 'Bali & Nusa Tenggara',
    });
    expect(baliNusra.totalCatalogCount).toBe(14);
    expect(baliNusra.cells.some((c) => c.locationLabel === 'Bali')).toBe(true);

    const oceanCulled = generateRegionalIndexCells({
      mode: 'all',
      viewportBounds: { south: -11.5, north: -9.5, west: 104.0, east: 112.0 },
    });
    expect(oceanCulled.cells).toHaveLength(0);

    // 2. Verifikasi UI Filter Indeks Regional pada kartu Indeks Skala Peta + rendering & klik lembar
    const noop = () => {};
    const fillTexts: string[] = [];
    const mockCtx2d = {
      save: noop,
      restore: noop,
      translate: noop,
      scale: noop,
      clearRect: noop,
      setTransform: noop,
      beginPath: noop,
      moveTo: noop,
      lineTo: noop,
      closePath: noop,
      rect: noop,
      arc: noop,
      clip: noop,
      fill: noop,
      stroke: noop,
      fillText: (text: string) => {
        fillTexts.push(text);
      },
      strokeText: noop,
      setLineDash: noop,
    } as unknown as CanvasRenderingContext2D;
    const ctxSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(mockCtx2d);
    const redrawSpy = vi
      .spyOn(
        L.Canvas.prototype as unknown as { _requestRedraw: () => void },
        '_requestRedraw',
      )
      .mockImplementation(noop);
    const getSizeSpy = vi
      .spyOn(L.Map.prototype, 'getSize')
      .mockImplementation(() => L.point(0, 0));
    const setViewSpy = vi.spyOn(L.Map.prototype, 'setView');
    const rectangleSpy = vi.spyOn(L, 'rectangle');
    const flyToSpy = vi
      .spyOn(L.Map.prototype, 'flyTo')
      .mockImplementation(function (this: L.Map, targetCenter, targetZoom) {
        return this.setView(targetCenter, targetZoom, { animate: false });
      });

    try {
      render(<App />);
      const activeMap = setViewSpy.mock.instances[0] as L.Map;

      const indexCard = document.getElementById('map-scale-index-card')!;
      expect(within(indexCard).queryByText(/Indeks NLP/i)).toBeNull();
      expect(within(indexCard).queryByText('Klik lembar')).toBeNull();

      const regionalGroup = within(indexCard).getByRole('group', {
        name: 'Filter Indeks Regional 1:100.000 dan 1:250.000',
      });
      const allBtn = within(regionalGroup).getByRole('button', {
        name: 'Semua (234)',
      });
      const jawaBtn = within(regionalGroup).getByRole('button', {
        name: 'Jawa 1:100K',
      });
      const luarJawaBtn = within(regionalGroup).getByRole('button', {
        name: 'Luar Jawa 250K',
      });

      // Aktifkan Indeks Regional Semua (234) -> menyalakan grid & menampilkan 234 marker
      fireEvent.click(allBtn);
      expect(allBtn).toHaveAttribute('aria-pressed', 'true');
      expect(within(indexCard).getByText('Regional 100–250K')).toBeInTheDocument();
      expect(within(indexCard).getByText('234 lembar')).toBeInTheDocument();
      expect(
        screen.getByRole('switch', { name: /Indeks Lembar Peta/i }),
      ).toHaveAttribute('aria-checked', 'true');
      expect(
        document.querySelectorAll('#leaflet-map-canvas .gm-quad-label'),
      ).toHaveLength(234);

      // Klik marker lembar regional (Banda Aceh 0421) -> membuka inspektor PSG & mempertahankan mode Indeks Regional
      const bandaMarker = Array.from(
        document.querySelectorAll<HTMLElement>(
          '#leaflet-map-canvas .gm-quad-label',
        ),
      ).find((el) => el.textContent?.includes('0421'));
      expect(bandaMarker).toBeDefined();
      fireEvent.click(bandaMarker!);

      const inspector = document.getElementById('map-feature-inspector')!;
      expect(inspector).not.toBeNull();
      expect(within(inspector).getByText('Lembar Banda Aceh')).toBeInTheDocument();
      expect(within(inspector).getByText('GL-SM 250')).toBeInTheDocument();
      expect(within(inspector).getByText('Pusat Survei Geologi')).toBeInTheDocument();
      // Pastikan label Penyusun tidak tampil ganda antara ringkasan & kotak metadata
      expect(within(inspector).getAllByText(/Penyusun:/i)).toHaveLength(1);
      expect(allBtn).toHaveAttribute('aria-pressed', 'true');

      // Filter wilayah ke Bali & Nusra -> menyaring menjadi 14 lembar
      const regionGroup = within(indexCard).getByRole('group', {
        name: 'Filter wilayah Indeks Regional',
      });
      fireEvent.click(
        within(regionGroup).getByRole('button', { name: 'Bali & Nusra' }),
      );
      expect(within(indexCard).getByText('14 lembar')).toBeInTheDocument();
      expect(
        document.querySelectorAll('#leaflet-map-canvas .gm-quad-label'),
      ).toHaveLength(14);

      // Zoom manual saat Indeks Regional aktif tidak boleh menimpa mode Regional menjadi Filter Skala
      act(() => {
        activeMap.setView([-8.8, 120.5], 8, { animate: false });
        activeMap.fire('zoomend');
      });
      expect(allBtn).toHaveAttribute('aria-pressed', 'true');
      const scaleGroup = within(indexCard).getByRole('group', {
        name: 'Filter Skala Peta 1:5.000.000 sampai 1:50.000',
      });
      expect(
        within(scaleGroup).getByRole('button', { name: '1:100.000' }),
      ).toHaveAttribute('aria-pressed', 'false');

      // Beralih ke Jawa 1:100K -> menampilkan 57 lembar & menyembunyikan chip sub-wilayah
      fireEvent.click(jawaBtn);
      expect(jawaBtn).toHaveAttribute('aria-pressed', 'true');
      expect(within(indexCard).getByText('Regional 1:100K')).toBeInTheDocument();
      expect(
        within(indexCard).queryByRole('group', {
          name: 'Filter wilayah Indeks Regional',
        }),
      ).toBeNull();
      expect(
        document.querySelectorAll('#leaflet-map-canvas .gm-quad-label'),
      ).toHaveLength(57);

      // Verifikasi mode kanvas browser (1280x760): beralih dari Jawa 1:100K ke Luar Jawa 250K memusatkan ke Indonesia (-2.0, 117.5),
      // menggambar lembar besar lebih dulu dari lembar kecil yang bertumpuk (Moa sebelum Babar), & menggambar label kanvas
      getSizeSpy.mockImplementation(() => L.point(1280, 760));
      act(() => {
        activeMap.setView([-7.25, 109.8], 7, { animate: false });
      });
      rectangleSpy.mockClear();
      fireEvent.click(luarJawaBtn);
      expect(luarJawaBtn).toHaveAttribute('aria-pressed', 'true');
      expect(within(indexCard).getByText('Regional 1:250K')).toBeInTheDocument();
      expect(within(indexCard).getByText('177 lembar')).toBeInTheDocument();
      expect(activeMap.getCenter().lng).toBeCloseTo(117.5, 1);
      expect(activeMap.getZoom()).toBe(5);
      expect(fillTexts.length).toBeGreaterThan(0);
      const drawnRectBounds = rectangleSpy.mock.calls.map(
        (call) => call[0] as [[number, number], [number, number]],
      );
      const moaDrawIdx = drawnRectBounds.findIndex(
        (b) => Math.abs(b[0][0] - -8.376389) < 0.001 && Math.abs(b[1][0] - -4.291667) < 0.001,
      );
      const babarDrawIdx = drawnRectBounds.findIndex(
        (b) => Math.abs(b[0][0] - -8.5) < 0.001 && Math.abs(b[0][1] - 128.55) < 0.001,
      );
      expect(moaDrawIdx).toBeGreaterThanOrEqual(0);
      expect(babarDrawIdx).toBeGreaterThan(moaDrawIdx);

      // Pilih Moa dari kanvas, verifikasi bringToFront tetap terpanggil saat moveend, lalu tutup untuk memulihkan urutan area
      const moaRect = rectangleSpy.mock.results[moaDrawIdx].value as L.Rectangle;
      const bringToFrontSpy = vi.spyOn(moaRect, 'bringToFront');
      act(() => {
        moaRect.fire('click');
      });
      expect(bringToFrontSpy).toHaveBeenCalled();
      bringToFrontSpy.mockRestore();

      const protoBringSpy = vi.spyOn(L.Path.prototype, 'bringToFront');
      act(() => {
        activeMap.fire('moveend');
      });
      expect(protoBringSpy).toHaveBeenCalled();
      protoBringSpy.mockRestore();

      rectangleSpy.mockClear();
      fireEvent.click(
        within(document.getElementById('map-feature-inspector')!).getByRole('button', {
          name: /Tutup inspektor indeks lembar/i,
        }),
      );
      expect(rectangleSpy.mock.calls.length).toBeGreaterThan(0);

      // Uji pencarian lembar regional (Lhoksemawe) saat filter wilayah berbeda aktif -> otomatis selaras & lembar dirender
      getSizeSpy.mockImplementation(() => L.point(0, 0));
      const regionGroupOuter = within(indexCard).getByRole('group', {
        name: 'Filter wilayah Indeks Regional',
      });
      fireEvent.click(
        within(regionGroupOuter).getByRole('button', { name: 'Bali & Nusra' }),
      );
      expect(
        document.querySelectorAll('#leaflet-map-canvas .gm-quad-label'),
      ).toHaveLength(14);
      const smartSearch = screen.getByLabelText('Cari lokasi atau koleksi peta');
      fireEvent.focus(smartSearch);
      fireEvent.change(smartSearch, { target: { value: 'Lhoksemawe' } });
      const lhokBtn = screen.getByRole('button', { name: /0521 · Lembar Lhoksemawe/i });
      expect(within(lhokBtn).getByText(/Indeks Regional \(GL-SM 250\)/i)).toBeInTheDocument();
      fireEvent.mouseDown(lhokBtn);
      fireEvent.click(lhokBtn);
      expect(
        within(document.getElementById('map-feature-inspector')!).getByText(
          'Lembar Lhoksemawe',
        ),
      ).toBeInTheDocument();
      expect(
        document.querySelectorAll('#leaflet-map-canvas .gm-quad-label'),
      ).toHaveLength(177);

      // Uji toggle ikon grid 4x4 (#map-index-grid-toggle) menyembunyikan lalu memulihkan Indeks Regional
      const gridToggleBtn = document.getElementById('map-index-grid-toggle') as HTMLButtonElement;
      fireEvent.click(gridToggleBtn);
      expect(within(indexCard).getByText('Nonaktif')).toBeInTheDocument();
      expect(
        document.querySelectorAll('#leaflet-map-canvas .gm-quad-label'),
      ).toHaveLength(0);
      fireEvent.click(gridToggleBtn);
      expect(luarJawaBtn).toHaveAttribute('aria-pressed', 'true');
      expect(
        document.querySelectorAll('#leaflet-map-canvas .gm-quad-label'),
      ).toHaveLength(177);

      // Beralih ke Filter Skala Peta 1:50.000 membersihkan mode Indeks Regional
      fireEvent.click(within(scaleGroup).getByRole('button', { name: '1:50.000' }));
      expect(luarJawaBtn).toHaveAttribute('aria-pressed', 'false');
      expect(
        within(scaleGroup).getByRole('button', { name: '1:50.000' }),
      ).toHaveAttribute('aria-pressed', 'true');

      // Kembali ke Indeks Regional lalu Reset menonaktifkan grid secara bersih
      fireEvent.click(allBtn);
      expect(allBtn).toHaveAttribute('aria-pressed', 'true');
      fireEvent.click(allBtn);
      expect(allBtn).toHaveAttribute('aria-pressed', 'false');
      expect(within(indexCard).getByText('Nonaktif')).toBeInTheDocument();
      expect(
        screen.getByRole('switch', { name: /Indeks Lembar Peta/i }),
      ).toHaveAttribute('aria-checked', 'false');
    } finally {
      ctxSpy.mockRestore();
      redrawSpy.mockRestore();
      getSizeSpy.mockRestore();
      setViewSpy.mockRestore();
      rectangleSpy.mockRestore();
      flyToSpy.mockRestore();
      cleanup();
    }
  });

  it('menampilkan kontrol Dynamic Pill 2D / 3D Terrain (Variasi 2C) beserta ekspansi slider Pitch', () => {
    render(<App />);

    const pillRoot = document.getElementById('map-dimension-pill');
    expect(pillRoot).not.toBeNull();

    const dimGroup = within(pillRoot!).getByRole('group', {
      name: 'Mode dimensi peta',
    });
    const btn2d = within(dimGroup).getByRole('button', { name: /^2D$/i });
    const btn3d = within(dimGroup).getByRole('button', { name: /3D Terrain/i });

    expect(btn2d).toHaveAttribute('aria-pressed', 'true');
    expect(btn3d).toHaveAttribute('aria-pressed', 'false');
    expect(within(pillRoot!).queryByText('BARU')).toBeNull();
    expect(document.getElementById('map-pitch-slider')).toBeNull();

    // Aktifkan 3D Terrain -> slider Pitch muncul & telemetri kanan menampilkan sudut Pitch
    fireEvent.click(btn3d);
    expect(btn2d).toHaveAttribute('aria-pressed', 'false');
    expect(btn3d).toHaveAttribute('aria-pressed', 'true');

    const pitchSlider = document.getElementById('map-pitch-slider') as HTMLInputElement;
    expect(pitchSlider).not.toBeNull();
    expect(pitchSlider.value).toBe('60');
    expect(within(pillRoot!).getByText('60°')).toBeInTheDocument();
    expect(screen.getByText('3D · 60°')).toBeInTheDocument();

    // Ubah sudut kemiringan Pitch
    fireEvent.change(pitchSlider, { target: { value: '72' } });
    expect(within(pillRoot!).getByText('72°')).toBeInTheDocument();
    expect(screen.getByText('3D · 72°')).toBeInTheDocument();

    // Kembali ke 2D -> slider Pitch kembali tersembunyi
    fireEvent.click(btn2d);
    expect(btn2d).toHaveAttribute('aria-pressed', 'true');
    expect(document.getElementById('map-pitch-slider')).toBeNull();
    expect(screen.queryByText('3D · 72°')).toBeNull();
  });
});
