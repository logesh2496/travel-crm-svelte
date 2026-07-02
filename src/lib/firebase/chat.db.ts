import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp, type Timestamp } from "firebase/firestore";
import app from "./firebase";
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
}

export function subscribeToMessages(
  limitCount: number,
  callback: (messages: ChatMessage[]) => void
) {
  const q = query(
    collection(db, "team_messages"),
    orderBy("timestamp", "desc"),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
    });
    // Reverse so the oldest is first and newest is at the bottom
    callback(messages.reverse());
  });
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
