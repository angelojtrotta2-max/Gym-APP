// JSON-based durable local database using @/src/utils/storage (AsyncStorage).
// On native (Expo Go / production build), AsyncStorage is backed by
// SQLite (Android) / persistent files (iOS) — meeting the offline-first,
// local-database-equivalent requirement.
// The entire dataset is stored as a single JSON blob under DB_KEY.

import { storage } from '@/src/utils/storage';
import {
  ExerciseRow,
  MuscleGroupRow,
  SetRow,
  TemplateRow,
  WorkoutRow,
} from './types';

const DB_KEY = 'gymlog_db_v1';

const DEFAULT_MUSCLE_GROUPS = [
  'Petto', 'Schiena', 'Spalle', 'Bicipiti', 'Tricipiti',
  'Quadricipiti', 'Femorali', 'Glutei', 'Polpacci', 'Addome',
  'Gambe', 'Full body', 'Altro',
];

interface DbShape {
  next_id: number;
  workouts: WorkoutRow[];
  templates: TemplateRow[];
  muscle_groups: MuscleGroupRow[];
}

let cache: DbShape | null = null;
let loading: Promise<DbShape> | null = null;

function emptyDb(): DbShape {
  return {
    next_id: 1,
    workouts: [],
    templates: [],
    muscle_groups: DEFAULT_MUSCLE_GROUPS.map((name, i) => ({
      id: i + 1,
      name,
      is_custom: 0,
      sort_order: i,
    })),
  };
}

export async function loadDb(): Promise<DbShape> {
  if (cache) return cache;
  if (loading) return loading;
  loading = (async () => {
    const raw = await storage.getItem(DB_KEY, '' as string);
    if (raw && typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw) as DbShape;
        // Ensure default muscle groups exist
        if (!parsed.muscle_groups || parsed.muscle_groups.length === 0) {
          parsed.muscle_groups = emptyDb().muscle_groups;
        }
        if (typeof parsed.next_id !== 'number') parsed.next_id = 1;
        if (!Array.isArray(parsed.workouts)) parsed.workouts = [];
        if (!Array.isArray(parsed.templates)) parsed.templates = [];
        cache = parsed;
        return parsed;
      } catch {
        // fallthrough to empty
      }
    }
    const fresh = emptyDb();
    cache = fresh;
    await persist();
    return fresh;
  })();
  const db = await loading;
  loading = null;
  return db;
}

async function persist() {
  if (!cache) return;
  await storage.setItem(DB_KEY, JSON.stringify(cache));
}

function nextId(): number {
  if (!cache) throw new Error('DB not loaded');
  const id = cache.next_id;
  cache.next_id = id + 1;
  return id;
}

export function nowIso() {
  return new Date().toISOString();
}

// Called by root layout on startup to warm the cache
export async function initDb(): Promise<void> {
  await loadDb();
}

// ============= WORKOUTS =============

export interface WorkoutSummary {
  id: number;
  date: string;
  notes: string | null;
  exercise_count: number;
  muscle_groups: string[];
  total_volume: number;
}

function summarize(w: WorkoutRow): WorkoutSummary {
  const groups = new Set<string>();
  let vol = 0;
  for (const e of w.exercises) {
    groups.add(e.muscle_group);
    for (const s of e.sets) {
      vol += (s.reps || 0) * (s.weight || 0);
    }
  }
  return {
    id: w.id!,
    date: w.date,
    notes: w.notes,
    exercise_count: w.exercises.length,
    muscle_groups: Array.from(groups),
    total_volume: vol,
  };
}

export async function createWorkout(
  w: Omit<WorkoutRow, 'id' | 'created_at' | 'updated_at'>
): Promise<number> {
  const db = await loadDb();
  const id = nextId();
  const now = nowIso();
  const full: WorkoutRow = {
    id,
    date: w.date,
    notes: w.notes,
    created_at: now,
    updated_at: now,
    exercises: w.exercises.map((e, i) => ({
      ...e,
      id: nextId(),
      workout_id: id,
      sort_order: i,
      sets: e.sets.map((s, j) => ({
        id: nextId(),
        set_index: j,
        reps: s.reps,
        weight: s.weight,
      })),
    })),
  };
  db.workouts.push(full);
  await persist();
  return id;
}

