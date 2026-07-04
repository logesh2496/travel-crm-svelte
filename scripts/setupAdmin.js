import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import fs from 'fs';
import path from 'path';

// Parse .env manually to avoid extra dependencies if possible
const envPath = path.resolve(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const firebaseConfig = {
  apiKey: envVars.PUBLIC_FB_API_KEY,
  authDomain: envVars.PUBLIC_FB_AUTH_DOMAIN,
  projectId: envVars.PUBLIC_FB_PROJECT_ID,
  storageBucket: envVars.PUBLIC_FB_STORAGE_BUCKET,
  messagingSenderId: envVars.PUBLIC_FB_MESSAGE_SENDER_ID,
  appId: envVars.PUBLIC_FB_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function setupAdmin() {
  const email = process.argv[2] || "admin@travelcrm.com";
  const password = process.argv[3] || "password123";

  try {
    console.log(`Creating admin user: ${email}...`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log(`Auth user created with UID: ${user.uid}`);
    console.log(`Setting up Firestore document...`);

    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      name: "CRM Admin",
      email: email,
      roles: ["Admin"],
      status: "Active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log("✅ Admin user setup successfully!");
    console.log(`You can now log in to the CRM with:`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log("⚠️ User already exists in Authentication. Make sure they exist in Firestore 'users' collection.");
    } else {
      console.error("❌ Error setting up admin:", error);
    }
    process.exit(1);
  }
}

setupAdmin();
