export interface ProcessedImageResult {
  dataUrl: string;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

/**
 * Validates and compresses an image file in browser memory
 * Max input size: 10MB
 * Output: Max width/height 1280px, JPEG quality ~70%
 */
export async function processAndCompressImage(file: File): Promise<ProcessedImageResult> {
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Ukuran file foto melebihi batas maksimal 10 MB.');
  }

  // Check MIME or extension
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'jfif'];
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const isImageMime = file.type.startsWith('image/');
  
  if (!isImageMime && !validExtensions.includes(ext)) {
    throw new Error('Format file tidak didukung. Harap upload gambar JPG, JPEG, atau PNG.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Gagal membaca file gambar. Silakan coba file lain.'));
    };

    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        reject(new Error('Gagal memproses gambar. File mungkin rusak atau tidak kompatibel.'));
      };

      img.onload = () => {
        try {
          const MAX_DIMENSION = 1280;
          let targetWidth = img.width;
          let targetHeight = img.height;

          // Scale down proportionally if larger than MAX_DIMENSION
          if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
            if (targetWidth > targetHeight) {
              targetHeight = Math.round((targetHeight * MAX_DIMENSION) / targetWidth);
              targetWidth = MAX_DIMENSION;
            } else {
              targetWidth = Math.round((targetWidth * MAX_DIMENSION) / targetHeight);
              targetHeight = MAX_DIMENSION;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Gagal membuat context canvas untuk kompresi.'));
            return;
          }

          // Fill white background to handle transparency when converting to JPEG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // Draw the image
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // Compress to JPEG with 0.70 quality
          const quality = 0.70;
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

          // Calculate approximate compressed size in bytes from base64
          const base64Length = compressedDataUrl.length - (compressedDataUrl.indexOf(',') + 1);
          const compressedSizeBytes = Math.round((base64Length * 3) / 4);

          resolve({
            dataUrl: compressedDataUrl,
            fileName: file.name.replace(/\.[^/.]+$/, '') + '_compressed.jpg',
            originalSize: file.size,
            compressedSize: compressedSizeBytes,
            width: targetWidth,
            height: targetHeight,
          });
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Terjadi kesalahan saat kompresi foto.'));
        }
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Creates a clean programmatic sample receipt/faktur image for demo records
 */
export function createSampleInvoiceImage(
  invoiceNo: string,
  customerName: string,
  salesName: string,
  nilaiSebelum: number,
  nilaiSesudah: number,
  benefit: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, 800, 1000);

  // Document paper container
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetY = 4;
  ctx.fillRect(40, 40, 720, 920);
  ctx.shadowColor = 'transparent';

  // Header band
  ctx.fillStyle = '#0F2D59';
  ctx.fillRect(40, 40, 720, 110);

  // Header text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('BUKTI POTONGAN FAKTUR PAJAK & CASHBACK', 70, 85);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText(`NO DOKUMEN: ${invoiceNo}  |  RESMI TERCATAT`, 70, 115);

  // Body content
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('DETAIL TRANSAKSI & CUSTOMER', 70, 200);

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(70, 215);
  ctx.lineTo(730, 215);
  ctx.stroke();

  // Information fields
  const drawRow = (label: string, value: string, y: number, highlight = false) => {
    ctx.fillStyle = '#64748B';
    ctx.font = '14px sans-serif';
    ctx.fillText(label, 70, y);

    ctx.fillStyle = highlight ? '#0F2D59' : '#0F172A';
    ctx.font = highlight ? 'bold 15px sans-serif' : '500 14px sans-serif';
    ctx.fillText(value, 320, y);
  };

  drawRow('Customer', customerName, 255);
  drawRow('Sales Representative', salesName, 290);
  drawRow('Tanggal Validasi', new Date().toLocaleDateString('id-ID'), 325);

  // Financial Table
  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(70, 360, 660, 40);
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('DESKRIPSI NILAI', 90, 385);
  ctx.fillText('JUMLAH (IDR)', 550, 385);

  const formatIDR = (n: number) => `Rp ${new Intl.NumberFormat('id-ID').format(n)}`;

  drawRow('1. Nilai Trx Sebelum FP + CB', formatIDR(nilaiSebelum), 440);
  drawRow('2. Nilai Trx Sesudah FP + CB', formatIDR(nilaiSesudah), 480);

  // Benefit highlight box
  ctx.fillStyle = '#EFF6FF';
  ctx.strokeStyle = '#93C5FD';
  ctx.lineWidth = 1.5;
  ctx.fillRect(70, 520, 660, 80);
  ctx.strokeRect(70, 520, 660, 80);

  ctx.fillStyle = '#1D4ED8';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('TOTAL BENEFIT CUSTOMER (POTONGAN FP + CB):', 90, 555);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(formatIDR(benefit), 90, 585);

  // Calculation percentage
  const pct = nilaiSebelum > 0 ? ((benefit / nilaiSebelum) * 100).toFixed(1) : '0';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#2563EB';
  ctx.fillText(`Efisiensi: ${pct}%`, 580, 570);

  // Stamp Box
  ctx.save();
  ctx.translate(520, 720);
  ctx.rotate(-0.08);
  ctx.strokeStyle = '#2563EB';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 180, 80);
  ctx.fillStyle = '#2563EB';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VERIFIED FP & CB', 90, 32);
  ctx.font = '12px sans-serif';
  ctx.fillText('APPROVED FINANCE', 90, 52);
  ctx.fillText(new Date().toISOString().slice(0, 10), 90, 68);
  ctx.restore();

  // Watermark footer
  ctx.textAlign = 'left';
  ctx.fillStyle = '#94A3B8';
  ctx.font = '12px sans-serif';
  ctx.fillText('* Dokumen digital ini adalah lampiran bukti FP + CB resmi sistem.', 70, 880);

  return canvas.toDataURL('image/jpeg', 0.85);
}
