import { useState, useEffect, useCallback } from 'react';
import { eq, desc, and } from 'drizzle-orm';
import { db } from '../db/client';
import { 
  runMoments, 
  pacePoints,
  journals,
  runSnaps,
  type RunMoment, 
  type NewRunMoment,
  type PacePoint,
  type NewPacePoint,
} from '../db/schema';

// Generate a unique ID (UUID-like)
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Extended RunMoment type with pace history
export interface RunMomentWithPaceHistory extends RunMoment {
  paceHistory: PacePoint[];
}

// RunMoment with journal preview and featured snap for list display
export interface RunMomentWithPreview extends RunMoment {
  journalPreview: string | null;
  featuredSnapUri: string | null;
}

interface UseRunMomentsOptions {
  userId: string | null;
}

interface UseRunMomentsReturn {
  runMoments: RunMomentWithPreview[];
  loading: boolean;
  error: Error | null;
  createRunMoment: (trailId: string, trailName: string) => Promise<string>;
  updateRunMoment: (id: string, data: Partial<RunMoment>) => Promise<void>;
  completeRunMoment: (id: string, finalData: CompleteRunData) => Promise<void>;
  deleteRunMoment: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

interface CompleteRunData {
  duration: number;
  distance: number;
  avgPace: number;
  paceHistory: Array<{
    timestamp: number;
    pace: number;
    lat: number;
    lng: number;
  }>;
}

export function useRunMoments({ userId }: UseRunMomentsOptions): UseRunMomentsReturn {
  const [momentsList, setMomentsList] = useState<RunMomentWithPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRunMoments = useCallback(async () => {
    if (!userId) {
      setMomentsList([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch all run moments
      const moments = await db
        .select()
        .from(runMoments)
        .where(eq(runMoments.userId, userId))
        .orderBy(desc(runMoments.createdAt));
      
      // Fetch the latest journal and featured snap for each run moment
      const momentsWithPreviews: RunMomentWithPreview[] = await Promise.all(
        moments.map(async (moment) => {
          const [latestJournal] = await db
            .select()
            .from(journals)
            .where(eq(journals.runMomentId, moment.id))
            .orderBy(desc(journals.createdAt))
            .limit(1);
          
          // Try to get featured snap, or fallback to most recent snap
          let [featuredSnap] = await db
            .select()
            .from(runSnaps)
            .where(and(
              eq(runSnaps.runMomentId, moment.id),
              eq(runSnaps.isFeatured, true)
            ))
            .limit(1);
          
          if (!featuredSnap) {
            [featuredSnap] = await db
              .select()
              .from(runSnaps)
              .where(eq(runSnaps.runMomentId, moment.id))
              .orderBy(desc(runSnaps.createdAt))
              .limit(1);
          }
          
          return {
            ...moment,
            journalPreview: latestJournal?.content ?? null,
            featuredSnapUri: featuredSnap?.uri ?? null,
          };
        })
      );
      
      setMomentsList(momentsWithPreviews);
      setError(null);
    } catch (err) {
      console.error('Error fetching run moments:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch run moments'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRunMoments();
  }, [fetchRunMoments]);

  const createRunMoment = useCallback(async (trailId: string, trailName: string): Promise<string> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const id = generateId();
    const now = new Date();

    const newRunMoment: NewRunMoment = {
      id,
      userId,
      trailId,
      trailName,
      startTime: now,
      duration: 0,
      distance: 0,
      avgPace: 0,
      status: 'active',
      createdAt: now,
    };

    await db.insert(runMoments).values(newRunMoment);
    await fetchRunMoments();
    
    return id;
  }, [userId, fetchRunMoments]);

  const updateRunMoment = useCallback(async (id: string, data: Partial<RunMoment>): Promise<void> => {
    await db
      .update(runMoments)
      .set(data)
      .where(eq(runMoments.id, id));
    
    await fetchRunMoments();
  }, [fetchRunMoments]);

  const completeRunMoment = useCallback(async (id: string, finalData: CompleteRunData): Promise<void> => {
    const now = new Date();

    // Update the run moment
    await db
      .update(runMoments)
      .set({
        duration: finalData.duration,
        distance: finalData.distance,
        avgPace: finalData.avgPace,
        endTime: now,
        status: 'completed',
      })
      .where(eq(runMoments.id, id));

    // Insert pace points
    if (finalData.paceHistory.length > 0) {
      const pacePointRecords: NewPacePoint[] = finalData.paceHistory.map((point) => ({
        id: generateId(),
        runMomentId: id,
        timestamp: point.timestamp,
        pace: point.pace,
        lat: point.lat,
        lng: point.lng,
      }));

      await db.insert(pacePoints).values(pacePointRecords);
    }

    await fetchRunMoments();
  }, [fetchRunMoments]);

  const deleteRunMoment = useCallback(async (id: string): Promise<void> => {
    // Pace points and journals will be deleted via CASCADE
    await db.delete(runMoments).where(eq(runMoments.id, id));
    await fetchRunMoments();
  }, [fetchRunMoments]);

  return {
    runMoments: momentsList,
    loading,
    error,
    createRunMoment,
    updateRunMoment,
    completeRunMoment,
    deleteRunMoment,
    refetch: fetchRunMoments,
  };
}

// Hook to get a single run moment with pace history
interface UseRunMomentOptions {
  userId: string | null;
  runMomentId: string | null;
}

interface UseRunMomentReturn {
  runMoment: RunMomentWithPaceHistory | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useRunMoment({ userId, runMomentId }: UseRunMomentOptions): UseRunMomentReturn {
  const [runMoment, setRunMoment] = useState<RunMomentWithPaceHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRunMoment = useCallback(async () => {
    if (!userId || !runMomentId) {
      setRunMoment(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch run moment
      const [moment] = await db
        .select()
        .from(runMoments)
        .where(and(
          eq(runMoments.id, runMomentId),
          eq(runMoments.userId, userId)
        ));

      if (!moment) {
        setRunMoment(null);
        setError(null);
        setLoading(false);
        return;
      }

      // Fetch pace history
      const paceHistory = await db
        .select()
        .from(pacePoints)
        .where(eq(pacePoints.runMomentId, runMomentId));

      setRunMoment({
        ...moment,
        paceHistory,
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching run moment:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch run moment'));
    } finally {
      setLoading(false);
    }
  }, [userId, runMomentId]);

  useEffect(() => {
    fetchRunMoment();
  }, [fetchRunMoment]);

  return {
    runMoment,
    loading,
    error,
    refetch: fetchRunMoment,
  };
}

// Standalone functions for use outside hooks
export async function createRunMomentRecord(
  userId: string, 
  trailId: string, 
  trailName: string
): Promise<string> {
  const id = generateId();
  const now = new Date();

  await db.insert(runMoments).values({
    id,
    userId,
    trailId,
    trailName,
    startTime: now,
    duration: 0,
    distance: 0,
    avgPace: 0,
    status: 'active',
    createdAt: now,
  });

  return id;
}

export async function completeRunMomentRecord(
  id: string,
  finalData: CompleteRunData
): Promise<void> {
  const now = new Date();

  await db
    .update(runMoments)
    .set({
      duration: finalData.duration,
      distance: finalData.distance,
      avgPace: finalData.avgPace,
      endTime: now,
      status: 'completed',
    })
    .where(eq(runMoments.id, id));

  if (finalData.paceHistory.length > 0) {
    const pacePointRecords: NewPacePoint[] = finalData.paceHistory.map((point) => ({
      id: generateId(),
      runMomentId: id,
      timestamp: point.timestamp,
      pace: point.pace,
      lat: point.lat,
      lng: point.lng,
    }));

    await db.insert(pacePoints).values(pacePointRecords);
  }
}

export async function getRunMomentById(
  userId: string, 
  runMomentId: string
): Promise<RunMomentWithPaceHistory | null> {
  const [moment] = await db
    .select()
    .from(runMoments)
    .where(and(
      eq(runMoments.id, runMomentId),
      eq(runMoments.userId, userId)
    ));

  if (!moment) return null;

  const paceHistory = await db
    .select()
    .from(pacePoints)
    .where(eq(pacePoints.runMomentId, runMomentId));

  return {
    ...moment,
    paceHistory,
  };
}
