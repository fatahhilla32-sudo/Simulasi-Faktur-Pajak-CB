import { Hash, TrendingDown, ArrowDownRight, Percent, ShoppingBag } from 'lucide-react';
import { SummaryStats } from '../types';
import { formatRupiah, formatPersen } from '../utils/formatters';

interface SummaryCardsProps {
  stats: SummaryStats;
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Total Transaksi */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Transaksi
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <Hash className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {stats.totalTransaksi}
          </span>
          <span className="text-xs text-slate-500">transaksi</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Jumlah dokumen terdaftar
        </p>
      </div>

      {/* 2. Total Sebelum FP+CB */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Trx Sebelum FP+CB
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 truncate" title={formatRupiah(stats.totalNilaiSebelum)}>
          {formatRupiah(stats.totalNilaiSebelum)}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Total omzet bruto kotor
        </p>
      </div>

      {/* 3. Total Sesudah FP+CB */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Trx Sesudah FP+CB
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 truncate" title={formatRupiah(stats.totalNilaiSesudah)}>
          {formatRupiah(stats.totalNilaiSesudah)}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Nilai netto setelah diskon
        </p>
      </div>

      {/* 4. Total Benefit Customer */}
      <div className="bg-white rounded-xl border border-blue-200 bg-gradient-to-br from-white to-blue-50/40 p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex items-center justify-between text-blue-700 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-800">
            Total Benefit Customer
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-blue-700 truncate" title={formatRupiah(stats.totalBenefit)}>
          {formatRupiah(stats.totalBenefit)}
        </div>
        <p className="text-xs text-blue-700/80 mt-2 font-medium">
          Total potongan (FP + CB)
        </p>
      </div>

      {/* 5. Rata-rata % Benefit */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Rata-rata % Benefit
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
            {formatPersen(stats.avgPersenBenefit)}
          </span>
          <span className="text-xs text-slate-500">dari nilai bruto</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Rata-rata porsi diskon
        </p>
      </div>
    </div>
  );
}
