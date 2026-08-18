'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from 'react';

interface User {
  uid: string;
  email: string | null;
}

interface UserProfile {
  role: 'patient' | 'doctor' | 'admin' | 'super_admin';
  firstName?: string;
  lastName?: string;
  age?: number;
  gender?: string;
  phone?: string;
  emergencyContact?: {
    name: string;
    phone: string;
  };
  consentAgreement?: boolean;
  practiceName?: string;
  profileComplete?: boolean;
}

interface UserProfileContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshUserProfile: () => void;
}

const UserProfileContext =
  createContext<UserProfileContextType | null>(null);

export function useUserProfile() {
  const context = useContext(UserProfileContext);

  if (!context) {
    throw new Error(
      'useUserProfile must be used within a UserProfileProvider'
    );
  }

  return context;
}

export function UserProfileProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] =
    useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshUserProfile = useCallback(() => {
    // Firebase authentication is disabled.
  }, []);

  useEffect(() => {
    // No Firebase authentication.
    // The application runs as a logged-out user by default.

    setUser(null);
    setUserProfile(null);
    setLoading(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      userProfile,
      loading,
      refreshUserProfile,
    }),
    [user, userProfile, loading, refreshUserProfile]
  );

  return (
    <UserProfileContext.Provider value={contextValue}>
      {children}
    </UserProfileContext.Provider>
  );
}