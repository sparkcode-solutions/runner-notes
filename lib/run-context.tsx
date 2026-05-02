import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { calculateDistance, calculatePace, type LocationCoords } from './location';

type RunStatus = 'idle' | 'active' | 'paused';

interface PacePoint {
    timestamp: number;
    pace: number;
    lat: number;
    lng: number;
}

interface RunState {
    status: RunStatus;
    runMomentId: string | null;
    trailName: string | null;
    trailId: string | null;
    distance: number;
    duration: number;
    pace: number;
    paceHistory: PacePoint[];
    startTime: number | null;
}

interface RunContextType extends RunState {
    startRun: (trailId: string, trailName: string, momentId: string) => void;
    pauseRun: () => void;
    resumeRun: () => void;
    stopRun: () => void;
    updateLocation: (location: LocationCoords) => void;
    setRunState: (state: Partial<RunState>) => void;
    isRestored: boolean;
}

const RunContext = createContext<RunContextType | null>(null);

const STORAGE_KEY = 'current_run_state';

const initialState: RunState = {
    status: 'idle',
    runMomentId: null,
    trailName: null,
    trailId: null,
    distance: 0,
    duration: 0,
    pace: 0,
    paceHistory: [],
    startTime: null,
};

export function RunProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<RunState>(initialState);
    const [isRestored, setIsRestored] = useState(false);

    // Refs for timer logic to avoid re-renders or stale closures in interval
    const timerRef = useRef<any>(null);
    const startTimeRef = useRef<number | null>(null);
    const lastLocationRef = useRef<LocationCoords | null>(null);

    // We need a stable reference to updateLocation for the event listener
    const updateLocationRef = useRef<(loc: LocationCoords) => void>(() => { });

    // Restore state on mount
    useEffect(() => {
        const restore = async () => {
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    console.log('[RunContext] Restoring state:', parsed.status);

                    if (parsed.status !== 'idle') {
                        setState(parsed);
                        startTimeRef.current = parsed.startTime;
                        lastLocationRef.current = null; // Reset last location ref on restore to avoid huge jumps if we moved

                        // If active, resume timer
                        if (parsed.status === 'active') {
                            startTimer(parsed.startTime);
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to restore run state', e);
            } finally {
                setIsRestored(true);
            }
        };
        restore();
    }, []);

    // Persist state on change
    useEffect(() => {
        if (isRestored) {
            if (state.status === 'idle') {
                AsyncStorage.removeItem(STORAGE_KEY);
            } else {
                AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            }
        }
    }, [state, isRestored]);

    const startTimer = (startTime: number) => {
        if (timerRef.current) clearInterval(timerRef.current);

        startTimeRef.current = startTime;

        timerRef.current = setInterval(() => {
            const now = Date.now();
            setState(prev => ({
                ...prev,
                duration: Math.floor((now - startTime) / 1000)
            }));
        }, 1000);
    };

    const startRun = (trailId: string, trailName: string, momentId: string) => {
        const now = Date.now();
        const newState: RunState = {
            ...initialState,
            status: 'active',
            trailId,
            trailName,
            runMomentId: momentId,
            startTime: now,
        };
        setState(newState);
        startTimeRef.current = now;
        lastLocationRef.current = null;
        startTimer(now);
    };

    const stopRun = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setState(initialState);
        AsyncStorage.removeItem(STORAGE_KEY);
    };

    const pauseRun = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setState(prev => ({ ...prev, status: 'paused' }));
    };

    const resumeRun = () => {
        if (state.startTime) {
            startTimer(state.startTime);
            setState(prev => ({ ...prev, status: 'active' }));
        }
    };

    const updateLocation = (location: LocationCoords) => {
        if (state.status !== 'active') return;

        // Skip if first
        if (!lastLocationRef.current) {
            lastLocationRef.current = location;
            // Add initial point
            setState(prev => ({
                ...prev,
                paceHistory: [...prev.paceHistory, {
                    timestamp: location.timestamp,
                    pace: prev.pace,
                    lat: location.latitude,
                    lng: location.longitude
                }]
            }));
            return;
        }

        const distanceDelta = calculateDistance(
            lastLocationRef.current.latitude,
            lastLocationRef.current.longitude,
            location.latitude,
            location.longitude
        );

        // Only count significant movements > 1m
        if (distanceDelta > 1) {
            const newDistance = state.distance + distanceDelta;
            const currentPace = calculatePace(newDistance, state.duration);

            setState(prev => ({
                ...prev,
                distance: newDistance,
                pace: currentPace,
                paceHistory: [...prev.paceHistory, {
                    timestamp: location.timestamp,
                    pace: currentPace,
                    lat: location.latitude,
                    lng: location.longitude
                }]
            }));
        }

        lastLocationRef.current = location;
    };

    const setRunState = (updates: Partial<RunState>) => {
        setState(prev => ({ ...prev, ...updates }));
    };

    // Update ref constantly
    useEffect(() => {
        updateLocationRef.current = updateLocation;
    });

    // Listener for location updates
    useEffect(() => {
        let subscription: any;

        if (state.status === 'active') {
            subscription = DeviceEventEmitter.addListener('onLocationUpdate', (loc) => {
                updateLocationRef.current(loc);
            });
        }

        return () => {
            if (subscription) subscription.remove();
        };
    }, [state.status]);


    return (
        <RunContext.Provider value={{
            ...state,
            startRun,
            stopRun,
            pauseRun,
            resumeRun,
            updateLocation,
            setRunState,
            isRestored
        }}>
            {children}
        </RunContext.Provider>
    );
}

export const useRun = () => {
    const context = useContext(RunContext);
    if (!context) throw new Error('useRun must be used within RunProvider');
    return context;
};
