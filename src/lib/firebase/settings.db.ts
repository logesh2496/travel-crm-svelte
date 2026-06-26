import { doc, getDoc, setDoc } from "firebase/firestore";
import db from "./db";

const SETTINGS_DOC = "agency_settings";
const DEFAULT_TENANT_ID = "default_tenant"; // Use a specific doc for the tenant

export interface AgencySettings {
  agencyName: string;
  gstNumber: string;
}

export const fetchAgencySettings = async (tenantId: string = DEFAULT_TENANT_ID): Promise<AgencySettings> => {
  const docRef = doc(db, SETTINGS_DOC, tenantId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as AgencySettings;
  }
  
  return {
    agencyName: "TravelCRM Pro Agency",
    gstNumber: "27AABCT1234F1Z5"
  };
};

export const saveAgencySettings = async (settings: AgencySettings, tenantId: string = DEFAULT_TENANT_ID): Promise<void> => {
  const docRef = doc(db, SETTINGS_DOC, tenantId);
  await setDoc(docRef, settings, { merge: true });
};
