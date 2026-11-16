import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useGeoMap } from '../context/GeoMapContext';
import { DEMO_PERSONAS } from '../data/geomapData';

export const AuthModal: React.FC = () => {
  const { authModalOpen, authContextMsg, pendingDownload, closeAuthModal, loginUser } =
    useGeoMap();
  const [email, setEmail] = useState('peneliti@geologi-esdm.go.id');
  const [password, setPassword] = useState('esdm-geospasial-2026');
  const [error, setError] = useState('');

  if (!authModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = email.trim();
    if (!cleaned || !cleaned.includes('@')) {
      setError('Masukkan alamat surel instansi atau pribadi yang valid.');
      return;
    }
    setError('');
    const displayName = cleaned.split('@')[0].replace(/[._-]/g, ' ');
    loginUser({
      name: displayName.replace(/\b\w/g, (c) => c.toUpperCase()),
      email: cleaned,
      role: 'Pengguna Terdaftar',
    });
  };

  return (
    <div
      id="auth-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="gm-modal-scrim fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        className="gm-popover-cb gm-surface w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
        style={{ boxShadow: 'var(--s-hud-specular), 0 24px 48px -12px rgba(15, 23, 42, 0.35)' }}
      >
        {/* Prototipe v3 Crisp Modal Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{
            borderColor: 'var(--s-border-subtle)',
            backgroundColor: 'var(--s-bg-surface-muted)',
          }}
        >
          <div>
            <h2 id="auth-modal-title" className="gm-heading text-sm font-bold">
              Masuk Portal Data Geospasial ESDM
            </h2>
            <p className="gm-micro mt-0.5 text-[11px]" style={{ color: 'var(--s-text-muted)' }}>
              Pratinjau tetap publik; masuk diperlukan untuk unduh GeoPDF/SHP penuh.
            </p>
          </div>

          <button
            type="button"
            onClick={closeAuthModal}
            className="gm-focus gm-press gm-touch-target inline-flex h-8 w-8 items-center justify-center rounded-lg cursor-pointer"
            style={{ color: 'var(--s-text-muted)' }}
            aria-label="Tutup jendela masuk"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5" noValidate>
          {/* 1-Click Role Personas (Prototipe v3 Styling) */}
          <div
            className="space-y-2 rounded-xl border p-3"
            style={{
              backgroundColor: 'var(--s-bg-surface-muted)',
              borderColor: 'var(--s-border-subtle)',
            }}
          >
            <p
              className="text-[11px] font-semibold"
              style={{ color: 'var(--s-text-secondary)' }}
            >
              Pilih Peran Demo Cepat (1 Klik Langsung Masuk):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_PERSONAS.map((persona) => (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() =>
                    loginUser({
                      name: persona.name,
                      email: persona.email,
                      role: persona.role,
                    })
                  }
                  className="gm-focus gm-press rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold cursor-pointer"
                  style={{
                    borderColor: 'var(--s-border-strong)',
                    backgroundColor: 'var(--s-bg-surface)',
                  }}
                >
                  {persona.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-email"
              className="mb-1.5 block text-xs font-semibold"
            >
              Alamat Surel Resmi / Pribadi
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              enterKeyHint="next"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="gm-focus w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
              style={{
                backgroundColor: 'var(--s-bg-surface)',
                borderColor: 'var(--s-border-strong)',
                color: 'var(--s-text-primary)',
              }}
              placeholder="nama@instansi.go.id"
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="mb-1.5 block text-xs font-semibold"
            >
              Kata Sandi
            </label>
            <input
              id="auth-password"
              type="password"
              enterKeyHint="done"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="gm-focus w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
              style={{
                backgroundColor: 'var(--s-bg-surface)',
                borderColor: 'var(--s-border-strong)',
                color: 'var(--s-text-primary)',
              }}
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-600" role="alert">
              {error}
            </p>
          )}

          {/* Contextual Notice & Pending Download Preservation */}
          <div
            className="rounded-lg p-3 text-[11px]"
            style={{
              backgroundColor: 'var(--s-status-public-bg)',
              color: 'var(--s-status-public-fg)',
            }}
          >
            <p>{authContextMsg}</p>
            {pendingDownload && (
              <p className="mt-1 font-semibold">
                Unduhan tertunda: <strong>{pendingDownload.format}</strong> —{' '}
                {pendingDownload.dataset.title}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={closeAuthModal}
              className="gm-focus gm-press rounded-xl border px-4 py-2.5 text-xs font-semibold cursor-pointer"
              style={{
                borderColor: 'var(--s-border-strong)',
                color: 'var(--s-text-secondary)',
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              className="gm-cta-primary gm-focus px-5 py-2.5 text-xs cursor-pointer"
            >
              {pendingDownload
                ? `Masuk & Lanjutkan Unduh ${pendingDownload.format}`
                : 'Masuk & Lanjutkan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
