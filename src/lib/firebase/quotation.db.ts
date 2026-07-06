import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import db from "./db";
import { getCurrentTenantId } from "./user.db";

const QUOTATIONS_COLLECTION = "quotations";

export interface Quotation {
  id?: string;
  quoteId: string;
  customer: string;
  destination: string;
  amount: number;
  status: string;
  // Dynamic Quote Builder fields
  qPkg?: string;
  qHotel?: string;
  qH?: number;
  qF?: number;
  qS?: number;
  qV?: number;
  qT?: number;
  qM?: number;
  qI?: number;
  qMk?: number;
  qGst?: number;
  qD?: number;
  currency?: string;
  tenantId?: string;
}

export const fetchQuotations = async (): Promise<Quotation[]> => {
  const tenantId = await getCurrentTenantId();
  const qCol = collection(db, QUOTATIONS_COLLECTION);
  const q = query(qCol, where("tenantId", "==", tenantId));
  const qSnapshot = await getDocs(q);
  return qSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quotation));
};

export const createQuotation = async (qData: Quotation): Promise<string> => {
  if (!qData.tenantId) {
    qData.tenantId = await getCurrentTenantId();
  }

  if (qData.id) {
    const { id, ...data } = qData;
    await setDoc(doc(db, QUOTATIONS_COLLECTION, id), data);
    return id;
  } else {
    const qCol = collection(db, QUOTATIONS_COLLECTION);
    const docRef = await addDoc(qCol, qData);
    return docRef.id;
  }
};

export const updateQuotation = async (id: string, updateData: Partial<Quotation>): Promise<void> => {
  const qRef = doc(db, QUOTATIONS_COLLECTION, id);
  await updateDoc(qRef, updateData);
};

export const deleteQuotation = async (id: string): Promise<void> => {
  const qRef = doc(db, QUOTATIONS_COLLECTION, id);
  await deleteDoc(qRef);
};
