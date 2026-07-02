import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) {
    env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  }
});

const firebaseConfig = {
  apiKey: env.PUBLIC_FB_API_KEY,
  authDomain: env.PUBLIC_FB_AUTH_DOMAIN,
  projectId: env.PUBLIC_FB_PROJECT_ID,
  storageBucket: env.PUBLIC_FB_STORAGE_BUCKET,
  messagingSenderId: env.PUBLIC_FB_MESSAGE_SENDER_ID,
  appId: env.PUBLIC_FB_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const snapshot = await getDocs(collection(db, 'followups'));
  const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log("Followups count:", docs.length);
  console.log("Followups data:", JSON.stringify(docs, null, 2));
}

check().catch(console.error);
