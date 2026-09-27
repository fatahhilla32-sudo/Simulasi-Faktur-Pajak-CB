import { useEffect } from 'react';
import { X, Download, FileText, User, Building, Calendar, DollarSign } from 'lucide-react';
import { Transaction } from '../types';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';

interface PhotoLightboxModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export function PhotoLightboxModal({ transaction, onClose }: PhotoLightboxModalProps) {
  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (transaction) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [transaction, onClose]);

  if (!transaction) return null;

  const handleDownload = () => {
    if (!transaction.fotoData) return;
    const link = document.createElement('a');
    link.href = transaction.fotoData;
    const sanitizedCustomer = transaction.namaCustomer.replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `Bukti_FP_CB_${sanitizedCustomer}_${transaction.tanggal}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                Bukti Dokumen FP & Cashback
              </h3>
              <p className="text-[11px] text-slate-400">
                {transaction.namaCustomer} · {formatTanggalIndo(transaction.tanggal)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-xs"
              title="Download File Foto"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download Foto</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Tutup preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-4 min-h-[300px] max-h-[68vh]">
          {transaction.fotoData ? (
            <img
              src={transaction.fotoData}
              alt={`Bukti FP CB - ${transaction.namaCustomer}`}
              className="max-w-full max-h-[64vh] object-contain rounded-lg shadow-lg border border-slate-800"
            />
          ) : (
            <p className="text-xs text-slate-500">Tidak ada lampiran foto untuk transaksi ini.</p>
          )}
        </div>

        {/* Footer Details */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 text-slate-300 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 truncate">
            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate" title={transaction.namaCustomer}>
              {transaction.namaCustomer}
            </span>
          </div>

          <div className="flex items-center gap-2 truncate">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {transaction.namaSales} ({transaction.nipSales})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{formatTanggalIndo(transaction.tanggal)}</span>
          </div>

          <div className="flex items-center justify-start sm:justify-end gap-1.5 font-mono text-emerald-400 font-semibold">
            <DollarSign className="w-3.5 h-3.5 shrink-0" />
            <span>Benefit: {formatRupiah(transaction.totalBenefit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
