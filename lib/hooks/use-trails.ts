import { useState, useEffect, useCallback } from 'react';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/client';
import { trails, type Trail, type NewTrail } from '../db/schema';

// Generate a unique ID (UUID-like)
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface UseTrailsOptions {
  userId: string;
}

interface UseTrailsReturn {
  trails: Trail[];
  loading: boolean;
  error: Error | null;
  createTrail: (name: string) => Promise<string>;
  deleteTrail: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useTrails({ userId }: UseTrailsOptions): UseTrailsReturn {
  const [trailsList, setTrailsList] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTrails = useCallback(async () => {
    try {
      setLoading(true);
      const result = await db
        .select()
        .from(trails)
        .where(eq(trails.userId, userId))
        .orderBy(desc(trails.createdAt));
      
      setTrailsList(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching trails:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch trails'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTrails();
  }, [fetchTrails]);

  const createTrail = useCallback(async (name: string): Promise<string> => {
    const id = generateId();
    const now = new Date();

    const newTrail: NewTrail = {
      id,
      userId,
      name,
      createdAt: now,
    };

    await db.insert(trails).values(newTrail);
    
    // Refetch to update the list
    await fetchTrails();
    
    return id;
  }, [userId, fetchTrails]);

  const deleteTrail = useCallback(async (id: string): Promise<void> => {
    await db.delete(trails).where(eq(trails.id, id));
    await fetchTrails();
  }, [fetchTrails]);

  return {
    trails: trailsList,
    loading,
    error,
    createTrail,
    deleteTrail,
    refetch: fetchTrails,
  };
}

// Standalone function for creating a trail (used in components that don't need the full hook)
export async function createTrailRecord(userId: string, name: string): Promise<string> {
  const id = generateId();
  const now = new Date();

  await db.insert(trails).values({
    id,
    userId,
    name,
    createdAt: now,
  });

  return id;
}

// Get all trails for a user
export async function getTrailsForUser(userId: string): Promise<Trail[]> {
  return db
    .select()
    .from(trails)
    .where(eq(trails.userId, userId))
    .orderBy(desc(trails.createdAt));
}
