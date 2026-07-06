import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import db from "./db";
import { getCurrentTenantId } from "./user.db";

const ITINERARIES_COLLECTION = "itineraries";

export interface ItineraryDay {
  title: string;
  activities: any[];
}

export interface Itinerary {
  id?: string;
  leadId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  theme: string;
  days: ItineraryDay[];
  costing: {
    baseCost: number;
    profitMarginPct: number;
    profitMarginAmt: number;
    gstPct: number;
    gstAmt: number;
    discount: number;
    finalCost: number;
    qF?: number;
    qH?: number;
    qT?: number;
    qS?: number;
    qI?: number;
    manualOverride?: boolean;
  };
  tenantId?: string;
}

export const fetchItineraries = async (): Promise<Itinerary[]> => {
  const tenantId = await getCurrentTenantId();
  const col = collection(db, ITINERARIES_COLLECTION);
  const q = query(col, where("tenantId", "==", tenantId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Itinerary));
};

export const fetchItineraryByLeadId = async (leadId: string): Promise<Itinerary | null> => {
  const tenantId = await getCurrentTenantId();
  const col = collection(db, ITINERARIES_COLLECTION);
  const q = query(col, where("leadId", "==", leadId), where("tenantId", "==", tenantId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Itinerary;
};

export const createItinerary = async (data: Itinerary): Promise<string> => {
  if (!data.tenantId) {
    data.tenantId = await getCurrentTenantId();
  }

  if (data.id) {
    const { id, ...rest } = data;
    await setDoc(doc(db, ITINERARIES_COLLECTION, id), rest);
    return id;
  } else {
    const { id, ...rest } = data;
    const col = collection(db, ITINERARIES_COLLECTION);
    const docRef = await addDoc(col, rest);
    return docRef.id;
  }
};

export const updateItinerary = async (id: string, updateData: Partial<Itinerary>): Promise<void> => {
  const ref = doc(db, ITINERARIES_COLLECTION, id);
  await updateDoc(ref, updateData);
};

export const deleteItinerary = async (id: string): Promise<void> => {
  const ref = doc(db, ITINERARIES_COLLECTION, id);
  await deleteDoc(ref);
};
