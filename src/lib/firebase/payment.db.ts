import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import db from "./db";
import { getCurrentTenantId } from "./user.db";
import { incrementDashboardKpi, logActivity } from "./dashboard.db";

const PAYMENTS_COLLECTION = "payments";

export interface Payment {
  id?: string;
  title: string;          // e.g. "Mehta Family — Balance Due"
  description: string;    // e.g. "BK-24-041"
  amount: number;
  paymentMethod: string;  // e.g. "Bank Transfer"
  status: 'scheduled' | 'paid';
  dueDate?: string;
  paidDate?: string;
  tenantId?: string;
}

export const fetchPayments = async (): Promise<Payment[]> => {
  const tenantId = await getCurrentTenantId();
  const col = collection(db, PAYMENTS_COLLECTION);
  const q = query(col, where("tenantId", "==", tenantId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
};

export const createPayment = async (payment: Payment): Promise<string> => {
  if (!payment.tenantId) {
    payment.tenantId = await getCurrentTenantId();
  }

  if (payment.id) {
    const { id, ...data } = payment;
    await setDoc(doc(db, PAYMENTS_COLLECTION, id), data);
    return id;
  } else {
    const col = collection(db, PAYMENTS_COLLECTION);
    const docRef = await addDoc(col, payment);
    
    // Aggregation hooks for paid payments
    if (payment.status === 'paid') {
      try {
        await logActivity({
          type: 'payment',
          text: `Payment Received — ₹${payment.amount.toLocaleString()} — ${payment.title}`,
          timestamp: new Date().toISOString(),
          user: 'System',
          source: 'System'
        });
        await incrementDashboardKpi('revenueMonth', payment.amount / 100000);
      } catch (e) {
        console.error("Aggregation failed:", e);
      }
    }
    
    return docRef.id;
  }
};

export const updatePayment = async (id: string, updateData: Partial<Payment>): Promise<void> => {
  const ref = doc(db, PAYMENTS_COLLECTION, id);
  await updateDoc(ref, updateData);
  
  if (updateData.status === 'paid' && updateData.amount) {
     try {
        await logActivity({
          type: 'payment',
          text: `Scheduled Payment Paid — ₹${updateData.amount.toLocaleString()} — ${updateData.title || ''}`,
          timestamp: new Date().toISOString(),
          user: 'System',
          source: 'System'
        });
        await incrementDashboardKpi('revenueMonth', updateData.amount / 100000);
      } catch (e) {
        console.error("Aggregation failed:", e);
      }
  }
};

export const deletePayment = async (id: string): Promise<void> => {
  const ref = doc(db, PAYMENTS_COLLECTION, id);
  await deleteDoc(ref);
};