export async function updateWorkout(
  id: number,
  w: Omit<WorkoutRow, 'id' | 'created_at' | 'updated_at'>
): Promise<void> {
  const db = await loadDb();
  const idx = db.workouts.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error('Workout not found');
  const existing = db.workouts[idx];
  const now = nowIso();
  const updated: WorkoutRow = {
    ...existing,
    date: w.date,
    notes: w.notes,
    updated_at: now,
    exercises: w.exercises.map((e, i) => ({
      ...e,
      id: nextId(),
      workout_id: id,
      sort_order: i,
      sets: e.sets.map((s, j) => ({
        id: nextId(),
        set_index: j,
        reps: s.reps,
        weight: s.weight,
      })),
    })),
  };
  db.workouts[idx] = updated;
  await persist();
}

export async function deleteWorkout(id: number): Promise<void> {
  const db = await loadDb();
  db.workouts = db.workouts.filter((w) => w.id !== id);
  await persist();
}

export async function getWorkoutById(id: number): Promise<WorkoutRow | null> {
  const db = await loadDb();
  const w = db.workouts.find((x) => x.id === id);
  if (!w) return null;
  // Deep clone to avoid mutation
  return JSON.parse(JSON.stringify(w));
}

export async function listWorkoutsByDate(date: string): Promise<WorkoutSummary[]> {
  return listWorkoutsFiltered({ date });
}

export interface WorkoutFilter {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  muscleGroup?: string;
  exerciseName?: string;
  notesText?: string;
}

export async function listWorkoutsFiltered(f: WorkoutFilter): Promise<WorkoutSummary[]> {
  const db = await loadDb();
  let list = db.workouts.slice();
  if (f.date) list = list.filter((w) => w.date === f.date);
  if (f.dateFrom) list = list.filter((w) => w.date >= f.dateFrom!);
  if (f.dateTo) list = list.filter((w) => w.date <= f.dateTo!);
  if (f.muscleGroup) {
    const mg = f.muscleGroup.toLowerCase();
    list = list.filter((w) =>
      w.exercises.some((e) => e.muscle_group.toLowerCase() === mg)
    );
  }
  if (f.exerciseName) {
    const q = f.exerciseName.toLowerCase();
    list = list.filter((w) =>
      w.exercises.some((e) => e.name.toLowerCase().includes(q))
    );
  }
  if (f.notesText) {
    const q = f.notesText.toLowerCase();
    list = list.filter(
      (w) =>
        (w.notes || '').toLowerCase().includes(q) ||
        w.exercises.some((e) => (e.notes || '').toLowerCase().includes(q))
    );
  }
  // Sort desc by date then id
  list.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return (b.id || 0) - (a.id || 0);
  });
  return list.map(summarize);
}

export async function getWorkoutDatesInMonth(
  year: number,
  month: number
): Promise<Set<string>> {
  const db = await loadDb();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const set = new Set<string>();
  for (const w of db.workouts) {
    if (w.date.startsWith(prefix)) set.add(w.date);
  }
  return set;
}

export async function getLastWorkout(): Promise<WorkoutSummary | null> {
  const list = await listWorkoutsFiltered({});
  return list[0] || null;
}

export async function duplicateWorkout(id: number, newDate?: string): Promise<number> {
  const original = await getWorkoutById(id);
  if (!original) throw new Error('Workout non trovato');
  const newId = await createWorkout({
    date: newDate || original.date,
    notes: original.notes,
    exercises: original.exercises.map((e) => ({
      ...e,
      id: undefined,
      workout_id: undefined,
      sets: e.sets.map((s) => ({ ...s, id: undefined })),
    })),
  });
  return newId;
}

