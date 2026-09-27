import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };
import { Transaction, ApprovalStatus, AUTHORIZED_APPROVER_EMAIL } from '../types';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific databaseId if provided
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

const COLLECTION_NAME = 'transaksi';

/**
 * Subscribe to live realtime transactions collection
 */
export function subscribeToTransactions(
  onData: (items: Transaction[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const collectionRef = collection(db, COLLECTION_NAME);
  // Order by tanggal descending then createdAt descending
  const q = query(collectionRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          tanggal: data.tanggal || '',
          nipSales: data.nipSales || '',
          namaSales: data.namaSales || '',
          namaCustomer: data.namaCustomer || '',
          jenisTransaksi: data.jenisTransaksi || 'LUNAS',
          approvalStatus: data.approvalStatus || 'Pending',
          approvedBy: data.approvedBy,
          approvedAt: data.approvedAt,
          nilaiSebelum: data.nilaiSebelum || 0,
          nilaiSesudah: data.nilaiSesudah || 0,
          totalBenefit: data.totalBenefit || 0,
          persenBenefit: data.persenBenefit || 0,
          fotoData: data.fotoData || '',
          fotoFileName: data.fotoFileName || '',
          fotoFileSize: data.fotoFileSize || 0,
          keterangan: data.keterangan || '',
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      });

      // Sort newest by tanggal then createdAt
      items.sort((a, b) => {
        if (b.tanggal !== a.tanggal) {
          return b.tanggal.localeCompare(a.tanggal);
        }
        return b.createdAt - a.createdAt;
      });

      onData(items);
    },
    (error) => {
      console.error('Realtime Firestore subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Save (create or update) a transaction in live Firestore
 */
export async function saveLiveTransaction(item: Transaction): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, item.id);
  const dataToSave: Record<string, unknown> = {
    id: item.id,
    tanggal: item.tanggal,
    nipSales: item.nipSales,
    namaSales: item.namaSales,
    namaCustomer: item.namaCustomer,
    jenisTransaksi: item.jenisTransaksi,
    approvalStatus: item.approvalStatus,
    nilaiSebelum: item.nilaiSebelum,
    nilaiSesudah: item.nilaiSesudah,
    totalBenefit: item.totalBenefit,
    persenBenefit: item.persenBenefit,
    fotoData: item.fotoData,
    fotoFileName: item.fotoFileName,
    fotoFileSize: item.fotoFileSize,
    createdAt: item.createdAt,
    updatedAt: Date.now(),
  };

  if (item.keterangan) {
    dataToSave.keterangan = item.keterangan;
  }
  if (item.approvedBy) {
    dataToSave.approvedBy = item.approvedBy;
  }
  if (item.approvedAt) {
    dataToSave.approvedAt = item.approvedAt;
  }

  await setDoc(docRef, dataToSave, { merge: true });
}

/**
 * Update transaction approval status in live Firestore
 */
export async function updateLiveTransactionApproval(
  id: string,
  approvalStatus: ApprovalStatus,
  approvedBy: string
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    approvalStatus,
    approvedBy,
    approvedAt: Date.now(),
    updatedAt: Date.now(),
  });
}

/**
 * Delete a transaction from live Firestore
 */
export async function deleteLiveTransaction(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

/**
 * Login using Google Account
 */
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Logout
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Check if the given email is the designated approver
 */
export function isAuthorizedApprover(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === AUTHORIZED_APPROVER_EMAIL.toLowerCase();
}
