import { doc, getDoc, setDoc } from "firebase/firestore";
import db from "./db";
import CryptoJS from "crypto-js";

const SETTINGS_DOC = "agency_settings";
const DEFAULT_TENANT_ID = "default_tenant"; // Use a specific doc for the tenant
const SECRET_KEY = "travelcrm_secret_key_123"; // basic secret for hashing as requested

export interface AgencySettings {
  agencyName: string;
  gstNumber: string;
  logoUrl?: string;
  address?: string;
  website?: string;
  emailHeader?: string;
  emailFooter?: string;
  smtpSettings?: {
    host: string;
    port: string;
    user: string;
    pass: string;
  };
}

const encryptData = (data: string) => {
  if (!data) return data;
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
};

const decryptData = (ciphertext: string) => {
  if (!ciphertext) return ciphertext;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8) || ciphertext;
  } catch (e) {
    return ciphertext;
  }
};

export const fetchAgencySettings = async (tenantId: string = DEFAULT_TENANT_ID): Promise<AgencySettings> => {
  const docRef = doc(db, SETTINGS_DOC, tenantId);
  const docSnap = await getDoc(docRef);
  
  const defaultSettings: AgencySettings = {
    agencyName: "TravelCRM Pro Agency",
    gstNumber: "27AABCT1234F1Z5",
    smtpSettings: {
      host: "",
      port: "",
      user: "",
      pass: ""
    }
  };

  if (docSnap.exists()) {
    const data = docSnap.data() as Partial<AgencySettings>;
    const fetchedSmtp: any = data.smtpSettings || {};
    return {
      ...defaultSettings,
      ...data,
      smtpSettings: {
        ...defaultSettings.smtpSettings,
        ...fetchedSmtp,
        pass: fetchedSmtp.pass ? decryptData(fetchedSmtp.pass) : ""
      }
    } as AgencySettings;
  }
  
  return defaultSettings;
};

export const saveAgencySettings = async (settings: AgencySettings, tenantId: string = DEFAULT_TENANT_ID): Promise<void> => {
  const docRef = doc(db, SETTINGS_DOC, tenantId);
  const settingsToSave = { ...settings };
  
  if (settingsToSave.smtpSettings?.pass) {
    settingsToSave.smtpSettings = {
      ...settingsToSave.smtpSettings,
      pass: encryptData(settingsToSave.smtpSettings.pass)
    };
  }
  
  await setDoc(docRef, settingsToSave, { merge: true });
};
