import React, { useState } from 'react';
import {
  Plus,
  ReceiptText,
  ShieldCheck,
  LogOut,
  LogIn,
  AlertCircle,
  Radio,
  User as UserIcon,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AUTHORIZED_APPROVER_EMAIL } from '../types';
import { loginWithGoogle, logoutUser, isAuthorizedApprover } from '../services/firebase';

interface NavbarProps {
  onOpenCreateModal: () => void;
  currentUser: User | null;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  totalRecords: number;
}

export function Navbar({
  onOpenCreateModal,
  currentUser,
  onToast,
}: NavbarProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const isApprover = isAuthorizedApprover(currentUser?.email);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      const user = await loginWithGoogle();
      const userEmail = user.email?.toLowerCase() || '';

      if (userEmail === AUTHORIZED_APPROVER_EMAIL.toLowerCase()) {
        onToast(
          `Selamat datang, Approver! Login berhasil dengan ${user.email}. Hak akses persetujuan aktif.`,
          'success'
        );
      } else {
        onToast(
          `Login Google berhasil dengan ${user.email}. Namun hanya akun ${AUTHORIZED_APPROVER_EMAIL} yang berhak menyetujui transaksi. Anda tetap dapat menginput transaksi sebagai user umum.`,
          'info'
        );
      }
    } catch (err: unknown) {
      console.error('Google Sign-In Error:', err);
      const message = err instanceof Error ? err.message : 'Gagal login dengan Google.';
      onToast(`Login dibatalkan atau gagal: ${message}`, 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      onToast('Anda telah logout. Mode user umum aktif.', 'info');
    } catch (err) {
      console.error(err);
      onToast('Gagal logout.', 'error');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Zone */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-white block">
                  Monitoring FP & Cashback
                </span>
                {/* Live Realtime Badge */}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Realtime
                </span>
              </div>
              <span className="text-xs text-slate-400 hidden sm:block">
                Sinkronisasi Langsung Cloud Firestore · Home Center
              </span>
            </div>
          </div>

          {/* Action Zone */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Google Approver Account Section */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                {isApprover ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="text-left hidden md:block">
                      <div className="text-[10px] font-bold text-emerald-300 uppercase leading-none">
                        Approver Resmi
                      </div>
                      <div className="font-mono text-[11px] leading-tight text-white">
                        {currentUser.email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs">
                    <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="text-left hidden md:block">
                      <div className="text-[10px] text-slate-400 leading-none">User Umum</div>
                      <div className="font-mono text-[11px] text-slate-300">
                        {currentUser.email}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                  title="Logout Akun Google"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                title={`Login dengan akun Google ${AUTHORIZED_APPROVER_EMAIL}`}
              >
                {/* Google Icon SVG */}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                <span>{isLoggingIn ? 'Menghubungkan...' : 'Login Approver (Google)'}</span>
              </button>
            )}

            {/* Input Data Baru - Anyone can input */}
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Input Data Baru</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
