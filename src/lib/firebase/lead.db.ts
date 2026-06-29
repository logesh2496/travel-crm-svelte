import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import db from "./db";
import { incrementDashboardKpi, incrementLeadSource, logActivity } from "./dashboard.db";

const LEADS_COLLECTION = "leads";

export interface Lead {
  leadId?: string;
  name: string;
  phone: string;
  dest: string;
  date: string;
  budget: string;
  src: string;
  exec: string;
  pri: string;
  status: string;
  notes?: string;
}

export const fetchLeads = async (): Promise<Lead[]> => {
  const leadsCol = collection(db, LEADS_COLLECTION);
  const leadSnapshot = await getDocs(leadsCol);
  return leadSnapshot.docs.map(doc => ({ leadId: doc.id, ...doc.data() } as Lead));
};

export const createLead = async (leadData: Lead): Promise<string> => {
  if (leadData.leadId) {
    const { leadId, ...data } = leadData;
    await setDoc(doc(db, LEADS_COLLECTION, leadId), data);
    return leadId;
  } else {
    const leadsCol = collection(db, LEADS_COLLECTION);
    const docRef = await addDoc(leadsCol, leadData);
    
    // Aggregation hooks
    try {
      await incrementDashboardKpi('totalQueries', 1);
      await incrementDashboardKpi('newQueries', 1);
      if (leadData.src) {
        await incrementLeadSource(leadData.src, 1);
      }
      await logActivity({
        type: 'query',
        text: `New query: ${leadData.name} — ${leadData.dest}`,
        timestamp: new Date().toISOString(),
        user: leadData.exec || 'System',
        source: leadData.src || 'Unknown'
      });
    } catch (e) {
      console.error("Aggregation failed:", e);
    }

    return docRef.id;
  }
};

export const updateLead = async (id: string, updateData: Partial<Lead>): Promise<void> => {
  const leadRef = doc(db, LEADS_COLLECTION, id);
  await updateDoc(leadRef, updateData);
};

export const deleteLead = async (id: string): Promise<void> => {
  const leadRef = doc(db, LEADS_COLLECTION, id);
  await deleteDoc(leadRef);
};
