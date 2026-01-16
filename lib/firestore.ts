import { firestore } from './firebase';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface Trail {
  id: string;
  name: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

export interface PacePoint {
  timestamp: number;
  pace: number; // min/km
  lat: number;
  lng: number;
}

export interface RunMoment {
  id: string;
  trailId: string;
  trailName: string;
  startTime: FirebaseFirestoreTypes.Timestamp;
  endTime?: FirebaseFirestoreTypes.Timestamp;
  duration: number; // seconds
  distance: number; // meters
  avgPace: number; // min/km
  paceHistory: PacePoint[];
  status: 'active' | 'paused' | 'completed';
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

export interface Journal {
  id: string;
  content: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

// User helpers
export const createUser = async (userId: string, email: string, displayName?: string) => {
  await firestore()
    .collection('users')
    .doc(userId)
    .set({
      email,
      displayName: displayName || '',
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
};

// Trail helpers
export const getTrails = (userId: string) => {
  return firestore()
    .collection('users')
    .doc(userId)
    .collection('trails')
    .orderBy('createdAt', 'desc');
};

export const createTrail = async (userId: string, name: string) => {
  const trailRef = await firestore()
    .collection('users')
    .doc(userId)
    .collection('trails')
    .add({
      name,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  return trailRef.id;
};

// Run Moment helpers
export const getRunMoments = (userId: string) => {
  return firestore()
    .collection('users')
    .doc(userId)
    .collection('runMoments')
    .orderBy('createdAt', 'desc');
};

export const getRunMoment = (userId: string, runMomentId: string) => {
  return firestore()
    .collection('users')
    .doc(userId)
    .collection('runMoments')
    .doc(runMomentId);
};

export const createRunMoment = async (
  userId: string,
  trailId: string,
  trailName: string
) => {
  const runMomentRef = await firestore()
    .collection('users')
    .doc(userId)
    .collection('runMoments')
    .add({
      trailId,
      trailName,
      startTime: firestore.FieldValue.serverTimestamp(),
      duration: 0,
      distance: 0,
      avgPace: 0,
      paceHistory: [],
      status: 'active',
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  return runMomentRef.id;
};

export const updateRunMoment = async (
  userId: string,
  runMomentId: string,
  data: Partial<RunMoment>
) => {
  await firestore()
    .collection('users')
    .doc(userId)
    .collection('runMoments')
    .doc(runMomentId)
    .update(data);
};

export const completeRunMoment = async (
  userId: string,
  runMomentId: string,
  finalData: {
    duration: number;
    distance: number;
    avgPace: number;
    paceHistory: PacePoint[];
  }
) => {
  await firestore()
    .collection('users')
    .doc(userId)
    .collection('runMoments')
    .doc(runMomentId)
    .update({
      ...finalData,
      endTime: firestore.FieldValue.serverTimestamp(),
      status: 'completed',
    });
};

// Journal helpers
export const getJournals = (userId: string, runMomentId: string) => {
  return firestore()
    .collection('users')
    .doc(userId)
    .collection('runMoments')
    .doc(runMomentId)
    .collection('journals')
    .orderBy('createdAt', 'desc');
};

export const createJournal = async (
  userId: string,
  runMomentId: string,
  content: string
) => {
  const journalRef = await firestore()
    .collection('users')
    .doc(userId)
    .collection('runMoments')
    .doc(runMomentId)
    .collection('journals')
    .add({
      content,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  return journalRef.id;
};

export const updateJournal = async (
  userId: string,
  runMomentId: string,
  journalId: string,
  content: string
) => {
  await firestore()
    .collection('users')
    .doc(userId)
    .collection('runMoments')
    .doc(runMomentId)
    .collection('journals')
    .doc(journalId)
    .update({
      content,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
};

export const deleteJournal = async (
  userId: string,
  runMomentId: string,
  journalId: string
) => {
  await firestore()
    .collection('users')
    .doc(userId)
    .collection('runMoments')
    .doc(runMomentId)
    .collection('journals')
    .doc(journalId)
    .delete();
};
