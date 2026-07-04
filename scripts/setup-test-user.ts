import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
// Load env vars
import { loadEnv } from 'vite';
const env = loadEnv('development', process.cwd(), '');

const firebaseConfig = {
  apiKey: env.PUBLIC_FB_API_KEY,
  authDomain: env.PUBLIC_FB_AUTH_DOMAIN,
  projectId: env.PUBLIC_FB_PROJECT_ID,
  storageBucket: env.PUBLIC_FB_STORAGE_BUCKET,
  messagingSenderId: env.PUBLIC_FB_MESSAGE_SENDER_ID,
  appId: env.PUBLIC_FB_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function setup() {
  const email = "admin@test.com";
  const password = "password123";

  try {
    console.log("Creating test user in Firebase Auth...");
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    console.log("User created with UID:", uid);

    console.log("Adding user record to Firestore...");
    await setDoc(doc(db, "users", uid), {
      name: "Admin Test User",
      email: email,
      roles: ["Admin"],
      status: "Active",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log("Test user setup complete!");
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log("Test user already exists. We can use it for testing.");
      process.exit(0);
    } else {
      console.error("Error setting up test user:", error);
      process.exit(1);
    }
  }
}

setup();
