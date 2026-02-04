import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Animated, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flame, Trophy, TrendingUp, Dumbbell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { useRef, useEffect } from 'react';
import LavaBackground from '@/components/LavaBackground';
import AnimeExpBar from '@/components/AnimeExpBar';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useUser } from '@/contexts/UserContext';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const { getTextColors } = useAppSettings();
  const { profile, stats: userStats } = useUser();
  const textColors = getTextColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const todayWorkout = [
    { exerciseName: 'Press de banca plano', sets: 4, reps: 8, weight: 85 },
    { exerciseName: 'Press de banca inclinado', sets: 3, reps: 10, weight: 35 },
    { exerciseName: 'Fondos en paralelas', sets: 3, reps: 12, weight: 0 },
  ];

  const currentExp = userStats.currentXp;
  const expToNextLevel = userStats.xpToNextLevel;
  const currentLevel = userStats.level;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const statsCards = [
    { icon: Flame, label: t.home.streak, value: `12 ${t.home.days}`, color: theme.dark.accent },
    { icon: Trophy, label: t.home.totalPRs, value: '23', color: colors.dark.gold },
    { icon: TrendingUp, label: t.home.progress, value: '+15%', color: colors.dark.success },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[theme.dark.gradientStart, theme.dark.gradientEnd]}
        style={StyleSheet.absoluteFillObject}
      />
      <LavaBackground />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              {profile?.photoUri ? (
                <Image source={{ uri: profile.photoUri }} style={styles.avatarImage} />
              ) : (
                <LinearGradient
                  colors={[theme.dark.accent, theme.dark.accentDark]}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarText}>{getInitials(profile?.name || 'IN')}</Text>
                </LinearGradient>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.greeting, { color: textColors.secondary }]}>{t.home.welcomeBack}</Text>
              <Text style={[styles.userName, { color: textColors.primary }]}>{profile?.name || 'Invitado'}</Text>
            </View>
          </View>

          <View style={styles.brandContainer} pointerEvents="none">
            <Text style={styles.brandText} testID="brand-label">G-PRIME</Text>
          </View>
        </View>

        <AnimeExpBar
          currentExp={currentExp}
          expToNextLevel={expToNextLevel}
          currentLevel={currentLevel}
        />

        <Animated.View 
          style={[
            styles.statsContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {statsCards.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.color + '20' }]}>
                <stat.icon size={20} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: textColors.primary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: textColors.secondary }]}>{stat.label}</Text>
            </View>
          ))}
        </Animated.View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColors.primary }]}>{t.home.todaysWorkout}</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.dark.accent }]}>{t.home.pushDay}</Text>
          </View>

          <View style={styles.workoutCard}>
            <LinearGradient
              colors={[theme.dark.accent + '15', theme.dark.surface]}
              style={styles.workoutGradient}
            >
              <View style={styles.workoutHeader}>
                <View style={styles.workoutInfo}>
                  <Text style={[styles.workoutTitle, { color: textColors.primary }]}>Tren Superior - Fuerza</Text>
                  <Text style={[styles.workoutMeta, { color: textColors.secondary }]}>3 {t.home.exercises} • 45 {t.home.approxMin}</Text>
                </View>
                <TouchableOpacity style={[styles.startButton, { backgroundColor: theme.dark.accent }]} testID="home-start-workout">
                  <Text style={styles.startButtonText}>{t.home.start}</Text>
                </TouchableOpacity>
              </View>

              {todayWorkout.map((exercise, index) => (
                <View key={index} style={styles.exerciseRow}>
                  <View style={styles.exerciseNumber}>
                    <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.exerciseDetails}>
                    <Text style={[styles.exerciseName, { color: textColors.primary }]}>{exercise.exerciseName}</Text>
                    <Text style={[styles.exerciseInfo, { color: textColors.secondary }]}>
                      {exercise.sets} {t.home.sets} × {exercise.reps} {t.home.reps}
                      {exercise.weight > 0 ? ` • ${exercise.weight} kg` : ` • ${t.home.bodyweight}`}
                    </Text>
                  </View>
                </View>
              ))}
            </LinearGradient>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColors.primary }]}>{t.home.quickActions}</Text>
          </View>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: theme.dark.accent + '20' }]}>

                <Dumbbell size={24} color={theme.dark.accent} />
              </View>
              <Text style={[styles.actionText, { color: textColors.primary }]}>{t.home.logWorkout}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#FFB74D20' }]}>
                <Trophy size={24} color="#FFB74D" />
              </View>
              <Text style={[styles.actionText, { color: textColors.primary }]}>{t.home.setGoal}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColors.primary }]}>{t.home.recentActivity}</Text>
          </View>

          <View style={styles.activityList}>
            {[t.home.yesterday, `2 ${t.home.daysAgo}`, `3 ${t.home.daysAgo}`].map((day, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={[styles.activityDot, { backgroundColor: theme.dark.accent }]} />
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: textColors.primary }]}>Entrenamiento Completo</Text>
                  <Text style={[styles.activityTime, { color: textColors.secondary }]}>{day}</Text>
                </View>
                <Text style={[styles.activityVolume, { color: theme.dark.accent }]}>{(6800 - index * 550).toLocaleString()} kg</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  brandText: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 2.2,
    textTransform: 'uppercase' as const,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: colors.dark.text,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    color: colors.dark.textSecondary,
    fontSize: 14,
  },
  userName: {
    color: colors.dark.text,
    fontSize: 20,
    fontWeight: '700' as const,
  },

  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
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
    marginBottom: 8,
  },
  statValue: {
    color: colors.dark.text,
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  statLabel: {
    color: colors.dark.textSecondary,
    fontSize: 12,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.dark.text,
    fontSize: 22,
    fontWeight: '700' as const,
  },
  sectionSubtitle: {
    color: colors.dark.accent,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  workoutCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.dark.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  workoutGradient: {
    padding: 20,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    color: colors.dark.text,
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  workoutMeta: {
    color: colors.dark.textSecondary,
    fontSize: 14,
  },
  startButton: {
    backgroundColor: colors.dark.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  startButtonText: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.dark.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseNumberText: {
    color: colors.dark.text,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  exerciseInfo: {
    color: colors.dark.textSecondary,
    fontSize: 13,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.dark.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionText: {
    color: colors.dark.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.dark.accent,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  activityTime: {
    color: colors.dark.textSecondary,
    fontSize: 13,
  },
  activityVolume: {
    color: colors.dark.accent,
    fontSize: 14,
    fontWeight: '700' as const,
  },
});
