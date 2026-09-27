import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Transaction,
  TransactionFormData,
  FilterState,
  SummaryStats,
  Toast,
  ApprovalStatus,
  AUTHORIZED_APPROVER_EMAIL,
} from './types';
import {
  subscribeToTransactions,
  saveLiveTransaction,
  deleteLiveTransaction,
  updateLiveTransactionApproval,
  auth,
  isAuthorizedApprover,
} from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { SummaryCards } from './components/SummaryCards';
import { TransactionTable } from './components/TransactionTable';
import { TransactionModalForm } from './components/TransactionModalForm';
import { PhotoLightboxModal } from './components/PhotoLightboxModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ToastNotification } from './components/ToastNotification';
import { exportTransactionsToExcel } from './utils/exportExcel';
import { Plus, Radio } from 'lucide-react';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Modals & Active items
  const [isModalFormOpen, setIsModalFormOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [previewingTransaction, setPreviewingTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Filters including Jenis Transaksi and Approval Status
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    namaSales: '',
    startDate: '',
    endDate: '',
    jenisTransaksi: '',
    approvalStatus: '',
  });

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 1. Listen for Google Auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Realtime Live Subscription to Firestore
  useEffect(() => {
    setIsLoading(true);
    const unsubscribeLive = subscribeToTransactions(
      (liveItems) => {
        setTransactions(liveItems);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error connecting to live Firestore:', error);
        addToast('Gagal menghubungkan ke database live Firestore.', 'error');
        setIsLoading(false);
      }
    );

    return () => unsubscribeLive();
  }, [addToast]);

  // Dynamic Sales directory for auto-filling Nama Sales when NIP is typed
  const salesDirectory = useMemo(() => {
    const dir: Record<string, string> = {};
    transactions.forEach((item) => {
      if (item.nipSales?.trim() && item.namaSales?.trim()) {
        dir[item.nipSales.trim()] = item.namaSales.trim();
      }
    });
    return dir;
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Search text (NIP, Sales, Customer)
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const nipMatch = t.nipSales.toLowerCase().includes(query);
        const salesMatch = t.namaSales.toLowerCase().includes(query);
        const customerMatch = t.namaCustomer.toLowerCase().includes(query);
        if (!nipMatch && !salesMatch && !customerMatch) {
          return false;
        }
      }

      // 2. Sales Filter
      if (filters.namaSales && t.namaSales.trim() !== filters.namaSales.trim()) {
        return false;
      }

      // 3. Jenis Transaksi Filter (DP / LUNAS)
      if (filters.jenisTransaksi && t.jenisTransaksi !== filters.jenisTransaksi) {
        return false;
      }

      // 4. Approval Status Filter (Approved / Not Approved / Pending)
      if (filters.approvalStatus && t.approvalStatus !== filters.approvalStatus) {
        return false;
      }

      // 5. Date range
      if (filters.startDate && t.tanggal < filters.startDate) {
        return false;
      }
      if (filters.endDate && t.tanggal > filters.endDate) {
        return false;
      }

      return true;
    });
  }, [transactions, filters]);

  // Dynamic summary statistics computed strictly from filtered data
  const summaryStats: SummaryStats = useMemo(() => {
    const count = filteredTransactions.length;
    let sumSebelum = 0;
    let sumSesudah = 0;
    let sumBenefit = 0;
    let approved = 0;
    let notApproved = 0;
    let pending = 0;

    filteredTransactions.forEach((t) => {
      sumSebelum += t.nilaiSebelum;
      sumSesudah += t.nilaiSesudah;
      sumBenefit += t.totalBenefit;
      if (t.approvalStatus === 'Approved') approved++;
      else if (t.approvalStatus === 'Not Approved') notApproved++;
      else pending++;
    });

    const avgPersen = sumSebelum > 0 ? (sumBenefit / sumSebelum) * 100 : 0;

    return {
      totalTransaksi: count,
      totalNilaiSebelum: sumSebelum,
      totalNilaiSesudah: sumSesudah,
      totalBenefit: sumBenefit,
      avgPersenBenefit: avgPersen,
      totalApproved: approved,
      totalNotApproved: notApproved,
      totalPending: pending,
    };
  }, [filteredTransactions]);

  // Form Submit - CAN BE DONE BY ANYONE (SALES / USER UMUM)
  const handleSaveTransaction = async (formData: TransactionFormData) => {
    const totalBenefit = formData.nilaiSebelum - formData.nilaiSesudah;
    const persenBenefit = formData.nilaiSebelum > 0 ? (totalBenefit / formData.nilaiSebelum) * 100 : 0;
    const now = Date.now();

    const isApprover = isAuthorizedApprover(currentUser?.email);
    const isEdit = Boolean(formData.id);

    const itemToSave: Transaction = {
      id: formData.id || `trx-${now}-${Math.random().toString(36).substring(2, 7)}`,
      tanggal: formData.tanggal,
      nipSales: formData.nipSales,
      namaSales: formData.namaSales,
      namaCustomer: formData.namaCustomer,
      jenisTransaksi: formData.jenisTransaksi || 'LUNAS',
      // If creator is approver, use selected status. If normal user, defaults to 'Pending'
      approvalStatus: isApprover
        ? formData.approvalStatus || 'Pending'
        : isEdit && editingTransaction
        ? editingTransaction.approvalStatus
        : 'Pending',
      approvedBy:
        isApprover && formData.approvalStatus && formData.approvalStatus !== 'Pending'
          ? currentUser?.email || AUTHORIZED_APPROVER_EMAIL
          : editingTransaction?.approvedBy,
      approvedAt:
        isApprover && formData.approvalStatus && formData.approvalStatus !== 'Pending'
          ? now
          : editingTransaction?.approvedAt,
      nilaiSebelum: formData.nilaiSebelum,
      nilaiSesudah: formData.nilaiSesudah,
      totalBenefit,
      persenBenefit,
      fotoData: formData.fotoData,
      fotoFileName: formData.fotoFileName,
      fotoFileSize: formData.fotoFileSize,
      keterangan: formData.keterangan,
      createdAt: isEdit && editingTransaction ? editingTransaction.createdAt : now,
      updatedAt: now,
    };

    try {
      await saveLiveTransaction(itemToSave);
      addToast(
        isEdit
          ? `Transaksi ${itemToSave.namaCustomer} berhasil diperbarui secara live.`
          : `Transaksi baru untuk ${itemToSave.namaCustomer} (${itemToSave.jenisTransaksi}) berhasil dikirim live!`,
        'success'
      );
    } catch (err: unknown) {
      console.error('Error saving live transaction:', err);
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan transaksi live.';
      addToast(`Error simpan: ${msg}`, 'error');
      throw err;
    }
  };

  // Immediate approval change handler - STRICTLY RESTRICTED TO fatah.mubarokah@homecenter.co.id
  const handleApprovalChange = async (id: string, newStatus: ApprovalStatus) => {
    if (!isAuthorizedApprover(currentUser?.email)) {
      addToast(
        `Akses ditolak! Anda harus login menggunakan akun Google resmi: ${AUTHORIZED_APPROVER_EMAIL}`,
        'error'
      );
      return;
    }

    try {
      await updateLiveTransactionApproval(id, newStatus, currentUser?.email || AUTHORIZED_APPROVER_EMAIL);
      addToast(`Status approval berhasil diubah menjadi: ${newStatus} secara live`, 'success');
    } catch (err: unknown) {
      console.error('Error updating live approval:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui status approval.';
      addToast(`Error update approval: ${msg}`, 'error');
    }
  };

  // Delete Action
  const handleConfirmDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await deleteLiveTransaction(id);
      setDeletingTransaction(null);
      addToast('Data transaksi berhasil dihapus dari cloud Firestore.', 'info');
    } catch (err) {
      console.error(err);
      addToast('Gagal menghapus data transaksi.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      if (filteredTransactions.length === 0) {
        addToast('Tidak ada data transaksi untuk diexport.', 'error');
        return;
      }
      exportTransactionsToExcel(filteredTransactions);
      addToast(
        `Berhasil mengexport ${filteredTransactions.length} transaksi ke file Excel (.xlsx)!`,
        'success'
      );
    } catch (err) {
      console.error(err);
      addToast('Gagal mengexport data ke Excel.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation Header */}
      <Navbar
        onOpenCreateModal={() => {
          setEditingTransaction(null);
          setIsModalFormOpen(true);
        }}
        currentUser={currentUser}
        onToast={addToast}
        totalRecords={transactions.length}
      />

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Page Hero Title & Info */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
              <span>Commercial & Finance Control</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Realtime Cloud Database
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Monitoring Discount Faktur Pajak (FP) + Cashback (CB)
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Data tersinkronisasi secara langsung untuk seluruh sales & user. Hak akses approval khusus melalui login akun Google{' '}
              <span className="font-semibold text-slate-800">{AUTHORIZED_APPROVER_EMAIL}</span>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setEditingTransaction(null);
                setIsModalFormOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl transition-all shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Input Data Transaksi</span>
            </button>
          </div>
        </div>

        {/* Loading State Skeleton */}
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-28 bg-slate-200/70 rounded-xl" />
              ))}
            </div>
            <div className="h-96 bg-slate-200/70 rounded-xl" />
          </div>
        ) : (
          <>
            {/* 1. Summary Cards */}
            <section aria-label="Ringkasan Transaksi">
              <SummaryCards stats={summaryStats} />
            </section>

            {/* 2. Transaction Data Table */}
            <section aria-label="Tabel Transaksi">
              <TransactionTable
                transactions={transactions}
                filteredTransactions={filteredTransactions}
                filters={filters}
                onFilterChange={setFilters}
                onResetFilters={() =>
                  setFilters({
                    search: '',
                    namaSales: '',
                    startDate: '',
                    endDate: '',
                    jenisTransaksi: '',
                    approvalStatus: '',
                  })
                }
                onEdit={(item) => {
                  setEditingTransaction(item);
                  setIsModalFormOpen(true);
                }}
                onDeleteRequest={(item) => {
                  setDeletingTransaction(item);
                }}
                onPreviewPhoto={(item) => {
                  setPreviewingTransaction(item);
                }}
                onExportExcel={handleExportExcel}
                currentUserEmail={currentUser?.email || ''}
                onApprovalChange={handleApprovalChange}
                onOpenCreateModal={() => {
                  setEditingTransaction(null);
                  setIsModalFormOpen(true);
                }}
              />
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Portal Monitoring FP & CB © {new Date().getFullYear()} · Approver Google Auth:{' '}
            <span className="font-mono text-slate-700 font-semibold">{AUTHORIZED_APPROVER_EMAIL}</span>
          </span>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sinkronisasi Cloud Firestore Live
            </span>
            <span>·</span>
            <span>Format Ekspor .xlsx</span>
          </div>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <TransactionModalForm
        isOpen={isModalFormOpen}
        onClose={() => {
          setIsModalFormOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleSaveTransaction}
        editData={editingTransaction}
        salesDirectory={salesDirectory}
        currentUserEmail={currentUser?.email || ''}
      />

      <PhotoLightboxModal
        transaction={previewingTransaction}
        onClose={() => setPreviewingTransaction(null)}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingTransaction)}
        transaction={deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Toast Notification Container */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
