import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  fbSignOut,
  onAuthStateChanged,
  User,
  db,
  doc,
  setDoc,
  serverTimestamp,
} from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  setAuthError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        // Sync user profile to Firestore
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          await setDoc(
            userRef,
            {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Learner',
              photoURL: firebaseUser.photoURL || '',
              lastLoginAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (e) {
          console.warn('Could not sync user profile to firestore:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign in window was closed. Please try again.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignored
      } else {
        setAuthError(err.message || 'Failed to sign in with Google.');
      }
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: any) {
      console.error('Email Sign In Error:', err);
      let msg = 'Failed to sign in. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email address or password.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed attempts. Please try again later.';
      }
      setAuthError(msg);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: name.trim(),
        });
      }
    } catch (err: any) {
      console.error('Sign Up Error:', err);
      let msg = 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please sign in.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password must be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      setAuthError(msg);
      throw err;
    }
  };

  const signOut = async () => {
    setAuthError(null);
    try {
      await fbSignOut(auth);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        authError,
        setAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
