import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuthMethod = 'guest' | 'phone';

interface UserProfile {
  id: string;
  name: string;
  photoUri: string | null;
  authMethod: AuthMethod;
  phoneNumber?: string;
  createdAt: string;
}

interface UserStats {
  totalExercises: number;
  totalSets: number;
  totalReps: number;
  level: number;
  currentXp: number;
  xpToNextLevel: number;
}

const USER_PROFILE_KEY = 'user_profile';
const USER_STATS_KEY = 'user_stats';

const XP_PER_EXERCISE = 50;
const XP_PER_SET = 10;
const XP_PER_REP = 1;
const BASE_XP_PER_LEVEL = 500;

function calculateLevel(totalXp: number): { level: number; currentXp: number; xpToNextLevel: number } {
  let level = 0;
  let remainingXp = totalXp;
  let xpForCurrentLevel = BASE_XP_PER_LEVEL;

  while (remainingXp >= xpForCurrentLevel) {
    remainingXp -= xpForCurrentLevel;
    level++;
    xpForCurrentLevel = BASE_XP_PER_LEVEL + (level * 100);
  }

  return {
    level,
    currentXp: remainingXp,
    xpToNextLevel: xpForCurrentLevel,
  };
}

export const [UserProvider, useUser] = createContextHook(() => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalExercises: 0,
    totalSets: 0,
    totalReps: 0,
    level: 0,
    currentXp: 0,
    xpToNextLevel: BASE_XP_PER_LEVEL,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      console.log('[UserContext] Loading user data...');
      const [storedProfile, storedStats] = await Promise.all([
        AsyncStorage.getItem(USER_PROFILE_KEY),
        AsyncStorage.getItem(USER_STATS_KEY),
      ]);

      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile) as UserProfile;
        setProfile(parsedProfile);
        setIsAuthenticated(true);
        console.log('[UserContext] User profile loaded:', parsedProfile.name);
      }

      if (storedStats) {
        const parsedStats = JSON.parse(storedStats) as UserStats;
        setStats(parsedStats);
        console.log('[UserContext] User stats loaded, level:', parsedStats.level);
      }
    } catch (error) {
      console.error('[UserContext] Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsGuest = useCallback(async () => {
    console.log('[UserContext] Logging in as guest...');
    const guestProfile: UserProfile = {
      id: `guest_${Date.now()}`,
      name: 'Invitado',
      photoUri: null,
      authMethod: 'guest',
      createdAt: new Date().toISOString(),
    };

    const initialStats: UserStats = {
      totalExercises: 0,
      totalSets: 0,
      totalReps: 0,
      level: 0,
      currentXp: 0,
      xpToNextLevel: BASE_XP_PER_LEVEL,
    };

    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(guestProfile));
      await AsyncStorage.setItem(USER_STATS_KEY, JSON.stringify(initialStats));
      setProfile(guestProfile);
      setStats(initialStats);
      setIsAuthenticated(true);
      console.log('[UserContext] Guest login successful');
    } catch (error) {
      console.error('[UserContext] Failed to save guest profile:', error);
    }
  }, []);

  const loginWithPhone = useCallback(async (phoneNumber: string) => {
    console.log('[UserContext] Logging in with phone:', phoneNumber);
    const phoneProfile: UserProfile = {
      id: `phone_${Date.now()}`,
      name: 'Usuario',
      photoUri: null,
      authMethod: 'phone',
      phoneNumber,
      createdAt: new Date().toISOString(),
    };

    const initialStats: UserStats = {
      totalExercises: 0,
      totalSets: 0,
      totalReps: 0,
      level: 0,
      currentXp: 0,
      xpToNextLevel: BASE_XP_PER_LEVEL,
    };

    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(phoneProfile));
      await AsyncStorage.setItem(USER_STATS_KEY, JSON.stringify(initialStats));
      setProfile(phoneProfile);
      setStats(initialStats);
      setIsAuthenticated(true);
      console.log('[UserContext] Phone login successful');
    } catch (error) {
      console.error('[UserContext] Failed to save phone profile:', error);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Pick<UserProfile, 'name' | 'photoUri'>>) => {
    if (!profile) return;
    
    console.log('[UserContext] Updating profile:', updates);
    const updatedProfile = { ...profile, ...updates };
    
    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      console.log('[UserContext] Profile updated successfully');
    } catch (error) {
      console.error('[UserContext] Failed to update profile:', error);
    }
  }, [profile]);

  const addWorkoutXp = useCallback(async (exerciseCount: number, setCount: number, repCount: number) => {
    console.log('[UserContext] Adding workout XP:', { exerciseCount, setCount, repCount });
    
    const xpGained = (exerciseCount * XP_PER_EXERCISE) + (setCount * XP_PER_SET) + (repCount * XP_PER_REP);
    const newTotalExercises = stats.totalExercises + exerciseCount;
    const newTotalSets = stats.totalSets + setCount;
    const newTotalReps = stats.totalReps + repCount;
    
    const totalXp = (newTotalExercises * XP_PER_EXERCISE) + (newTotalSets * XP_PER_SET) + (newTotalReps * XP_PER_REP);
    const { level, currentXp, xpToNextLevel } = calculateLevel(totalXp);

    const newStats: UserStats = {
      totalExercises: newTotalExercises,
      totalSets: newTotalSets,
      totalReps: newTotalReps,
      level,
      currentXp,
      xpToNextLevel,
    };

    try {
      await AsyncStorage.setItem(USER_STATS_KEY, JSON.stringify(newStats));
      setStats(newStats);
      console.log('[UserContext] XP added, new level:', level, 'XP gained:', xpGained);
      return xpGained;
    } catch (error) {
      console.error('[UserContext] Failed to update stats:', error);
      return 0;
    }
  }, [stats]);

  const logout = useCallback(async () => {
    console.log('[UserContext] Logging out...');
    try {
      await AsyncStorage.multiRemove([USER_PROFILE_KEY, USER_STATS_KEY]);
      setProfile(null);
      setStats({
        totalExercises: 0,
        totalSets: 0,
        totalReps: 0,
        level: 0,
        currentXp: 0,
        xpToNextLevel: BASE_XP_PER_LEVEL,
      });
      setIsAuthenticated(false);
      console.log('[UserContext] Logout successful');
    } catch (error) {
      console.error('[UserContext] Failed to logout:', error);
    }
  }, []);

  return {
    profile,
    stats,
    isLoading,
    isAuthenticated,
    loginAsGuest,
    loginWithPhone,
    updateProfile,
    addWorkoutXp,
    logout,
  };
});
