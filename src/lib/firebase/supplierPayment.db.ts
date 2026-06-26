import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import db from "./db";
import { logActivity } from "./dashboard.db";

const SUPPLIER_PAYMENTS_COLLECTION = "supplier_payments";

export interface SupplierPayment {
  id?: string;
  supplierName: string;
  supplierType: string;
  description: string;
  amount: number;
  status: 'scheduled' | 'paid' | 'overdue';
  dueDate?: string;
  paidDate?: string;
}

export const fetchSupplierPayments = async (): Promise<SupplierPayment[]> => {
  const col = collection(db, SUPPLIER_PAYMENTS_COLLECTION);
  const snap = await getDocs(col);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplierPayment));
};

export const createSupplierPayment = async (payment: SupplierPayment): Promise<string> => {
  if (payment.id) {
    const { id, ...data } = payment;
    await setDoc(doc(db, SUPPLIER_PAYMENTS_COLLECTION, id), data);
    return id;
  } else {
    const col = collection(db, SUPPLIER_PAYMENTS_COLLECTION);
    const docRef = await addDoc(col, payment);
    
    if (payment.status === 'paid') {
      try {
        await logActivity({
          type: 'payment',
          text: `Supplier Payment Made — ₹${payment.amount.toLocaleString()} — ${payment.supplierName}`,
          timestamp: new Date().toISOString(),
          user: 'System',
          source: 'System'
        });
      } catch (e) {
        console.error("Aggregation failed:", e);
      }
    } else if (payment.status === 'scheduled') {
      try {
        await logActivity({
          type: 'payment',
          text: `Supplier Payment Scheduled — ₹${payment.amount.toLocaleString()} — ${payment.supplierName}`,
          timestamp: new Date().toISOString(),
          user: 'System',
          source: 'System'
        });
      } catch (e) {
        console.error("Aggregation failed:", e);
      }
    }
    
    return docRef.id;
  }
};

export const updateSupplierPayment = async (id: string, updateData: Partial<SupplierPayment>): Promise<void> => {
  const ref = doc(db, SUPPLIER_PAYMENTS_COLLECTION, id);
  await updateDoc(ref, updateData);
  
  if (updateData.status === 'paid' && updateData.amount) {
     try {
        await logActivity({
          type: 'payment',
          text: `Scheduled Supplier Payment Paid — ₹${updateData.amount.toLocaleString()} — ${updateData.supplierName || ''}`,
          timestamp: new Date().toISOString(),
          user: 'System',
          source: 'System'
        });
      } catch (e) {
        console.error("Aggregation failed:", e);
      }
  }
};

export const deleteSupplierPayment = async (id: string): Promise<void> => {
  const ref = doc(db, SUPPLIER_PAYMENTS_COLLECTION, id);
  await deleteDoc(ref);
};