export async function moveWorkoutToDate(id: number, newDate: string): Promise<void> {
  const db = await loadDb();
  const w = db.workouts.find((x) => x.id === id);
  if (!w) throw new Error('Workout not found');
  w.date = newDate;
  w.updated_at = nowIso();
  await persist();
}

export interface ExerciseHistoryPoint {
  workout_id: number;
  date: string;
  max_weight: number;
  total_reps: number;
  total_volume: number;
  set_count: number;
  notes: string | null;
  sets: SetRow[];
}

export async function getExerciseHistory(
  exerciseName: string
): Promise<ExerciseHistoryPoint[]> {
  const db = await loadDb();
  const q = exerciseName.toLowerCase();
  const out: ExerciseHistoryPoint[] = [];
  for (const w of db.workouts) {
    for (const e of w.exercises) {
      if (e.name.toLowerCase() === q) {
        let max = 0;
        let reps = 0;
        let vol = 0;
        for (const s of e.sets) {
          if (s.weight > max) max = s.weight;
          reps += s.reps;
          vol += s.reps * s.weight;
        }
        out.push({
          workout_id: w.id!,
          date: w.date,
          max_weight: max,
          total_reps: reps,
          total_volume: vol,
          set_count: e.sets.length,
          notes: e.notes,
          sets: e.sets,
        });
      }
    }
  }
  out.sort((a, b) => (a.date < b.date ? -1 : 1));
  return out;
}

export async function getAllExerciseNames(): Promise<string[]> {
  const db = await loadDb();
  const set = new Set<string>();
  for (const w of db.workouts) {
    for (const e of w.exercises) set.add(e.name);
  }
  return Array.from(set).sort();
}

// ============= MUSCLE GROUPS =============

export async function listMuscleGroups(): Promise<MuscleGroupRow[]> {
  const db = await loadDb();
  return db.muscle_groups
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}

export async function addMuscleGroup(name: string): Promise<void> {
  const db = await loadDb();
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Nome vuoto');
  if (db.muscle_groups.some((g) => g.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('Gruppo già esistente');
  }
  const maxOrder = db.muscle_groups.reduce((m, g) => Math.max(m, g.sort_order), 0);
  db.muscle_groups.push({
    id: nextId(),
    name: trimmed,
    is_custom: 1,
    sort_order: maxOrder + 1,
  });
  await persist();
}

export async function updateMuscleGroup(id: number, name: string): Promise<void> {
  const db = await loadDb();
  const g = db.muscle_groups.find((x) => x.id === id);
  if (!g) throw new Error('Gruppo non trovato');
  g.name = name.trim();
  await persist();
}

export async function deleteMuscleGroup(id: number): Promise<void> {
  const db = await loadDb();
  db.muscle_groups = db.muscle_groups.filter((g) => g.id !== id);
  await persist();
}

// ============= TEMPLATES =============

export async function listTemplates(): Promise<TemplateRow[]> {
  const db = await loadDb();
  return db.templates
    .slice()
    .sort((a, b) => (a.created_at! < b.created_at! ? 1 : -1))
    .map((t) => ({ ...t, exercises: [] }));
}

export async function getTemplateById(id: number): Promise<TemplateRow | null> {
  const db = await loadDb();
  const t = db.templates.find((x) => x.id === id);
  if (!t) return null;
  return JSON.parse(JSON.stringify(t));
}

export async function saveTemplate(
  t: Omit<TemplateRow, 'id' | 'created_at'>
): Promise<number> {
  const db = await loadDb();
  const id = nextId();
  const full: TemplateRow = {
    id,
    name: t.name,
    notes: t.notes,
    created_at: nowIso(),
    exercises: t.exercises.map((e, i) => ({
      ...e,
      id: nextId(),
      sort_order: i,
      sets: e.sets.map((s, j) => ({
        id: nextId(),
        set_index: j,
        reps: s.reps,
        weight: s.weight,
      })),
    })),
  };
  db.templates.push(full);
  await persist();
  return id;
}

export async function deleteTemplate(id: number): Promise<void> {
  const db = await loadDb();
  db.templates = db.templates.filter((t) => t.id !== id);
  await persist();
}
