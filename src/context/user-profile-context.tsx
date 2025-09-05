
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { onIdTokenChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';

// More specific user profile type based on PRD
interface UserProfile extends DocumentData {
    role: 'patient' | 'doctor' | 'admin' | 'super_admin';
    firstName?: string;
    lastName?: string;
    // Patient specific
    age?: number;
    gender?: string;
    phone?: string;
    emergencyContact?: { name: string; phone: string };
    consentAgreement?: boolean;
    // Doctor specific
    practiceName?: string;
    // A simple flag to check if the core profile is complete
    profileComplete?: boolean; 
}

interface UserProfileContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshUserProfile: () => void;
}

const UserProfileContext = createContext<UserProfileContextType | null>(null);

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}

const eraseCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
};

const setCookie = (name: string, value: string, hours: number) => {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + hours * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${value}; path=/; SameSite=Lax; expires=${expires}`;
}

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (uid: string) => {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      setUserProfile(userDoc.data() as UserProfile);
    } else {
      setUserProfile({ role: 'patient', profileComplete: false });
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (auth.currentUser) {
      setLoading(true);
      await auth.currentUser.getIdToken(true); // Force refresh token
      await fetchUserProfile(auth.currentUser.uid); // Re-fetch profile
      setLoading(false);
    }
  }, [fetchUserProfile]);


  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (authUser) => {
      setLoading(true);
      if (authUser) {
        setUser(authUser);
        const token = await authUser.getIdToken();
        setCookie('firebaseIdToken', token, 1); // Set cookie for 1 hour
        await fetchUserProfile(authUser.uid);
      } else {
        setUser(null);
        setUserProfile(null);
        eraseCookie('firebaseIdToken');
      }
      setLoading(false);
    });

    // Set up an interval to refresh the token periodically (e.g., every 55 minutes)
    const tokenRefreshInterval = setInterval(async () => {
        if (auth.currentUser) {
            await auth.currentUser.getIdToken(true);
        }
    }, 55 * 60 * 1000); // 55 minutes

    return () => {
        unsubscribe();
        clearInterval(tokenRefreshInterval);
    };
  }, [fetchUserProfile]);

  const contextValue = useMemo(() => ({
    user,
    userProfile,
    loading,
    refreshUserProfile,
  }), [user, userProfile, loading, refreshUserProfile]);

  return (
    <UserProfileContext.Provider value={contextValue}>
      {children}
    </UserProfileContext.Provider>
  );
}
