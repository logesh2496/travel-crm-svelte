import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import db from "./db";

const PACKAGES_COLLECTION = "packages";

export interface PackageTemplate {
  id?: string;
  title: string;
  destination: string;
  theme: string;
  days: { title: string; activities: string[] }[];
  baseCostEstimate?: number;
}

export const fetchPackages = async (): Promise<PackageTemplate[]> => {
  const col = collection(db, PACKAGES_COLLECTION);
  const snapshot = await getDocs(col);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PackageTemplate));
};

export const createPackage = async (data: PackageTemplate): Promise<string> => {
  if (data.id) {
    const { id, ...rest } = data;
    await setDoc(doc(db, PACKAGES_COLLECTION, id), rest);
    return id;
  } else {
    const col = collection(db, PACKAGES_COLLECTION);
    const docRef = await addDoc(col, data);
    return docRef.id;
  }
};

export const updatePackage = async (id: string, updateData: Partial<PackageTemplate>): Promise<void> => {
  const ref = doc(db, PACKAGES_COLLECTION, id);
  await updateDoc(ref, updateData);
};

export const deletePackage = async (id: string): Promise<void> => {
  const ref = doc(db, PACKAGES_COLLECTION, id);
  await deleteDoc(ref);
};
