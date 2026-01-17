import { useState, useEffect, useCallback } from 'react';
import { eq, desc, and } from 'drizzle-orm';
import { db } from '../db/client';
import { journals, type Journal, type NewJournal } from '../db/schema';

// Generate a unique ID (UUID-like)
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface UseJournalsOptions {
  runMomentId: string | null;
}

interface UseJournalsReturn {
  journals: Journal[];
  loading: boolean;
  error: Error | null;
  createJournal: (content: string) => Promise<string>;
  updateJournal: (id: string, content: string) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useJournals({ runMomentId }: UseJournalsOptions): UseJournalsReturn {
  const [journalsList, setJournalsList] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchJournals = useCallback(async () => {
    if (!runMomentId) {
      setJournalsList([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await db
        .select()
        .from(journals)
        .where(eq(journals.runMomentId, runMomentId))
        .orderBy(desc(journals.createdAt));
      
      setJournalsList(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching journals:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch journals'));
    } finally {
      setLoading(false);
    }
  }, [runMomentId]);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  const createJournal = useCallback(async (content: string): Promise<string> => {
    if (!runMomentId) {
      throw new Error('Run moment ID is required');
    }

    const id = generateId();
    const now = new Date();

    const newJournal: NewJournal = {
      id,
      runMomentId,
      content,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(journals).values(newJournal);
    await fetchJournals();
    
    return id;
  }, [runMomentId, fetchJournals]);

  const updateJournal = useCallback(async (id: string, content: string): Promise<void> => {
    const now = new Date();
    
    await db
      .update(journals)
      .set({
        content,
        updatedAt: now,
      })
      .where(eq(journals.id, id));
    
    await fetchJournals();
  }, [fetchJournals]);

  const deleteJournal = useCallback(async (id: string): Promise<void> => {
    await db.delete(journals).where(eq(journals.id, id));
    await fetchJournals();
  }, [fetchJournals]);

  return {
    journals: journalsList,
    loading,
    error,
    createJournal,
    updateJournal,
    deleteJournal,
    refetch: fetchJournals,
  };
}

// Hook to get a single journal
interface UseJournalOptions {
  journalId: string | null;
  runMomentId: string | null;
}

interface UseJournalReturn {
  journal: Journal | null;
  loading: boolean;
  error: Error | null;
  updateJournal: (content: string) => Promise<void>;
  deleteJournal: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useJournal({ journalId, runMomentId }: UseJournalOptions): UseJournalReturn {
  const [journal, setJournal] = useState<Journal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchJournal = useCallback(async () => {
    if (!journalId || !runMomentId) {
      setJournal(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const [result] = await db
        .select()
        .from(journals)
        .where(and(
          eq(journals.id, journalId),
          eq(journals.runMomentId, runMomentId)
        ));

      setJournal(result || null);
      setError(null);
    } catch (err) {
      console.error('Error fetching journal:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch journal'));
    } finally {
      setLoading(false);
    }
  }, [journalId, runMomentId]);

  useEffect(() => {
    fetchJournal();
  }, [fetchJournal]);

  const updateJournal = useCallback(async (content: string): Promise<void> => {
    if (!journalId) {
      throw new Error('Journal ID is required');
    }

    const now = new Date();
    
    await db
      .update(journals)
      .set({
        content,
        updatedAt: now,
      })
      .where(eq(journals.id, journalId));
    
    await fetchJournal();
  }, [journalId, fetchJournal]);

  const deleteJournal = useCallback(async (): Promise<void> => {
    if (!journalId) {
      throw new Error('Journal ID is required');
    }

    await db.delete(journals).where(eq(journals.id, journalId));
  }, [journalId]);

  return {
    journal,
    loading,
    error,
    updateJournal,
    deleteJournal,
    refetch: fetchJournal,
  };
}

// Standalone functions
export async function createJournalRecord(runMomentId: string, content: string): Promise<string> {
  const id = generateId();
  const now = new Date();

  await db.insert(journals).values({
    id,
    runMomentId,
    content,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

export async function updateJournalRecord(journalId: string, content: string): Promise<void> {
  const now = new Date();
  
  await db
    .update(journals)
    .set({
      content,
      updatedAt: now,
    })
    .where(eq(journals.id, journalId));
}

export async function deleteJournalRecord(journalId: string): Promise<void> {
  await db.delete(journals).where(eq(journals.id, journalId));
}

export async function getJournalById(journalId: string): Promise<Journal | null> {
  const [result] = await db
    .select()
    .from(journals)
    .where(eq(journals.id, journalId));

  return result || null;
}

export async function getJournalsForRunMoment(runMomentId: string): Promise<Journal[]> {
  return db
    .select()
    .from(journals)
    .where(eq(journals.runMomentId, runMomentId))
    .orderBy(desc(journals.createdAt));
}
