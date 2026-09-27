import React, { useState } from 'react';
import {
  Search,
  RotateCcw,
  Edit2,
  Trash2,
  Maximize2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  ShieldCheck,
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
} from 'lucide-react';
import {
  Transaction,
  FilterState,
  SortState,
  SortField,
  ApprovalStatus,
  AUTHORIZED_APPROVER_EMAIL,
} from '../types';
import {
  formatRupiah,
  formatPersen,
  formatTanggalIndo,
} from '../utils/formatters';

interface TransactionTableProps {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  onEdit: (item: Transaction) => void;
  onDeleteRequest: (item: Transaction) => void;
  onPreviewPhoto: (item: Transaction) => void;
  onExportExcel: () => void;
  currentUserEmail: string;
  onApprovalChange: (id: string, status: ApprovalStatus) => Promise<void>;
  onOpenCreateModal: () => void;
}

export function TransactionTable({
  transactions,
  filteredTransactions,
  filters,
  onFilterChange,
  onResetFilters,
  onEdit,
  onDeleteRequest,
  onPreviewPhoto,
  onExportExcel,
  currentUserEmail,
  onApprovalChange,
  onOpenCreateModal,
}: TransactionTableProps) {
  const isApprover =
    currentUserEmail.trim().toLowerCase() === AUTHORIZED_APPROVER_EMAIL.toLowerCase();

  // Sorting state
  const [sortState, setSortState] = useState<SortState>({
    field: 'tanggal',
    order: 'desc',
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Distinct sales list for filter dropdown
  const salesOptions = React.useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.namaSales?.trim()) set.add(t.namaSales.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [transactions]);

  // Handle Sort
  const handleSort = (field: SortField) => {
    setSortState((prev) => {
      if (prev.field === field) {
        return {
          field,
          order: prev.order === 'asc' ? 'desc' : 'asc',
        };
      }
      return { field, order: 'desc' };
    });
    setCurrentPage(1);
  };

  // Sorted data
  const sortedData = React.useMemo(() => {
    const list = [...filteredTransactions];
    const { field, order } = sortState;

    list.sort((a, b) => {
      let valA: string | number = a[field] ?? '';
      let valB: string | number = b[field] ?? '';

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
        return order === 'asc'
          ? (valA as string).localeCompare(valB as string)
          : (valB as string).localeCompare(valA as string);
      }

      return order === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return list;
  }, [filteredTransactions, sortState]);

  // Pagination slice
  const totalPages = Math.max(Math.ceil(sortedData.length / pageSize), 1);
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Quick Date Presets
  const applyDatePreset = (preset: 'all' | 'this_month' | 'last_30_days') => {
    const now = new Date();
    if (preset === 'all') {
      onFilterChange({ ...filters, startDate: '', endDate: '' });
    } else if (preset === 'this_month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const firstDay = `${year}-${month}-01`;
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      const end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      onFilterChange({ ...filters, startDate: firstDay, endDate: end });
    } else if (preset === 'last_30_days') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const start = past.toISOString().slice(0, 10);
      const end = now.toISOString().slice(0, 10);
      onFilterChange({ ...filters, startDate: start, endDate: end });
    }
    setCurrentPage(1);
  };

  const isFilterActive =
    Boolean(filters.search) ||
    Boolean(filters.namaSales) ||
    Boolean(filters.jenisTransaksi) ||
    Boolean(filters.approvalStatus) ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate);

  const renderSortIndicator = (field: SortField) => {
    if (sortState.field !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />;
    }
    return sortState.order === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
    );
  };

  const handleStatusChangeInternal = async (id: string, newStatus: ApprovalStatus) => {
    try {
      setUpdatingId(id);
      await onApprovalChange(id, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Toolbar & Filters */}
      <div className="p-4 sm:p-5 border-b border-slate-200 space-y-4">
        {/* Header Title + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Data Transaksi & Pemotongan Benefit
              </h2>
              {isApprover ? (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Mode Akses Approver Aktif
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Mode Sales (Approval Read-Only)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan {filteredTransactions.length} dari total {transactions.length} transaksi tercatat secara live
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportExcel}
              disabled={filteredTransactions.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Export ke Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar: Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-1">
          {/* Search Box */}
          <div className="lg:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari NIP, Sales, PS, Customer, No Telp..."
              value={filters.search}
              onChange={(e) => {
                onFilterChange({ ...filters, search: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
            />
          </div>

          {/* Sales Dropdown */}
          <div className="lg:col-span-3">
            <select
              value={filters.namaSales}
              onChange={(e) => {
                onFilterChange({ ...filters, namaSales: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors text-slate-700"
            >
              <option value="">Semua Sales Representative</option>
              {salesOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Dropdown 1: Jenis Transaksi (DP / LUNAS) */}
          <div className="lg:col-span-2">
            <select
              value={filters.jenisTransaksi}
              onChange={(e) => {
                onFilterChange({ ...filters, jenisTransaksi: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium transition-colors text-slate-700"
            >
              <option value="">Semua Jenis (DP/LUNAS)</option>
              <option value="DP">DP (Down Payment)</option>
              <option value="LUNAS">LUNAS</option>
            </select>
          </div>

          {/* Filter Dropdown 2: Status Approval (Approved / Not Approved) */}
          <div className="lg:col-span-3">
            <select
              value={filters.approvalStatus}
              onChange={(e) => {
                onFilterChange({ ...filters, approvalStatus: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium transition-colors text-slate-700"
            >
              <option value="">Semua Status Approval</option>
              <option value="Approved">Approved (Disetujui)</option>
              <option value="Not Approved">Not Approved (Ditolak)</option>
              <option value="Pending">Menunggu Approval (Pending)</option>
            </select>
          </div>
        </div>

        {/* Filter Controls Bar: Row 2 (Date & Presets) */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium shrink-0">Rentang Tanggal:</span>
              <input
                type="date"
                title="Dari Tanggal"
                value={filters.startDate}
                onChange={(e) => {
                  onFilterChange({ ...filters, startDate: e.target.value });
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono transition-colors"
              />
              <span className="text-xs text-slate-400">s/d</span>
              <input
                type="date"
                title="Sampai Tanggal"
                value={filters.endDate}
                onChange={(e) => {
                  onFilterChange({ ...filters, endDate: e.target.value });
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono transition-colors"
              />
            </div>

            {/* Quick date presets */}
            <div className="flex items-center gap-1 pl-2">
              <button
                type="button"
                onClick={() => applyDatePreset('all')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  !filters.startDate && !filters.endDate
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('this_month')}
                className="px-2 py-1 rounded text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('last_30_days')}
                className="px-2 py-1 rounded text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                30 Hari
              </button>
            </div>
          </div>

          {/* Reset button if active */}
          {isFilterActive && (
            <button
              onClick={onResetFilters}
              title="Reset Semua Filter"
              className="py-1.5 px-3 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 self-start lg:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold select-none">
              <th className="py-3 px-3 text-center w-12">No</th>

              <th
                onClick={() => handleSort('tanggal')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Tanggal</span>
                  {renderSortIndicator('tanggal')}
                </div>
              </th>

              <th
                onClick={() => handleSort('nipSales')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>NIP Sales</span>
                  {renderSortIndicator('nipSales')}
                </div>
              </th>

              <th
                onClick={() => handleSort('namaSales')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Nama Sales</span>
                  {renderSortIndicator('namaSales')}
                </div>
              </th>

              {/* Column: Nama PS */}
              <th
                onClick={() => handleSort('namaPS')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Nama PS</span>
                  {renderSortIndicator('namaPS')}
                </div>
              </th>

              <th
                onClick={() => handleSort('namaCustomer')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Nama Customer</span>
                  {renderSortIndicator('namaCustomer')}
                </div>
              </th>

              {/* Column: Nomor Telepon Customer */}
              <th
                onClick={() => handleSort('teleponCustomer')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>No. Telp Customer</span>
                  {renderSortIndicator('teleponCustomer')}
                </div>
              </th>

              {/* Column: Jenis Transaksi (DP / LUNAS) */}
              <th
                onClick={() => handleSort('jenisTransaksi')}
                className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Jenis</span>
                  {renderSortIndicator('jenisTransaksi')}
                </div>
              </th>

              {/* Column: Status Approval */}
              <th
                onClick={() => handleSort('approvalStatus')}
                className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Status Approval</span>
                  {renderSortIndicator('approvalStatus')}
                </div>
              </th>

              <th
                onClick={() => handleSort('nilaiSebelum')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Value Sebelum</span>
                  {renderSortIndicator('nilaiSebelum')}
                </div>
              </th>

              <th
                onClick={() => handleSort('nilaiSesudah')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Value Sesudah</span>
                  {renderSortIndicator('nilaiSesudah')}
                </div>
              </th>

              <th
                onClick={() => handleSort('totalBenefit')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Total Benefit</span>
                  {renderSortIndicator('totalBenefit')}
                </div>
              </th>

              <th
                onClick={() => handleSort('persenBenefit')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>% Benefit</span>
                  {renderSortIndicator('persenBenefit')}
                </div>
              </th>

              <th className="py-3 px-3 text-center whitespace-nowrap">Foto Bukti</th>

              <th className="py-3 px-3 text-center whitespace-nowrap w-24">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={15} className="py-12 text-center text-slate-500">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <Search className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">
                      Tidak Ada Data Transaksi
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4 text-center">
                      {isFilterActive
                        ? 'Tidak ditemukan data yang sesuai dengan filter pencarian Anda.'
                        : 'Belum ada transaksi FP & Cashback yang dicatat. Siapapun dapat menginput data transaksi.'}
                    </p>
                    {isFilterActive ? (
                      <button
                        onClick={onResetFilters}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 rounded-lg transition-colors"
                      >
                        Reset Filter
                      </button>
                    ) : (
                      <button
                        onClick={onOpenCreateModal}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-xs"
                      >
                        <span>Input Transaksi Pertama</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => {
                const globalIndex = (currentPage - 1) * pageSize + index + 1;
                const isDP = item.jenisTransaksi === 'DP';
                const isApproved = item.approvalStatus === 'Approved';
                const isNotApproved = item.approvalStatus === 'Not Approved';

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* No */}
                    <td className="py-3.5 px-3 text-center font-mono text-slate-500">
                      {globalIndex}
                    </td>

                    {/* Tanggal */}
                    <td className="py-3.5 px-3 whitespace-nowrap font-mono text-slate-800">
                      {formatTanggalIndo(item.tanggal, { short: true })}
                    </td>

                    {/* NIP Sales */}
                    <td className="py-3.5 px-3 whitespace-nowrap font-mono text-slate-600 font-medium">
                      {item.nipSales}
                    </td>

                    {/* Nama Sales */}
                    <td className="py-3.5 px-3 whitespace-nowrap font-semibold text-slate-900">
                      {item.namaSales}
                    </td>

                    {/* Nama PS */}
                    <td className="py-3.5 px-3 whitespace-nowrap font-medium text-slate-700">
                      {item.namaPS ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-medium text-[11px]">
                          {item.namaPS}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Nama Customer */}
                    <td className="py-3.5 px-3 text-slate-800 font-medium max-w-[180px] truncate" title={item.namaCustomer}>
                      {item.namaCustomer}
                    </td>

                    {/* No. Telepon Customer */}
                    <td className="py-3.5 px-3 whitespace-nowrap font-mono text-slate-700">
                      {item.teleponCustomer ? (
                        <a
                          href={`https://wa.me/${item.teleponCustomer.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                          title="Hubungi via WhatsApp / Telepon"
                        >
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{item.teleponCustomer}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Jenis (DP / LUNAS) */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block font-mono text-[11px] font-bold px-2.5 py-0.5 rounded ${
                          isDP
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {item.jenisTransaksi || 'LUNAS'}
                      </span>
                    </td>

                    {/* Status Approval */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {isApprover ? (
                        /* Interactive Dropdown for authorized approver (fatah.mubarokah@homecenter.co.id) */
                        <div className="inline-flex items-center">
                          <select
                            value={item.approvalStatus || 'Pending'}
                            disabled={updatingId === item.id}
                            onChange={(e) =>
                              handleStatusChangeInternal(item.id, e.target.value as ApprovalStatus)
                            }
                            className={`text-xs font-semibold rounded-md px-2 py-1 border transition-colors cursor-pointer ${
                              isApproved
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-emerald-500'
                                : isNotApproved
                                ? 'bg-rose-50 text-rose-800 border-rose-300 focus:ring-rose-500'
                                : 'bg-amber-50 text-amber-800 border-amber-300 focus:ring-amber-500'
                            }`}
                            title={`Ubah status approval (Approver: ${AUTHORIZED_APPROVER_EMAIL})`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Not Approved">Not Approved</option>
                          </select>
                        </div>
                      ) : (
                        /* Read-only view for standard users */
                        <div
                          className="inline-flex items-center gap-1.5 cursor-not-allowed"
                          title={`Hanya dapat diakses oleh ${AUTHORIZED_APPROVER_EMAIL}`}
                        >
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                              isApproved
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isNotApproved
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {isNotApproved && <XCircle className="w-3 h-3 text-rose-600" />}
                            {!isApproved && !isNotApproved && <Clock className="w-3 h-3 text-slate-500" />}
                            <span>{item.approvalStatus || 'Pending'}</span>
                          </span>
                          <Lock className="w-3 h-3 text-slate-400" />
                        </div>
                      )}
                    </td>

                    {/* Nilai Sebelum */}
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-700">
                      {formatRupiah(item.nilaiSebelum)}
                    </td>

                    {/* Nilai Sesudah */}
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-700">
                      {formatRupiah(item.nilaiSesudah)}
                    </td>

                    {/* Total Benefit */}
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums font-bold text-blue-700 bg-blue-50/30">
                      {formatRupiah(item.totalBenefit)}
                    </td>

                    {/* % Benefit */}
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums font-semibold text-emerald-700">
                      {formatPersen(item.persenBenefit)}
                    </td>

                    {/* Thumbnail Foto */}
                    <td className="py-3.5 px-3 text-center">
                      {item.fotoData ? (
                        <button
                          onClick={() => onPreviewPhoto(item)}
                          title="Klik untuk melihat foto bukti ukuran penuh"
                          className="relative group/thumb inline-block rounded-md overflow-hidden border border-slate-300 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        >
                          <img
                            src={item.fotoData}
                            alt="Bukti FP CB"
                            className="w-10 h-10 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Maximize2 className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEdit(item)}
                          title="Edit Transaksi"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          aria-label={`Edit transaksi ${item.namaCustomer}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteRequest(item)}
                          title="Hapus Transaksi"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          aria-label={`Hapus transaksi ${item.namaCustomer}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span>Tampilkan</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 bg-white border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>baris per halaman</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono tabular-nums text-slate-600">
            Halaman {currentPage} dari {totalPages}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1}
              className="px-2.5 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
