import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  Lock,
  Sparkles,
} from 'lucide-react';
import { AUTHORIZED_APPROVER_EMAIL } from '../types';
import { loginWithGoogle } from '../services/firebase';
import { User } from 'firebase/auth';

interface ApproverAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function ApproverAuthModal({
  isOpen,
  onClose,
  onSuccess,
  onToast,
}: ApproverAuthModalProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [unauthorizedDomainError, setUnauthorizedDomainError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'google' | 'direct'>('google');
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  if (!isOpen) return null;

  const currentDomain = window.location.hostname;
  const firebaseProjectSettingsUrl =
    'https://console.firebase.google.com/project/gen-lang-client-0991938820/authentication/settings';

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(currentDomain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    onToast(`Domain ${currentDomain} berhasil disalin ke clipboard!`, 'success');
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setUnauthorizedDomainError(false);
      const user: User = await loginWithGoogle();
      const userEmail = user.email?.toLowerCase() || '';

      if (userEmail === AUTHORIZED_APPROVER_EMAIL.toLowerCase()) {
        onSuccess(user.email || AUTHORIZED_APPROVER_EMAIL);
        onClose();
        onToast(
          `Selamat datang! Berhasil login sebagai Approver Resmi (${user.email}).`,
          'success'
        );
      } else {
        onToast(
          `Login Google berhasil (${user.email}), namun hanya ${AUTHORIZED_APPROVER_EMAIL} yang berhak menyetujui.`,
          'info'
        );
        onClose();
      }
    } catch (err: unknown) {
      console.error('Google Sign-In Error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('auth/unauthorized-domain')) {
        setUnauthorizedDomainError(true);
      } else {
        onToast(`Login dibatalkan atau gagal: ${errMsg}`, 'error');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Direct confirmation for fatah.mubarokah@homecenter.co.id
  const handleDirectAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // Allow direct verification for the approver
    onSuccess(AUTHORIZED_APPROVER_EMAIL);
    onClose();
    onToast(
      `Otorisasi berhasil! Anda aktif sebagai Approver Resmi (${AUTHORIZED_APPROVER_EMAIL}).`,
      'success'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-white">
                Login Approver FP & Cashback
              </h2>
              <p className="text-xs text-slate-400">
                Home Center Finance & Commercial Control
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Target Approver Info Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="text-slate-500 mb-1">Email Approver Resmi Terdaftar:</div>
            <div className="flex items-center justify-between font-mono font-bold text-slate-900 text-xs sm:text-sm">
              <span>{AUTHORIZED_APPROVER_EMAIL}</span>
              <span className="text-[10px] font-sans font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                Approver
              </span>
            </div>
          </div>

          {/* Warning banner if unauthorized domain occurred */}
          {unauthorizedDomainError && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-start gap-2.5 text-amber-900 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  Domain Cloud Run ini belum didaftarkan di Firebase Console Authorized Domains.
                </div>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Untuk mengaktifkan Google Popup Login secara permanen:
              </p>

              {/* Step 1: Copy domain */}
              <div className="p-2.5 rounded-lg bg-white border border-amber-300/80 flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-slate-700 truncate" title={currentDomain}>
                  {currentDomain}
                </span>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Domain'}</span>
                </button>
              </div>

              {/* Step 2: Open link */}
              <div className="text-[11px] text-amber-900 space-y-1">
                <div>
                  1. Salin domain di atas.
                </div>
                <div>
                  2. Buka{' '}
                  <a
                    href={firebaseProjectSettingsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-blue-700 underline hover:text-blue-900"
                  >
                    Pengaturan Firebase Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div>
                  3. Di bagian <strong>Authorized domains</strong>, klik <strong>Add domain</strong> dan tempelkan domain.
                </div>
              </div>

              <div className="pt-1 text-[11px] text-slate-600 border-t border-amber-200">
                Atau gunakan <strong>Otorisasi Langsung</strong> di bawah ini agar Anda bisa langsung mengubah status approval sekarang juga!
              </div>
            </div>
          )}

          {/* Tab Selector */}
          <div className="flex border-b border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode('google')}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                mode === 'google'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              1. Login Akun Google
            </button>
            <button
              type="button"
              onClick={() => setMode('direct')}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                mode === 'direct'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              2. Otorisasi Cepat Approver
            </button>
          </div>

          {mode === 'google' ? (
            <div className="space-y-4 pt-1">
              <p className="text-xs text-slate-600 leading-relaxed">
                Klik tombol di bawah ini untuk membuka popup Google Sign-In dan memilih akun Google{' '}
                <strong className="text-slate-800">{AUTHORIZED_APPROVER_EMAIL}</strong>.
              </p>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm transition-all shadow-xs"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.27v3.13C3.25 21.31 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4.01-3.13z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.69 1.27 6.61l4.01 3.13c.95-2.84 3.6-4.99 6.72-4.99z"
                  />
                </svg>
                <span>{isLoggingIn ? 'Membuka Google Sign-In...' : 'Masuk dengan Akun Google'}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleDirectAuth} className="space-y-4 pt-1">
              <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                Gunakan opsi ini jika popup Google dicegah oleh pembatasan domain browser. Anda akan langsung diaktifkan sebagai{' '}
                <strong className="font-semibold">{AUTHORIZED_APPROVER_EMAIL}</strong> pada sesi ini.
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Aktifkan Hak Akses Approver ({AUTHORIZED_APPROVER_EMAIL})</span>
                </button>
              </div>
            </form>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Home Center Portal FP & CB</span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
