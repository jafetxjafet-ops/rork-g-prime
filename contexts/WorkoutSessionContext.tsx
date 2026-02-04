import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Exercise, WorkoutSet, CompletedWorkout, WorkoutExerciseSession } from '@/types/workout';

const COMPLETED_WORKOUTS_KEY = 'completed_workouts';
const PR_STORAGE_KEY = 'personal_records';

export const [WorkoutSessionProvider, useWorkoutSession] = createContextHook(() => {
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExerciseSession[]>([]);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);

  const addExerciseToWorkout = useCallback((exercise: Exercise) => {
    console.log('[WorkoutSession] Adding exercise:', exercise.name);
    setSelectedExercises(prev => {
      const exists = prev.find(e => e.exercise.id === exercise.id);
      if (exists) return prev;
      return [...prev, {
        exercise,
        sets: [{ weight: 0, reps: 0, completed: false }],
      }];
    });
  }, []);

  const removeExerciseFromWorkout = useCallback((exerciseId: string) => {
    console.log('[WorkoutSession] Removing exercise:', exerciseId);
    setSelectedExercises(prev => prev.filter(e => e.exercise.id !== exerciseId));
  }, []);

  const addSet = useCallback((exerciseId: string) => {
    console.log('[WorkoutSession] Adding set for exercise:', exerciseId);
    setSelectedExercises(prev => prev.map(e => {
      if (e.exercise.id === exerciseId) {
        return {
          ...e,
          sets: [...e.sets, { weight: 0, reps: 0, completed: false }],
        };
      }
      return e;
    }));
  }, []);

  const duplicateSet = useCallback((exerciseId: string) => {
    console.log('[WorkoutSession] Duplicating last set for exercise:', exerciseId);
    setSelectedExercises(prev => prev.map(e => {
      if (e.exercise.id === exerciseId && e.sets.length > 0) {
        const lastSet = e.sets[e.sets.length - 1];
        return {
          ...e,
          sets: [...e.sets, { ...lastSet, completed: false }],
        };
      }
      return e;
    }));
  }, []);

  const removeSet = useCallback((exerciseId: string, setIndex: number) => {
    console.log('[WorkoutSession] Removing set:', setIndex, 'for exercise:', exerciseId);
    setSelectedExercises(prev => prev.map(e => {
      if (e.exercise.id === exerciseId) {
        const newSets = e.sets.filter((_, i) => i !== setIndex);
        return {
          ...e,
          sets: newSets.length > 0 ? newSets : [{ weight: 0, reps: 0, completed: false }],
        };
      }
      return e;
    }));
  }, []);

  const updateSet = useCallback((exerciseId: string, setIndex: number, updates: Partial<WorkoutSet>) => {
    setSelectedExercises(prev => prev.map(e => {
      if (e.exercise.id === exerciseId) {
        return {
          ...e,
          sets: e.sets.map((set, i) => i === setIndex ? { ...set, ...updates } : set),
        };
      }
      return e;
    }));
  }, []);

  const toggleSetCompleted = useCallback((exerciseId: string, setIndex: number) => {
    setSelectedExercises(prev => prev.map(e => {
      if (e.exercise.id === exerciseId) {
        return {
          ...e,
          sets: e.sets.map((set, i) => i === setIndex ? { ...set, completed: !set.completed } : set),
        };
      }
      return e;
    }));
  }, []);

  const startWorkout = useCallback(() => {
    console.log('[WorkoutSession] Starting workout');
    setIsWorkoutActive(true);
    setWorkoutStartTime(new Date());
  }, []);

  const finishWorkout = useCallback(async (): Promise<{ completedWorkout: CompletedWorkout; newPRs: Record<string, number> }> => {
    console.log('[WorkoutSession] Finishing workout');
    
    const endTime = new Date();
    const duration = workoutStartTime 
      ? Math.round((endTime.getTime() - workoutStartTime.getTime()) / 60000)
      : 0;

    const completedWorkout: CompletedWorkout = {
      id: `workout_${Date.now()}`,
      date: endTime.toISOString(),
      duration,
      exercises: selectedExercises.map(e => ({
        exerciseId: e.exercise.id,
        exerciseName: e.exercise.name,
        muscleGroup: e.exercise.muscleGroup,
        sets: e.sets.filter(s => s.completed),
      })),
      totalVolume: selectedExercises.reduce((total, e) => {
        return total + e.sets
          .filter(s => s.completed)
          .reduce((setTotal, s) => setTotal + (s.weight * s.reps), 0);
      }, 0),
    };

    try {
      const storedWorkouts = await AsyncStorage.getItem(COMPLETED_WORKOUTS_KEY);
      const workouts: CompletedWorkout[] = storedWorkouts ? JSON.parse(storedWorkouts) : [];
      workouts.unshift(completedWorkout);
      await AsyncStorage.setItem(COMPLETED_WORKOUTS_KEY, JSON.stringify(workouts.slice(0, 100)));
      console.log('[WorkoutSession] Saved completed workout');
    } catch (error) {
      console.error('[WorkoutSession] Error saving workout:', error);
    }

    const newPRs: Record<string, number> = {};
    try {
      const storedPRs = await AsyncStorage.getItem(PR_STORAGE_KEY);
      const prs: Record<string, number> = storedPRs ? JSON.parse(storedPRs) : {};
      
      for (const exercise of selectedExercises) {
        const maxWeight = Math.max(...exercise.sets.filter(s => s.completed).map(s => s.weight));
        if (maxWeight > 0) {
          const currentPR = prs[exercise.exercise.id] || 0;
          if (maxWeight > currentPR) {
            prs[exercise.exercise.id] = maxWeight;
            newPRs[exercise.exercise.id] = maxWeight;
            console.log('[WorkoutSession] New PR for', exercise.exercise.name, ':', maxWeight);
          }
        }
      }
      
      await AsyncStorage.setItem(PR_STORAGE_KEY, JSON.stringify(prs));
    } catch (error) {
      console.error('[WorkoutSession] Error updating PRs:', error);
    }

    setIsWorkoutActive(false);
    setWorkoutStartTime(null);
    setSelectedExercises([]);

    return { completedWorkout, newPRs };
  }, [selectedExercises, workoutStartTime]);

  const cancelWorkout = useCallback(() => {
    console.log('[WorkoutSession] Cancelling workout');
    setIsWorkoutActive(false);
    setWorkoutStartTime(null);
    setSelectedExercises([]);
  }, []);

  const clearSelectedExercises = useCallback(() => {
    setSelectedExercises([]);
  }, []);

  return {
    selectedExercises,
    isWorkoutActive,
    workoutStartTime,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    addSet,
    duplicateSet,
    removeSet,
    updateSet,
    toggleSetCompleted,
    startWorkout,
    finishWorkout,
    cancelWorkout,
    clearSelectedExercises,
  };
});
