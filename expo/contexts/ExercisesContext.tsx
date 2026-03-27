import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { exercises as defaultExercises } from '@/mocks/exercises';
import { Exercise } from '@/types/workout';

const CUSTOM_EXERCISES_KEY = 'custom_exercises';

export const [ExercisesProvider, useExercises] = createContextHook(() => {
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCustomExercises();
  }, []);

  const loadCustomExercises = async () => {
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_EXERCISES_KEY);
      if (stored) {
        setCustomExercises(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load custom exercises:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCustomExercises = async (exercises: Exercise[]) => {
    try {
      await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(exercises));
      setCustomExercises(exercises);
    } catch (error) {
      console.error('Failed to save custom exercises:', error);
    }
  };

  const addCustomExercise = (exercise: Omit<Exercise, 'id'>) => {
    const newExercise: Exercise = {
      ...exercise,
      id: `custom_${Date.now()}`,
    };
    const updated = [...customExercises, newExercise];
    saveCustomExercises(updated);
  };

  const deleteCustomExercise = (id: string) => {
    const updated = customExercises.filter(ex => ex.id !== id);
    saveCustomExercises(updated);
  };

  const allExercises = [...defaultExercises, ...customExercises];

  return {
    allExercises,
    customExercises,
    defaultExercises,
    isLoading,
    addCustomExercise,
    deleteCustomExercise,
  };
});
