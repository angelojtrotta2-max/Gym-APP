// Re-exports from the JSON-based durable local database.
export {
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getWorkoutById,
  listWorkoutsByDate,
  listWorkoutsFiltered,
  getWorkoutDatesInMonth,
  getLastWorkout,
  duplicateWorkout,
  moveWorkoutToDate,
  getExerciseHistory,
  getAllExerciseNames,
} from './database';

export type {
  WorkoutSummary,
  WorkoutFilter,
  ExerciseHistoryPoint,
} from './database';
