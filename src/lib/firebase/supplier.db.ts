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
  serverTimestamp
} from "firebase/firestore";
import db from "./db";

const COLLECTION_NAME = "suppliers";
const suppliersCollection = collection(db, COLLECTION_NAME);

export interface Supplier {
  id?: string;
  name: string;
  serviceType: string;
  contactPerson: string;
  email: string;
  mobile: string;
  landline: string;
  status: string;
  bankDetails: string;
  createdAt?: any;
  updatedAt?: any;
}

export const getSuppliers = async (): Promise<Supplier[]> => {
  try {
    const q = query(suppliersCollection, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Supplier[];
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }
};

export const getSupplierById = async (id: string): Promise<Supplier | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Supplier;
    }
    return null;
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return null;
  }
};

export const addSupplier = async (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(suppliersCollection, {
      ...supplierData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding supplier:", error);
    throw error;
  }
};

export const updateSupplier = async (id: string, updateData: Partial<Omit<Supplier, 'id' | 'createdAt'>>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating supplier:", error);
    throw error;
  }
};

export const deleteSupplier = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting supplier:", error);
    throw error;
  }
};
