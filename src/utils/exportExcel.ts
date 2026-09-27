import * as XLSX from 'xlsx';
import { Transaction } from '../types';
import { formatTanggalIndo } from './formatters';

export function exportTransactionsToExcel(transactions: Transaction[], filenameSuffix = 'data_fpcb'): void {
  if (!transactions || transactions.length === 0) {
    throw new Error('Tidak ada data transaksi untuk diexport.');
  }

  // Format data for spreadsheet
  const rows = transactions.map((t, idx) => ({
    'No': idx + 1,
    'Tanggal Transaksi': t.tanggal,
    'Tanggal (Format)': formatTanggalIndo(t.tanggal),
    'NIP Sales': t.nipSales,
    'Nama Sales': t.namaSales,
    'Nama PS': t.namaPS || '-',
    'Nama Customer': t.namaCustomer,
    'No. Telp Customer': t.teleponCustomer || '-',
    'Jenis Transaksi': t.jenisTransaksi || 'LUNAS',
    'Status Approval': t.approvalStatus || 'Pending',
    'Disetujui Oleh': t.approvedBy || '-',
    'Nilai Sebelum FP+CB (Rp)': t.nilaiSebelum,
    'Nilai Sesudah FP+CB (Rp)': t.nilaiSesudah,
    'Total Benefit (Rp)': t.totalBenefit,
    '% Benefit': Number(t.persenBenefit.toFixed(2)),
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // Tanggal
    { wch: 18 }, // Tanggal format
    { wch: 14 }, // NIP Sales
    { wch: 22 }, // Nama Sales
    { wch: 22 }, // Nama PS
    { wch: 28 }, // Nama Customer
    { wch: 20 }, // No. Telp Customer
    { wch: 16 }, // Jenis Transaksi
    { wch: 18 }, // Status Approval
    { wch: 32 }, // Disetujui Oleh
    { wch: 24 }, // Nilai Sebelum
    { wch: 24 }, // Nilai Sesudah
    { wch: 22 }, // Total Benefit
    { wch: 14 }, // % Benefit
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data FP dan CB');

  // Generate file name with current date stamp
  const today = new Date().toISOString().slice(0, 10);
  const fileName = `Laporan_Benefit_FP_CB_${filenameSuffix}_${today}.xlsx`;

  // Write and trigger download
  XLSX.writeFile(workbook, fileName);
}
