export type ExerciseCategory = 
  | 'Boxeo'
  | 'MMA'
  | 'Powerlifting'
  | 'Corredores'
  | 'Calistenia'
  | 'GymComercial'
  | 'GymBarrio'
  | 'Extras';

export type MuscleGroup = 
  | 'Pecho'
  | 'Espalda'
  | 'Piernas'
  | 'Hombros'
  | 'Brazos'
  | 'Core'
  | 'Glúteos'
  | 'Cuerpo Completo';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroup: MuscleGroup;
  equipment?: string;
  primaryMuscle: string;
  secondaryMuscles?: string[];
  muscleActivation?: Record<string, number>;
  difficulty?: 'Principiante' | 'Intermedio' | 'Avanzado';
}

export interface WorkoutSet {
  reps: number;
  weight: number;
  completed?: boolean;
}

export interface WorkoutExerciseSession {
  exercise: Exercise;
  sets: WorkoutSet[];
}

export interface CompletedWorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  sets: WorkoutSet[];
}

export interface CompletedWorkout {
  id: string;
  date: string;
  duration: number;
  exercises: CompletedWorkoutExercise[];
  totalVolume: number;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  date?: string;
  duration?: number;
}

export interface Goal {
  id: string;
  exerciseId: string;
  exerciseName: string;
  currentWeight: number;
  targetWeight: number;
  deadline: string;
  progress: number;
  completed?: boolean;
}

export interface Stats {
  totalWorkouts: number;
  totalVolume: number;
  personalRecords: Record<string, number>;
  weeklyProgress: number[];
}

export interface MuscleStats {
  muscleGroup: MuscleGroup;
  totalVolume: number;
  sessions: number;
  strength: number;
}
