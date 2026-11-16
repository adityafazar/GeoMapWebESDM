import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, Minus, Plus, RotateCcw } from 'lucide-react';
import { useGeoMap } from '../context/GeoMapContext';
import { DATASETS, type PreviewMode } from '../data/geomapData';
import {
  createVelocityTracker,
  projectMomentum,
  rubberbandClamp,
  stepAppleSpring,
} from '../utils/applePhysics';

function getSchemaRows(
  mode: PreviewMode,
): { field: string; type: string; example: string }[] {
  if (mode === 'fault') {
    return [
      { field: 'NAMA_SESAR', type: 'String(80)', example: 'Segmen Sesar Lembang' },
      { field: 'KINEMATIKA', type: 'String(24)', example: 'Geser Mengiri (Sinistral)' },
      { field: 'SLIP_RATE', type: 'Double', example: '4.5 mm/thn' },
      { field: 'SUMBER_DATA', type: 'String(64)', example: 'Pusat Survei Geologi KESDM' },
    ];
  }
  if (mode === 'basin') {
    return [
      { field: 'NAMA_CEKUNGAN', type: 'String(64)', example: 'Cekungan Kutai / Tarakan' },
      { field: 'STATUS_EKS', type: 'String(30)', example: 'Produksi & Potensi CCS' },
      { field: 'TEBAL_SED_M', type: 'Integer', example: '8500' },
      { field: 'LUAS_KM2', type: 'Double', example: '12450.5' },
    ];
  }
  if (mode === 'hydro') {
    return [
      { field: 'KODE_CAT', type: 'String(16)', example: 'CAT-JB-01' },
      { field: 'PRODUKTIF', type: 'String(40)', example: 'Produktif Sedang–Tinggi' },
      { field: 'DEBIT_L_S', type: 'Double', example: '12.4 L/dt' },
      { field: 'DATUM_CRS', type: 'String(24)', example: 'WGS 1984 (EPSG:4326)' },
    ];
  }
  return [
    { field: 'SIMBOL_LIT', type: 'String(12)', example: 'Qvu / Tmc' },
    { field: 'NAMA_FORMASI', type: 'String(80)', example: 'Endapan Vulkanik Muda' },
    { field: 'UMUR_GEOL', type: 'String(32)', example: 'Kuarter – Plistosen' },
    { field: 'KODE_LEMBAR', type: 'String(16)', example: '1209-3' },
  ];
}

