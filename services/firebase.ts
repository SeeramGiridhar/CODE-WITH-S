import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  FacebookAuthProvider,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { HistoryItem, SupportedLanguage, Commit } from "../types";

// Configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

let auth: any;
let db: any;
let googleProvider: any;
let githubProvider: any;
let facebookProvider: any;

// Helper to check if config appears valid
const isConfigValid = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" &&
  !firebaseConfig.apiKey.includes("INSERT_KEY");

if (isConfigValid) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    githubProvider = new GithubAuthProvider();
    facebookProvider = new FacebookAuthProvider();
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Firebase not configured. App running in offline demo mode.");
}

// Mock User for Offline Mode
const MOCK_GUEST_USER = {
  uid: 'offline-guest',
  isAnonymous: true,
  displayName: 'Guest (Offline)',
  email: null,
  photoURL: null,
  providerData: []
} as unknown as User;

export const loginWithGoogle = async () => {
  if (!auth) throw new Error("Firebase configuration is missing.");
  return (await signInWithPopup(auth, googleProvider)).user;
};

export const loginWithGithub = async () => {
  if (!auth) throw new Error("Firebase configuration is missing.");
  return (await signInWithPopup(auth, githubProvider)).user;
};

export const loginWithFacebook = async () => {
  if (!auth) throw new Error("Firebase configuration is missing.");
  return (await signInWithPopup(auth, facebookProvider)).user;
};

export const loginAsGuest = async () => {
  if (!auth) {
    // If offline, return mock user instead of throwing
    return MOCK_GUEST_USER;
  }
  return (await signInAnonymously(auth)).user;
};

export const logoutUser = async () => {
  if (!auth) return;
  await signOut(auth);
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  if (!auth) {
    // If not configured, immediately callback with null
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

// --- History Methods ---

export const saveSnippetToCloud = async (userId: string, language: string, code: string, comment?: string) => {
  if (!db) return; // Offline mode: do nothing (local storage handles it)
  try {
    await addDoc(collection(db, "history"), {
      userId,
      language,
      code,
      comment: comment || "",
      timestamp: serverTimestamp()
    });
  } catch (e) {
    console.error("Error saving snippet", e);
  }
};

export const getHistoryFromCloud = async (userId: string): Promise<HistoryItem[]> => {
  if (!db) return []; // Offline mode: return empty
  try {
    const q = query(
      collection(db, "history"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      timestamp: doc.data().timestamp?.toMillis() || Date.now(),
      language: doc.data().language as SupportedLanguage,
      code: doc.data().code,
      comment: doc.data().comment
    }));
  } catch (e) {
    console.error("Error fetching history", e);
    return [];
  }
};

export const deleteHistoryFromCloud = async (itemId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, "history", itemId));
};

// --- Version Control (Git) Methods ---

export const pushCommitsToCloud = async (userId: string, commits: Commit[]) => {
  if (!db) throw new Error("Offline mode: Cannot push to cloud.");
  
  const batch = writeBatch(db);
  const commitsRef = collection(db, "commits");

  // We only push commits that aren't already on the server.
  // For simplicity in this demo, we assume the UI passes only unsynced commits,
  // or we just blindly add them. A real app would check existence.
  // Here we will query by commit ID to avoid duplicates if re-pushing.
  
  for (const commit of commits) {
    // Check if exists
    const q = query(commitsRef, where("id", "==", commit.id), where("userId", "==", userId));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      const newDocRef = doc(commitsRef); // Auto ID for the doc, but we store internal ID inside
      batch.set(newDocRef, {
        ...commit,
        userId,
        timestamp: serverTimestamp() // Use server time for ordering
      });
    }
  }

  await batch.commit();
};

export const pullCommitsFromCloud = async (userId: string): Promise<Commit[]> => {
  if (!db) return [];
  try {
    const q = query(
      collection(db, "commits"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        message: data.message,
        timestamp: data.timestamp?.toMillis() || Date.now(),
        code: data.code,
        language: data.language as SupportedLanguage,
        author: data.author,
        isSynced: true
      };
    });
  } catch (e) {
    console.error("Error pulling commits", e);
    throw e;
  }
};