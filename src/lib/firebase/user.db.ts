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
  serverTimestamp
} from "firebase/firestore";
import db from "./db";

const COLLECTION_NAME = "users";
const usersCollection = collection(db, COLLECTION_NAME);

export interface AppUser {
  id?: string;
  name: string;
  email: string;
  roles: string[]; // e.g., ['Admin'], ['Sales', 'Operations']
  status: 'Active' | 'Inactive';
  createdAt?: any;
  updatedAt?: any;
}

export const getUsers = async (): Promise<AppUser[]> => {
  try {
    const q = query(usersCollection, orderBy("createdAt", "desc"));
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

export const addUser = async (user: Omit<AppUser, "id">): Promise<string> => {
  try {
    const docRef = await addDoc(usersCollection, {
      ...user,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
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
