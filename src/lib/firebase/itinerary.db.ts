import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import db from "./db";

const ITINERARIES_COLLECTION = "itineraries";

export interface ItineraryDay {
  title: string;
  activities: string[];
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
  };
}

export const fetchItineraries = async (): Promise<Itinerary[]> => {
  const col = collection(db, ITINERARIES_COLLECTION);
  const snapshot = await getDocs(col);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Itinerary));
};

export const createItinerary = async (data: Itinerary): Promise<string> => {
  if (data.id) {
    const { id, ...rest } = data;
    await setDoc(doc(db, ITINERARIES_COLLECTION, id), rest);
    return id;
  } else {
    const col = collection(db, ITINERARIES_COLLECTION);
    const docRef = await addDoc(col, data);
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
