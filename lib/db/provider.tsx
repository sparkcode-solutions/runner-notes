import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from './client';
import { runMigrations } from './migrations';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import type * as schema from './schema';

interface DatabaseContextType {
  db: ExpoSQLiteDatabase<typeof schema>;
  isReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

interface DatabaseProviderProps {
  children: React.ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        await runMigrations();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        // Still set ready to true to allow app to function
        // Error handling can be improved based on requirements
        setIsReady(true);
      }
    };

    initDatabase();
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, isReady }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = (): DatabaseContextType => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

// Re-export db for direct access when needed
export { db };
