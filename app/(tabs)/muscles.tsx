import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trophy, TrendingUp, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { useState, useRef } from 'react';
import LavaBackground from '@/components/LavaBackground';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppSettings } from '@/contexts/AppSettingsContext';

interface MuscleGroup {
  id: string;
  name: string;
  strength: number;
  workouts: number;
  medal: 'gold' | 'silver' | 'bronze' | 'none';
  x: number;
  y: number;
}

export default function MusclesScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const { getTextColors } = useAppSettings();
  const textColors = getTextColors();
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const muscleGroups: MuscleGroup[] = [
    { id: 'chest', name: 'Chest', strength: 92, workouts: 45, medal: 'gold', x: 50, y: 25 },
    { id: 'shoulders', name: 'Shoulders', strength: 78, workouts: 38, medal: 'silver', x: 50, y: 18 },
    { id: 'biceps', name: 'Biceps', strength: 85, workouts: 42, medal: 'silver', x: 30, y: 35 },
    { id: 'triceps', name: 'Triceps', strength: 88, workouts: 40, medal: 'gold', x: 70, y: 35 },
    { id: 'abs', name: 'Abs', strength: 75, workouts: 35, medal: 'bronze', x: 50, y: 40 },
    { id: 'quads', name: 'Quads', strength: 95, workouts: 48, medal: 'gold', x: 50, y: 60 },
    { id: 'hamstrings', name: 'Hamstrings', strength: 82, workouts: 36, medal: 'silver', x: 50, y: 70 },
    { id: 'calves', name: 'Calves', strength: 68, workouts: 28, medal: 'bronze', x: 50, y: 85 },
    { id: 'back', name: 'Back', strength: 90, workouts: 44, medal: 'gold', x: 50, y: 30 },
    { id: 'glutes', name: 'Glutes', strength: 87, workouts: 41, medal: 'gold', x: 50, y: 55 },
  ];

  const getMedalColor = (medal: string) => {
    switch (medal) {
      case 'gold':
        return colors.dark.gold;
      case 'silver':
        return colors.dark.silver;
      case 'bronze':
        return colors.dark.bronze;
      default:
        return colors.dark.textSecondary;
    }
  };

  const handleMusclePress = (muscleId: string) => {
    setSelectedMuscle(muscleId);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const selectedMuscleData = muscleGroups.find(m => m.id === selectedMuscle);

  const exercisesForMuscle = selectedMuscleData ? [
    { name: 'Bench Press', targetLevel: 'Primary' },
    { name: 'Incline Press', targetLevel: 'Primary' },
    { name: 'Dumbbell Flyes', targetLevel: 'Primary' },
    { name: 'Push Ups', targetLevel: 'Secondary' },
  ] : [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[theme.dark.gradientStart, theme.dark.gradientEnd]}
        style={StyleSheet.absoluteFillObject}
      />
      <LavaBackground />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColors.primary }]}>{t.muscles.title}</Text>
        <View style={[styles.totalStrengthBadge, { backgroundColor: theme.dark.accent + '20', borderColor: colors.dark.gold + '40' }]}>
          <Trophy size={18} color={colors.dark.gold} />
          <Text style={styles.totalStrengthText}>{t.muscles.avgStrength} 85%</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bodyContainer}>
          <Text style={[styles.sectionTitle, { color: textColors.primary }]}>{t.muscles.interactiveBodyMap}</Text>
          <Text style={[styles.sectionSubtitle, { color: textColors.secondary }]}>{t.muscles.tapMuscle}</Text>
          
          <View style={[styles.bodyMapCard, { borderColor: theme.dark.accent + '30' }]}>
            <LinearGradient
              colors={[theme.dark.accent + '15', theme.dark.gradientEnd]}
              style={styles.bodyMapGradient}
            >
              <View style={styles.bodyOutline}>
                <View style={styles.bodyHead} />
                
                <View style={styles.bodyTorso}>
                  <TouchableOpacity
                    style={[styles.musclePoint, { top: '10%', left: '50%' }]}
                    onPress={() => handleMusclePress('shoulders')}
                  >
                    <View style={[styles.muscleDot, { backgroundColor: theme.dark.accent, borderColor: theme.dark.accentDark }, selectedMuscle === 'shoulders' && styles.muscleDotActive]}>
                      <Text style={styles.muscleDotText}>💪</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.musclePoint, { top: '25%', left: '50%' }]}
                    onPress={() => handleMusclePress('chest')}
                  >
                    <View style={[styles.muscleDot, { backgroundColor: theme.dark.accent, borderColor: theme.dark.accentDark }, selectedMuscle === 'chest' && styles.muscleDotActive]}>
                      <Text style={styles.muscleDotText}>💪</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.musclePoint, { top: '25%', left: '25%' }]}
                    onPress={() => handleMusclePress('biceps')}
                  >
                    <View style={[styles.muscleDot, { backgroundColor: theme.dark.accent, borderColor: theme.dark.accentDark }, selectedMuscle === 'biceps' && styles.muscleDotActive]}>
                      <Text style={styles.muscleDotText}>💪</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.musclePoint, { top: '25%', left: '75%' }]}
                    onPress={() => handleMusclePress('triceps')}
                  >
                    <View style={[styles.muscleDot, { backgroundColor: theme.dark.accent, borderColor: theme.dark.accentDark }, selectedMuscle === 'triceps' && styles.muscleDotActive]}>
                      <Text style={styles.muscleDotText}>💪</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.musclePoint, { top: '45%', left: '50%' }]}
                    onPress={() => handleMusclePress('abs')}
                  >
                    <View style={[styles.muscleDot, { backgroundColor: theme.dark.accent, borderColor: theme.dark.accentDark }, selectedMuscle === 'abs' && styles.muscleDotActive]}>
                      <Text style={styles.muscleDotText}>💪</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.bodyLegs}>
                  <TouchableOpacity
                    style={[styles.musclePoint, { top: '15%', left: '50%' }]}
                    onPress={() => handleMusclePress('quads')}
                  >
                    <View style={[styles.muscleDot, { backgroundColor: theme.dark.accent, borderColor: theme.dark.accentDark }, selectedMuscle === 'quads' && styles.muscleDotActive]}>
                      <Text style={styles.muscleDotText}>🦵</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.musclePoint, { top: '45%', left: '50%' }]}
                    onPress={() => handleMusclePress('hamstrings')}
                  >
                    <View style={[styles.muscleDot, { backgroundColor: theme.dark.accent, borderColor: theme.dark.accentDark }, selectedMuscle === 'hamstrings' && styles.muscleDotActive]}>
                      <Text style={styles.muscleDotText}>🦵</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.musclePoint, { top: '75%', left: '50%' }]}
                    onPress={() => handleMusclePress('calves')}
                  >
                    <View style={[styles.muscleDot, { backgroundColor: theme.dark.accent, borderColor: theme.dark.accentDark }, selectedMuscle === 'calves' && styles.muscleDotActive]}>
                      <Text style={styles.muscleDotText}>🦵</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {selectedMuscleData && (
                <Animated.View style={[styles.muscleDetailCard, { transform: [{ scale: scaleAnim }], backgroundColor: theme.dark.accent + '15', borderColor: theme.dark.accent }]}>
                  <View style={styles.muscleDetailHeader}>
                    <View style={styles.muscleDetailLeft}>
                      <Text style={[styles.muscleDetailName, { color: textColors.primary }]}>{selectedMuscleData.name}</Text>
                      <View style={styles.medalBadge}>
                        <Trophy size={14} color={getMedalColor(selectedMuscleData.medal)} fill={getMedalColor(selectedMuscleData.medal)} />
                        <Text style={[styles.medalText, { color: getMedalColor(selectedMuscleData.medal) }]}>
                          {selectedMuscleData.medal.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.strengthCircle, { backgroundColor: theme.dark.accent + '20', borderColor: theme.dark.accent }]}>
                      <Text style={[styles.strengthValue, { color: textColors.primary }]}>{selectedMuscleData.strength}</Text>
                      <Text style={[styles.strengthLabel, { color: textColors.secondary }]}>{t.muscles.str}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.muscleStats}>
                    <View style={styles.muscleStat}>
                      <Zap size={16} color={theme.dark.accent} />
                      <Text style={[styles.muscleStatLabel, { color: textColors.secondary }]}>{selectedMuscleData.workouts} {t.muscles.sessions}</Text>
                    </View>
                    <View style={styles.muscleStat}>
                      <TrendingUp size={16} color={colors.dark.success} />
                      <Text style={[styles.muscleStatLabel, { color: textColors.secondary }]}>+12% {t.muscles.thisMonth}</Text>
                    </View>
                  </View>
                </Animated.View>
              )}
            </LinearGradient>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColors.primary }]}>{t.muscles.muscleRankings}</Text>
          <View style={styles.rankingsGrid}>
            {muscleGroups
              .sort((a, b) => b.strength - a.strength)
              .map((muscle, index) => (
                <TouchableOpacity
                  key={muscle.id}
                  style={[styles.rankingCard, { backgroundColor: theme.dark.accent + '12' }]}
                  onPress={() => handleMusclePress(muscle.id)}
                >
                  <View style={styles.rankingLeft}>
                    <Text style={[styles.rankNumber, { color: theme.dark.accent }]}>#{index + 1}</Text>
                    <Trophy 
                      size={20} 
                      color={getMedalColor(muscle.medal)} 
                      fill={getMedalColor(muscle.medal)}
                    />
                    <View style={styles.rankingInfo}>
                      <Text style={[styles.rankingName, { color: textColors.primary }]}>{muscle.name}</Text>
                      <Text style={[styles.rankingWorkouts, { color: textColors.secondary }]}>{muscle.workouts} {t.muscles.sessions}</Text>
                    </View>
                  </View>
                  <View style={styles.rankingRight}>
                    <Text style={[styles.rankingStrength, { color: textColors.primary }]}>{muscle.strength}</Text>
                    <Text style={[styles.rankingStrengthLabel, { color: textColors.secondary }]}>{t.muscles.str}</Text>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        </View>

        {selectedMuscleData && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColors.primary }]}>{t.muscles.exercisesFor} {selectedMuscleData.name}</Text>
            {exercisesForMuscle.map((exercise, index) => (
              <View key={index} style={[styles.exerciseCard, { backgroundColor: theme.dark.accent + '12' }]}>
                <View style={styles.exerciseLeft}>
                  <Text style={[styles.exerciseName, { color: textColors.primary }]}>{exercise.name}</Text>
                  <View style={[
                    styles.targetBadge,
                    exercise.targetLevel === 'Primary' ? { backgroundColor: theme.dark.accent + '20' } : styles.targetSecondary
                  ]}>
                    <Text style={[styles.targetText, { color: theme.dark.accent }]}>{exercise.targetLevel === 'Primary' ? t.muscles.primary : t.muscles.secondary}</Text>
                  </View>
                </View>
                <TouchableOpacity style={[styles.exerciseButton, { backgroundColor: theme.dark.accent }]}>
                  <Text style={styles.exerciseButtonText}>{t.muscles.view}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
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
  totalStrengthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dark.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.dark.gold + '40',
  },
  totalStrengthText: {
    color: colors.dark.gold,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  bodyContainer: {
    marginBottom: 28,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: colors.dark.text,
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: colors.dark.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  bodyMapCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  bodyMapGradient: {
    padding: 20,
    minHeight: 500,
  },
  bodyOutline: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyHead: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.dark.surfaceSecondary,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.dark.border,
  },
  bodyTorso: {
    width: 180,
    height: 200,
    backgroundColor: colors.dark.surfaceSecondary,
    borderRadius: 90,
    marginBottom: 10,
    position: 'relative' as const,
    borderWidth: 2,
    borderColor: colors.dark.border,
  },
  bodyLegs: {
    width: 120,
    height: 220,
    backgroundColor: colors.dark.surfaceSecondary,
    borderRadius: 60,
    position: 'relative' as const,
    borderWidth: 2,
    borderColor: colors.dark.border,
  },
  musclePoint: {
    position: 'absolute' as const,
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  muscleDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.dark.accentDark,
  },
  muscleDotActive: {
    backgroundColor: colors.dark.gold,
    borderColor: colors.dark.gold,
    transform: [{ scale: 1.2 }],
  },
  muscleDotText: {
    fontSize: 18,
  },
  muscleDetailCard: {
    marginTop: 20,
    backgroundColor: colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.dark.accent,
  },
  muscleDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  muscleDetailLeft: {
    flex: 1,
  },
  muscleDetailName: {
    color: colors.dark.text,
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  medalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.dark.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  medalText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  strengthCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.dark.accent + '20',
    borderWidth: 3,
    borderColor: colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strengthValue: {
    color: colors.dark.text,
    fontSize: 24,
    fontWeight: '700' as const,
  },
  strengthLabel: {
    color: colors.dark.textSecondary,
    fontSize: 10,
    fontWeight: '700' as const,
  },
  muscleStats: {
    flexDirection: 'row',
    gap: 16,
  },
  muscleStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  muscleStatLabel: {
    color: colors.dark.textSecondary,
    fontSize: 14,
  },
  rankingsGrid: {
    gap: 12,
  },
  rankingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rankNumber: {
    color: colors.dark.accent,
    fontSize: 18,
    fontWeight: '700' as const,
    minWidth: 30,
  },
  rankingInfo: {
    flex: 1,
  },
  rankingName: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  rankingWorkouts: {
    color: colors.dark.textSecondary,
    fontSize: 13,
  },
  rankingRight: {
    alignItems: 'center',
  },
  rankingStrength: {
    color: colors.dark.text,
    fontSize: 24,
    fontWeight: '700' as const,
  },
  rankingStrengthLabel: {
    color: colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '600' as const,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  exerciseLeft: {
    flex: 1,
  },
  exerciseName: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  targetBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  targetPrimary: {
    backgroundColor: colors.dark.accent + '20',
  },
  targetSecondary: {
    backgroundColor: colors.dark.surfaceSecondary,
  },
  targetText: {
    color: colors.dark.accent,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  exerciseButton: {
    backgroundColor: colors.dark.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  exerciseButtonText: {
    color: colors.dark.text,
    fontSize: 14,
    fontWeight: '700' as const,
  },
});
