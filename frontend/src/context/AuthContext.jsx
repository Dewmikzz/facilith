import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, signInWithGoogle, logout, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [role, setRole] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Fetch role from Firestore users collection BEFORE setting currentUser
                try {
                    const userRef = doc(db, 'users', user.uid);
                    const snap = await getDoc(userRef);
                    
                    if (snap.exists()) {
                        const data = snap.data();
                        setRole(data.role);
                        setUserData(data);
                        
                        // If current Firestore name is 'Campus User' but Auth has a real name, SYNC IT
                        if (data.fullName === 'Campus User' && user.displayName) {
                            await updateDoc(userRef, { fullName: user.displayName, photoURL: user.photoURL || '' });
                        }
                    } else {
                        // AUTO-CREATE profile if missing
                        const newProfile = {
                            fullName: user.displayName || 'Campus User',
                            email: user.email,
                            photoURL: user.photoURL || '',
                            role: 'USER',
                            createdAt: serverTimestamp()
                        };
                        await setDoc(userRef, newProfile);
                        setRole('USER');
                        setUserData(newProfile);
                    }
                } catch (err) {
                    console.error("Auth profile sync error:", err);
                }
                setCurrentUser(user);
            } else {
                setCurrentUser(null);
                setRole(null);
                setUserData(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value = { currentUser, role, userData, loginWithGoogle: signInWithGoogle, logout };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
