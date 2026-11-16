import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Search, X } from 'lucide-react';
import { useGeoMap } from '../context/GeoMapContext';
import {
  FAQ_DATA,
  OFFICIAL_ATTRIBUTION,
  type FaqItem,
} from '../data/geomapData';

const FAQ_CATEGORIES: { id: 'all' | FaqItem['catAnchor']; label: string }[] = [
  { id: 'all', label: 'Semua Topik' },
  { id: 'category-1', label: 'Akun & Akses' },
  { id: 'category-2', label: 'Pencarian & Filter' },
  { id: 'category-3', label: 'Format, CRS & SHP' },
  { id: 'category-4', label: 'Layer Kebencanaan & PVMBG' },
  { id: 'category-5', label: 'Peta & Cakupan' },
];

export const FaqView: React.FC = () => {
  const { registerSearchInput } = useGeoMap();
  const [faqQuery, setFaqQuery] = useState('');
  const [activeCat, setActiveCat] = useState<'all' | FaqItem['catAnchor']>('all');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    'faq-1': true,
    'faq-4': true,
  });

  const filteredFaq = useMemo(() => {
    const q = faqQuery.trim().toLowerCase();
    return FAQ_DATA.filter((item) => {
      if (activeCat !== 'all' && item.catAnchor !== activeCat) return false;
      if (!q) return true;
      return (
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q) ||
        item.cat.toLowerCase().includes(q)
      );
    });
  }, [activeCat, faqQuery]);

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
      {/* Prototipe v3 FAQ Header */}
      <div
        className="space-y-1.5 border-b pb-4"
        style={{ borderColor: 'var(--s-border-subtle)' }}
      >
        <span
          className="gm-micro text-[11px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--s-text-brand)' }}
        >
          Pusat Bantuan Terpadu · Geospasial Kementerian ESDM
        </span>
        <h1 className="gm-heading text-xl font-extrabold sm:text-2xl">
          Panduan &amp; Pertanyaan Umum (FAQ)
        </h1>
        <p
          className="gm-prose text-xs leading-relaxed"
          style={{ color: 'var(--s-text-muted)' }}
        >
          Pelajari standar proyeksi WGS 1984 / UTM, batas kuota unduhan 20 paket/hari, integrasi status PVMBG MAGMA, serta cara kerja layer Clean Startup.
        </p>
      </div>

      {/* Prototipe v3 Filter & Search Container */}
      <div className="gm-surface space-y-3 rounded-2xl p-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            style={{ color: 'var(--s-text-muted)' }}
            aria-hidden="true"
          />
          <input
            ref={(el) => registerSearchInput(el)}
            type="search"
            enterKeyHint="search"
            value={faqQuery}
            onChange={(e) => setFaqQuery(e.target.value)}
            placeholder="Ketik kata kunci: SHP, kuota, PVMBG, koordinat..."
            aria-label="Cari pertanyaan panduan GeoMap"
            className="gm-focus w-full rounded-xl border py-2.5 pr-9 pl-9 text-xs outline-none"
            style={{
              backgroundColor: 'var(--s-bg-surface-muted)',
              borderColor: 'var(--s-border-strong)',
              color: 'var(--s-text-primary)',
            }}
          />
          {faqQuery && (
            <button
              type="button"
              onClick={() => setFaqQuery('')}
              className="gm-focus absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 cursor-pointer"
              aria-label="Hapus pencarian FAQ"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Kategori FAQ"
        >
          {FAQ_CATEGORIES.map((cat) => {
            const selected = activeCat === cat.id;
            return (
              <button
                key={cat.id}
                id={cat.id === 'all' ? undefined : cat.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveCat(cat.id)}
                className="gm-press gm-focus rounded-full border px-3 py-1.5 text-xs font-semibold cursor-pointer"
                style={
                  selected
                    ? {
                        backgroundColor: 'var(--s-accent-cta-bg)',
                        color: '#000000',
                        borderColor: '#D5B600',
                      }
                    : {
                        backgroundColor: 'var(--s-bg-surface-muted)',
                        borderColor: 'var(--s-border-subtle)',
                        color: 'var(--s-text-secondary)',
                      }
                }
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prototipe v3 Accordion Cards */}
      <div className="space-y-2.5">
        {filteredFaq.length === 0 ? (
          <div className="gm-surface rounded-2xl p-6 text-center text-sm">
            <p className="font-bold">
              Tidak ada FAQ yang cocok dengan &ldquo;{faqQuery}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setFaqQuery('');
                setActiveCat('all');
              }}
              className="gm-cta-primary mt-3 px-4 py-2 text-xs cursor-pointer"
            >
              Tampilkan Semua Topik FAQ
            </button>
          </div>
        ) : (
          filteredFaq.map((item) => {
            const isOpen = Boolean(openIds[item.id]);
            return (
              <article
                key={item.id}
                className="gm-surface overflow-hidden rounded-2xl"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  className="gm-focus gm-press flex w-full items-center justify-between gap-3 p-4 text-left cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: 'var(--s-text-brand)' }}
                    >
                      {item.cat}
                    </span>
                    <h2 className="gm-heading text-sm font-bold">{item.q}</h2>
                  </div>
                  <span style={{ color: 'var(--s-text-muted)' }}>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <ChevronDown
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                </button>
                {isOpen && (
                  <div
                    className="gm-blur-swap gm-prose border-t px-4 pt-2 pb-4 text-xs leading-relaxed"
                    style={{
                      borderColor: 'var(--s-border-subtle)',
                      color: 'var(--s-text-secondary)',
                    }}
                  >
                    <p>{item.a}</p>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* Technical Standardization Summary Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="gm-surface rounded-2xl p-5">
          <div className="text-sm font-bold">
            Integrasi Status PVMBG &amp; MAGMA Indonesia
          </div>
          <p
            className="mt-2 text-xs leading-relaxed"
            style={{ color: 'var(--s-text-muted)' }}
          >
            Setiap titik gunung api aktif pada layer{' '}
            <strong>Sebaran Gunung Api</strong> menampilkan tingkat aktivitas resmi PVMBG (Level I Normal, Level II Waspada, Level III Siaga, Level IV Awas).
          </p>
          <a
            href="https://magma.esdm.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="gm-press gm-focus mt-3 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold"
            style={{ borderColor: 'var(--s-border-strong)' }}
          >
            <span>Buka Portal MAGMA ESDM</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        <div className="gm-surface rounded-2xl p-5">
          <div className="text-sm font-bold">
            Atribusi &amp; Lisensi Resmi Badan Geologi
          </div>
          <p
            className="mt-2 text-xs leading-relaxed"
            style={{ color: 'var(--s-text-muted)' }}
          >
            Cantumkan atribusi resmi Kementerian ESDM saat mengutip peta geologi dalam publikasi akademik maupun dokumen AMDAL/eksplorasi:
          </p>
          <p
            className="mt-2 rounded-xl border p-2.5 font-mono text-[11px]"
            style={{
              backgroundColor: 'var(--s-bg-surface-muted)',
              borderColor: 'var(--s-border-subtle)',
            }}
          >
            {OFFICIAL_ATTRIBUTION}
          </p>
        </div>
      </section>
    </main>
  );
};
