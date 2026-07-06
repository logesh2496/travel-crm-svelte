import { collection, addDoc, onSnapshot, query, orderBy, limit, where, serverTimestamp, type Timestamp } from "firebase/firestore";
import app from "./firebase";
import { getCurrentTenantId } from "./user.db";
import { getFirestore } from "firebase/firestore";

const db = getFirestore(app);

export interface ChatMessage {
  id?: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp?: number;
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  tenantId?: string;
}

export function subscribeToMessages(
  limitCount: number,
  callback: (messages: ChatMessage[]) => void
) {
  // We can't await inside subscribe safely if we want to return the unsubscriber synchronously.
  // Instead, we will wrap the setup or let the caller pass tenantId. 
  // For simplicity, we fetch it asynchronously and then subscribe.
  let unsubscribe: () => void = () => {};
  
  getCurrentTenantId().then(tenantId => {
    const q = query(
      collection(db, "team_messages"),
      where("tenantId", "==", tenantId),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );

    unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      // Reverse so the oldest is first and newest is at the bottom
      callback(messages.reverse());
    });
  });

  return () => unsubscribe();
}

export async function sendChatMessage(
  text: string,
  senderId: string,
  senderName: string,
  replyTo?: { id: string; text: string; senderName: string }
) {
  try {
    const messageData: any = {
      text,
      senderId,
      senderName,
      timestamp: Date.now(),
      tenantId: await getCurrentTenantId(),
    };
    if (replyTo) {
      messageData.replyTo = replyTo;
    }
    await addDoc(collection(db, "team_messages"), messageData);
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}
