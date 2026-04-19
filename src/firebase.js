// src/firebase.js
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserSessionPersistence,
  GoogleAuthProvider,
  FacebookAuthProvider
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  enableIndexedDbPersistence, 
  initializeFirestore, 
  CACHE_SIZE_UNLIMITED 
} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAFrudD0XiJz-3Sl2V_PorR3tjFXC2W3Dk",
    authDomain: "react-router-a88d6.firebaseapp.com",
    projectId: "react-router-a88d6",
    storageBucket: "react-router-a88d6.firebasestorage.app",
    messagingSenderId: "530845512286",
    appId: "1:530845512286:web:a4dfd5e4c045bbf2727acf",
    measurementId: "G-K7QPD5MF5B"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// Enable persistent auth state with session persistence (lighter than local)
export const firebasePersistenceInitialized = (async () => {
  // console.log('Firebase persistence initialization started');
  try {
    await setPersistence(auth, browserSessionPersistence);
    // console.log('Firebase persistence set to SESSION');
    // console.log('Firebase persistence initialization completed');
    return true;
  } catch (error) {
    console.error('Error setting persistence:', error);
    // console.log('Firebase persistence initialization failed');
    return false;
  }
})();

// Initialize Firestore with settings for better performance
const firestoreSettings = {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
};

export const db = initializeFirestore(app, firestoreSettings);

// Enable offline persistence with optimized settings
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Offline persistence failed - multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Browser does not support offline persistence');
  }
});

// Helper functions for collection operations
export const visitsCollection = collection(db, "visits");

export const deleteVisitDoc = async (id) => {
    try {
        const docRef = doc(db, "visits", id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error deleting document:", error);
        return false;
    }
};

export const ensureVisitsCollection = async () => {
    try {
        // Try to get documents from the collection
        const snapshot = await getDocs(visitsCollection);
        return true;
    } catch (error) {
        console.error("Error accessing visits collection:", error);
        // Collection doesn't exist or other error
        return false;
    }
};

export { auth };
