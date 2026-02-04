import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, Alert, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Target, Plus, X, Calendar, TrendingUp, Trash2, Trophy, ChevronDown, Search, Clock, CheckCircle, ChevronLeft, ChevronRight, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import LavaBackground from '@/components/LavaBackground';
import { useTranslation } from '@/hooks/useTranslation';
import { useExercises } from '@/contexts/ExercisesContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import type { Goal, ExerciseCategory } from '@/types/workout';

const GOALS_STORAGE_KEY = 'user_goals';
const PR_STORAGE_KEY = 'personal_records';

const CATEGORIES: (ExerciseCategory | 'All')[] = ['All', 'Boxeo', 'MMA', 'Powerlifting', 'Corredores', 'Calistenia', 'GymComercial', 'GymBarrio', 'Extras'];

const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const { allExercises } = useExercises();
  const { getTextColors } = useAppSettings();
  const textColors = getTextColors();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>('');
  const [targetWeight, setTargetWeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'All'>('All');
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [personalRecords, setPersonalRecords] = useState<Record<string, number>>({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationGoal, setCelebrationGoal] = useState<Goal | null>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const saveGoals = useCallback(async (newGoals: Goal[]) => {
    try {
      await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(newGoals));
      setGoals(newGoals);
    } catch (error) {
      console.error('Error saving goals:', error);
    }
  }, []);

  useEffect(() => {
    const loadGoals = async () => {
      try {
        const stored = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
        if (stored) {
          setGoals(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading goals:', error);
      }
    };

    const loadPersonalRecords = async () => {
      try {
        const stored = await AsyncStorage.getItem(PR_STORAGE_KEY);
        if (stored) {
          setPersonalRecords(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading PRs:', error);
      }
    };

    loadGoals();
    loadPersonalRecords();
  }, []);

  useEffect(() => {
    if (showCelebration) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [showCelebration, scaleAnim, rotateAnim, fadeAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    if (goals.length === 0) return;
    
    let hasChanges = false;
    const updatedGoals = goals.map(goal => {
      const currentPR = personalRecords[goal.exerciseId] || goal.currentWeight;
      if (currentPR >= goal.targetWeight && !goal.completed) {
        hasChanges = true;
        setCelebrationGoal({ ...goal, currentWeight: currentPR });
        setShowCelebration(true);
        return { ...goal, completed: true, progress: 100, currentWeight: currentPR };
      }
      if (currentPR !== goal.currentWeight) {
        hasChanges = true;
        const progress = Math.min(100, Math.round((currentPR / goal.targetWeight) * 100));
        return { ...goal, currentWeight: currentPR, progress };
      }
      return goal;
    });
    
    if (hasChanges) {
      saveGoals(updatedGoals);
    }
  }, [personalRecords, goals, t.goals.goalAchieved, saveGoals]);

  const formatDateForDisplay = (date: Date): string => {
    const day = date.getDate();
    const month = MONTHS_ES[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getCountdown = (deadlineStr: string): { text: string; isOverdue: boolean } => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const parts = deadlineStr.split(' ');
    if (parts.length < 3) return { text: deadlineStr, isOverdue: false };
    
    const day = parseInt(parts[0], 10);
    const monthIndex = MONTHS_ES.findIndex(m => m.toLowerCase() === parts[1].toLowerCase());
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || monthIndex === -1 || isNaN(year)) {
      return { text: deadlineStr, isOverdue: false };
    }
    
    const deadline = new Date(year, monthIndex, day);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: t.goals.overdue, isOverdue: true };
    } else if (diffDays === 0) {
      return { text: t.goals.today, isOverdue: false };
    } else if (diffDays < 7) {
      return { text: `${diffDays} ${t.goals.daysRemaining}`, isOverdue: false };
    } else {
      const weeks = Math.floor(diffDays / 7);
      return { text: `${weeks} ${t.goals.weeksRemaining}`, isOverdue: false };
    }
  };

  const handleAddGoal = () => {
    if (!selectedExercise || !targetWeight || !currentWeight) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const current = parseFloat(currentWeight);
    const target = parseFloat(targetWeight);
    const progress = Math.min(100, Math.round((current / target) * 100));
    const deadlineStr = formatDateForDisplay(selectedDate);

    const newGoal: Goal = {
      id: `goal_${Date.now()}`,
      exerciseId: selectedExercise,
      exerciseName: selectedExerciseName,
      currentWeight: current,
      targetWeight: target,
      deadline: deadlineStr,
      progress: progress,
      completed: progress >= 100,
    };

    saveGoals([...goals, newGoal]);
    resetForm();
    setShowAddModal(false);
  };

  const handleDeleteGoal = (goalId: string) => {
    Alert.alert(
      'Eliminar Meta',
      '¿Estás seguro de que quieres eliminar esta meta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const newGoals = goals.filter(g => g.id !== goalId);
            saveGoals(newGoals);
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setSelectedExercise('');
    setSelectedExerciseName('');
    setTargetWeight('');
    setCurrentWeight('');
    setSelectedDate(new Date());
    setExerciseSearchQuery('');
    setSelectedCategory('All');
  };

  const selectExercise = (exercise: { id: string; name: string }) => {
    setSelectedExercise(exercise.id);
    setSelectedExerciseName(exercise.name);
    setShowExerciseModal(false);
  };

  const filteredGoals = useMemo(() => {
    if (!searchQuery.trim()) return goals;
    return goals.filter(goal => 
      goal.exerciseName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [goals, searchQuery]);

  const filteredExercises = useMemo(() => {
    let filtered = allExercises;
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(ex => ex.category === selectedCategory);
    }
    
    if (exerciseSearchQuery.trim()) {
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [allExercises, selectedCategory, exerciseSearchQuery]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDay = getFirstDayOfMonth(calendarDate);
    const days: (number | null)[] = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      <View style={styles.calendar}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity 
            onPress={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
            style={styles.calendarNavButton}
          >
            <ChevronLeft size={24} color={colors.dark.text} />
          </TouchableOpacity>
          <Text style={styles.calendarTitle}>
            {MONTHS_ES[calendarDate.getMonth()]} {calendarDate.getFullYear()}
          </Text>
          <TouchableOpacity 
            onPress={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
            style={styles.calendarNavButton}
          >
            <ChevronRight size={24} color={colors.dark.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.calendarDaysHeader}>
          {DAYS_ES.map((day, index) => (
            <Text key={index} style={styles.calendarDayLabel}>{day}</Text>
          ))}
        </View>

        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.calendarWeek}>
            {week.map((day, dayIndex) => {
              if (day === null) {
                return <View key={dayIndex} style={styles.calendarDayEmpty} />;
              }
              
              const dateToCheck = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
              const isSelected = selectedDate.getDate() === day && 
                selectedDate.getMonth() === calendarDate.getMonth() && 
                selectedDate.getFullYear() === calendarDate.getFullYear();
              const isPast = dateToCheck < today;
              
              return (
                <TouchableOpacity
                  key={dayIndex}
                  style={[
                    styles.calendarDay,
                    isSelected && [styles.calendarDaySelected, { backgroundColor: theme.dark.accent }],
                    isPast && styles.calendarDayPast,
                  ]}
                  onPress={() => {
                    if (!isPast) {
                      setSelectedDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day));
                    }
                  }}
                  disabled={isPast}
                >
                  <Text style={[
                    styles.calendarDayText,
                    isSelected && styles.calendarDayTextSelected,
                    isPast && styles.calendarDayTextPast,
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[theme.dark.gradientStart, theme.dark.gradientEnd]}
        style={StyleSheet.absoluteFillObject}
      />
      <LavaBackground />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Target size={28} color={theme.dark.accent} />
          <Text style={[styles.headerTitle, { color: textColors.primary }]}>{t.goals.title}</Text>
        </View>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.dark.accent }]} onPress={() => setShowAddModal(true)} testID="goals-add">
          <Plus size={24} color={colors.dark.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchFilterContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={colors.dark.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t.goals.searchExercises}
            placeholderTextColor={colors.dark.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredGoals.length === 0 ? (
          <View style={styles.emptyState}>
            <Target size={64} color={colors.dark.textSecondary} />
            <Text style={[styles.emptyTitle, { color: textColors.primary }]}>{t.goals.noGoals}</Text>
            <Text style={[styles.emptySubtitle, { color: textColors.secondary }]}>{t.goals.addFirst}</Text>
            <TouchableOpacity style={[styles.emptyButton, { backgroundColor: theme.dark.accent }]} onPress={() => setShowAddModal(true)}>
              <Text style={styles.emptyButtonText}>{t.goals.addGoal}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredGoals.map((goal) => {
            const countdown = getCountdown(goal.deadline);
            return (
              <View
                key={goal.id}
                style={[styles.goalCard, goal.completed && styles.goalCardCompleted]}
              >
                {goal.completed && (
                  <View style={styles.completedBadge}>
                    <Trophy size={16} color={colors.dark.gold} fill={colors.dark.gold} />
                    <Text style={styles.completedText}>¡COMPLETADO!</Text>
                  </View>
                )}

                <View style={styles.goalHeader}>
                  <Text style={[styles.goalExercise, { color: textColors.primary }]}>{goal.exerciseName}</Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteGoal(goal.id)}
                  >
                    <Trash2 size={18} color={colors.dark.error} />
                  </TouchableOpacity>
                </View>

                <View style={styles.goalDeadlineRow}>
                  <Calendar size={14} color={textColors.secondary} />
                  <Text style={[styles.goalDeadlineText, { color: textColors.secondary }]}>{goal.deadline}</Text>
                  <View style={styles.countdownBadge}>
                    <Clock size={12} color={countdown.isOverdue ? colors.dark.error : theme.dark.accent} />
                    <Text style={[
                      styles.countdownText, 
                      { color: countdown.isOverdue ? colors.dark.error : theme.dark.accent }
                    ]}>
                      {countdown.text}
                    </Text>
                  </View>
                </View>

                <View style={styles.goalProgress}>
                  <View style={styles.goalWeights}>
                    <View style={styles.weightItem}>
                      <Text style={[styles.weightLabel, { color: textColors.secondary }]}>{t.goals.currentWeight}</Text>
                      <Text style={[styles.weightValue, { color: textColors.primary }]}>{goal.currentWeight} kg</Text>
                    </View>
                    <TrendingUp size={20} color={goal.completed ? colors.dark.gold : theme.dark.accent} />
                    <View style={styles.weightItem}>
                      <Text style={[styles.weightLabel, { color: textColors.secondary }]}>{t.goals.targetWeight}</Text>
                      <Text style={[styles.weightValue, styles.targetWeight, { color: theme.dark.accent }]}>{goal.targetWeight} kg</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <LinearGradient
                      colors={goal.completed ? [colors.dark.gold, colors.dark.warning] : [theme.dark.accent, theme.dark.accentDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressBarFill, { width: `${Math.min(goal.progress, 100)}%` }]}
                    />
                  </View>
                  <Text style={[styles.progressPercentage, goal.completed && styles.progressCompleted]}>
                    {goal.progress}%
                  </Text>
                </View>

                {!goal.completed && (
                  <Text style={[styles.remainingText, { color: textColors.secondary }]}>
                    {goal.targetWeight - goal.currentWeight} kg para llegar
                  </Text>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.goals.newGoal}</Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
                <X size={24} color={colors.dark.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.goals.exercise}</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowExerciseModal(true)}
              >
                <Text style={selectedExerciseName ? styles.selectText : styles.selectPlaceholder}>
                  {selectedExerciseName || t.goals.selectExercise}
                </Text>
                <ChevronDown size={20} color={colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.goals.currentWeight} (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={colors.dark.textSecondary}
                keyboardType="numeric"
                value={currentWeight}
                onChangeText={setCurrentWeight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.goals.targetWeight} (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={colors.dark.textSecondary}
                keyboardType="numeric"
                value={targetWeight}
                onChangeText={setTargetWeight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.goals.deadline}</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                  setCalendarDate(selectedDate);
                  setShowDatePicker(true);
                }}
              >
                <Calendar size={20} color={theme.dark.accent} />
                <Text style={styles.selectText}>
                  {formatDateForDisplay(selectedDate)}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleAddGoal}>
              <LinearGradient
                colors={[theme.dark.accent, theme.dark.accentDark]}
                style={styles.saveGradient}
              >
                <Text style={styles.saveText}>{t.goals.addGoal}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showExerciseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, styles.exerciseModalCard]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.goals.selectExercise}</Text>
              <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
                <X size={24} color={colors.dark.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.exerciseSearchBar}>
              <Search size={18} color={colors.dark.textSecondary} />
              <TextInput
                style={styles.exerciseSearchInput}
                placeholder={t.goals.searchExercises}
                placeholderTextColor={colors.dark.textSecondary}
                value={exerciseSearchQuery}
                onChangeText={setExerciseSearchQuery}
              />
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat && { backgroundColor: theme.dark.accent }
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === cat && styles.categoryChipTextSelected
                  ]}>
                    {cat === 'All' ? t.goals.allCategories : cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
              {filteredExercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  style={styles.exerciseItem}
                  onPress={() => selectExercise(exercise)}
                >
                  <Text style={styles.exerciseItemText}>{exercise.name}</Text>
                  <View style={styles.exerciseItemMeta}>
                    <Text style={[styles.exerciseItemCategory, { color: theme.dark.accent }]}>{exercise.category}</Text>
                    <Text style={styles.exerciseItemMuscle}>{exercise.muscleGroup}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.goals.selectDate}</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <X size={24} color={colors.dark.text} />
              </TouchableOpacity>
            </View>

            {renderCalendar()}

            <TouchableOpacity 
              style={[styles.dateConfirmButton, { backgroundColor: theme.dark.accent }]}
              onPress={() => setShowDatePicker(false)}
            >
              <CheckCircle size={20} color={colors.dark.text} />
              <Text style={styles.dateConfirmText}>{formatDateForDisplay(selectedDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCelebration}
        transparent
        animationType="none"
        onRequestClose={() => setShowCelebration(false)}
      >
        <View style={styles.celebrationOverlay}>
          <Animated.View style={[styles.celebrationCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity style={styles.celebrationCloseButton} onPress={() => setShowCelebration(false)}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <View style={styles.trophyContainer}>
                <Trophy size={80} color={colors.dark.gold} fill={colors.dark.gold} />
              </View>
            </Animated.View>
            
            <Text style={styles.congratsTitle}>{t.common.goalAchievedTitle || '¡Felicidades, Meta Alcanzada!'}</Text>
            <Text style={styles.congratsMessage}>{t.common.goalAchievedMessage || 'Has alcanzado tu objetivo de'}</Text>
            <Text style={[styles.congratsExercise, { color: theme.dark.accent }]}>
              {celebrationGoal?.exerciseName}
            </Text>
            <Text style={styles.congratsWeight}>
              {celebrationGoal?.targetWeight} kg
            </Text>
            
            <View style={[styles.rewardContainer, { backgroundColor: theme.dark.accent + '20' }]}>
              <Zap size={24} color={theme.dark.accent} fill={theme.dark.accent} />
              <Text style={[styles.rewardText, { color: theme.dark.accent }]}>+500 XP</Text>
            </View>
            
            <TouchableOpacity style={styles.celebrationButton} onPress={() => setShowCelebration(false)}>
              <LinearGradient
                colors={[colors.dark.gold, colors.dark.warning]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.celebrationGradient}
              >
                <Text style={styles.celebrationButtonText}>¡Excelente!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: colors.dark.text,
    fontSize: 32,
    fontWeight: '700' as const,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchFilterContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.dark.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    color: colors.dark.text,
    fontSize: 15,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    color: colors.dark.text,
    fontSize: 22,
    fontWeight: '700' as const,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: colors.dark.textSecondary,
    fontSize: 16,
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: colors.dark.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyButtonText: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  goalCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.dark.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  goalCardCompleted: {
    borderColor: colors.dark.gold,
    borderWidth: 2,
  },
  completedBadge: {
    position: 'absolute' as const,
    top: -12,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dark.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.dark.gold,
    zIndex: 1,
  },
  completedText: {
    color: colors.dark.gold,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalExercise: {
    color: colors.dark.text,
    fontSize: 20,
    fontWeight: '700' as const,
    flex: 1,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.dark.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalDeadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  goalDeadlineText: {
    color: colors.dark.textSecondary,
    fontSize: 14,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.dark.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  goalProgress: {
    marginBottom: 12,
  },
  goalWeights: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weightItem: {
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
  targetWeight: {
    color: colors.dark.accent,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 10,
    backgroundColor: colors.dark.surfaceSecondary,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressPercentage: {
    color: colors.dark.accent,
    fontSize: 14,
    fontWeight: '700' as const,
    minWidth: 45,
    textAlign: 'right' as const,
  },
  progressCompleted: {
    color: colors.dark.gold,
  },
  remainingText: {
    color: colors.dark.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.dark.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  exerciseModalCard: {
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: colors.dark.text,
    fontSize: 24,
    fontWeight: '700' as const,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.dark.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    color: colors.dark.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.dark.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.dark.border,
    gap: 12,
  },
  selectText: {
    color: colors.dark.text,
    fontSize: 16,
    flex: 1,
  },
  selectPlaceholder: {
    color: colors.dark.textSecondary,
    fontSize: 16,
    flex: 1,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveText: {
    color: colors.dark.text,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  exerciseSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 12,
  },
  exerciseSearchInput: {
    flex: 1,
    color: colors.dark.text,
    fontSize: 15,
  },
  categoryScroll: {
    maxHeight: 44,
    marginBottom: 12,
  },
  categoryScrollContent: {
    gap: 8,
    paddingRight: 8,
  },
  categoryChip: {
    backgroundColor: colors.dark.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryChipText: {
    color: colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  categoryChipTextSelected: {
    color: colors.dark.text,
  },
  exerciseList: {
    maxHeight: 400,
  },
  exerciseItem: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.dark.surfaceSecondary,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseItemText: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  exerciseItemMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  exerciseItemCategory: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  exerciseItemMuscle: {
    color: colors.dark.textSecondary,
    fontSize: 13,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  calendar: {
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarTitle: {
    color: colors.dark.text,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  calendarDayLabel: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
    width: 40,
    textAlign: 'center' as const,
  },
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  calendarDay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayEmpty: {
    width: 40,
    height: 40,
  },
  calendarDaySelected: {
    backgroundColor: colors.dark.accent,
  },
  calendarDayPast: {
    opacity: 0.3,
  },
  calendarDayText: {
    color: colors.dark.text,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  calendarDayTextSelected: {
    color: colors.dark.text,
    fontWeight: '700' as const,
  },
  calendarDayTextPast: {
    color: colors.dark.textSecondary,
  },
  dateConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
  },
  dateConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  celebrationCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.dark.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.dark.gold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  celebrationCloseButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  trophyContainer: {
    marginBottom: 24,
    marginTop: 20,
  },
  congratsTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  congratsMessage: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center' as const,
    opacity: 0.8,
  },
  congratsExercise: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  congratsWeight: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800' as const,
    marginBottom: 24,
    textAlign: 'center' as const,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  rewardText: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  celebrationButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  celebrationGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  celebrationButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
});
