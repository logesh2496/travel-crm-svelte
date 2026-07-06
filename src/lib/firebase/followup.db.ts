import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import db from "./db";
import { getCurrentTenantId } from "./user.db";

const FOLLOWUPS_COLLECTION = "followups";

export interface Followup {
  id?: string;
  leadId: string;
  date: string;
  time: string;
  type: string;
  exec: string;
  notes: string;
  status?: string;
  timestamp?: number;
  tenantId?: string;
}

export const fetchFollowups = async (): Promise<Followup[]> => {
  const tenantId = await getCurrentTenantId();
  const followupsCol = collection(db, FOLLOWUPS_COLLECTION);
  const q = query(followupsCol, where("tenantId", "==", tenantId));
  const followupSnapshot = await getDocs(q);
  return followupSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Followup));
};

export const createFollowup = async (followupData: Followup): Promise<string> => {
  if (!followupData.tenantId) {
    followupData.tenantId = await getCurrentTenantId();
  }

  if (followupData.id) {
    const { id, ...data } = followupData;
    await setDoc(doc(db, FOLLOWUPS_COLLECTION, id), data);
    return id;
  } else {
    const followupsCol = collection(db, FOLLOWUPS_COLLECTION);
    const docRef = await addDoc(followupsCol, followupData);
    return docRef.id;
  }
};

export const updateFollowup = async (id: string, updateData: Partial<Followup>): Promise<void> => {
  const followupRef = doc(db, FOLLOWUPS_COLLECTION, id);
  await updateDoc(followupRef, updateData);
};

export const deleteFollowup = async (id: string): Promise<void> => {
  const followupRef = doc(db, FOLLOWUPS_COLLECTION, id);
  await deleteDoc(followupRef);
};
