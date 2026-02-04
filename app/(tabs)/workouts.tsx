import { ScrollView, StyleSheet, Text, View, TouchableOpacity, TextInput, Modal, Alert, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Plus, X, Filter, ChevronDown, Play, Square, Copy, Trash2, Check, Trophy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useRef, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import type { Exercise, ExerciseCategory, MuscleGroup, Goal } from '@/types/workout';
import LavaBackground from '@/components/LavaBackground';
import { useTranslation } from '@/hooks/useTranslation';
import { useExercises } from '@/contexts/ExercisesContext';
import { categoryLabels, muscleGroupLabels } from '@/mocks/exercises';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useWorkoutSession } from '@/contexts/WorkoutSessionContext';

const categories: ExerciseCategory[] = ['Boxeo', 'MMA', 'Powerlifting', 'Corredores', 'Calistenia', 'GymComercial', 'GymBarrio', 'Extras'];
const muscleGroups: MuscleGroup[] = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Glúteos', 'Cuerpo Completo'];

const GOALS_STORAGE_KEY = 'user_goals';

export default function WorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const { allExercises, addCustomExercise } = useExercises();
  const { getTextColors } = useAppSettings();
  const textColors = getTextColors();
  const {
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
  } = useWorkoutSession();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'Todos'>('Todos');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'Todos'>('Todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showMuscleFilter, setShowMuscleFilter] = useState(false);
  const [showWorkoutPanel, setShowWorkoutPanel] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [achievedGoals, setAchievedGoals] = useState<string[]>([]);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseCategory, setNewExerciseCategory] = useState<ExerciseCategory>('GymComercial');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState<MuscleGroup>('Pecho');
  const [newExerciseEquipment, setNewExerciseEquipment] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isWorkoutActive && workoutStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - workoutStartTime.getTime()) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWorkoutActive, workoutStartTime]);

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
      ]).start();
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
    }
  }, [showCelebration, scaleAnim, rotateAnim]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredExercises = allExercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || exercise.category === selectedCategory;
    const matchesMuscle = selectedMuscle === 'Todos' || exercise.muscleGroup === selectedMuscle;
    return matchesSearch && matchesCategory && matchesMuscle;
  });

  const groupedExercises = filteredExercises.reduce((acc, exercise) => {
    const key = exercise.category;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);

  const handleAddExercise = () => {
    if (newExerciseName.trim()) {
      addCustomExercise({
        name: newExerciseName.trim(),
        category: newExerciseCategory,
        muscleGroup: newExerciseMuscle,
        primaryMuscle: newExerciseMuscle,
        equipment: newExerciseEquipment.trim() || undefined,
        difficulty: 'Intermedio',
      });
      setNewExerciseName('');
      setNewExerciseEquipment('');
      setShowAddModal(false);
    }
  };

  const validateGoals = useCallback(async (newPRs: Record<string, number>) => {
    console.log('[Workouts] Validating goals with new PRs:', newPRs);
    try {
      const storedGoals = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
      if (!storedGoals) return;

      const goals: Goal[] = JSON.parse(storedGoals);
      const achieved: string[] = [];
      let hasChanges = false;

      const updatedGoals = goals.map(goal => {
        const newPR = newPRs[goal.exerciseId];
        if (newPR && newPR >= goal.targetWeight && !goal.completed) {
          hasChanges = true;
          achieved.push(goal.exerciseName);
          return { ...goal, completed: true, progress: 100, currentWeight: newPR };
        }
        if (newPR && newPR > goal.currentWeight) {
          hasChanges = true;
          const progress = Math.min(100, Math.round((newPR / goal.targetWeight) * 100));
          return { ...goal, currentWeight: newPR, progress };
        }
        return goal;
      });

      if (hasChanges) {
        await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(updatedGoals));
      }

      if (achieved.length > 0) {
        setAchievedGoals(achieved);
        setShowCelebration(true);
      }
    } catch (error) {
      console.error('[Workouts] Error validating goals:', error);
    }
  }, []);

  const handleStartWorkout = () => {
    if (selectedExercises.length === 0) {
      Alert.alert('Sin ejercicios', 'Agrega al menos un ejercicio antes de iniciar');
      return;
    }
    startWorkout();
    setShowWorkoutPanel(true);
  };

  const handleFinishWorkout = async () => {
    Alert.alert(
      'Terminar Rutina',
      '¿Estás seguro de que quieres terminar el entrenamiento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Terminar',
          style: 'default',
          onPress: async () => {
            const { newPRs } = await finishWorkout();
            setShowWorkoutPanel(false);
            await validateGoals(newPRs);
            Alert.alert('¡Entrenamiento completado!', 'Tu progreso ha sido guardado.');
          },
        },
      ]
    );
  };

  const handleCancelWorkout = () => {
    Alert.alert(
      'Cancelar Rutina',
      '¿Estás seguro? Se perderá todo el progreso.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: () => {
            cancelWorkout();
            setShowWorkoutPanel(false);
          },
        },
      ]
    );
  };

  const activeFiltersCount = (selectedCategory !== 'Todos' ? 1 : 0) + (selectedMuscle !== 'Todos' ? 1 : 0);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[theme.dark.gradientStart, theme.dark.gradientEnd]}
        style={StyleSheet.absoluteFillObject}
      />
      <LavaBackground />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColors.primary }]}>{t.workouts.title}</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.dark.accent }]} onPress={() => setShowAddModal(true)} testID="workouts-add">
          <Plus size={24} color={colors.dark.text} />
        </TouchableOpacity>
      </View>

      {selectedExercises.length > 0 && !isWorkoutActive && (
        <View style={styles.workoutPreviewBar}>
          <View style={styles.workoutPreviewInfo}>
            <Text style={[styles.workoutPreviewCount, { color: textColors.primary }]}>
              {selectedExercises.length} ejercicio{selectedExercises.length !== 1 ? 's' : ''} seleccionado{selectedExercises.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity onPress={() => setShowWorkoutPanel(true)}>
              <Text style={[styles.workoutPreviewEdit, { color: theme.dark.accent }]}>Ver lista</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={[styles.startWorkoutButton, { backgroundColor: theme.dark.accent }]}
            onPress={handleStartWorkout}
          >
            <Play size={18} color={colors.dark.text} fill={colors.dark.text} />
            <Text style={styles.startWorkoutText}>Iniciar Rutina</Text>
          </TouchableOpacity>
        </View>
      )}

      {isWorkoutActive && (
        <TouchableOpacity 
          style={[styles.activeWorkoutBar, { backgroundColor: theme.dark.accent }]}
          onPress={() => setShowWorkoutPanel(true)}
        >
          <View style={styles.activeWorkoutInfo}>
            <View style={styles.activeWorkoutDot} />
            <Text style={styles.activeWorkoutText}>Entrenamiento en curso</Text>
          </View>
          <Text style={styles.activeWorkoutTime}>{formatTime(elapsedTime)}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.dark.accent + '15' }]}>
          <Search size={20} color={textColors.secondary} />
          <TextInput
            style={[styles.searchInput, { color: textColors.primary }]}
            placeholder={t.workouts.search}
            placeholderTextColor={textColors.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={[styles.filterButton, selectedCategory !== 'Todos' && { backgroundColor: theme.dark.accent, borderColor: theme.dark.accent }]}
          onPress={() => setShowCategoryFilter(true)}
        >
          <Filter size={16} color={selectedCategory !== 'Todos' ? colors.dark.text : textColors.secondary} />
          <Text style={[styles.filterButtonText, selectedCategory !== 'Todos' && styles.filterButtonTextActive]}>
            {selectedCategory === 'Todos' ? t.workouts.filterByCategory : categoryLabels[selectedCategory]}
          </Text>
          <ChevronDown size={16} color={selectedCategory !== 'Todos' ? colors.dark.text : textColors.secondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, selectedMuscle !== 'Todos' && { backgroundColor: theme.dark.accent, borderColor: theme.dark.accent }]}
          onPress={() => setShowMuscleFilter(true)}
        >
          <Text style={[styles.filterButtonText, selectedMuscle !== 'Todos' && styles.filterButtonTextActive]}>
            {selectedMuscle === 'Todos' ? t.workouts.filterByMuscle : muscleGroupLabels[selectedMuscle]}
          </Text>
          <ChevronDown size={16} color={selectedMuscle !== 'Todos' ? colors.dark.text : textColors.secondary} />
        </TouchableOpacity>

        {activeFiltersCount > 0 && (
          <TouchableOpacity
            style={styles.clearFilters}
            onPress={() => {
              setSelectedCategory('Todos');
              setSelectedMuscle('Todos');
            }}
          >
            <X size={16} color={colors.dark.error} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.exercisesSection}>
          <Text style={[styles.sectionTitle, { color: textColors.primary }]}>{t.workouts.allExercises}</Text>
          <Text style={[styles.exerciseCount, { color: textColors.secondary }]}>{filteredExercises.length} ejercicios</Text>
        </View>

        {Object.entries(groupedExercises).map(([category, categoryExercises]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={[styles.categoryTitle, { color: theme.dark.accent }]}>{categoryLabels[category] || category}</Text>
            {categoryExercises.map((exercise) => {
              const isSelected = selectedExercises.some(e => e.exercise.id === exercise.id);
              return (
                <TouchableOpacity 
                  key={exercise.id} 
                  style={[
                    styles.exerciseCard,
                    { backgroundColor: theme.dark.accent + '10' },
                    isSelected && { borderColor: theme.dark.accent, borderWidth: 2 }
                  ]}
                  onPress={() => {
                    if (isSelected) {
                      removeExerciseFromWorkout(exercise.id);
                    } else {
                      addExerciseToWorkout(exercise);
                    }
                  }}
                >
                  <View style={[styles.exerciseIcon, { backgroundColor: theme.dark.accent + '25' }]}>
                    <Text style={[styles.exerciseIconText, { color: theme.dark.accent }]}>{exercise.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, { color: textColors.primary }]}>{exercise.name}</Text>
                    <View style={styles.exerciseTags}>
                      <View style={[styles.tag, { backgroundColor: theme.dark.accent + '25' }]}>
                        <Text style={[styles.tagText, { color: theme.dark.accent }]}>{exercise.muscleGroup}</Text>
                      </View>
                      {exercise.equipment && (
                        <View style={[styles.tag, styles.tagSecondary]}>
                          <Text style={[styles.tagTextSecondary, { color: textColors.secondary }]}>{exercise.equipment}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={[styles.addExerciseButton, isSelected && { backgroundColor: theme.dark.accent }]}>
                    {isSelected ? (
                      <Check size={20} color={colors.dark.text} />
                    ) : (
                      <Plus size={20} color={theme.dark.accent} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {filteredExercises.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: textColors.primary }]}>No se encontraron ejercicios</Text>
            <Text style={[styles.emptySubtext, { color: textColors.secondary }]}>Intenta ajustar los filtros</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showWorkoutPanel}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWorkoutPanel(false)}
      >
        <View style={styles.workoutPanelOverlay}>
          <View style={[styles.workoutPanelCard, { backgroundColor: theme.dark.gradientEnd }]}>
            <LinearGradient
              colors={[theme.dark.gradientStart, theme.dark.gradientEnd]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.workoutPanelHeader}>
              <View>
                <Text style={[styles.workoutPanelTitle, { color: textColors.primary }]}>
                  {isWorkoutActive ? 'Entrenamiento Activo' : 'Tu Rutina'}
                </Text>
                {isWorkoutActive && (
                  <Text style={[styles.workoutPanelTimer, { color: theme.dark.accent }]}>
                    {formatTime(elapsedTime)}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowWorkoutPanel(false)}>
                <X size={24} color={textColors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.workoutPanelScroll} showsVerticalScrollIndicator={false}>
              {selectedExercises.map((item, exerciseIndex) => (
                <View key={item.exercise.id} style={[styles.workoutExerciseCard, { backgroundColor: theme.dark.accent + '12' }]}>
                  <View style={styles.workoutExerciseHeader}>
                    <View style={styles.workoutExerciseInfo}>
                      <Text style={[styles.workoutExerciseNumber, { color: theme.dark.accent }]}>
                        {exerciseIndex + 1}
                      </Text>
                      <View>
                        <Text style={[styles.workoutExerciseName, { color: textColors.primary }]}>
                          {item.exercise.name}
                        </Text>
                        <Text style={[styles.workoutExerciseMuscle, { color: textColors.secondary }]}>
                          {item.exercise.muscleGroup}
                        </Text>
                      </View>
                    </View>
                    {!isWorkoutActive && (
                      <TouchableOpacity
                        style={styles.removeExerciseButton}
                        onPress={() => removeExerciseFromWorkout(item.exercise.id)}
                      >
                        <Trash2 size={18} color={colors.dark.error} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.setsContainer}>
                    <View style={styles.setsHeader}>
                      <Text style={[styles.setHeaderText, { color: textColors.secondary }]}>SET</Text>
                      <Text style={[styles.setHeaderText, { color: textColors.secondary }]}>PESO (kg)</Text>
                      <Text style={[styles.setHeaderText, { color: textColors.secondary }]}>REPS</Text>
                      {isWorkoutActive && <Text style={[styles.setHeaderText, { color: textColors.secondary }]}>✓</Text>}
                    </View>

                    {item.sets.map((set, setIndex) => (
                      <View key={setIndex} style={[styles.setRow, set.completed && { backgroundColor: theme.dark.accent + '20' }]}>
                        <Text style={[styles.setNumber, { color: textColors.primary }]}>{setIndex + 1}</Text>
                        <TextInput
                          style={[styles.setInput, { color: textColors.primary, borderColor: theme.dark.accent + '40' }]}
                          keyboardType="numeric"
                          value={set.weight > 0 ? set.weight.toString() : ''}
                          onChangeText={(text) => updateSet(item.exercise.id, setIndex, { weight: parseFloat(text) || 0 })}
                          placeholder="0"
                          placeholderTextColor={textColors.secondary}
                        />
                        <TextInput
                          style={[styles.setInput, { color: textColors.primary, borderColor: theme.dark.accent + '40' }]}
                          keyboardType="numeric"
                          value={set.reps > 0 ? set.reps.toString() : ''}
                          onChangeText={(text) => updateSet(item.exercise.id, setIndex, { reps: parseInt(text) || 0 })}
                          placeholder="0"
                          placeholderTextColor={textColors.secondary}
                        />
                        {isWorkoutActive && (
                          <TouchableOpacity
                            style={[styles.setCheckButton, set.completed && { backgroundColor: theme.dark.accent }]}
                            onPress={() => toggleSetCompleted(item.exercise.id, setIndex)}
                          >
                            <Check size={16} color={set.completed ? colors.dark.text : textColors.secondary} />
                          </TouchableOpacity>
                        )}
                        {!isWorkoutActive && item.sets.length > 1 && (
                          <TouchableOpacity
                            style={styles.setRemoveButton}
                            onPress={() => removeSet(item.exercise.id, setIndex)}
                          >
                            <X size={14} color={colors.dark.error} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>

                  <View style={styles.setActionsRow}>
                    <TouchableOpacity
                      style={[styles.setActionButton, { borderColor: theme.dark.accent }]}
                      onPress={() => addSet(item.exercise.id)}
                    >
                      <Plus size={16} color={theme.dark.accent} />
                      <Text style={[styles.setActionText, { color: theme.dark.accent }]}>Agregar Set</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.setActionButton, { borderColor: theme.dark.accent }]}
                      onPress={() => duplicateSet(item.exercise.id)}
                    >
                      <Copy size={16} color={theme.dark.accent} />
                      <Text style={[styles.setActionText, { color: theme.dark.accent }]}>Duplicar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {selectedExercises.length === 0 && (
                <View style={styles.emptyWorkoutState}>
                  <Text style={[styles.emptyWorkoutText, { color: textColors.secondary }]}>
                    No hay ejercicios seleccionados
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.workoutPanelActions}>
              {!isWorkoutActive ? (
                <>
                  <TouchableOpacity
                    style={[styles.workoutActionButton, styles.workoutSecondaryButton]}
                    onPress={() => setShowWorkoutPanel(false)}
                  >
                    <Text style={[styles.workoutSecondaryButtonText, { color: textColors.primary }]}>Cerrar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.workoutActionButton, { backgroundColor: theme.dark.accent }]}
                    onPress={handleStartWorkout}
                  >
                    <Play size={20} color={colors.dark.text} fill={colors.dark.text} />
                    <Text style={styles.workoutPrimaryButtonText}>Iniciar Rutina</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.workoutActionButton, styles.workoutCancelButton]}
                    onPress={handleCancelWorkout}
                  >
                    <X size={20} color={colors.dark.error} />
                    <Text style={[styles.workoutCancelButtonText, { color: colors.dark.error }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.workoutActionButton, { backgroundColor: theme.dark.accent }]}
                    onPress={handleFinishWorkout}
                  >
                    <Square size={20} color={colors.dark.text} fill={colors.dark.text} />
                    <Text style={styles.workoutPrimaryButtonText}>Terminar Rutina</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCelebration}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCelebration(false)}
      >
        <View style={styles.celebrationOverlay}>
          <Animated.View style={[styles.celebrationCard, { transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity style={styles.celebrationClose} onPress={() => setShowCelebration(false)}>
              <X size={24} color={colors.dark.text} />
            </TouchableOpacity>
            
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <View style={styles.trophyContainer}>
                <Trophy size={80} color={colors.dark.gold} fill={colors.dark.gold} />
              </View>
            </Animated.View>
            
            <Text style={styles.celebrationTitle}>¡Meta Alcanzada!</Text>
            <Text style={styles.celebrationMessage}>Has completado tu objetivo en:</Text>
            {achievedGoals.map((goal, i) => (
              <Text key={i} style={[styles.celebrationGoal, { color: theme.dark.accent }]}>{goal}</Text>
            ))}
            
            <TouchableOpacity 
              style={[styles.celebrationButton, { backgroundColor: theme.dark.accent }]}
              onPress={() => setShowCelebration(false)}
            >
              <Text style={styles.celebrationButtonText}>¡Genial!</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.dark.gradientEnd }]}>
            <LinearGradient
              colors={[theme.dark.gradientStart + '80', theme.dark.gradientEnd]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColors.primary }]}>{t.workouts.addExercise}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={textColors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: textColors.primary }]}>{t.workouts.exerciseName}</Text>
              <TextInput
                style={[styles.input, { color: textColors.primary, borderColor: theme.dark.accent + '40' }]}
                placeholder="ej. Cruce de poleas"
                placeholderTextColor={textColors.secondary}
                value={newExerciseName}
                onChangeText={setNewExerciseName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: textColors.primary }]}>{t.workouts.category}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                <View style={styles.categoryButtons}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryButton,
                        newExerciseCategory === cat && { backgroundColor: theme.dark.accent, borderColor: theme.dark.accent },
                      ]}
                      onPress={() => setNewExerciseCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          { color: textColors.secondary },
                          newExerciseCategory === cat && styles.categoryButtonTextActive,
                        ]}
                      >
                        {categoryLabels[cat]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: textColors.primary }]}>{t.workouts.primaryMuscle}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                <View style={styles.categoryButtons}>
                  {muscleGroups.map((muscle) => (
                    <TouchableOpacity
                      key={muscle}
                      style={[
                        styles.categoryButton,
                        newExerciseMuscle === muscle && { backgroundColor: theme.dark.accent, borderColor: theme.dark.accent },
                      ]}
                      onPress={() => setNewExerciseMuscle(muscle)}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          { color: textColors.secondary },
                          newExerciseMuscle === muscle && styles.categoryButtonTextActive,
                        ]}
                      >
                        {muscleGroupLabels[muscle]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: textColors.primary }]}>{t.workouts.equipment}</Text>
              <TextInput
                style={[styles.input, { color: textColors.primary, borderColor: theme.dark.accent + '40' }]}
                placeholder="ej. Polea, Mancuernas"
                placeholderTextColor={textColors.secondary}
                value={newExerciseEquipment}
                onChangeText={setNewExerciseEquipment}
              />
            </View>

            <TouchableOpacity
              style={[styles.addButton2, { backgroundColor: theme.dark.accent }]}
              onPress={handleAddExercise}
            >
              <Text style={styles.addButtonText}>{t.common.add}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCategoryFilter}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryFilter(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.filterModal, { backgroundColor: theme.dark.gradientEnd }]}>
            <LinearGradient
              colors={[theme.dark.gradientStart + '80', theme.dark.gradientEnd]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColors.primary }]}>{t.workouts.filterByCategory}</Text>
              <TouchableOpacity onPress={() => setShowCategoryFilter(false)}>
                <X size={24} color={textColors.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.filterOption, selectedCategory === 'Todos' && { backgroundColor: theme.dark.accent }]}
                onPress={() => { setSelectedCategory('Todos'); setShowCategoryFilter(false); }}
              >
                <Text style={[styles.filterOptionText, { color: textColors.secondary }, selectedCategory === 'Todos' && styles.filterOptionTextActive]}>
                  {t.workouts.all}
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterOption, selectedCategory === cat && { backgroundColor: theme.dark.accent }]}
                  onPress={() => { setSelectedCategory(cat); setShowCategoryFilter(false); }}
                >
                  <Text style={[styles.filterOptionText, { color: textColors.secondary }, selectedCategory === cat && styles.filterOptionTextActive]}>
                    {categoryLabels[cat]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showMuscleFilter}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMuscleFilter(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.filterModal, { backgroundColor: theme.dark.gradientEnd }]}>
            <LinearGradient
              colors={[theme.dark.gradientStart + '80', theme.dark.gradientEnd]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColors.primary }]}>{t.workouts.filterByMuscle}</Text>
              <TouchableOpacity onPress={() => setShowMuscleFilter(false)}>
                <X size={24} color={textColors.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.filterOption, selectedMuscle === 'Todos' && { backgroundColor: theme.dark.accent }]}
                onPress={() => { setSelectedMuscle('Todos'); setShowMuscleFilter(false); }}
              >
                <Text style={[styles.filterOptionText, { color: textColors.secondary }, selectedMuscle === 'Todos' && styles.filterOptionTextActive]}>
                  {t.workouts.all}
                </Text>
              </TouchableOpacity>
              {muscleGroups.map((muscle) => (
                <TouchableOpacity
                  key={muscle}
                  style={[styles.filterOption, selectedMuscle === muscle && { backgroundColor: theme.dark.accent }]}
                  onPress={() => { setSelectedMuscle(muscle); setShowMuscleFilter(false); }}
                >
                  <Text style={[styles.filterOptionText, { color: textColors.secondary }, selectedMuscle === muscle && styles.filterOptionTextActive]}>
                    {muscleGroupLabels[muscle]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
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
  workoutPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  workoutPreviewInfo: {
    flex: 1,
  },
  workoutPreviewCount: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  workoutPreviewEdit: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  startWorkoutText: {
    color: colors.dark.text,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  activeWorkoutBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
  },
  activeWorkoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activeWorkoutDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.dark.text,
  },
  activeWorkoutText: {
    color: colors.dark.text,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  activeWorkoutTime: {
    color: colors.dark.text,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  searchInput: {
    flex: 1,
    color: colors.dark.text,
    fontSize: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dark.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  filterButtonText: {
    color: colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  filterButtonTextActive: {
    color: colors.dark.text,
  },
  clearFilters: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.dark.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  exercisesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.dark.text,
    fontSize: 22,
    fontWeight: '700' as const,
  },
  exerciseCount: {
    color: colors.dark.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  categorySection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  categoryTitle: {
    color: colors.dark.accent,
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 12,
    textTransform: 'uppercase' as const,
  },
  exerciseCard: {
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
  exerciseIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.dark.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseIconText: {
    color: colors.dark.accent,
    fontSize: 20,
    fontWeight: '700' as const,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  exerciseTags: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.dark.accent + '20',
  },
  tagText: {
    color: colors.dark.accent,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  tagSecondary: {
    backgroundColor: colors.dark.surfaceSecondary,
  },
  tagTextSecondary: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  addExerciseButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.dark.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.dark.text,
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  emptySubtext: {
    color: colors.dark.textSecondary,
    fontSize: 14,
  },
  workoutPanelOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  workoutPanelCard: {
    backgroundColor: colors.dark.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  workoutPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  workoutPanelTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  workoutPanelTimer: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginTop: 4,
  },
  workoutPanelScroll: {
    padding: 20,
    maxHeight: 500,
  },
  workoutExerciseCard: {
    backgroundColor: colors.dark.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  workoutExerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutExerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  workoutExerciseNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  workoutExerciseName: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  workoutExerciseMuscle: {
    fontSize: 13,
    marginTop: 2,
  },
  removeExerciseButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.dark.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setsContainer: {
    marginBottom: 12,
  },
  setsHeader: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  setHeaderText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  setNumber: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  setInput: {
    flex: 1,
    backgroundColor: colors.dark.surface,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    borderWidth: 1,
  },
  setCheckButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  setRemoveButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.dark.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  setActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  setActionText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  emptyWorkoutState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyWorkoutText: {
    fontSize: 15,
  },
  workoutPanelActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  workoutActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  workoutSecondaryButton: {
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  workoutSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  workoutPrimaryButtonText: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  workoutCancelButton: {
    backgroundColor: colors.dark.error + '15',
    borderWidth: 1,
    borderColor: colors.dark.error + '40',
  },
  workoutCancelButtonText: {
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
    maxWidth: 340,
    backgroundColor: colors.dark.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.dark.gold,
  },
  celebrationClose: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyContainer: {
    marginBottom: 20,
    marginTop: 10,
  },
  celebrationTitle: {
    color: colors.dark.text,
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  celebrationMessage: {
    color: colors.dark.textSecondary,
    fontSize: 15,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  celebrationGoal: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
    textAlign: 'center' as const,
  },
  celebrationButton: {
    marginTop: 20,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  celebrationButtonText: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '700' as const,
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
    maxHeight: '85%',
    overflow: 'hidden',
  },
  filterModal: {
    backgroundColor: colors.dark.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '60%',
    overflow: 'hidden',
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
  categoryScroll: {
    maxHeight: 50,
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.dark.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  categoryButtonText: {
    color: colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  categoryButtonTextActive: {
    color: colors.dark.text,
  },
  addButton2: {
    backgroundColor: colors.dark.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: colors.dark.text,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  filterOption: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.dark.surfaceSecondary,
    marginBottom: 8,
  },
  filterOptionText: {
    color: colors.dark.textSecondary,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  filterOptionTextActive: {
    color: colors.dark.text,
  },
});
