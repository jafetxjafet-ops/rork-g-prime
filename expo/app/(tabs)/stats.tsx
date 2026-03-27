import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrendingUp, Calendar, Dumbbell, Award, Crown, ArrowUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import LavaBackground from '@/components/LavaBackground';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import type { CompletedWorkout, MuscleGroup } from '@/types/workout';

const COMPLETED_WORKOUTS_KEY = 'completed_workouts';
const PR_STORAGE_KEY = 'personal_records';

interface MuscleVolume {
  name: string;
  volume: number;
  sessions: number;
  percentage: number;
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const { getTextColors } = useAppSettings();
  const textColors = getTextColors();

  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [personalRecords, setPersonalRecords] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [workoutsStr, prsStr] = await Promise.all([
          AsyncStorage.getItem(COMPLETED_WORKOUTS_KEY),
          AsyncStorage.getItem(PR_STORAGE_KEY),
        ]);
        
        if (workoutsStr) {
          setCompletedWorkouts(JSON.parse(workoutsStr));
        }
        if (prsStr) {
          setPersonalRecords(JSON.parse(prsStr));
        }
      } catch (error) {
        console.error('[Stats] Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const thisMonthWorkouts = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return completedWorkouts.filter(w => new Date(w.date) >= startOfMonth);
  }, [completedWorkouts]);

  const weeklyData = useMemo(() => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    return days.map((day, index) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + index);
      
      const dayWorkouts = completedWorkouts.filter(w => {
        const workoutDate = new Date(w.date);
        return workoutDate.toDateString() === dayDate.toDateString();
      });
      
      const volume = dayWorkouts.reduce((sum, w) => sum + w.totalVolume, 0);
      return { day, volume };
    });
  }, [completedWorkouts]);

  const maxVolume = Math.max(...weeklyData.map(d => d.volume), 1);

  const monthlyStats = useMemo(() => {
    const totalVolume = thisMonthWorkouts.reduce((sum, w) => sum + w.totalVolume, 0);
    const prCount = Object.keys(personalRecords).length;
    
    return [
      { label: t.stats.workoutCount, value: thisMonthWorkouts.length.toString(), change: '+12%', icon: Dumbbell },
      { label: t.stats.volumeLifted, value: totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(0)}K` : totalVolume.toString(), change: '+18%', icon: TrendingUp },
      { label: t.stats.personalRecords, value: prCount.toString(), change: `+${Math.min(prCount, 5)}`, icon: Award },
    ];
  }, [thisMonthWorkouts, personalRecords, t.stats]);

  const muscleVolumes = useMemo((): MuscleVolume[] => {
    const volumes: Record<MuscleGroup, { volume: number; sessions: Set<string> }> = {
      'Pecho': { volume: 0, sessions: new Set() },
      'Espalda': { volume: 0, sessions: new Set() },
      'Piernas': { volume: 0, sessions: new Set() },
      'Hombros': { volume: 0, sessions: new Set() },
      'Brazos': { volume: 0, sessions: new Set() },
      'Core': { volume: 0, sessions: new Set() },
      'Glúteos': { volume: 0, sessions: new Set() },
      'Cuerpo Completo': { volume: 0, sessions: new Set() },
    };

    completedWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const muscle = exercise.muscleGroup;
        if (volumes[muscle]) {
          const exerciseVolume = exercise.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
          volumes[muscle].volume += exerciseVolume;
          volumes[muscle].sessions.add(workout.id);
        }
      });
    });

    const maxVol = Math.max(...Object.values(volumes).map(v => v.volume), 1);
    
    return Object.entries(volumes)
      .map(([name, data]) => ({
        name,
        volume: data.volume,
        sessions: data.sessions.size,
        percentage: Math.round((data.volume / maxVol) * 100),
      }))
      .filter(m => m.volume > 0)
      .sort((a, b) => b.volume - a.volume);
  }, [completedWorkouts]);

  const strongestMuscle = muscleVolumes[0] || {
    name: 'Piernas',
    percentage: 0,
    volume: 0,
    sessions: 0,
  };

  const monthlyProgress = useMemo(() => {
    const exerciseProgress: Record<string, { name: string; startWeight: number; currentWeight: number }> = {};
    
    const sortedWorkouts = [...completedWorkouts].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const maxWeight = Math.max(...exercise.sets.map(s => s.weight), 0);
        if (maxWeight > 0) {
          if (!exerciseProgress[exercise.exerciseId]) {
            exerciseProgress[exercise.exerciseId] = {
              name: exercise.exerciseName,
              startWeight: maxWeight,
              currentWeight: maxWeight,
            };
          } else {
            exerciseProgress[exercise.exerciseId].currentWeight = Math.max(
              exerciseProgress[exercise.exerciseId].currentWeight,
              maxWeight
            );
          }
        }
      });
    });

    return Object.values(exerciseProgress)
      .filter(p => p.currentWeight > p.startWeight)
      .sort((a, b) => (b.currentWeight - b.startWeight) - (a.currentWeight - a.startWeight))
      .slice(0, 3);
  }, [completedWorkouts]);

  const recentPRs = useMemo(() => {
    const prs: { exercise: string; weight: number; date: string; improvement: string }[] = [];
    
    const sortedWorkouts = [...completedWorkouts].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 10);

    sortedWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const maxWeight = Math.max(...exercise.sets.map(s => s.weight), 0);
        if (maxWeight > 0 && maxWeight === personalRecords[exercise.exerciseId]) {
          const workoutDate = new Date(workout.date);
          const now = new Date();
          const diffDays = Math.floor((now.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
          
          let dateStr = 'Hoy';
          if (diffDays === 1) dateStr = 'Hace 1 día';
          else if (diffDays > 1 && diffDays < 7) dateStr = `Hace ${diffDays} días`;
          else if (diffDays >= 7) dateStr = `Hace ${Math.floor(diffDays / 7)} semana${diffDays >= 14 ? 's' : ''}`;

          prs.push({
            exercise: exercise.exerciseName,
            weight: maxWeight,
            date: dateStr,
            improvement: '+5 kg',
          });
        }
      });
    });

    return prs.slice(0, 3);
  }, [completedWorkouts, personalRecords]);

  const displayPRs = recentPRs.length > 0 ? recentPRs : [
    { exercise: 'Press de banca plano', weight: 102, date: 'Hace 2 días', improvement: '+5 kg' },
    { exercise: 'Sentadilla Low Bar', weight: 143, date: 'Hace 1 semana', improvement: '+7 kg' },
    { exercise: 'Peso muerto convencional', weight: 184, date: 'Hace 2 semanas', improvement: '+9 kg' },
  ];

  const displayProgress = monthlyProgress.length > 0 ? monthlyProgress : [
    { name: 'Press de banca plano', startWeight: 80, currentWeight: 102 },
    { name: 'Sentadilla Low Bar', startWeight: 100, currentWeight: 143 },
    { name: 'Peso muerto convencional', startWeight: 120, currentWeight: 184 },
  ];

  const displayMuscles = muscleVolumes.length > 0 ? muscleVolumes.slice(0, 6) : [
    { name: 'Piernas', percentage: 92, sessions: 14 },
    { name: 'Brazos', percentage: 88, sessions: 11 },
    { name: 'Pecho', percentage: 85, sessions: 12 },
    { name: 'Espalda', percentage: 78, sessions: 10 },
    { name: 'Hombros', percentage: 70, sessions: 9 },
    { name: 'Core', percentage: 65, sessions: 8 },
  ];

  const totalWeekVolume = weeklyData.reduce((sum, d) => sum + d.volume, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[theme.dark.gradientStart, theme.dark.gradientEnd]}
        style={StyleSheet.absoluteFillObject}
      />
      <LavaBackground />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColors.primary }]}>{t.stats.title}</Text>
        <TouchableOpacity style={[styles.periodButton, { backgroundColor: theme.dark.accent + '20', borderColor: theme.dark.accent + '40' }]}>
          <Calendar size={20} color={theme.dark.accent} />
          <Text style={[styles.periodText, { color: textColors.primary }]}>{t.stats.thisMonth}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          {monthlyStats.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: theme.dark.accent + '12' }]}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.dark.accent + '25' }]}>
                <stat.icon size={20} color={theme.dark.accent} />
              </View>
              <Text style={[styles.statValue, { color: textColors.primary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: textColors.secondary }]}>{stat.label}</Text>
              <View style={styles.changeContainer}>
                <TrendingUp size={12} color={colors.dark.success} />
                <Text style={styles.changeText}>{stat.change}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Crown size={22} color={colors.dark.gold} />
            <Text style={[styles.sectionTitle, { color: textColors.primary }]}>{t.stats.strongestMuscle}</Text>
          </View>
          <View style={[styles.strongestCard, { borderColor: colors.dark.gold }]}>
            <LinearGradient
              colors={[colors.dark.gold + '20', theme.dark.gradientEnd]}
              style={styles.strongestGradient}
            >
              <View style={styles.strongestHeader}>
                <Text style={[styles.strongestName, { color: textColors.primary }]}>{strongestMuscle.name}</Text>
                <View style={styles.strongestBadge}>
                  <Crown size={16} color={colors.dark.gold} fill={colors.dark.gold} />
                  <Text style={styles.strongestBadgeText}>#1</Text>
                </View>
              </View>
              <View style={styles.strongestStats}>
                <View style={styles.strongestStatItem}>
                  <Text style={[styles.strongestStatValue, { color: textColors.primary }]}>{strongestMuscle.percentage}%</Text>
                  <Text style={[styles.strongestStatLabel, { color: textColors.secondary }]}>Fuerza</Text>
                </View>
                <View style={styles.strongestStatItem}>
                  <Text style={[styles.strongestStatValue, { color: textColors.primary }]}>{(strongestMuscle.volume / 1000).toFixed(1)}K</Text>
                  <Text style={[styles.strongestStatLabel, { color: textColors.secondary }]}>Volumen (kg)</Text>
                </View>
                <View style={styles.strongestStatItem}>
                  <Text style={[styles.strongestStatValue, { color: textColors.primary }]}>{strongestMuscle.sessions}</Text>
                  <Text style={[styles.strongestStatLabel, { color: textColors.secondary }]}>Sesiones</Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={[colors.dark.gold, colors.dark.warning]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${strongestMuscle.percentage}%` }]}
                />
              </View>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColors.primary }]}>{t.stats.monthlyProgress}</Text>
          <View style={styles.progressList}>
            {displayProgress.map((item, index) => (
              <View key={index} style={[styles.progressCard, { backgroundColor: theme.dark.accent + '12' }]}>
                <Text style={[styles.progressExercise, { color: textColors.primary }]}>
                  {'name' in item ? item.name : (item as { exercise: string }).exercise}
                </Text>
                <View style={styles.progressWeights}>
                  <View style={styles.weightColumn}>
                    <Text style={[styles.weightLabel, { color: textColors.secondary }]}>{t.stats.startWeight}</Text>
                    <Text style={[styles.weightValue, { color: textColors.primary }]}>{item.startWeight} kg</Text>
                  </View>
                  <View style={[styles.arrowContainer, { backgroundColor: colors.dark.success + '20' }]}>
                    <ArrowUp size={20} color={colors.dark.success} />
                  </View>
                  <View style={styles.weightColumn}>
                    <Text style={[styles.weightLabel, { color: textColors.secondary }]}>{t.stats.currentWeight}</Text>
                    <Text style={[styles.weightValue, { color: theme.dark.accent }]}>{item.currentWeight} kg</Text>
                  </View>
                  <View style={styles.improvementBadge}>
                    <Text style={styles.improvementText}>+{item.currentWeight - item.startWeight} kg</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColors.primary }]}>{t.stats.volumeLifted}</Text>
          <View style={[styles.chartCard, { backgroundColor: theme.dark.accent + '12' }]}>
            <View style={styles.chartContainer}>
              {weeklyData.map((data, index) => (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    {data.volume > 0 && (
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${(data.volume / maxVolume) * 100}%`,
                            backgroundColor:
                              data.volume === maxVolume
                                ? theme.dark.accent
                                : theme.dark.accent + '60',
                          },
                        ]}
                      />
                    )}
                  </View>
                  <Text style={[styles.dayLabel, { color: textColors.secondary }]}>{data.day}</Text>
                </View>
              ))}
            </View>
            <View style={styles.volumeInfo}>
              <Text style={[styles.totalVolumeLabel, { color: textColors.secondary }]}>{t.stats.totalVolume}</Text>
              <Text style={[styles.totalVolumeValue, { color: textColors.primary }]}>
                {totalWeekVolume > 0 ? totalWeekVolume.toLocaleString() : '59,000'} kg
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColors.primary }]}>{t.stats.personalRecords}</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: theme.dark.accent }]}>Ver Todo</Text>
            </TouchableOpacity>
          </View>

          {displayPRs.map((record, index) => (
            <View key={index} style={[styles.recordCard, { backgroundColor: theme.dark.accent + '12' }]}>
              <View style={[styles.recordIcon, { backgroundColor: theme.dark.accent + '25' }]}>
                <Award size={24} color={theme.dark.accent} />
              </View>
              <View style={styles.recordInfo}>
                <Text style={[styles.recordExercise, { color: textColors.primary }]}>{record.exercise}</Text>
                <Text style={[styles.recordDate, { color: textColors.secondary }]}>{record.date}</Text>
              </View>
              <View style={styles.recordStats}>
                <Text style={[styles.recordWeight, { color: textColors.primary }]}>{record.weight} kg</Text>
                <Text style={styles.recordImprovement}>{record.improvement}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColors.primary }]}>{t.stats.muscleStrength}</Text>
          <View style={styles.muscleGrid}>
            {displayMuscles.map((muscle, index) => (
              <View key={index} style={[styles.muscleCard, { backgroundColor: theme.dark.accent + '12' }]}>
                <View style={styles.muscleHeader}>
                  <Text style={[styles.muscleName, { color: textColors.primary }]}>{muscle.name}</Text>
                  <Text style={[styles.musclePercentage, { color: theme.dark.accent }]}>{muscle.percentage}%</Text>
                </View>
                <View style={styles.muscleProgressBar}>
                  <View
                    style={[
                      styles.muscleProgressFill,
                      {
                        width: `${muscle.percentage}%`,
                        backgroundColor:
                          muscle.percentage >= 80 ? theme.dark.accent : theme.dark.accent + '70',
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.muscleWorkouts, { color: textColors.secondary }]}>{muscle.sessions} sesiones</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: colors.dark.text,
    fontSize: 32,
    fontWeight: '700' as const,
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dark.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  periodText: {
    color: colors.dark.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.dark.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    color: colors.dark.text,
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  statLabel: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    color: colors.dark.success,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.dark.text,
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  seeAllText: {
    color: colors.dark.accent,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  strongestCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.dark.gold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  strongestGradient: {
    padding: 20,
  },
  strongestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  strongestName: {
    color: colors.dark.text,
    fontSize: 28,
    fontWeight: '700' as const,
  },
  strongestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dark.gold + '30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  strongestBadgeText: {
    color: colors.dark.gold,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  strongestStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  strongestStatItem: {
    alignItems: 'center',
  },
  strongestStatValue: {
    color: colors.dark.text,
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  strongestStatLabel: {
    color: colors.dark.textSecondary,
    fontSize: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.dark.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressList: {
    gap: 12,
  },
  progressCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.dark.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  progressExercise: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  progressWeights: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weightColumn: {
    alignItems: 'center',
  },
  weightLabel: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  weightValue: {
    color: colors.dark.text,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.dark.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  improvementBadge: {
    backgroundColor: colors.dark.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  improvementText: {
    color: colors.dark.success,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  chartCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.dark.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    marginBottom: 20,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barWrapper: {
    flex: 1,
    width: '70%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 8,
    minHeight: 4,
  },
  dayLabel: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  volumeInfo: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  totalVolumeLabel: {
    color: colors.dark.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  totalVolumeValue: {
    color: colors.dark.text,
    fontSize: 28,
    fontWeight: '700' as const,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  recordIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.dark.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordExercise: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  recordDate: {
    color: colors.dark.textSecondary,
    fontSize: 13,
  },
  recordStats: {
    alignItems: 'flex-end',
  },
  recordWeight: {
    color: colors.dark.text,
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  recordImprovement: {
    color: colors.dark.success,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  muscleGrid: {
    gap: 12,
  },
  muscleCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.dark.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  muscleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  muscleName: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  musclePercentage: {
    color: colors.dark.accent,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  muscleProgressBar: {
    height: 8,
    backgroundColor: colors.dark.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  muscleProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  muscleWorkouts: {
    color: colors.dark.textSecondary,
    fontSize: 13,
  },
});
