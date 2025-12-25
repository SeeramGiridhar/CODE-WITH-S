// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { getAnalytics } from "firebase/analytics";
// @ts-ignore
import { getAuth, signInWithPopup, GoogleAuthProvider, signInAnonymously, signOut, onAuthStateChanged } from "firebase/auth";
// @ts-ignore
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

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC7ZPnOYEh8xDjH6dfQhnY4MI4yiXh2Oh0",
  authDomain: "binary-hearts-fddfb.firebaseapp.com",
  projectId: "binary-hearts-fddfb",
  storageBucket: "binary-hearts-fddfb.firebasestorage.app",
  messagingSenderId: "84640460496",
  appId: "1:84640460496:web:19951bcd4fae0a45b838d5",
  measurementId: "G-XCHFCWH1H8"
};

let auth: any;
let db: any;
let analytics: any;
let googleProvider: any;

// Helper to check if config appears valid
const isConfigValid = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey.length > 20 &&
  !firebaseConfig.apiKey.includes("INSERT_KEY");

if (isConfigValid) {
  try {
    const app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    auth = undefined;
    db = undefined;
  }
} else {
  console.warn("Firebase config invalid.");
}

// --- Auth Methods ---

export const loginWithGoogle = async () => {
  if (!auth) throw new Error("Firebase Service Not Available");
  return (await signInWithPopup(auth, googleProvider)).user;
};

export const loginAsGuest = async () => {
  if (!auth) throw new Error("Firebase Service Not Available");
  return (await signInAnonymously(auth)).user;
};

export const logoutUser = async () => {
  if (!auth) return;
  await signOut(auth);
};

export const subscribeToAuth = (callback: (user: any | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

// --- Hybrid History Methods (Cloud + Local Fallback) ---

const LOCAL_HISTORY_KEY = 'codeflow_local_history_v1';

// Helper to interact with local storage history
const LocalStorageHistory = {
  get: (userId: string): HistoryItem[] => {
    try {
      const all = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '[]');
      // For offline-guest, show everything or specific items. 
      // For now, we filter by userId to allow multi-user simulation on same device
      return all.filter((item: any) => item.userId === userId);
    } catch { return []; }
  },
  add: (item: any) => {
    try {
      const all = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '[]');
      // Prepend new item, keep max 50
      const updated = [item, ...all].slice(0, 50);
      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) { console.error("Local save failed", e); }
  },
  delete: (id: string) => {
    try {
      const all = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '[]');
      const updated = all.filter((item: any) => item.id !== id);
      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) { console.error("Local delete failed", e); }
  }
};

export const saveSnippetToCloud = async (userId: string, language: string, code: string, comment?: string) => {
  // Prepare object
  const docData = {
    userId,
    language,
    code,
    comment: comment || "",
    // Cloud uses serverTimestamp, Local uses Date.now(). We handle this distinction.
  };

  // 1. If Offline Guest or No DB, go straight to local
  if (userId === 'offline-guest' || !db) {
    LocalStorageHistory.add({ ...docData, id: `local-${Date.now()}`, timestamp: Date.now() });
    return;
  }

  // 2. Try Cloud
  try {
    await addDoc(collection(db, "history"), {
      ...docData,
      timestamp: serverTimestamp()
    });
  } catch (e: any) {
    // 3. Fallback on Permission Error or Offline
    if (e.code === 'permission-denied' || e.code === 'unavailable') {
      console.warn(`Cloud save failed (${e.code}). Saving locally.`);
      LocalStorageHistory.add({ ...docData, id: `local-${Date.now()}`, timestamp: Date.now() });
    } else {
      console.error("Error saving snippet", e);
    }
  }
};

export const getHistoryFromCloud = async (userId: string): Promise<HistoryItem[]> => {
  // 1. If Offline Guest or No DB, go straight to local
  if (userId === 'offline-guest' || !db) {
    return LocalStorageHistory.get(userId);
  }

  // 2. Try Cloud
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
  } catch (e: any) {
    // 3. Fallback on Permission Error or Offline
    if (e.code === 'permission-denied' || e.code === 'unavailable') {
       console.warn(`Cloud fetch failed (${e.code}). Fetching local history.`);
       return LocalStorageHistory.get(userId);
    }
    console.error("Error fetching history", e);
    return [];
  }
};

export const deleteHistoryFromCloud = async (itemId: string) => {
    if (itemId.startsWith('local-')) {
      LocalStorageHistory.delete(itemId);
      return;
    }

    if (!db) return;
    try {
      await deleteDoc(doc(db, "history", itemId));
    } catch (e: any) {
       console.error("Error deleting history", e);
       // Attempt local delete just in case we have ID overlap or mixed mode
       LocalStorageHistory.delete(itemId);
    }
};

// --- Version Control (Git) Methods ---

export const pushCommitsToCloud = async (userId: string, commits: Commit[]) => {
  if (!db || userId === 'offline-guest') {
    throw new Error("Cannot push in offline mode");
  }
  
  try {
    const batch = writeBatch(db);
    const commitsRef = collection(db, "commits");

    for (const commit of commits) {
      const q = query(commitsRef, where("id", "==", commit.id), where("userId", "==", userId));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        const newDocRef = doc(commitsRef);
        batch.set(newDocRef, {
          ...commit,
          userId,
          timestamp: serverTimestamp()
        });
      }
    }
    await batch.commit();
  } catch (e: any) {
    if (e.code === 'permission-denied') {
      throw new Error("Cloud permissions denied. Please check Firestore Rules.");
    }
    throw e;
  }
};

export const pullCommitsFromCloud = async (userId: string): Promise<Commit[]> => {
  if (!db || userId === 'offline-guest') return [];
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
  } catch (e: any) {
    console.error("Error pulling commits", e);
    // If perm denied, just return empty list, don't crash app
    return [];
  }
};