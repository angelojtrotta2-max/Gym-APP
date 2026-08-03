export type WeightType = 'weighted' | 'bodyweight' | 'bodyweight_plus' | 'bodyweight_assisted';

export interface SetRow {
  id?: number;
  set_index: number;
  reps: number;
  weight: number;
}

export interface ExerciseRow {
  id?: number;
  workout_id?: number;
  muscle_group: string;
  name: string;
  rest_seconds: number;
  notes: string | null;
  weight_type: WeightType;
  sort_order: number;
  sets: SetRow[];
}

export interface WorkoutRow {
  id?: number;
  date: string; // YYYY-MM-DD
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  exercises: ExerciseRow[];
}

export interface MuscleGroupRow {
  id: number;
  name: string;
  is_custom: number;
  sort_order: number;
}

export interface TemplateRow {
  id?: number;
  name: string;
  notes: string | null;
  created_at?: string;
  exercises: ExerciseRow[];
}
