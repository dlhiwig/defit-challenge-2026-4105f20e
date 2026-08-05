/**
 * Firebase Auth Context
 * 
 * Provides authentication state and methods using Firebase Auth.
 * Shares the same Firebase project as the DEFIT App (defit.work),
 * so users can sign up on either site and log into both.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
  linkWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { initializeFirebase, getFirebaseAuth } from '@/lib/firebase';

// Initialize Firebase on module load
initializeFirebase();

// Firebase exposes `uid`; the app consumes `id` throughout, so we expose both.
export type AppUser = User & { id: string };

interface AuthContextType {
  user: AppUser | null;
  session: { access_token?: string } | null; // Compatibility with old code
  loading: boolean;
  isDemoMode: boolean; // Always false now
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(
        firebaseUser
          ? (Object.assign(Object.create(Object.getPrototypeOf(firebaseUser)), firebaseUser, {
              id: firebaseUser.uid,
            }) as AppUser)
          : null
      );
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const auth = getFirebaseAuth();
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      if (result.user && fullName) {
        await updateProfile(result.user, { displayName: fullName });
      }
      
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signInWithApple = async () => {
    try {
      const auth = getFirebaseAuth();
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      await signInWithPopup(auth, provider);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session: user ? { access_token: undefined } : null, // Compatibility stub
      loading,
      isDemoMode: false, // Firebase auth is always live
      signUp,
      signIn,
      signInWithGoogle,
      signInWithApple,
      resetPassword,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
