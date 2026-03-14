'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase';

export type UserRole = 'chro' | 'hr_partner' | 'talent_ops' | 'engagement_manager';

export const USER_ROLE_ROUTES: Record<UserRole, string> = {
  chro: '/dashboard',
  hr_partner: '/employees',
  talent_ops: '/employee-insights',
  engagement_manager: '/engagement-analytics',
};

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  setRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const COLLECTION_USERS = 'users';

async function getUserProfile(
  uid: string,
  email: string
): Promise<{ name: string; role: UserRole | null }> {
  const db = getFirebaseDb();
  if (!db) return { name: '', role: null };
  const snap = await getDoc(doc(db, COLLECTION_USERS, uid));
  if (!snap.exists()) return { name: '', role: null };
  const data = snap.data();
  return {
    name: data.name ?? '',
    role: (data.role as UserRole) ?? null,
  };
}

function mapFirebaseUser(fbUser: FirebaseUser, profile: { name: string; role: UserRole | null }): User {
  return {
    id: fbUser.uid,
    name: profile.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
    email: fbUser.email ?? '',
    role: profile.role,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setIsLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      setIsLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      try {
        const profile = await getUserProfile(fbUser.uid, fbUser.email ?? '');
        setUser(mapFirebaseUser(fbUser, profile));
      } catch (err) {
        setUser(
          mapFirebaseUser(fbUser, { name: fbUser.displayName ?? '', role: null })
        );
      } finally {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase is not configured.');
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getUserProfile(cred.user.uid, cred.user.email ?? '');
      setUser(mapFirebaseUser(cred.user, profile));
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'code' in err
          ? (err as { code: string }).code === 'auth/invalid-credential' ||
            (err as { code: string }).code === 'auth/user-not-found'
            ? 'Invalid email or password.'
            : (err as { message?: string }).message ?? 'Sign in failed.'
          : 'Sign in failed.';
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ) => {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    if (!auth) throw new Error('Firebase is not configured.');
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      if (db) {
        await setDoc(doc(db, COLLECTION_USERS, uid), {
          name,
          email,
          role,
          createdAt: new Date().toISOString(),
        });
      }
      setUser(
        mapFirebaseUser(cred.user, { name, role })
      );
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'code' in err
          ? (err as { code: string }).code === 'auth/email-already-in-use'
            ? 'An account with this email already exists.'
            : (err as { message?: string }).message ?? 'Sign up failed.'
          : 'Sign up failed.';
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    const auth = getFirebaseAuth();
    if (auth) signOut(auth);
    setUser(null);
  };

  const setRole = async (role: UserRole) => {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    const uid = user?.id ?? auth?.currentUser?.uid;
    if (db && uid) {
      await updateDoc(doc(db, COLLECTION_USERS, uid), { role });
    }
    if (user) {
      setUser({ ...user, role });
    } else if (auth?.currentUser) {
      const profile = await getUserProfile(auth.currentUser.uid, auth.currentUser.email ?? '');
      setUser(
        mapFirebaseUser(auth.currentUser, { ...profile, role })
      );
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
