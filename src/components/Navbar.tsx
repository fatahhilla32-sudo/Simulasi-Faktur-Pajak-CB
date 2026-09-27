import { useState } from 'react';
import {
  Plus,
  ReceiptText,
  ShieldCheck,
  User,
  LogOut,
  LogIn,
  Trash2,
  X,
  AlertCircle,
} from 'lucide-react';
import { AUTHORIZED_APPROVER_EMAIL } from '../types';

interface NavbarProps {
  onOpenCreateModal: () => void;
  onClearAllData: () => void;
  totalRecords: number;
  currentUserEmail: string;
  onUserEmailChange: (newEmail: string) => void;
}

export function Navbar({
  onOpenCreateModal,
  onClearAllData,
  totalRecords,
  currentUserEmail,
  onUserEmailChange,
}: NavbarProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [inputEmail, setInputEmail] = useState(AUTHORIZED_APPROVER_EMAIL);
  const [loginError, setLoginError] = useState('');

  const isApprover =
    currentUserEmail.trim().toLowerCase() === AUTHORIZED_APPROVER_EMAIL.toLowerCase();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = inputEmail.trim().toLowerCase();
    if (cleanEmail !== AUTHORIZED_APPROVER_EMAIL.toLowerCase()) {
      setLoginError(`Hanya email ${AUTHORIZED_APPROVER_EMAIL} yang berhak sebagai Approver.`);
      return;
    }
    setLoginError('');
    onUserEmailChange(AUTHORIZED_APPROVER_EMAIL);
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    onUserEmailChange('user.umum@homecenter.co.id');
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Zone */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                <ReceiptText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold tracking-tight text-white block">
                  Monitoring FP & Cashback
                </span>
                <span className="text-xs text-slate-400 hidden sm:block">
                  Sistem Pencatatan Potongan Faktur Pajak & Cashback Sales
                </span>
              </div>
            </div>

            {/* Action Zone */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Approver Status / Login Toggle */}
              {isApprover ? (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-600/80 text-emerald-300 text-xs font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-emerald-400 leading-none">Akses Approver Aktif</div>
                      <div className="font-mono text-[11px] leading-tight text-white">
                        {AUTHORIZED_APPROVER_EMAIL}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                    title="Beralih ke mode User Umum (non-approver)"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden md:inline">Mode Umum</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setInputEmail(AUTHORIZED_APPROVER_EMAIL);
                    setLoginError('');
                    setIsLoginModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                  title="Masuk sebagai Approver FP & CB"
                >
                  <LogIn className="w-3.5 h-3.5 text-blue-400" />
                  <span>Login Approver</span>
                </button>
              )}

              {/* Clear data button if there are records */}
              {totalRecords > 0 && (
                <button
                  onClick={onClearAllData}
                  title="Hapus semua data transaksi yang tersimpan"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline text-[11px]">Kosongkan Data</span>
                </button>
              )}

              {/* Input Data Baru - Can be clicked by anyone (user umum) */}
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

      {/* Modal Login Approver */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">Otorisasi Hak Akses Approver</h3>
              </div>
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Penginputan data dapat dilakukan oleh user siapapun. Namun untuk memberikan status{' '}
                <strong className="text-emerald-700 font-semibold">Approved</strong> atau{' '}
                <strong className="text-rose-700 font-semibold">Not Approved</strong>, sistem
                hanya mengizinkan email resmi berikut:
              </p>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 flex items-center justify-between">
                <span>{AUTHORIZED_APPROVER_EMAIL}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-sans font-bold">
                  Resmi
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Konfirmasi Email Approver
                </label>
                <input
                  type="email"
                  value={inputEmail}
                  onChange={(e) => {
                    setInputEmail(e.target.value);
                    setLoginError('');
                  }}
                  required
                  placeholder="Masukkan email approver..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                />
              </div>

              {loginError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
                >
                  Masuk Sebagai Approver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
