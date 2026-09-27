import React, { useState } from 'react';
import {
  Plus,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  User,
  Check,
  ChevronDown,
} from 'lucide-react';
import { AUTHORIZED_APPROVER_EMAIL } from '../types';

interface NavbarProps {
  onOpenCreateModal: () => void;
  onResetSeedData: () => void;
  totalRecords: number;
  currentUserEmail: string;
  onUserEmailChange: (newEmail: string) => void;
}

export function Navbar({
  onOpenCreateModal,
  onResetSeedData,
  currentUserEmail,
  onUserEmailChange,
}: NavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isApprover =
    currentUserEmail.trim().toLowerCase() === AUTHORIZED_APPROVER_EMAIL.toLowerCase();

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
              <span className="text-base sm:text-lg font-bold tracking-tight text-white block">
                Monitoring FP & Cashback
              </span>
              <span className="text-xs text-slate-400 hidden sm:block">
                Sistem Pencatatan Potongan Faktur Pajak & Cashback Sales
              </span>
            </div>
          </div>

          {/* Action & Identity Zone */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Account / Approver Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  isApprover
                    ? 'bg-emerald-950/60 border-emerald-600/80 text-emerald-200 hover:bg-emerald-900/60'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title="Ganti akun untuk menguji hak akses persetujuan"
              >
                {isApprover ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <div className="text-left hidden md:block">
                  <div className="leading-tight text-[11px] font-semibold flex items-center gap-1">
                    {isApprover ? 'Approver Resmi' : 'Sales Representative'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                    {currentUserEmail}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-fadeIn text-xs">
                    <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                      <div className="font-semibold text-slate-900">Hak Akses Approval</div>
                      <div className="text-[11px] text-slate-500">
                        Persetujuan FP + CB hanya diizinkan untuk email resmi berikut:
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onUserEmailChange(AUTHORIZED_APPROVER_EMAIL);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                        isApprover ? 'bg-emerald-50 text-emerald-900' : 'hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className="font-semibold flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Approver (Penuh)</span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                          {AUTHORIZED_APPROVER_EMAIL}
                        </div>
                      </div>
                      {isApprover && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onUserEmailChange('sales.field@homecenter.co.id');
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                        !isApprover ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className="font-semibold flex items-center gap-1.5">
                          <User className="w-4 h-4 text-slate-600" />
                          <span>Sales Umum (Read-Only)</span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                          sales.field@homecenter.co.id
                        </div>
                      </div>
                      {!isApprover && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={onResetSeedData}
              title="Muat Ulang Data Sampel Demonstrasi"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Data Sampel</span>
            </button>

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
