import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from "firebase/firestore";
import db from "./db";

const COLLECTION_NAME = "b2b_clients";
const b2bCollection = collection(db, COLLECTION_NAME);

export interface BizClient {
  id?: string;
  type: 'b2b' | 'b2c';
  companyName?: string; // Primarily for B2B
  contactPerson: string;
  email: string;
  phone: string;
  whatsapp?: string;
  city: string;
  country: string;
  status: 'active' | 'inactive';
  gstNumber?: string;
  taxId?: string;
  commissionRate?: number; // Primarily for B2B
  creditLimit?: number; // Primarily for B2B
  notes?: string;
  totalBusiness: number; // Starts at 0, updated by bookings
  createdAt?: any;
  updatedAt?: any;
}

export const getClients = async (type?: 'b2b' | 'b2c'): Promise<BizClient[]> => {
  try {
    let q = query(b2bCollection, orderBy("createdAt", "desc"));
    if (type) {
      q = query(b2bCollection, where("type", "==", type), orderBy("createdAt", "desc"));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BizClient[];
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
};

export const getClientById = async (id: string): Promise<BizClient | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as BizClient;
    }
    return null;
  } catch (error) {
    console.error("Error fetching client:", error);
    return null;
  }
};

export const addClient = async (clientData: Omit<BizClient, 'id' | 'createdAt' | 'updatedAt' | 'totalBusiness'>): Promise<string> => {
  try {
    const docRef = await addDoc(b2bCollection, {
      ...clientData,
      totalBusiness: 0, // Always starts at 0
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding client:", error);
    throw error;
  }
};

export const updateClient = async (id: string, updateData: Partial<Omit<BizClient, 'id' | 'createdAt'>>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating client:", error);
    throw error;
  }
};

export const deleteClient = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting client:", error);
    throw error;
  }
};
