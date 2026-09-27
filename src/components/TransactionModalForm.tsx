import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  Trash2,
  AlertCircle,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  Sparkles,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import {
  Transaction,
  TransactionFormData,
  JenisTransaksi,
  ApprovalStatus,
  AUTHORIZED_APPROVER_EMAIL,
} from '../types';
import {
  formatRupiah,
  parseRupiahInput,
  formatRupiahInputValue,
  formatPersen,
  getTodayDateString,
  formatFileSize,
} from '../utils/formatters';
import { processAndCompressImage } from '../utils/imageCompressor';

interface TransactionModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  editData?: Transaction | null;
  salesDirectory: Record<string, string>; // NIP -> Nama Sales map
  currentUserEmail: string;
}

export function TransactionModalForm({
  isOpen,
  onClose,
  onSubmit,
  editData,
  salesDirectory,
  currentUserEmail,
}: TransactionModalFormProps) {
  const isApprover =
    currentUserEmail.trim().toLowerCase() === AUTHORIZED_APPROVER_EMAIL.toLowerCase();

  const [tanggal, setTanggal] = useState<string>(getTodayDateString());
  const [nipSales, setNipSales] = useState<string>('');
  const [namaSales, setNamaSales] = useState<string>('');
  const [namaCustomer, setNamaCustomer] = useState<string>('');
  const [jenisTransaksi, setJenisTransaksi] = useState<JenisTransaksi>('LUNAS');
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('Pending');
  const [rawSebelum, setRawSebelum] = useState<string>('');
  const [rawSesudah, setRawSesudah] = useState<string>('');
  const [keterangan, setKeterangan] = useState<string>('');

  // Image states
  const [fotoData, setFotoData] = useState<string>('');
  const [fotoFileName, setFotoFileName] = useState<string>('');
  const [fotoFileSize, setFotoFileSize] = useState<number>(0);
  const [originalFileSize, setOriginalFileSize] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  // Validation & UI states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [autoFilledSales, setAutoFilledSales] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Populate form if editing, or reset if creating
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setTanggal(editData.tanggal);
        setNipSales(editData.nipSales);
        setNamaSales(editData.namaSales);
        setNamaCustomer(editData.namaCustomer);
        setJenisTransaksi(editData.jenisTransaksi || 'LUNAS');
        setApprovalStatus(editData.approvalStatus || 'Pending');
        setRawSebelum(formatRupiahInputValue(editData.nilaiSebelum));
        setRawSesudah(formatRupiahInputValue(editData.nilaiSesudah));
        setKeterangan(editData.keterangan || '');
        setFotoData(editData.fotoData);
        setFotoFileName(editData.fotoFileName);
        setFotoFileSize(editData.fotoFileSize);
        setOriginalFileSize(editData.fotoFileSize);
        setAutoFilledSales(false);
      } else {
        setTanggal(getTodayDateString());
        setNipSales('');
        setNamaSales('');
        setNamaCustomer('');
        setJenisTransaksi('LUNAS');
        setApprovalStatus('Pending');
        setRawSebelum('');
        setRawSesudah('');
        setKeterangan('');
        setFotoData('');
        setFotoFileName('');
        setFotoFileSize(0);
        setOriginalFileSize(0);
        setAutoFilledSales(false);
      }
      setErrors({});
    }
  }, [isOpen, editData]);

  // Autocomplete Nama Sales when NIP changes
  const handleNipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setNipSales(val);

    const trimmed = val.trim();
    if (trimmed && salesDirectory[trimmed]) {
      setNamaSales(salesDirectory[trimmed]);
      setAutoFilledSales(true);
    } else {
      setAutoFilledSales(false);
    }

    if (errors.nipSales) {
      setErrors((prev) => ({ ...prev, nipSales: '' }));
    }
  };

  // Currency input handlers
  const handleSebelumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRupiahInputValue(e.target.value);
    setRawSebelum(formatted);
    if (errors.nilaiSebelum) {
      setErrors((prev) => ({ ...prev, nilaiSebelum: '' }));
    }
  };

  const handleSesudahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRupiahInputValue(e.target.value);
    setRawSesudah(formatted);
    if (errors.nilaiSesudah) {
      setErrors((prev) => ({ ...prev, nilaiSesudah: '' }));
    }
  };

  // Real-time calculations
  const nilaiSebelum = parseRupiahInput(rawSebelum);
  const nilaiSesudah = parseRupiahInput(rawSesudah);
  const totalBenefit = Math.max(nilaiSebelum - nilaiSesudah, 0);
  const isInvalidCalculation = nilaiSesudah > nilaiSebelum && nilaiSebelum > 0 && nilaiSesudah > 0;
  const persenBenefit = nilaiSebelum > 0 ? (totalBenefit / nilaiSebelum) * 100 : 0;

  // Image upload & compression handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    setIsCompressing(true);
    setErrors((prev) => ({ ...prev, foto: '' }));

    try {
      const result = await processAndCompressImage(file);
      setFotoData(result.dataUrl);
      setFotoFileName(result.fileName);
      setFotoFileSize(result.compressedSize);
      setOriginalFileSize(result.originalSize);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memproses foto.';
      setErrors((prev) => ({ ...prev, foto: message }));
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemovePhoto = () => {
    setFotoData('');
    setFotoFileName('');
    setFotoFileSize(0);
    setOriginalFileSize(0);
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!nipSales.trim()) {
      newErrors.nipSales = 'NIP Sales wajib diisi.';
    }
    if (!namaSales.trim()) {
      newErrors.namaSales = 'Nama Sales wajib diisi.';
    }
    if (!namaCustomer.trim()) {
      newErrors.namaCustomer = 'Nama Customer wajib diisi.';
    }
    if (!nilaiSebelum || nilaiSebelum <= 0) {
      newErrors.nilaiSebelum = 'Value Trx Sebelum FP+CB harus lebih besar dari 0.';
    }
    if (nilaiSesudah < 0 || rawSesudah.trim() === '') {
      newErrors.nilaiSesudah = 'Value Trx Sesudah FP+CB wajib diisi.';
    }
    if (nilaiSesudah > nilaiSebelum) {
      newErrors.nilaiSesudah = 'Value Sesudah tidak boleh lebih besar dari Value Sebelum.';
    }
    if (!fotoData) {
      newErrors.foto = 'Foto Faktur Pajak + Cashback wajib diupload.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        id: editData?.id,
        tanggal,
        nipSales: nipSales.trim(),
        namaSales: namaSales.trim(),
        namaCustomer: namaCustomer.trim(),
        jenisTransaksi,
        approvalStatus: isApprover ? approvalStatus : (editData?.approvalStatus || 'Pending'),
        approvedBy: isApprover && approvalStatus !== 'Pending' ? AUTHORIZED_APPROVER_EMAIL : editData?.approvedBy,
        approvedAt: isApprover && approvalStatus !== 'Pending' ? Date.now() : editData?.approvedAt,
        nilaiSebelum,
        nilaiSesudah,
        fotoData,
        fotoFileName: fotoFileName || 'faktur_cashback.jpg',
        fotoFileSize,
        keterangan: keterangan.trim(),
      });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan transaksi.';
      setErrors((prev) => ({ ...prev, submit: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                {editData ? 'Edit Data Transaksi FP + CB' : 'Input Transaksi FP + CB Baru'}
              </h2>
              <p className="text-xs text-slate-400">
                Lengkapi seluruh formulir dengan data transaksi yang valid
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errors.submit && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Row 1: Tanggal & NIP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal Transaksi <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  NIP Sales <span className="text-rose-500">*</span>
                </label>
                {autoFilledSales && (
                  <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                    <Sparkles className="w-3 h-3" /> Nama terisi otomatis
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="Contoh: SLS-8801"
                value={nipSales}
                onChange={handleNipChange}
                required
                className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono uppercase transition-colors ${
                  errors.nipSales ? 'border-rose-300 focus:border-rose-500' : 'border-slate-300 focus:border-blue-600'
                }`}
              />
              {errors.nipSales && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.nipSales}</p>
              )}
            </div>
          </div>

          {/* Row 2: Nama Sales & Nama Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Sales <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nama lengkap sales"
                value={namaSales}
                onChange={(e) => {
                  setNamaSales(e.target.value);
                  if (errors.namaSales) setErrors((prev) => ({ ...prev, namaSales: '' }));
                }}
                required
                className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors ${
                  errors.namaSales ? 'border-rose-300 focus:border-rose-500' : 'border-slate-300 focus:border-blue-600'
                }`}
              />
              {errors.namaSales && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.namaSales}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Customer <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: PT Sumber Makmur Abadi"
                value={namaCustomer}
                onChange={(e) => {
                  setNamaCustomer(e.target.value);
                  if (errors.namaCustomer) setErrors((prev) => ({ ...prev, namaCustomer: '' }));
                }}
                required
                className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors ${
                  errors.namaCustomer ? 'border-rose-300 focus:border-rose-500' : 'border-slate-300 focus:border-blue-600'
                }`}
              />
              {errors.namaCustomer && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.namaCustomer}</p>
              )}
            </div>
          </div>

          {/* Row 3: Jenis Transaksi (DP / LUNAS) & Approval Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jenis Transaksi <span className="text-rose-500">*</span>
              </label>
              <select
                value={jenisTransaksi}
                onChange={(e) => setJenisTransaksi(e.target.value as JenisTransaksi)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium transition-colors"
              >
                <option value="LUNAS">LUNAS</option>
                <option value="DP">DP (Down Payment)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">Pilih status pembayaran faktur</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Status Approval
                </label>
                {isApprover ? (
                  <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" /> Approver Aktif
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Otomatis Pending
                  </span>
                )}
              </div>

              {isApprover ? (
                <select
                  value={approvalStatus}
                  onChange={(e) => setApprovalStatus(e.target.value as ApprovalStatus)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium transition-colors"
                >
                  <option value="Pending">Menunggu Approval (Pending)</option>
                  <option value="Approved">Approved (Disetujui)</option>
                  <option value="Not Approved">Not Approved (Ditolak)</option>
                </select>
              ) : (
                <div className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    Menunggu Approval (Pending)
                  </span>
                  <span className="text-[11px] text-slate-400">Verifikasi Approver</span>
                </div>
              )}
              <p className="text-[10px] text-slate-500 mt-1">
                {isApprover
                  ? 'Anda memiliki hak untuk menentukan status persetujuan transaksi ini.'
                  : `Approval akan diproses oleh approver (${AUTHORIZED_APPROVER_EMAIL}).`}
              </p>
            </div>
          </div>

          {/* Row 4: Nilai Sebelum & Sesudah */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Value Trx Sebelum FP+CB <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Rp 0"
                value={rawSebelum}
                onChange={handleSebelumChange}
                required
                className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono tabular-nums transition-colors ${
                  errors.nilaiSebelum ? 'border-rose-300 focus:border-rose-500' : 'border-slate-300 focus:border-blue-600'
                }`}
              />
              {errors.nilaiSebelum ? (
                <p className="text-[11px] text-rose-500 mt-1">{errors.nilaiSebelum}</p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1">Nilai bruto sebelum potongan</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Value Trx Sesudah FP+CB <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Rp 0"
                value={rawSesudah}
                onChange={handleSesudahChange}
                required
                className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono tabular-nums transition-colors ${
                  errors.nilaiSesudah || isInvalidCalculation
                    ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20'
                    : 'border-slate-300 focus:border-blue-600'
                }`}
              />
              {isInvalidCalculation ? (
                <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Value Sesudah tidak boleh lebih besar dari Value Sebelum.
                </p>
              ) : errors.nilaiSesudah ? (
                <p className="text-[11px] text-rose-500 mt-1">{errors.nilaiSesudah}</p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1">Nilai netto yang dibayar customer</p>
              )}
            </div>
          </div>

          {/* Row 5: Total Benefit (Read Only & Calculated Automatically) */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-blue-900 mb-0.5">
                Total Benefit Customer (Dihitung Otomatis)
              </div>
              <div className="text-[11px] text-blue-700">
                Formula: Value Sebelum − Value Sesudah
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-blue-900">
                {formatRupiah(totalBenefit)}
              </div>
              <div className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-mono text-xs font-bold shrink-0">
                {formatPersen(persenBenefit)}
              </div>
            </div>
          </div>

          {/* Row 6: Upload Foto Bukti FP + CB */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700">
                Foto Bukti FP + Cashback <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Maksimal 10 MB (JPG, PNG, HEIC) · Kompresi Otomatis
              </span>
            </div>

            {/* Hidden File Inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Upload Box or Preview */}
            {!fotoData ? (
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-5 text-center transition-colors bg-slate-50/50">
                {isCompressing ? (
                  <div className="py-6 flex flex-col items-center justify-center gap-2">
                    <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-slate-600 font-medium">
                      Mengompresi dan memproses foto bukti...
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mb-1">
                      Upload foto dokumen Faktur Pajak & Cashback
                    </p>
                    <p className="text-[11px] text-slate-500 mb-4 max-w-sm mx-auto">
                      Pilih foto dari perangkat atau ambil langsung menggunakan kamera ponsel
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-600" />
                        Pilih dari Galeri / File
                      </button>

                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Ambil dengan Kamera HP
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Photo Preview Card */
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-slate-300 bg-slate-200 shrink-0 relative group">
                  <img
                    src={fotoData}
                    alt="Preview Faktur dan Cashback"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 truncate mb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{fotoFileName}</span>
                  </div>

                  <div className="space-y-0.5 text-[11px] text-slate-500">
                    <div>
                      Ukuran Asli:{' '}
                      <span className="font-mono tabular-nums font-medium text-slate-700">
                        {formatFileSize(originalFileSize)}
                      </span>
                    </div>
                    <div>
                      Ukuran Terkompresi:{' '}
                      <span className="font-mono tabular-nums font-semibold text-emerald-700">
                        {formatFileSize(fotoFileSize)}
                      </span>{' '}
                      <span className="text-emerald-600">(Siap disimpan cepat)</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      Ganti Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                    >
                      <Camera className="w-3 h-3" />
                      Kamera
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-rose-600 bg-white border border-rose-200 rounded-md hover:bg-rose-50 transition-colors ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            )}

            {errors.foto && (
              <p className="text-[11px] text-rose-500 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.foto}
              </p>
            )}
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isInvalidCalculation || isCompressing}
              className={`px-5 py-2 text-xs font-semibold text-white rounded-lg transition-colors shadow-sm flex items-center gap-2 ${
                isSubmitting || isInvalidCalculation || isCompressing
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>{editData ? 'Simpan Perubahan' : 'Simpan Transaksi'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
