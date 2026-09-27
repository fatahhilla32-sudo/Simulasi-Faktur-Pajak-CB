import { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatRupiah, formatCompactRupiah, formatPersen } from '../utils/formatters';
import { BarChart3, TrendingUp, Users, Award } from 'lucide-react';

interface ChartsSectionProps {
  transactions: Transaction[];
}

export function ChartsSection({ transactions }: ChartsSectionProps) {
  const [hoveredSales, setHoveredSales] = useState<string | null>(null);
  const [hoveredCustomer, setHoveredCustomer] = useState<string | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  // 1. Total Benefit per Sales
  const salesData = useMemo(() => {
    const map = new Map<string, { salesName: string; nip: string; totalBenefit: number; count: number }>();

    transactions.forEach((t) => {
      const key = t.namaSales.trim() || t.nipSales.trim() || 'Lainnya';
      const existing = map.get(key) || {
        salesName: key,
        nip: t.nipSales,
        totalBenefit: 0,
        count: 0,
      };
      existing.totalBenefit += t.totalBenefit;
      existing.count += 1;
      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalBenefit - a.totalBenefit);
  }, [transactions]);

  // 2. Top 10 Customer dengan Benefit Terbesar
  const topCustomersData = useMemo(() => {
    const map = new Map<string, { customerName: string; totalBenefit: number; count: number; totalBruto: number }>();

    transactions.forEach((t) => {
      const key = t.namaCustomer.trim() || 'Lainnya';
      const existing = map.get(key) || {
        customerName: key,
        totalBenefit: 0,
        count: 0,
        totalBruto: 0,
      };
      existing.totalBenefit += t.totalBenefit;
      existing.totalBruto += t.nilaiSebelum;
      existing.count += 1;
      map.set(key, existing);
    });

    return Array.from(map.values())
      .sort((a, b) => b.totalBenefit - a.totalBenefit)
      .slice(0, 10);
  }, [transactions]);

  // 3. Tren Total Benefit per Bulan
  const monthlyTrendData = useMemo(() => {
    const map = new Map<string, { monthKey: string; monthLabel: string; totalBenefit: number; count: number }>();

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];

    transactions.forEach((t) => {
      if (!t.tanggal) return;
      const [year, month] = t.tanggal.split('-');
      if (!year || !month) return;
      const monthIdx = parseInt(month, 10) - 1;
      const monthKey = `${year}-${month}`;
      const monthLabel = `${monthNames[monthIdx]} ${year}`;

      const existing = map.get(monthKey) || {
        monthKey,
        monthLabel,
        totalBenefit: 0,
        count: 0,
      };
      existing.totalBenefit += t.totalBenefit;
      existing.count += 1;
      map.set(monthKey, existing);
    });

    // Sort chronologically
    return Array.from(map.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [transactions]);

  // Max calculations for chart scales
  const maxSalesBenefit = useMemo(() => {
    const max = Math.max(...salesData.map((d) => d.totalBenefit), 0);
    return max > 0 ? max : 1;
  }, [salesData]);

  const maxCustomerBenefit = useMemo(() => {
    const max = Math.max(...topCustomersData.map((d) => d.totalBenefit), 0);
    return max > 0 ? max : 1;
  }, [topCustomersData]);

  const maxMonthBenefit = useMemo(() => {
    const max = Math.max(...monthlyTrendData.map((d) => d.totalBenefit), 0);
    return max > 0 ? max : 1;
  }, [monthlyTrendData]);

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Benefit per Sales */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Total Benefit per Sales
              </h3>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {salesData.length} Sales
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Akumulasi potongan diskon FP & CB yang diberikan oleh tiap sales representative
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            {salesData.slice(0, 7).map((item) => {
              const pct = (item.totalBenefit / maxSalesBenefit) * 100;
              const isHovered = hoveredSales === item.salesName;

              return (
                <div
                  key={item.salesName}
                  onMouseEnter={() => setHoveredSales(item.salesName)}
                  onMouseLeave={() => setHoveredSales(null)}
                  className={`group p-2 rounded-lg transition-colors ${
                    isHovered ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-semibold text-slate-800 truncate">
                        {item.salesName}
                      </span>
                      {item.nip && (
                        <span className="text-slate-500 font-mono text-[11px] shrink-0">
                          ({item.nip})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-500">
                        {item.count} trx
                      </span>
                      <span className="font-mono tabular-nums font-bold text-slate-900">
                        {formatRupiah(item.totalBenefit)}
                      </span>
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHovered ? 'bg-blue-600' : 'bg-blue-500/85'
                      }`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Maksimal per sales:</span>
            <span className="font-mono tabular-nums font-medium text-slate-700">
              {formatRupiah(maxSalesBenefit)}
            </span>
          </div>
        </div>

        {/* Chart 2: Tren Total Benefit per Bulan (Line/Area SVG) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Tren Total Benefit per Bulan
              </h3>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {monthlyTrendData.length} Periode
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Perkembangan nilai total potongan FP+CB dari waktu ke waktu
            </p>
          </div>

          {/* SVG Line Chart */}
          {monthlyTrendData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-slate-500">
              Belum ada data periode untuk ditampilkan
            </div>
          ) : (
            <div className="relative pt-2">
              <div className="h-56 w-full">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox={`0 0 500 200`}
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = 180 - ratio * 150;
                    return (
                      <g key={ratio}>
                        <line
                          x1="30"
                          y1={y}
                          x2="480"
                          y2={y}
                          stroke="#E2E8F0"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                      </g>
                    );
                  })}

                  {/* Area & Line */}
                  {(() => {
                    const points = monthlyTrendData.map((d, idx) => {
                      const count = monthlyTrendData.length;
                      const x = count === 1 ? 250 : 40 + (idx / (count - 1)) * 430;
                      const y = 180 - (d.totalBenefit / maxMonthBenefit) * 150;
                      return { x, y, data: d };
                    });

                    const pathLine = points
                      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                      .join(' ');

                    const pathArea = `${pathLine} L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z`;

                    return (
                      <>
                        <path d={pathArea} fill="url(#trendGradient)" />
                        <path
                          d={pathLine}
                          fill="none"
                          stroke="#2563EB"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Interactive Data Dots */}
                        {points.map((p, idx) => {
                          const isHovered = hoveredMonth === p.data.monthKey;
                          return (
                            <g
                              key={idx}
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredMonth(p.data.monthKey)}
                              onMouseLeave={() => setHoveredMonth(null)}
                            >
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r={isHovered ? 6 : 4}
                                fill={isHovered ? '#1D4ED8' : '#FFFFFF'}
                                stroke="#2563EB"
                                strokeWidth={isHovered ? 3 : 2}
                                className="transition-all duration-150"
                              />
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* X-Axis labels */}
              <div className="flex justify-between items-center px-4 mt-2 text-[11px] text-slate-500 font-medium">
                {monthlyTrendData.map((d) => (
                  <span
                    key={d.monthKey}
                    className={`transition-colors ${
                      hoveredMonth === d.monthKey ? 'text-blue-600 font-bold' : ''
                    }`}
                  >
                    {d.monthLabel}
                  </span>
                ))}
              </div>

              {/* Hover Details Card */}
              <div className="h-8 mt-2 flex items-center justify-between text-xs px-2 bg-slate-50 rounded-md border border-slate-200/80">
                {hoveredMonth ? (
                  (() => {
                    const item = monthlyTrendData.find((d) => d.monthKey === hoveredMonth);
                    if (!item) return null;
                    return (
                      <>
                        <span className="font-semibold text-slate-800">
                          {item.monthLabel}:
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">{item.count} transaksi</span>
                          <span className="font-mono tabular-nums font-bold text-blue-600">
                            {formatRupiah(item.totalBenefit)}
                          </span>
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <span className="text-slate-500 italic text-[11px]">
                    Arahkan kursor ke titik grafik untuk melihat rincian bulan
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Puncak benefit per bulan:</span>
            <span className="font-mono tabular-nums font-medium text-slate-700">
              {formatRupiah(maxMonthBenefit)}
            </span>
          </div>
        </div>
      </div>

      {/* Chart 3: Top 10 Customer dengan Benefit Terbesar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              Top 10 Customer dengan Benefit Terbesar
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar customer penerima potongan diskon FP + Cashback tertinggi
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            Menampilkan {topCustomersData.length} customer
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {topCustomersData.map((item, idx) => {
            const pct = (item.totalBenefit / maxCustomerBenefit) * 100;
            const isHovered = hoveredCustomer === item.customerName;

            return (
              <div
                key={item.customerName}
                onMouseEnter={() => setHoveredCustomer(item.customerName)}
                onMouseLeave={() => setHoveredCustomer(null)}
                className={`p-3 rounded-lg border transition-all ${
                  isHovered
                    ? 'border-blue-300 bg-blue-50/40 shadow-xs'
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 truncate" title={item.customerName}>
                      {item.customerName}
                    </span>
                  </div>
                  <span className="text-xs font-mono tabular-nums font-bold text-blue-700 shrink-0">
                    {formatRupiah(item.totalBenefit)}
                  </span>
                </div>

                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                    style={{ width: `${Math.max(pct, 3)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{item.count} kali transaksi</span>
                  <span>
                    Total Bruto: <span className="font-mono tabular-nums">{formatCompactRupiah(item.totalBruto)}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
