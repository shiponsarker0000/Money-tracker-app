import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, onSnapshot, query, where, deleteDoc, writeBatch, serverTimestamp, getDocFromServer } from 'firebase/firestore';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Auth functions
export const loginWithGoogle = async () => {
  try {
    // Check if we are running in a native environment (Capacitor/Android)
    const isNative = window.location.protocol === 'capacitor:' || window.location.protocol === 'http:' && window.location.hostname === 'localhost';
    
    if (isNative) {
      // For native apps, signInWithPopup often fails. 
      // We'll try to provide a better experience or instructions.
      alert("আপনি যদি Android App (Android Studio) ব্যবহার করেন, তবে Google Login সফল করতে Firebase Console-এ নিচের কাজগুলো অবশ্যই করতে হবে:\n\n১. Firebase Console-এ আপনার Android App (com.mymoney.app) যুক্ত করুন।\n২. আপনার কম্পিউটারের SHA-1 ফিঙ্গারপ্রিন্ট Firebase-এ যুক্ত করুন।\n৩. Authorized Domains-এ 'localhost' যুক্ত করুন।\n\nএখন আমি পপ-আপ খোলার চেষ্টা করছি...");
    }

    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.error("Login Error:", error);
    if (error.code === 'auth/invalid-action-code' || error.message.includes('requested action is invalid')) {
      alert("লগইন ত্রুটি: 'The requested action is invalid'।\n\nএটি সাধারণত হয় যদি আপনার অ্যাপের ডোমেইনটি Firebase Console-এ 'Authorized Domains'-এ যুক্ত করা না থাকে।\n\nদয়া করে Firebase Console-এ গিয়ে Authentication > Settings > Authorized Domains-এ নিচের ডোমেইনগুলো যুক্ত করুন:\n১. ais-dev-ukapt4ptlrusqfme6x7wot-308255555625.asia-southeast1.run.app\n২. ais-pre-ukapt4ptlrusqfme6x7wot-308255555625.asia-southeast1.run.app\n৩. localhost (Android App-এর জন্য)");
    } else if (error.code === 'auth/popup-blocked') {
      alert("আপনার ব্রাউজার পপ-আপ ব্লক করেছে। দয়া করে পপ-আপ এলাউ করুন এবং আবার চেষ্টা করুন।");
    } else if (error.code === 'auth/unauthorized-domain') {
      alert("এই ডোমেইনটি Firebase-এ অনুমোদিত নয়। দয়া করে Firebase Console-এ Authorized Domains চেক করুন।");
    } else {
      alert("লগইন করতে সমস্যা হয়েছে: " + error.message);
    }
    throw error;
  }
};
export const logout = () => signOut(auth);

// Firestore helper functions
export const cleanData = (data: any) => {
  const cleaned = { ...data };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
};

export const saveToFirestore = async (path: string, data: any) => {
  try {
    await setDoc(doc(db, path), { ...cleanData(data), updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteFromFirestore = async (path: string) => {
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Error handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}

testConnection();
