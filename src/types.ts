export type JenisTransaksi = 'DP' | 'LUNAS';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Not Approved';

export const AUTHORIZED_APPROVER_EMAIL = 'fatah.mubarokah@homecenter.co.id';

export interface Transaction {
  id: string;
  tanggal: string; // YYYY-MM-DD
  nipSales: string;
  namaSales: string;
  namaPS: string; // Nama PS (Project Sales / Product Specialist)
  namaCustomer: string;
  teleponCustomer: string; // No. Telepon / WhatsApp Customer
  jenisTransaksi: JenisTransaksi; // 'DP' | 'LUNAS'
  approvalStatus: ApprovalStatus; // 'Approved' | 'Not Approved' | 'Pending'
  approvedBy?: string;
  approvedAt?: number;
  nilaiSebelum: number;
  nilaiSesudah: number;
  totalBenefit: number;
  persenBenefit: number;
  fotoData: string; // base64 Data URL
  fotoFileName: string;
  fotoFileSize: number; // in bytes
  keterangan?: string;
  createdAt: number;
  updatedAt: number;
}

export type TransactionFormData = Omit<Transaction, 'id' | 'totalBenefit' | 'persenBenefit' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

export interface FilterState {
  search: string;
  namaSales: string;
  startDate: string;
  endDate: string;
  jenisTransaksi: string; // '' | 'DP' | 'LUNAS'
  approvalStatus: string; // '' | 'Approved' | 'Not Approved' | 'Pending'
}

export type SortField =
  | 'tanggal'
  | 'nipSales'
  | 'namaSales'
  | 'namaPS'
  | 'namaCustomer'
  | 'teleponCustomer'
  | 'jenisTransaksi'
  | 'approvalStatus'
  | 'nilaiSebelum'
  | 'nilaiSesudah'
  | 'totalBenefit'
  | 'persenBenefit'
  | 'createdAt';

export interface SortState {
  field: SortField;
  order: 'asc' | 'desc';
}

export interface SummaryStats {
  totalTransaksi: number;
  totalNilaiSebelum: number;
  totalNilaiSesudah: number;
  totalBenefit: number;
  avgPersenBenefit: number;
  totalApproved?: number;
  totalNotApproved?: number;
  totalPending?: number;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
