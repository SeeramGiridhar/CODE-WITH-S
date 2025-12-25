
// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { getAnalytics } from "firebase/analytics";
// @ts-ignore
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail
} from "firebase/auth";
// @ts-ignore
import { 
  getFirestore, 
  collection, 
  addDoc,
  setDoc, 
  getDoc,
  query, 
  where, 
  orderBy, 
  getDocs, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  writeBatch,
  arrayUnion
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
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    auth = undefined;
    db = undefined;
  }
} else {
  console.warn("Firebase config invalid.");
}

// --- Auth Methods ---

/**
 * Registers a user and stores their full login details (id, email, password) in Firestore.
 */
export const registerUser = async (email: string, pass: string, name: string) => {
  if (!auth) throw new Error("Auth Service Unavailable");
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    await updateProfile(user, { displayName: name });

    if (db) {
      try {
        const userRef = doc(db, "users", user.uid);
        const userData = {
          uid: user.uid,
          displayName: name,
          email: email,
          password: pass, // Storing password as requested
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          passwordHistory: [{
            password: pass,
            updatedAt: new Date().toISOString()
          }]
        };
        await setDoc(userRef, userData);
      } catch (dbError) {
        console.error("Error creating user document:", dbError);
      }
    }
    return user;
  } catch (error: any) {
    throw error;
  }
};

/**
 * Logs in a user and updates their login details and password history in the database.
 */
export const loginUser = async (email: string, pass: string) => {
  if (!auth) throw new Error("Auth Service Unavailable");
  try {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    
    if (db) {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        let updateData: any = { 
          lastLogin: serverTimestamp(),
          email: email,
          password: pass // Update current password field
        };

        // Check if password has changed to maintain history
        if (userSnap.exists()) {
          const currentData = userSnap.data();
          if (currentData.password !== pass) {
            updateData.passwordHistory = arrayUnion({
              password: pass,
              updatedAt: new Date().toISOString()
            });
          }
        }

        await setDoc(userRef, updateData, { merge: true });
      } catch (dbError) {
        console.error("Error updating user login timestamp:", dbError);
      }
    }
    return user;
  } catch (error: any) {
    throw error;
  }
};

export const resetUserPassword = async (email: string) => {
  if (!auth) throw new Error("Auth Service Unavailable");
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw error;
  }
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

// --- History Methods (Optimized to avoid index requirement) ---

export const saveSnippetToCloud = async (userId: string, language: string, code: string, title: string, comment?: string) => {
  if (!db || !userId) return;
  try {
    await addDoc(collection(db, "history"), {
      userId,
      language,
      code,
      title,
      comment: comment || "",
      timestamp: serverTimestamp()
    });
  } catch (e: any) {
    console.error("Error saving snippet", e);
    throw e;
  }
};

export const getHistoryFromCloud = async (userId: string): Promise<HistoryItem[]> => {
  if (!db || !userId) return [];

  try {
    const q = query(
      collection(db, "history"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      timestamp: doc.data().timestamp?.toMillis() || Date.now(),
      language: doc.data().language as SupportedLanguage,
      code: doc.data().code,
      title: doc.data().title || "Untitled Snippet",
      comment: doc.data().comment
    }));

    return items.sort((a, b) => b.timestamp - a.timestamp);
  } catch (e: any) {
    console.error("Error fetching history", e);
    throw e;
  }
};

export const deleteHistoryFromCloud = async (itemId: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "history", itemId));
    } catch (e: any) {
       console.error("Error deleting history", e);
       throw e;
    }
};

// --- Version Control (Git) Methods ---

export const pushCommitsToCloud = async (userId: string, commits: Commit[]) => {
  if (!db || !userId) return;
  
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
    console.error("Error pushing commits", e);
    throw e;
  }
};

export const pullCommitsFromCloud = async (userId: string): Promise<Commit[]> => {
  if (!db || !userId) return [];
  try {
    const q = query(
      collection(db, "commits"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => {
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

    return items.sort((a, b) => b.timestamp - a.timestamp);
  } catch (e: any) {
    console.error("Error pulling commits", e);
    throw e;
  }
};
