import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import db from "./db";
import { getCurrentTenantId } from "./user.db";
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
  tenantId?: string;
}

export const fetchLeads = async (): Promise<Lead[]> => {
  const tenantId = await getCurrentTenantId();
  const leadsCol = collection(db, LEADS_COLLECTION);
  const q = query(leadsCol, where("tenantId", "==", tenantId));
  const leadSnapshot = await getDocs(q);
  return leadSnapshot.docs.map(doc => ({ leadId: doc.id, ...doc.data() } as Lead));
};

export const createLead = async (leadData: Lead): Promise<string> => {
  if (!leadData.tenantId) {
    leadData.tenantId = await getCurrentTenantId();
  }
  
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
