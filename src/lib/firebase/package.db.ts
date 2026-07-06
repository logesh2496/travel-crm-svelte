import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import db from "./db";
import { getCurrentTenantId } from "./user.db";

const PACKAGES_COLLECTION = "packages";

export interface PackageTemplate {
  id?: string;
  title: string;
  destination: string;
  theme: string;
  days: { title: string; activities: string[] }[];
  baseCostEstimate?: number;
  tenantId?: string;
}

export const fetchPackages = async (): Promise<PackageTemplate[]> => {
  const tenantId = await getCurrentTenantId();
  const col = collection(db, PACKAGES_COLLECTION);
  const q = query(col, where("tenantId", "==", tenantId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PackageTemplate));
};

export const createPackage = async (data: PackageTemplate): Promise<string> => {
  if (!data.tenantId) {
    data.tenantId = await getCurrentTenantId();
  }

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
