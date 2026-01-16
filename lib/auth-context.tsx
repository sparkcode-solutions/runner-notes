import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebase';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import { createUser } from './firestore';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithApple = async () => {
    try {
      // Start the sign-in request
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Create a Firebase credential from the Apple credential
      const { identityToken } = credential;
      if (!identityToken) {
        throw new Error('No identity token returned from Apple');
      }

      const appleCredential = auth.AppleAuthProvider.credential(identityToken);

      // Sign in to Firebase with the Apple credential
      const userCredential = await auth().signInWithCredential(appleCredential);

      // Create user document in Firestore if it's a new user
      if (userCredential.additionalUserInfo?.isNewUser && userCredential.user) {
        const displayName = credential.fullName
          ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
          : undefined;

        await createUser(
          userCredential.user.uid,
          userCredential.user.email || '',
          displayName
        );
      }
    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        // User canceled the sign-in flow
        console.log('User canceled Apple Sign-In');
      } else {
        console.error('Error signing in with Apple:', error);
        throw error;
      }
    }
  };

  const signOut = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithApple, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
