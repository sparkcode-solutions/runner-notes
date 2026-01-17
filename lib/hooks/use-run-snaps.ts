import { useState, useEffect, useCallback } from 'react';
import { eq, desc, and } from 'drizzle-orm';
import { db } from '../db/client';
import { runSnaps, type RunSnap, type NewRunSnap } from '../db/schema';
import { saveSnapImage, copySnapImage, deleteSnapImage } from '../image-storage';

// Generate a unique ID
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface UseRunSnapsOptions {
  runMomentId: string | null;
}

interface UseRunSnapsReturn {
  snaps: RunSnap[];
  featuredSnap: RunSnap | null;
  loading: boolean;
  error: Error | null;
  addSnap: (sourceUri: string, caption?: string, fromGallery?: boolean) => Promise<string>;
  deleteSnap: (id: string) => Promise<void>;
  setFeatured: (id: string) => Promise<void>;
  updateCaption: (id: string, caption: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useRunSnaps({ runMomentId }: UseRunSnapsOptions): UseRunSnapsReturn {
  const [snapsList, setSnapsList] = useState<RunSnap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSnaps = useCallback(async () => {
    if (!runMomentId) {
      setSnapsList([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await db
        .select()
        .from(runSnaps)
        .where(eq(runSnaps.runMomentId, runMomentId))
        .orderBy(desc(runSnaps.createdAt));
      
      setSnapsList(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching snaps:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch snaps'));
    } finally {
      setLoading(false);
    }
  }, [runMomentId]);

  useEffect(() => {
    fetchSnaps();
  }, [fetchSnaps]);

  // Get featured snap
  const featuredSnap = snapsList.find(snap => snap.isFeatured) || snapsList[0] || null;

  const addSnap = useCallback(async (
    sourceUri: string, 
    caption?: string,
    fromGallery = false
  ): Promise<string> => {
    if (!runMomentId) {
      throw new Error('Run moment ID is required');
    }

    // Save image to permanent storage
    const permanentUri = fromGallery 
      ? await copySnapImage(sourceUri, runMomentId)
      : await saveSnapImage(sourceUri, runMomentId);

    const id = generateId();
    const now = new Date();
    
    // Check if this is the first snap (make it featured)
    const isFirstSnap = snapsList.length === 0;

    const newSnap: NewRunSnap = {
      id,
      runMomentId,
      uri: permanentUri,
      caption: caption || null,
      isFeatured: isFirstSnap,
      createdAt: now,
    };

    await db.insert(runSnaps).values(newSnap);
    await fetchSnaps();
    
    return id;
  }, [runMomentId, snapsList.length, fetchSnaps]);

  const deleteSnap = useCallback(async (id: string): Promise<void> => {
    // Get the snap to delete the file
    const [snap] = await db
      .select()
      .from(runSnaps)
      .where(eq(runSnaps.id, id));

    if (snap) {
      // Delete the image file
      await deleteSnapImage(snap.uri);
      
      // Delete from database
      await db.delete(runSnaps).where(eq(runSnaps.id, id));
      
      // If this was the featured snap, make another one featured
      if (snap.isFeatured && runMomentId) {
        const [nextSnap] = await db
          .select()
          .from(runSnaps)
          .where(eq(runSnaps.runMomentId, runMomentId))
          .orderBy(desc(runSnaps.createdAt))
          .limit(1);
        
        if (nextSnap) {
          await db
            .update(runSnaps)
            .set({ isFeatured: true })
            .where(eq(runSnaps.id, nextSnap.id));
        }
      }
    }
    
    await fetchSnaps();
  }, [runMomentId, fetchSnaps]);

  const setFeatured = useCallback(async (id: string): Promise<void> => {
    if (!runMomentId) return;

    // Remove featured from all snaps in this run
    await db
      .update(runSnaps)
      .set({ isFeatured: false })
      .where(eq(runSnaps.runMomentId, runMomentId));

    // Set the new featured snap
    await db
      .update(runSnaps)
      .set({ isFeatured: true })
      .where(eq(runSnaps.id, id));

    await fetchSnaps();
  }, [runMomentId, fetchSnaps]);

  const updateCaption = useCallback(async (id: string, caption: string): Promise<void> => {
    await db
      .update(runSnaps)
      .set({ caption })
      .where(eq(runSnaps.id, id));

    await fetchSnaps();
  }, [fetchSnaps]);

  return {
    snaps: snapsList,
    featuredSnap,
    loading,
    error,
    addSnap,
    deleteSnap,
    setFeatured,
    updateCaption,
    refetch: fetchSnaps,
  };
}

// Standalone function to get featured snap for a run
export async function getFeaturedSnapForRun(runMomentId: string): Promise<RunSnap | null> {
  const [featured] = await db
    .select()
    .from(runSnaps)
    .where(and(
      eq(runSnaps.runMomentId, runMomentId),
      eq(runSnaps.isFeatured, true)
    ))
    .limit(1);

  if (featured) return featured;

  // Fallback to most recent snap
  const [mostRecent] = await db
    .select()
    .from(runSnaps)
    .where(eq(runSnaps.runMomentId, runMomentId))
    .orderBy(desc(runSnaps.createdAt))
    .limit(1);

  return mostRecent || null;
}

// Get snap count for a run
export async function getSnapCountForRun(runMomentId: string): Promise<number> {
  const result = await db
    .select()
    .from(runSnaps)
    .where(eq(runSnaps.runMomentId, runMomentId));

  return result.length;
}
