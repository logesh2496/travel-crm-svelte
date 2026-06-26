import { collection, getDocs, setDoc, doc, query, where, deleteDoc } from "firebase/firestore";
import db from "./db";

const FB_COLLECTION = "facebook_integrations";

export interface FacebookIntegration {
  pageId: string;
  pageName: string;
  tenantId: string;
  accessToken: string;
  linkedBy: string;
  linkedAt: string;
  status: 'active' | 'expired';
}

export const saveFacebookIntegration = async (integration: FacebookIntegration): Promise<void> => {
  const docRef = doc(db, FB_COLLECTION, integration.pageId);
  await setDoc(docRef, integration);
};

export const fetchFacebookIntegrations = async (tenantId: string): Promise<FacebookIntegration[]> => {
  const q = query(collection(db, FB_COLLECTION), where("tenantId", "==", tenantId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as FacebookIntegration);
};

export const deleteFacebookIntegration = async (pageId: string): Promise<void> => {
  const docRef = doc(db, FB_COLLECTION, pageId);
  await deleteDoc(docRef);
};
