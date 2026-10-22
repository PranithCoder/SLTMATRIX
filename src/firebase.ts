import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  initializeFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";

// Firebase config is read from Vite environment variables (or defaults)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDVfGttgp9uQogKTDBYzUknokJoXH-NZcs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "slt-matrix.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "slt-matrix",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "slt-matrix.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "596272385139",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:596272385139:web:70df813556016361632e06",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ZJS6SW6MM5",
};

// Initialise Firebase app (singleton)
const app = initializeApp(firebaseConfig);

// Initialise Analytics (only in the browser)
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// Export Firestore instance for the whole app with ignoreUndefinedProperties enabled
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});

/* -------------------------------------------------------------------
   Helper functions – thin wrappers around Firestore SDK.
   You can import these directly in your services or components.
------------------------------------------------------------------- */
export const addDocument = async (col: string, data: any) => {
  const colRef = collection(db, col);
  const docRef = await addDoc(colRef, data);
  return docRef.id;
};

export const getAllDocuments = async (col: string) => {
  const colRef = collection(db, col);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getDocument = async (col: string, id: string) => {
  const docRef = doc(db, col, id);
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateDocument = async (col: string, id: string, data: any) => {
  const docRef = doc(db, col, id);
  await setDoc(docRef, data, { merge: true });
};

export const deleteDocument = async (col: string, id: string) => {
  const docRef = doc(db, col, id);
  await deleteDoc(docRef);
};
