import { Transaction, JenisTransaksi, ApprovalStatus } from '../types';
import { createSampleInvoiceImage } from '../utils/imageCompressor';

const DB_NAME = 'fpcb_monitoring_system';
const DB_VERSION = 2;
const STORE_NAME = 'transaksi';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      let store: IDBObjectStore;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      } else {
        store = (event.target as IDBOpenDBRequest).transaction!.objectStore(STORE_NAME);
      }

      if (!store.indexNames.contains('tanggal')) {
        store.createIndex('tanggal', 'tanggal', { unique: false });
      }
      if (!store.indexNames.contains('nipSales')) {
        store.createIndex('nipSales', 'nipSales', { unique: false });
      }
      if (!store.indexNames.contains('namaSales')) {
        store.createIndex('namaSales', 'namaSales', { unique: false });
      }
      if (!store.indexNames.contains('namaCustomer')) {
        store.createIndex('namaCustomer', 'namaCustomer', { unique: false });
      }
      if (!store.indexNames.contains('jenisTransaksi')) {
        store.createIndex('jenisTransaksi', 'jenisTransaksi', { unique: false });
      }
      if (!store.indexNames.contains('approvalStatus')) {
        store.createIndex('approvalStatus', 'approvalStatus', { unique: false });
      }
      if (!store.indexNames.contains('createdAt')) {
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all transactions from IndexedDB with normalization for legacy records
 */
export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const results = (request.result as Transaction[]) || [];
      // Normalize any older records that might not have new fields
      const normalized = results.map((item, idx) => ({
        ...item,
        jenisTransaksi: item.jenisTransaksi || (idx % 3 === 0 ? 'DP' : 'LUNAS'),
        approvalStatus: item.approvalStatus || (idx % 2 === 0 ? 'Approved' : 'Pending'),
      }));

      // Sort newest by date then createdAt
      normalized.sort((a, b) => {
        if (b.tanggal !== a.tanggal) {
          return b.tanggal.localeCompare(a.tanggal);
        }
        return b.createdAt - a.createdAt;
      });
      resolve(normalized);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Save (insert or update) a transaction
 */
export async function saveTransaction(item: Transaction): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update transaction approval status
 */
export async function updateTransactionApproval(
  id: string,
  approvalStatus: ApprovalStatus,
  approvedBy: string
): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const data = getRequest.result as Transaction;
      if (!data) {
        reject(new Error('Data transaksi tidak ditemukan.'));
        return;
      }
      data.approvalStatus = approvalStatus;
      data.approvedBy = approvedBy;
      data.approvedAt = Date.now();
      data.updatedAt = Date.now();

      const putRequest = store.put(data);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Delete a transaction by ID
 */
export async function deleteTransaction(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get unique mapping of NIP Sales -> Nama Sales
 */
export async function getSalesDirectory(): Promise<Record<string, string>> {
  const items = await getAllTransactions();
  const dir: Record<string, string> = {};
  items.forEach((item) => {
    if (item.nipSales?.trim() && item.namaSales?.trim()) {
      dir[item.nipSales.trim()] = item.namaSales.trim();
    }
  });
  return dir;
}

/**
 * Clear all data from store (for testing/reset)
 */
export async function clearAllTransactions(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Initial seed data generator with realistic Indonesian transactions
 */
export async function seedInitialDataIfEmpty(): Promise<Transaction[]> {
  const current = await getAllTransactions();
  if (current.length > 0) {
    return current;
  }

  const now = new Date();
  const getPastDate = (daysAgo: number) => {
    const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const sampleRows: Array<{
    nip: string;
    sales: string;
    customer: string;
    sebelum: number;
    sesudah: number;
    tanggal: string;
    jenis: JenisTransaksi;
    approval: ApprovalStatus;
  }> = [
    {
      nip: 'SLS-8801',
      sales: 'Rian Hidayat',
      customer: 'PT Surya Makmur Abadi',
      sebelum: 125000000,
      sesudah: 110000000,
      tanggal: getPastDate(1),
      jenis: 'LUNAS',
      approval: 'Approved',
    },
    {
      nip: 'SLS-8802',
      sales: 'Dewi Lestari',
      customer: 'CV Sumber Rejeki Tehnik',
      sebelum: 78500000,
      sesudah: 70000000,
      tanggal: getPastDate(3),
      jenis: 'DP',
      approval: 'Pending',
    },
    {
      nip: 'SLS-8801',
      sales: 'Rian Hidayat',
      customer: 'PT Indo Sentosa Prima',
      sebelum: 210000000,
      sesudah: 189000000,
      tanggal: getPastDate(6),
      jenis: 'LUNAS',
      approval: 'Approved',
    },
    {
      nip: 'SLS-8803',
      sales: 'Bambang Prasetyo',
      customer: 'PT Mandiri Jaya Nusantara',
      sebelum: 95000000,
      sesudah: 83500000,
      tanggal: getPastDate(10),
      jenis: 'DP',
      approval: 'Not Approved',
    },
    {
      nip: 'SLS-8804',
      sales: 'Siti Rahmawati',
      customer: 'PT Berkah Cipta Logistik',
      sebelum: 145000000,
      sesudah: 130500000,
      tanggal: getPastDate(14),
      jenis: 'LUNAS',
      approval: 'Approved',
    },
    {
      nip: 'SLS-8802',
      sales: 'Dewi Lestari',
      customer: 'PT Kencana Mega Pratama',
      sebelum: 160000000,
      sesudah: 144000000,
      tanggal: getPastDate(18),
      jenis: 'LUNAS',
      approval: 'Pending',
    },
    {
      nip: 'SLS-8803',
      sales: 'Bambang Prasetyo',
      customer: 'PT Prima Niaga Utama',
      sebelum: 65000000,
      sesudah: 58500000,
      tanggal: getPastDate(25),
      jenis: 'DP',
      approval: 'Approved',
    },
  ];

  const seeded: Transaction[] = [];

  for (let i = 0; i < sampleRows.length; i++) {
    const row = sampleRows[i];
    const benefit = row.sebelum - row.sesudah;
    const persen = (benefit / row.sebelum) * 100;
    const invoiceDoc = `INV-FP/2026/09/${String(i + 101).padStart(4, '0')}`;
    const foto = createSampleInvoiceImage(
      invoiceDoc,
      row.customer,
      row.sales,
      row.sebelum,
      row.sesudah,
      benefit
    );

    const item: Transaction = {
      id: `trx-${Date.now()}-${i}`,
      tanggal: row.tanggal,
      nipSales: row.nip,
      namaSales: row.sales,
      namaCustomer: row.customer,
      jenisTransaksi: row.jenis,
      approvalStatus: row.approval,
      approvedBy: row.approval !== 'Pending' ? 'fatah.mubarokah@homecenter.co.id' : undefined,
      approvedAt: row.approval !== 'Pending' ? Date.now() - (i * 86400000) : undefined,
      nilaiSebelum: row.sebelum,
      nilaiSesudah: row.sesudah,
      totalBenefit: benefit,
      persenBenefit: persen,
      fotoData: foto,
      fotoFileName: `faktur_${row.nip}_${i + 1}.jpg`,
      fotoFileSize: 145000,
      createdAt: Date.now() - (i * 86400000),
      updatedAt: Date.now() - (i * 86400000),
    };

    await saveTransaction(item);
    seeded.push(item);
  }

  return seeded;
}
