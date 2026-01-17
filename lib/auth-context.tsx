import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { eq } from 'drizzle-orm';
import { db } from './db/client';
import { users, type User } from './db/schema';

const SECURE_STORE_USER_KEY = 'runner_notes_user_id';
const LOCAL_USER_ID = 'local-user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-create local user on mount (skipping authentication)
  useEffect(() => {
    const initLocalUser = async () => {
      try {
        // Check if local user exists
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, LOCAL_USER_ID));

        if (existingUser) {
          setUser(existingUser);
        } else {
          // Create local user
          const now = new Date();
          await db.insert(users).values({
            id: LOCAL_USER_ID,
            appleUserId: 'local',
            email: null,
            displayName: 'Runner',
            createdAt: now,
          });

          const [newUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, LOCAL_USER_ID));

          setUser(newUser);
        }

        // Store user ID for consistency
        await SecureStore.setItemAsync(SECURE_STORE_USER_KEY, LOCAL_USER_ID);
      } catch (error) {
        console.error('Error initializing local user:', error);
      } finally {
        setLoading(false);
      }
    };

    initLocalUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
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
