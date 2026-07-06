import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import db from "./db";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import mainApp from "./firebase";

const COLLECTION_NAME = "users";
const usersCollection = collection(db, COLLECTION_NAME);

export interface AppUser {
  id?: string;
  name: string;
  email: string;
  roles: string[]; // e.g., ['Admin'], ['Sales', 'Operations']
  status: 'Active' | 'Inactive';
  tenantId?: string;
  createdAt?: any;
  updatedAt?: any;
  activeSessionId?: string;
}

let cachedTenantId: string | null = null;
export const getCurrentTenantId = async (): Promise<string> => {
  if (cachedTenantId) return cachedTenantId;
  const auth = getAuth(mainApp);
  if (!auth.currentUser) return "default_tenant";
  const user = await getUser(auth.currentUser.uid);
  cachedTenantId = user?.tenantId || "default_tenant";
  return cachedTenantId;
};
export const clearTenantCache = () => { cachedTenantId = null; };

export const getUsers = async (): Promise<AppUser[]> => {
  try {
    const tenantId = await getCurrentTenantId();
    const q = query(usersCollection, where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AppUser[];
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

export const getUser = async (id: string): Promise<AppUser | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as AppUser;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

export const addUser = async (user: Omit<AppUser, "id">, defaultPassword?: string): Promise<string> => {
  try {
    // Inject current tenantId if not provided
    if (!user.tenantId) {
      user.tenantId = await getCurrentTenantId();
    }

    // 1. Create the user in Firebase Auth using a secondary app to avoid logging out the current admin
    const secondaryApp = initializeApp(mainApp.options, "SecondaryApp");
    const secondaryAuth = getAuth(secondaryApp);
    
    // Use the provided default password or generate a random one
    const passwordToUse = defaultPassword || Math.random().toString(36).slice(-8) + "A1!";
    
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, user.email, passwordToUse);
    const newUid = userCredential.user.uid;
    
    // Sign out the secondary app just to be clean
    await signOut(secondaryAuth);

    // 2. Add the user to Firestore using their new UID as the document ID
    const docRef = doc(db, COLLECTION_NAME, newUid);
    await setDoc(docRef, {
      ...user,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return newUid;
  } catch (error) {
    console.error("Error adding user:", error);
    throw error;
  }
};

export const updateUser = async (id: string, user: Partial<AppUser>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...user,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};
