import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, query, where, updateDoc } from "firebase/firestore";
import db from "./db";
import { getCurrentTenantId } from "./user.db";

const MASTERS_COLLECTION = "masters";

export interface MasterRecord {
  id?: string;
  agencyId: string;
  type: string; // e.g. 'meal_plan', 'ferry_class'
  name: string;
  code?: string;
  status: 'active' | 'inactive';
  description?: string;
  serviceType?: string; // e.g., 'Flight', 'Hotel', 'Transfer'
  
  // For specialized masters, we can have custom data fields
  customData?: Record<string, any>;
  
  createdAt?: string;
  updatedAt?: string;
  tenantId?: string;
}

export const fetchMasters = async (agencyId: string, type: string): Promise<MasterRecord[]> => {
  const tenantId = await getCurrentTenantId();
  const mastersCol = collection(db, MASTERS_COLLECTION);
  const q = query(
    mastersCol, 
    where("agencyId", "==", agencyId),
    where("type", "==", type),
    where("tenantId", "==", tenantId)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MasterRecord));
};

export const saveMaster = async (masterData: MasterRecord): Promise<string> => {
  const timestamp = new Date().toISOString();
  if (!masterData.tenantId) {
    masterData.tenantId = await getCurrentTenantId();
  }
  
  if (masterData.id) {
    const { id, ...data } = masterData;
    const updatePayload = { ...data, updatedAt: timestamp };
    await updateDoc(doc(db, MASTERS_COLLECTION, id), updatePayload);
    return id;
  } else {
    const payload = { ...masterData, createdAt: timestamp, updatedAt: timestamp };
    const docRef = await addDoc(collection(db, MASTERS_COLLECTION), payload);
    return docRef.id;
  }
};

export const deleteMaster = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, MASTERS_COLLECTION, id));
};
