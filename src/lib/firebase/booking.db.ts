import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import db from "./db";
import { incrementDashboardKpi, logActivity, incrementExecutiveStats } from "./dashboard.db";

const BOOKINGS_COLLECTION = "bookings";

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  date: string;
  pnr: string;
  status: string;
}

export interface Hotel {
  id: string;
  hotelName: string;
  city: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  status: string;
}

export interface Transport {
  id: string;
  type: string; // Bus, Train, Cab
  provider: string;
  details: string;
  date: string;
  status: string;
}

export interface Activity {
  id: string;
  name: string;
  date: string;
  vendor: string;
  status: string;
}

export interface Visa {
  id: string;
  country: string;
  type: string;
  status: string; // Applied, Approved, Rejected
}

export interface Insurance {
  id: string;
  provider: string;
  policyNumber: string;
  status: string;
}

export interface DocumentReference {
  id: string;
  type: string; // Voucher, Invoice, Ticket
  name: string;
  referenceUrl: string;
}

export interface Booking {
  id?: string;
  leadId?: string; // Links to lead id
  customerName: string;
  customerPhone: string;
  packageName: string;
  hotelName: string;
  travelDates: string;
  pax: string; // e.g., '2A·1C'
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string; // e.g., 'Confirmed', 'Upcoming', 'Completed', 'Closed', 'Cancelled'
  
  tourCoordinator?: string;
  progress?: number;
  flights?: Flight[];
  hotels?: Hotel[];
  busesTrains?: Transport[];
  sightseeing?: Activity[];
  visas?: Visa[];
  insurance?: Insurance[];
  documents?: DocumentReference[];
}

export const fetchBookings = async (): Promise<Booking[]> => {
  const bookingsCol = collection(db, BOOKINGS_COLLECTION);
  const bookingSnapshot = await getDocs(bookingsCol);
  return bookingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
};

export const createBooking = async (bookingData: Booking): Promise<string> => {
  if (bookingData.id) {
    const { id, ...data } = bookingData;
    await setDoc(doc(db, BOOKINGS_COLLECTION, id), data);
    return id;
  } else {
    const bookingsCol = collection(db, BOOKINGS_COLLECTION);
    const docRef = await addDoc(bookingsCol, bookingData);
    
    // Aggregation hooks
    try {
      if (bookingData.status === 'Confirmed') {
        await incrementDashboardKpi('confirmed', 1);
        // Assuming totalAmount is in total rupees and we store revenueMonth in Lakhs, or just adding raw amount
        await incrementDashboardKpi('revenueMonth', bookingData.totalAmount / 100000);
      }
      
      await logActivity({
        type: 'booking',
        text: `Booking ${bookingData.status} — ${bookingData.customerName} — ${bookingData.packageName}`,
        timestamp: new Date().toISOString(),
        user: 'System', // Would pass exec from auth context normally
        source: 'System'
      });
      
      // Update top executives if we had exec ID. For now we use a dummy exec ID for demonstration
      await incrementExecutiveStats('dummy-exec-id', 'Current User', bookingData.totalAmount / 100000, 1);
    } catch (e) {
      console.error("Aggregation failed:", e);
    }

    return docRef.id;
  }
};

export const updateBooking = async (id: string, updateData: Partial<Booking>): Promise<void> => {
  const bookingRef = doc(db, BOOKINGS_COLLECTION, id);
  await updateDoc(bookingRef, updateData);
};

export const deleteBooking = async (id: string): Promise<void> => {
  const bookingRef = doc(db, BOOKINGS_COLLECTION, id);
  await deleteDoc(bookingRef);
};
