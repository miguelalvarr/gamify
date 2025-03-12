// Firebase configuration file
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCj8mhvMgpLfhrMLI4hv2rcx2Rg25yq4kU",
  authDomain: "gamify-e1f8a.firebaseapp.com",
  projectId: "gamify-e1f8a",
  storageBucket: "gamify-e1f8a.firebasestorage.app",
  messagingSenderId: "268347964126",
  appId: "1:268347964126:web:c9e7c65f875e4ccdc4a04f",
  measurementId: "G-VSPKQH9X7P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };