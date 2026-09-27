import { useEffect } from 'react';
import { X, Download, Calendar, User, Building, DollarSign, Phone, Briefcase } from 'lucide-react';
import { Transaction } from '../types';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';

interface PhotoLightboxModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export function PhotoLightboxModal({ transaction, onClose }: PhotoLightboxModalProps) {
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
    link.download = transaction.fotoFileName || `bukti_fpcb_${transaction.namaCustomer}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 text-white">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-sm tracking-tight">
              Bukti Foto Faktur Pajak & Cashback
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 font-mono">
              {transaction.fotoFileName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Foto</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Tutup foto"
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
              {transaction.teleponCustomer ? ` (${transaction.teleponCustomer})` : ''}
            </span>
          </div>

          <div className="flex items-center gap-2 truncate">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              Sales: {transaction.namaSales} ({transaction.nipSales})
            </span>
          </div>

          <div className="flex items-center gap-2 truncate">
            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              PS: {transaction.namaPS || '-'}
            </span>
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
