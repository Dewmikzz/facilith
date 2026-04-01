import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsW9s8aQuIyS-gT0gyHzQvPOPyWPWb3ug",
  authDomain: "my-facility-1dc95.firebaseapp.com",
  databaseURL: "https://my-facility-1dc95-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "my-facility-1dc95",
  storageBucket: "my-facility-1dc95.firebasestorage.app",
  messagingSenderId: "463949996929",
  appId: "1:463949996929:web:27cbfc23a31a57792d3e80"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        throw error;
    }
};

export const logout = () => signOut(auth);
