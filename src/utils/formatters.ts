/**
 * Format number to Indonesian Rupiah representation
 * Contoh: 12500000 -> "Rp 12.500.000"
 */
export function formatRupiah(value: number | null | undefined, withPrefix = true): string {
  if (value === null || value === undefined || isNaN(value)) {
    return withPrefix ? 'Rp 0' : '0';
  }
  const rounded = Math.round(value);
  const formatted = new Intl.NumberFormat('id-ID').format(rounded);
  return withPrefix ? `Rp ${formatted}` : formatted;
}

/**
 * Format compact Rupiah for chart axes
 * Contoh: 15000000 -> "Rp 15 Jt"
 */
export function formatCompactRupiah(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1)} Jt`;
  }
  if (Math.abs(value) >= 1_000) {
    return `Rp ${(value / 1_000).toFixed(0)} Rb`;
  }
  return `Rp ${value}`;
}

/**
 * Parse numeric value from formatted string
 */
export function parseRupiahInput(val: string): number {
  if (!val) return 0;
  // Remove non-digit characters
  const cleaned = val.replace(/[^0-9]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format raw string or number into readable Rupiah while typing
 */
export function formatRupiahInputValue(val: string | number): string {
  const num = typeof val === 'number' ? val : parseRupiahInput(val);
  if (!num) return '';
  return `Rp ${new Intl.NumberFormat('id-ID').format(num)}`;
}

/**
 * Format percentage
 */
export function formatPersen(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0.0%';
  return `${val.toFixed(1)}%`;
}

/**
 * Format date to Indonesian text
 * Contoh: "2026-09-26" -> "26 Sep 2026"
 */
export function formatTanggalIndo(dateStr: string, options: { short?: boolean } = {}): string {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    
    const monthNamesShort = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    const monthNamesLong = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const mName = options.short ? monthNamesShort[month - 1] : monthNamesLong[month - 1];
    return `${day} ${mName} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Get today date formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format file size in bytes to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
