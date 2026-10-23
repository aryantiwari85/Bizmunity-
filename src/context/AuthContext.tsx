import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, testConnection } from '../firebase/config';
import { UserProfile } from '../types/bizmunity';
import { calculateStreakBonus } from '../utils/bizmunityLogic';
import { updateUserProfile } from '../firebase/authService';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authReady: boolean;
  isNewGoogleUser: boolean;
  pendingGoogleUser: FirebaseUser | null;
  setPendingGoogleUser: (user: FirebaseUser | null) => void;
  setIsNewGoogleUser: (isNew: boolean) => void;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  authReady: false,
  isNewGoogleUser: false,
  pendingGoogleUser: null,
  setPendingGoogleUser: () => {},
  setIsNewGoogleUser: () => {},
  refreshProfile: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isNewGoogleUser, setIsNewGoogleUser] = useState<boolean>(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<FirebaseUser | null>(null);

  // Validate live Firestore connection on initial boot
  useEffect(() => {
    testConnection();
  }, []);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      setAuthReady(true);

      if (user) {
        // Listen to live user profile from Firestore
        const userRef = doc(db, 'users', user.uid);
        unsubscribeProfile = onSnapshot(
          userRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const profile = { id: docSnap.id, ...docSnap.data() } as UserProfile;
              setUserProfile(profile);

              // Check and update daily streak
              const streak = calculateStreakBonus(
                profile.streakDays || 0,
                profile.lastActiveDate,
                new Date().toISOString().split('T')[0]
              );

              if (streak.bonusPoints > 0) {
                updateUserProfile(user.uid, {
                  streakDays: streak.newStreak,
                  lastActiveDate: new Date().toISOString(),
                  loyaltyPoints: (profile.loyaltyPoints || 0) + streak.bonusPoints,
                }).catch(console.error);
              }
            } else {
              setUserProfile(null);
            }
          },
          (error) => {
            console.error('Error listening to user profile:', error);
          }
        );
      } else {
        if (unsubscribeProfile) unsubscribeProfile();
        setUserProfile(null);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        authReady,
        isNewGoogleUser,
        pendingGoogleUser,
        setPendingGoogleUser,
        setIsNewGoogleUser,
        refreshProfile: () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
