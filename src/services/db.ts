import { Transaction, ApprovalStatus } from '../types';

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
 * Get all transactions from IndexedDB
 */
export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const results = (request.result as Transaction[]) || [];
      const normalized = results.map((item) => ({
        ...item,
        jenisTransaksi: item.jenisTransaksi || 'LUNAS',
        approvalStatus: item.approvalStatus || 'Pending',
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
 * Initialize data without any seed sample data
 */
export async function initTransactions(): Promise<Transaction[]> {
  return await getAllTransactions();
}