export const PreviewView: React.FC = () => {
  const {
    activeDataset,
    navigate,
    openDatasetOnMainMap,
    requestDownload,
    user,
  } = useGeoMap();

  const [plateZoom, setPlateZoom] = useState(1);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showProvinceMask, setShowProvinceMask] = useState(true);
  const [rightTab, setRightTab] = useState<'download' | 'metadata' | 'schema'>(
    'download',
  );
  const [copiedCitation, setCopiedCitation] = useState(false);

  // Apple Fluid Interfaces 1:1 Pan + Momentum + Rubber-band Spring Refs (0 React re-renders during drag)
  const stageViewportRef = useRef<HTMLDivElement | null>(null);
  const stageGroupRef = useRef<SVGGElement | null>(null);
  const panRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ vx: 0, vy: 0 });
  const zoomRef = useRef(1);
  const rafIdRef = useRef<number | null>(null);
  const velocityTrackerRef = useRef(createVelocityTracker(90));
  const dragSessionRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);

  const getPanBounds = useCallback((zoom: number) => {
    return {
      maxX: Math.max(70, (zoom - 1) * 260 + 70),
      maxY: Math.max(50, (zoom - 1) * 170 + 50),
    };
  }, []);

  const syncStageTransform = useCallback(() => {
    const group = stageGroupRef.current;
    if (!group) return;
    group.setAttribute(
      'transform',
      `translate(${panRef.current.x.toFixed(2)}, ${panRef.current.y.toFixed(2)}) scale(${zoomRef.current})`,
    );
  }, []);

  const cancelSpringLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const springPanTo = useCallback(
    (targetX: number, targetY: number, dampingRatio = 1.0, response = 0.42) => {
      cancelSpringLoop();
      const stageEl = stageViewportRef.current?.closest('.geomap-stage');
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
          stageEl?.getAttribute('data-instant') === 'true');

      if (prefersReducedMotion || typeof requestAnimationFrame !== 'function') {
        panRef.current = { x: targetX, y: targetY };
        velRef.current = { vx: 0, vy: 0 };
        syncStageTransform();
        return;
      }

      let lastTime = performance.now();
      const tick = (now: number) => {
        const dtSec = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
        lastTime = now;

        const nextX = stepAppleSpring(
          { value: panRef.current.x, velocity: velRef.current.vx },
          targetX,
          dtSec,
          { response, dampingRatio, restDelta: 0.25 },
        );
        const nextY = stepAppleSpring(
          { value: panRef.current.y, velocity: velRef.current.vy },
          targetY,
          dtSec,
          { response, dampingRatio, restDelta: 0.25 },
        );

        panRef.current = { x: nextX.value, y: nextY.value };
        velRef.current = { vx: nextX.velocity, vy: nextY.velocity };
        syncStageTransform();

        if (nextX.settled && nextY.settled) {
          rafIdRef.current = null;
          return;
        }
        rafIdRef.current = requestAnimationFrame(tick);
      };

      rafIdRef.current = requestAnimationFrame(tick);
    },
    [cancelSpringLoop, syncStageTransform],
  );

  useEffect(() => {
    zoomRef.current = plateZoom;
    const bounds = getPanBounds(plateZoom);
    const clampedX = Math.max(-bounds.maxX, Math.min(bounds.maxX, panRef.current.x));
    const clampedY = Math.max(-bounds.maxY, Math.min(bounds.maxY, panRef.current.y));
    if (clampedX !== panRef.current.x || clampedY !== panRef.current.y) {
      springPanTo(clampedX, clampedY, 1.0, 0.32);
    } else {
      syncStageTransform();
    }
  }, [plateZoom, getPanBounds, springPanTo, syncStageTransform]);

  useEffect(() => {
    cancelSpringLoop();
    panRef.current = { x: 0, y: 0 };
    velRef.current = { vx: 0, vy: 0 };
    zoomRef.current = 1;
    setPlateZoom(1);
    syncStageTransform();
  }, [activeDataset.slug, cancelSpringLoop, syncStageTransform]);

  useEffect(() => () => cancelSpringLoop(), [cancelSpringLoop]);

  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    cancelSpringLoop();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragSessionRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPanX: panRef.current.x,
      startPanY: panRef.current.y,
    };
    velRef.current = { vx: 0, vy: 0 };
    velocityTrackerRef.current.reset();
    velocityTrackerRef.current.push(panRef.current.x, panRef.current.y);
    setIsDraggingSheet(true);
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== e.pointerId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = rect.width > 0 ? 600 / rect.width : 1;
    const scaleY = rect.height > 0 ? 390 / rect.height : 1;
    const rawX = session.startPanX + (e.clientX - session.startClientX) * scaleX;
    const rawY = session.startPanY + (e.clientY - session.startClientY) * scaleY;

    const bounds = getPanBounds(zoomRef.current);
    const nextX = rubberbandClamp(rawX, -bounds.maxX, bounds.maxX, 240, 0.55);
    const nextY = rubberbandClamp(rawY, -bounds.maxY, bounds.maxY, 170, 0.55);

    panRef.current = { x: nextX, y: nextY };
    velocityTrackerRef.current.push(nextX, nextY);
    syncStageTransform();
  };

  const finishStageDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== e.pointerId) return;
    dragSessionRef.current = null;
    setIsDraggingSheet(false);
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const { vx, vy } = velocityTrackerRef.current.velocity();
    velRef.current = { vx, vy };

    const bounds = getPanBounds(zoomRef.current);
    const projectedX = panRef.current.x + projectMomentum(vx, 0.99);
    const projectedY = panRef.current.y + projectMomentum(vy, 0.99);
    const clampedTargetX = Math.max(-bounds.maxX, Math.min(bounds.maxX, projectedX));
    const clampedTargetY = Math.max(-bounds.maxY, Math.min(bounds.maxY, projectedY));
    const hitBoundary =
      clampedTargetX !== projectedX || clampedTargetY !== projectedY;

    springPanTo(
      clampedTargetX,
      clampedTargetY,
      hitBoundary ? 0.92 : 1.0,
      hitBoundary ? 0.36 : 0.44,
    );
  };

  const schemaRows = getSchemaRows(activeDataset.previewMode);
  const related = DATASETS.filter(
    (d) => d.slug !== activeDataset.slug && d.theme === activeDataset.theme,
  ).slice(0, 3);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#/peta/${activeDataset.slug}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 1800);
  };

  return (
    <main className="mx-auto w-full max-w-[1380px] space-y-4 p-4 sm:p-6">
      {/* Prototipe v3 Clean Breadcrumb */}
      <nav
        aria-label="Breadcrumb Pratinjau Peta"
        className="flex flex-wrap items-center gap-1.5 text-xs"
        style={{ color: 'var(--s-text-muted)' }}
      >
        <button
          type="button"
          onClick={() => navigate('map')}
          className="gm-focus gm-press cursor-pointer hover:underline"
        >
          Peta Interaktif
        </button>
        <span aria-hidden="true">/</span>
        <button
          type="button"
          onClick={() => navigate('catalog')}
          className="gm-focus gm-press cursor-pointer hover:underline"
        >
          Katalog Peta
        </button>
        <span aria-hidden="true">/</span>
        <span
          className="truncate font-semibold"
          style={{ color: 'var(--s-text-primary)' }}
        >
          {activeDataset.title}
        </span>
      </nav>

      {/* Prototipe v3 Title & Quick Action Header */}
      <div
        className="flex flex-col justify-between gap-3 border-b pb-3 md:flex-row md:items-end"
        style={{ borderColor: 'var(--s-border-subtle)' }}
      >
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
              style={{
                backgroundColor: 'var(--s-status-public-bg)',
                color: 'var(--s-status-public-fg)',
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: 'var(--s-status-public-dot)' }}
                aria-hidden="true"
              />
              Pratinjau Terbuka Publik
            </span>
            <span
              className="tabular-nums rounded-full border px-2.5 py-0.5 text-[11px] font-bold"
              style={{
                backgroundColor: 'var(--s-bg-surface-muted)',
                borderColor: 'var(--s-border-subtle)',
                color: 'var(--s-text-secondary)',
              }}
            >
              {activeDataset.scale}
            </span>
            <code
              className="rounded px-2 py-0.5 text-[11px]"
              style={{
                backgroundColor: 'var(--s-bg-surface-muted)',
                color: 'var(--s-text-muted)',
              }}
            >
              #/peta/{activeDataset.slug}
            </code>
          </div>
          <h1 className="gm-heading text-xl font-extrabold sm:text-2xl">
            {activeDataset.title}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => openDatasetOnMainMap(activeDataset)}
          className="gm-focus gm-press inline-flex shrink-0 items-center rounded-xl border px-3.5 py-2 text-xs font-semibold cursor-pointer"
          style={{
            borderColor: 'var(--s-border-strong)',
            backgroundColor: 'var(--s-bg-surface)',
            color: 'var(--s-text-primary)',
          }}
        >
          Tampilkan Layer di Peta Utama
        </button>
      </div>

      {/* Prototipe v3 Asymmetric Grid: 1.8fr Geo-Canvas Left + 1fr Tabbed Download/Metadata Right */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.8fr_1fr]">
        {/* Left Column: Zoomable Cartographic Sheet & Attribute Table */}
        <div className="space-y-4">
          <section
            aria-label="Kanvas pratinjau peta zoomable"
            className="gm-surface flex flex-col overflow-hidden rounded-2xl"
          >
            {/* Viewer Toolbar */}
            <div
              className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5"
              style={{
                backgroundColor: 'var(--s-bg-surface-muted)',
                borderColor: 'var(--s-border-subtle)',
              }}
            >
              <div
                className="text-xs font-semibold"
                style={{ color: 'var(--s-text-secondary)' }}
              >
                {activeDataset.sheetCode.startsWith('Lembar')
                  ? activeDataset.sheetCode
                  : `Lembar ${activeDataset.sheetCode}`}{' '}
                • Geser &amp; Zoom Bebas
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  aria-pressed={showGrid}
                  onClick={() => setShowGrid((g) => !g)}
                  className="gm-focus gm-press inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-semibold cursor-pointer"
                  style={
                    showGrid
                      ? {
                          backgroundColor: 'var(--s-accent-cta-bg)',
                          color: '#000000',
                          borderColor: '#D5B600',
                        }
                      : {
                          backgroundColor: 'var(--s-bg-surface)',
                          borderColor: 'var(--s-border-strong)',
                        }
                  }
                >
                  Grid Koordinat
                </button>
                <button
                  type="button"
                  aria-pressed={showProvinceMask}
                  onClick={() => setShowProvinceMask((m) => !m)}
                  className="gm-focus gm-press inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold cursor-pointer"
                  style={
                    showProvinceMask
                      ? {
                          backgroundColor: 'var(--s-accent-cta-bg)',
                          color: '#000000',
                          borderColor: '#D5B600',
                        }
                      : {
                          backgroundColor: 'var(--s-bg-surface)',
                          borderColor: 'var(--s-border-strong)',
                        }
                  }
                >
                  <span>Provinsi</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPlateZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))
                  }
                  aria-label="Perkecil pratinjau lembar peta"
                  className="gm-focus gm-press gm-touch-target inline-flex h-8 w-8 items-center justify-center rounded-lg border cursor-pointer"
                  style={{
                    borderColor: 'var(--s-border-strong)',
                    backgroundColor: 'var(--s-bg-surface)',
                  }}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="tabular-nums w-16 text-center text-xs font-bold">
                  Zoom {Math.round(plateZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPlateZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))
                  }
                  aria-label="Perbesar pratinjau lembar peta"
                  className="gm-focus gm-press gm-touch-target inline-flex h-8 w-8 items-center justify-center rounded-lg border cursor-pointer"
                  style={{
                    borderColor: 'var(--s-border-strong)',
                    backgroundColor: 'var(--s-bg-surface)',
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlateZoom(1);
                    springPanTo(0, 0, 1.0, 0.36);
                  }}
                  aria-label="Reset zoom dan posisi pratinjau"
                  className="gm-focus gm-press gm-touch-target inline-flex h-8 w-8 items-center justify-center rounded-lg border cursor-pointer"
                  style={{
                    borderColor: 'var(--s-border-strong)',
                    backgroundColor: 'var(--s-bg-surface)',
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive SVG Plate Sheet + Penampang A–A' (Apple 1:1 Pointer + Rubber-Band Spring) */}
            <div
              ref={stageViewportRef}
              onPointerDown={handleStagePointerDown}
              onPointerMove={handleStagePointerMove}
              onPointerUp={finishStageDrag}
              onPointerCancel={finishStageDrag}
              className={`relative h-[380px] sm:h-[440px] overflow-hidden bg-white select-none ${
                isDraggingSheet ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{ touchAction: 'none' }}
            >
              <svg
                viewBox="0 0 600 390"
                className="h-full w-full"
                role="img"
                aria-label={`Pratinjau kartografi ${activeDataset.title}`}
              >
                <rect width="600" height="390" fill="#FFFFFF" />

                {showGrid && (
                  <g stroke="#CBD5E1" strokeWidth="0.6">
                    <line x1="130" y1="20" x2="130" y2="365" />
                    <line x1="250" y1="20" x2="250" y2="365" />
                    <line x1="370" y1="20" x2="370" y2="365" />
                    <line x1="490" y1="20" x2="490" y2="365" />
                    <line x1="20" y1="110" x2="580" y2="110" />
                    <line x1="20" y1="220" x2="580" y2="220" />
                  </g>
                )}

                <g
                  ref={stageGroupRef}
                  style={{ transformOrigin: '300px 195px' }}
                >
                  {activeDataset.previewMode === 'fault' && (
                    <g>
                      <rect
                        x="30"
                        y="28"
                        width="540"
                        height="330"
                        fill="#F8FAFC"
                        stroke="#233C5A"
                        strokeWidth="1.5"
                      />
                      <ellipse
                        cx="290"
                        cy="195"
                        rx="220"
                        ry="110"
                        fill="#FEF3C7"
                        opacity="0.7"
                      />
                      <ellipse
                        cx="285"
                        cy="195"
                        rx="150"
                        ry="70"
                        fill="#FDBA74"
                        opacity="0.6"
                      />
                      <ellipse
                        cx="280"
                        cy="195"
                        rx="90"
                        ry="38"
                        fill="#FCA5A5"
                        opacity="0.65"
                      />
                      <path
                        d="M60 120 L185 162 L280 195 L410 220 L525 256"
                        fill="none"
                        stroke="#B91C1C"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M140 278 L280 195 L370 112"
                        fill="none"
                        stroke="#DC2626"
                        strokeWidth="2.2"
                        strokeDasharray="6 4"
                      />
                      <g transform="translate(210,168)">
                        <circle
                          r="12"
                          fill="#FFF"
                          stroke="#0F172A"
                          strokeWidth="1.5"
                        />
                        <path d="M0-12 A12 12 0 0 1 12 0 L0 0 Z" fill="#0F172A" />
                        <path
                          d="M0 12 A12 12 0 0 1-12 0 L0 0 Z"
                          fill="#0F172A"
                        />
                      </g>
                      <g transform="translate(350,206)">
                        <circle
                          r="12"
                          fill="#FFF"
                          stroke="#0F172A"
                          strokeWidth="1.5"
                        />
                        <path d="M0-12 A12 12 0 0 1 12 0 L0 0 Z" fill="#0F172A" />
                        <path
                          d="M0 12 A12 12 0 0 1-12 0 L0 0 Z"
                          fill="#0F172A"
                        />
                      </g>
                      <text
                        x="290"
                        y="182"
                        fontSize="11"
                        fontWeight="700"
                        fill="#7F1D1D"
                        textAnchor="middle"
                      >
                        SEGMEN SESAR AKTIF (GESER MENGIRI)
                      </text>
                    </g>
                  )}

                  {activeDataset.previewMode === 'basin' && (
                    <g>
                      <rect
                        x="30"
                        y="28"
                        width="540"
                        height="330"
                        fill="#F0FDF4"
                        stroke="#233C5A"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M80,190 C130,85 430,75 495,180 C525,260 390,320 225,310 C120,305 60,250 80,190 Z"
                        fill="#A7F3D0"
                        stroke="#047857"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M135,195 C175,120 390,115 445,188 C465,245 360,285 245,280 C160,275 115,240 135,195 Z"
                        fill="#6EE7B7"
                        stroke="#047857"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M195,198 C225,155 340,155 375,198 C390,232 325,254 260,250 C205,246 180,222 195,198 Z"
                        fill="#10B981"
                        stroke="#064E3B"
                        strokeWidth="1.4"
                      />
                      <line
                        x1="110"
                        y1="200"
                        x2="480"
                        y2="200"
                        stroke="#064E3B"
                        strokeWidth="1.2"
                        strokeDasharray="4 4"
                      />
                      <text
                        x="285"
                        y="205"
                        fontSize="11"
                        fontWeight="700"
                        fill="#064E3B"
                        textAnchor="middle"
                      >
                        ISOPACH DEPO-CENTER (&gt; 4.500 m Sedimen)
                      </text>
                    </g>
                  )}

                  {activeDataset.previewMode === 'hydro' && (
                    <g>
                      <rect
                        x="30"
                        y="28"
                        width="540"
                        height="330"
                        fill="#F0F9FF"
                        stroke="#233C5A"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M40,95 Q290,145 560,88"
                        fill="none"
                        stroke="#0284C7"
                        strokeWidth="2"
                      />
                      <path
                        d="M40,165 Q295,215 560,158"
                        fill="none"
                        stroke="#0369A1"
                        strokeWidth="2"
                      />
                      <path
                        d="M40,235 Q300,285 560,228"
                        fill="none"
                        stroke="#075985"
                        strokeWidth="2"
                      />
                      <path
                        d="M40,305 Q305,345 560,295"
                        fill="none"
                        stroke="#0C4A6E"
                        strokeWidth="2"
                      />
                      <circle
                        cx="300"
                        cy="185"
                        r="46"
                        fill="rgba(234,88,12,0.18)"
                        stroke="#EA580C"
                        strokeWidth="1.8"
                        strokeDasharray="4 3"
                      />
                      <polygon
                        points="300,164 316,196 284,196"
                        fill="#EA580C"
                        stroke="#FFF"
                        strokeWidth="1.5"
                      />
                      <text
                        x="300"
                        y="246"
                        fontSize="11"
                        fontWeight="700"
                        fill="#0C4A6E"
                        textAnchor="middle"
                      >
                        KONTUR PIEZOMETRIK / ZONA BAHAYA TERKALIBRASI
                      </text>
                    </g>
                  )}

                  {activeDataset.previewMode === 'geology' && (
                    <g>
                      <rect
                        x="30"
                        y="28"
                        width="540"
                        height="248"
                        fill="#FEFCE8"
                        stroke="#233C5A"
                        strokeWidth="1.5"
                      />
                      <polygon
                        points="30,28 240,28 190,170 30,210"
                        fill="#FDE047"
                        stroke="#854D0E"
                        strokeWidth="1"
                      />
                      <polygon
                        points="240,28 450,28 395,188 190,170"
                        fill="#D5B600"
                        opacity="0.72"
                        stroke="#713F12"
                        strokeWidth="1"
                      />
                      <polygon
                        points="450,28 570,28 570,276 395,188"
                        fill="#93C5FD"
                        opacity="0.7"
                        stroke="#1E3A8A"
                        strokeWidth="1"
                      />
                      <polygon
                        points="30,210 190,170 395,188 570,276 30,276"
                        fill="#FCA5A5"
                        opacity="0.6"
                        stroke="#991B1B"
                        strokeWidth="1"
                      />
                      <line
                        x1="65"
                        y1="150"
                        x2="535"
                        y2="150"
                        stroke="#000"
                        strokeWidth="2"
                        strokeDasharray="7 4"
                      />
                      <text x="54" y="154" fontSize="12" fontWeight="800">
                        A
                      </text>
                      <text x="540" y="154" fontSize="12" fontWeight="800">
                        A&apos;
                      </text>
                      <rect
                        x="30"
                        y="290"
                        width="540"
                        height="68"
                        fill="#FFFFFF"
                        stroke="#233C5A"
                        strokeWidth="1.5"
                      />
                      <polygon
                        points="30,358 30,318 160,308 320,332 480,314 570,326 570,358"
                        fill="#D5B600"
                        opacity="0.55"
                        stroke="#0F172A"
                        strokeWidth="1.3"
                      />
                      <text
                        x="42"
                        y="305"
                        fontSize="9.5"
                        fontWeight="700"
                        fill="#233C5A"
                      >
                        PENAMPANG GEOLOGI A — A&apos; (Skala Vertikal 2×)
                      </text>
                    </g>
                  )}

                  {showProvinceMask && (
                    <g
                      stroke="#233C5A"
                      strokeOpacity="0.45"
                      strokeWidth="1.2"
                      strokeDasharray="6 4"
                      fill="none"
                    >
                      <path d="M30,190 L215,175 L340,220 L570,200" />
                      <path d="M260,28 L280,145 L265,276" />
                    </g>
                  )}
                </g>

                <text
                  x="300"
                  y="378"
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="700"
                  fill="#475569"
                  letterSpacing="0.08em"
                >
                  PRATINJAU RESOLUSI MENENGAH (150 DPI) • AKSES PUBLIK BADAN GEOLOGI KESDM
                </text>
              </svg>
            </div>
          </section>

          {/* Compact Reference Schema Table Bar (keeps DBF/SHP schema accessible immediately) */}
          <section className="gm-surface rounded-2xl p-4">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <h2 className="gm-heading text-xs font-bold">
                Pratinjau Skema Tabel Atribut (.DBF / .SHP)
              </h2>
              <span
                className="rounded px-2 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: 'var(--s-status-public-bg)',
                  color: 'var(--s-status-public-fg)',
                }}
              >
                {activeDataset.datum}
              </span>
            </div>

            <div
              className="overflow-hidden rounded-xl border text-[11px]"
              style={{ borderColor: 'var(--s-border-subtle)' }}
            >
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr style={{ backgroundColor: 'var(--s-bg-surface-muted)' }}>
                    <th className="p-2 font-bold">Field</th>
                    <th className="p-2 font-bold">Tipe</th>
                    <th className="p-2 font-bold">Contoh Atribut</th>
                  </tr>
                </thead>
                <tbody
                  className="divide-y"
                  style={{ borderColor: 'var(--s-border-subtle)' }}
                >
                  {schemaRows.map((row) => (
                    <tr key={row.field}>
                      <td className="p-2 font-mono font-bold">{row.field}</td>
                      <td className="p-2" style={{ color: 'var(--s-text-muted)' }}>
                        {row.type}
                      </td>
                      <td className="p-2">{row.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column: Prototipe v3 3-Tab Specifications & Auth-Gated Download Sidebar */}
        <aside
          aria-label="Panel unduhan dan spesifikasi teknis"
          className="space-y-4"
        >
          <div className="gm-surface overflow-hidden rounded-2xl">
            <div
              role="tablist"
              aria-label="Tab informasi lembar peta"
              className="grid grid-cols-3 border-b text-xs font-semibold"
              style={{
                backgroundColor: 'var(--s-bg-surface-muted)',
                borderColor: 'var(--s-border-subtle)',
              }}
            >
              {[
                { id: 'download' as const, label: 'Unduh' },
                { id: 'metadata' as const, label: 'Metadata SNI' },
                { id: 'schema' as const, label: 'Atribut SHP' },
              ].map((t) => {
                const selected = rightTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setRightTab(t.id)}
                    className="gm-focus gm-press border-b-2 px-2 py-3 cursor-pointer"
                    style={{
                      borderColor: selected ? '#233C5A' : 'transparent',
                      backgroundColor: selected
                        ? 'var(--s-bg-surface)'
                        : 'transparent',
                      color: selected
                        ? 'var(--s-text-primary)'
                        : 'var(--s-text-muted)',
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div key={rightTab} className="gm-blur-swap space-y-4 p-4">
              {rightTab === 'download' && (
                <>
                  <p
                    className="gm-prose text-xs leading-relaxed"
                    style={{ color: 'var(--s-text-secondary)' }}
                  >
                    {activeDataset.summary}
                  </p>

                  <div
                    className="space-y-2.5 rounded-xl border p-3.5"
                    style={{
                      borderColor: 'var(--s-border-subtle)',
                      backgroundColor: 'var(--s-bg-surface-muted)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">
                        Pratinjau Web PNG (150 DPI)
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          backgroundColor: 'var(--s-status-public-bg)',
                          color: 'var(--s-status-public-fg)',
                        }}
                      >
                        Tanpa Login
                      </span>
                    </div>
                    <button
                      type="button"
                      className="gm-cta-primary gm-focus inline-flex w-full items-center justify-center px-3 py-2.5 text-xs cursor-pointer"
                    >
                      Unduh PNG Pratinjau (Gratis)
                    </button>
                  </div>

                  <div
                    className="space-y-3 rounded-xl border p-3.5"
                    style={{ borderColor: 'var(--s-border-strong)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">
                        Berkas Resolusi Penuh &amp; GIS
                      </span>
                      <span
                        className="gm-micro tabular-nums inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          backgroundColor: user
                            ? 'var(--s-status-public-bg)'
                            : 'var(--s-status-lock-bg)',
                          color: user
                            ? 'var(--s-status-public-fg)'
                            : 'var(--s-status-lock-fg)',
                        }}
                      >
                        {user
                          ? `Kuota: ${user.quotaLimit - user.quotaUsed}/${user.quotaLimit}`
                          : 'Perlu Masuk'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => requestDownload(activeDataset, 'GeoPDF')}
                        className="gm-cta-primary gm-focus flex w-full items-center justify-between px-3.5 py-2.5 text-xs cursor-pointer"
                      >
                        <span>Unduh GeoPDF Penuh</span>
                        <span className="tabular-nums rounded bg-black/15 px-1.5 py-0.5 text-[11px]">
                          {activeDataset.fileSizeRaster}
                        </span>
                      </button>

                      {activeDataset.hasShp ? (
                        <button
                          type="button"
                          onClick={() => requestDownload(activeDataset, 'SHP')}
                          className="gm-focus gm-press flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-semibold text-white cursor-pointer"
                          style={{
                            backgroundColor: '#233C5A',
                            borderColor: '#15253B',
                          }}
                        >
                          <span>Unduh Paket Vektor .SHP</span>
                          <span className="tabular-nums rounded bg-white/15 px-1.5 py-0.5 text-[11px]">
                            {activeDataset.fileSizeShp}
                          </span>
                        </button>
                      ) : (
                        <div
                          className="rounded-lg px-3 py-2 text-[11px] opacity-80"
                          style={{ backgroundColor: 'var(--s-bg-surface-muted)' }}
                        >
                          Paket vektor .SHP belum tersedia untuk dataset kompilasi ini.
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="gm-press gm-focus inline-flex w-full items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold cursor-pointer"
                        style={{ borderColor: 'var(--s-border-subtle)' }}
                      >
                        {copiedCitation ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Tautan Disalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Salin Tautan Sitasi Resmi</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {rightTab === 'metadata' && (
                <dl
                  className="tabular-nums divide-y text-xs"
                  style={{ borderColor: 'var(--s-border-subtle)' }}
                >
                  {[
                    ['Penerbit Resmi', activeDataset.publisher],
                    ['Nomor / Kode', activeDataset.sheetCode],
                    ['Skala Peta', activeDataset.scale],
                    ['Tahun Publikasi', String(activeDataset.year)],
                    ['Sistem Koordinat', activeDataset.datum],
                    ['Wilayah Cakupan', activeDataset.region],
                    [
                      'Lisensi Data',
                      'Terbuka Pemerintah (Atribusi Wajib KESDM)',
                    ],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between gap-3 py-2.5">
                      <dt style={{ color: 'var(--s-text-muted)' }}>{label}</dt>
                      <dd className="text-right font-semibold">{val}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {rightTab === 'schema' && (
                <div className="space-y-2">
                  <p
                    className="text-[11px]"
                    style={{ color: 'var(--s-text-muted)' }}
                  >
                    Struktur kolom atribut di dalam berkas DBF / SHP:
                  </p>
                  <div
                    className="overflow-hidden rounded-xl border text-[11px]"
                    style={{ borderColor: 'var(--s-border-subtle)' }}
                  >
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr style={{ backgroundColor: 'var(--s-bg-surface-muted)' }}>
                          <th className="p-2 font-bold">Field</th>
                          <th className="p-2 font-bold">Tipe</th>
                          <th className="p-2 font-bold">Contoh</th>
                        </tr>
                      </thead>
                      <tbody
                        className="divide-y"
                        style={{ borderColor: 'var(--s-border-subtle)' }}
                      >
                        {schemaRows.map((row) => (
                          <tr key={row.field}>
                            <td className="p-2 font-mono font-bold">
                              {row.field}
                            </td>
                            <td className="p-2">{row.type}</td>
                            <td className="p-2 opacity-85">{row.example}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {related.length > 0 && (
            <div className="gm-surface rounded-2xl p-4">
              <h2
                className="gm-heading text-xs font-bold uppercase tracking-wider"
                style={{ color: 'var(--s-text-muted)' }}
              >
                Peta Terkait Lainnya
              </h2>
              <div className="mt-2.5 space-y-2">
                {related.map((rel) => (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => navigate('preview', { slug: rel.slug })}
                    className="gm-press gm-focus flex w-full flex-col rounded-xl border p-2.5 text-left cursor-pointer"
                    style={{
                      borderColor: 'var(--s-border-subtle)',
                      backgroundColor: 'var(--s-bg-surface-muted)',
                    }}
                  >
                    <span className="text-xs font-bold">{rel.title}</span>
                    <span
                      className="mt-0.5 text-[11px]"
                      style={{ color: 'var(--s-text-muted)' }}
                    >
                      Skala {rel.scale} · {rel.region}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
};
