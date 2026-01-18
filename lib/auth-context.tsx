import { eq } from 'drizzle-orm';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from './db/client';
import { users, type User } from './db/schema';

const LOCAL_USER_ID = 'local-user';

interface AuthContextType {
  user: User;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default user object (always available)
const DEFAULT_USER: User = {
  id: LOCAL_USER_ID,
  appleUserId: 'local',
  email: null,
  displayName: 'Runner',
  coachMode: null,
  createdAt: new Date(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, LOCAL_USER_ID));

      if (existingUser) {
        setUser(existingUser);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  // Auto-create local user on mount (no authentication required)
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

          if (newUser) {
            setUser(newUser);
          } else {
            setUser(DEFAULT_USER);
          }
        }
      } catch (error) {
        console.error('Error initializing local user:', error);
        // Even on error, use default user
        setUser(DEFAULT_USER);
      } finally {
        setLoading(false);
      }
    };

    initLocalUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
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
