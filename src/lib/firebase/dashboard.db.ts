import { collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, query, orderBy, limit, increment } from "firebase/firestore";
import db from "./db";

const STATS_DOC_ID = "current";
const STATS_COLLECTION = "dashboardStats";
const ACTIVITIES_COLLECTION = "activities";
const EXECUTIVES_COLLECTION = "salesExecutives";

export interface DashboardStats {
  kpis: {
    totalQueries: number;
    newQueries: number;
    quotesSent: number;
    confirmed: number;
    revenueMonth: number;
    pendingFollowUps: number;
  };
  leadSources: Record<string, number>;
  monthlyTrends: {
    month: string;
    queries: number;
    revenue: number;
  }[];
}

export interface Activity {
  id?: string;
  type: string; // e.g., 'query', 'quote', 'booking', 'payment', 'voucher'
  text: string;
  timestamp: string; // ISO string
  user: string;
  source: string; // e.g., 'Website', 'Email'
}

export interface SalesExec {
  id?: string;
  name: string;
  revenue: number;
  bookings: number;
}

// Ensure a default stats document exists if not created yet
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const statsRef = doc(db, STATS_COLLECTION, STATS_DOC_ID);
  const statsSnap = await getDoc(statsRef);
  
  if (statsSnap.exists()) {
    return statsSnap.data() as DashboardStats;
  } else {
    // Default initial data if none exists
    const defaultStats: DashboardStats = {
      kpis: {
        totalQueries: 0,
        newQueries: 0,
        quotesSent: 0,
        confirmed: 0,
        revenueMonth: 0,
        pendingFollowUps: 0
      },
      leadSources: {
        Website: 0,
        WhatsApp: 0,
        Facebook: 0,
        Referral: 0,
        B2B_Agents: 0
      },
      monthlyTrends: [
        { month: 'Jan', queries: 0, revenue: 0 },
        { month: 'Feb', queries: 0, revenue: 0 },
        { month: 'Mar', queries: 0, revenue: 0 },
        { month: 'Apr', queries: 0, revenue: 0 },
        { month: 'May', queries: 0, revenue: 0 },
        { month: 'Jun', queries: 0, revenue: 0 }
      ]
    };
    await setDoc(statsRef, defaultStats);
    return defaultStats;
  }
};

export const fetchRecentActivities = async (): Promise<Activity[]> => {
  const activitiesCol = collection(db, ACTIVITIES_COLLECTION);
  const q = query(activitiesCol, orderBy('timestamp', 'desc'), limit(10));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
};

export const fetchTopExecutives = async (): Promise<SalesExec[]> => {
  const execCol = collection(db, EXECUTIVES_COLLECTION);
  const q = query(execCol, orderBy('revenue', 'desc'), limit(5));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SalesExec));
};

// --- Client-Side Batching/Aggregation Helpers ---

export const logActivity = async (activity: Activity): Promise<void> => {
  const activitiesCol = collection(db, ACTIVITIES_COLLECTION);
  await addDoc(activitiesCol, activity);
};

export const incrementDashboardKpi = async (kpiKey: keyof DashboardStats['kpis'], amount: number = 1): Promise<void> => {
  const statsRef = doc(db, STATS_COLLECTION, STATS_DOC_ID);
  await updateDoc(statsRef, {
    [`kpis.${kpiKey}`]: increment(amount)
  });
};

export const incrementLeadSource = async (source: string, amount: number = 1): Promise<void> => {
  const statsRef = doc(db, STATS_COLLECTION, STATS_DOC_ID);
  // Map common sources to the object keys safely
  let sourceKey = source;
  if (source === 'B2B Agents') sourceKey = 'B2B_Agents';
  await updateDoc(statsRef, {
    [`leadSources.${sourceKey}`]: increment(amount)
  });
};

export const incrementExecutiveStats = async (execId: string, execName: string, revenueAmount: number, bookingsCount: number = 1): Promise<void> => {
  const execRef = doc(db, EXECUTIVES_COLLECTION, execId);
  const execSnap = await getDoc(execRef);
  if (execSnap.exists()) {
    await updateDoc(execRef, {
      revenue: increment(revenueAmount),
      bookings: increment(bookingsCount)
    });
  } else {
    // Create if not exists
    await setDoc(execRef, {
      name: execName,
      revenue: revenueAmount,
      bookings: bookingsCount
    });
  }
};
