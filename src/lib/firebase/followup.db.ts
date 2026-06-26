import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import db from "./db";

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
}

export const fetchFollowups = async (): Promise<Followup[]> => {
  const followupsCol = collection(db, FOLLOWUPS_COLLECTION);
  const followupSnapshot = await getDocs(followupsCol);
  return followupSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Followup));
};

export const createFollowup = async (followupData: Followup): Promise<string> => {
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
