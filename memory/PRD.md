# Gym Log Offline - Product Requirements Document

## Overview
Fully offline mobile app for gym workout tracking, built with React Native + Expo. No account, no login, no external services. All data lives on-device via durable local storage (AsyncStorage → SQLite backend on Android / persistent file on iOS / IndexedDB on Web).

## Language
Italian (IT) — all UI copy in Italian.

## Storage
- Local durable JSON database persisted through `@/src/utils/storage` (AsyncStorage).
- Zero network, zero cloud, zero authentication.
- Data survives app restart, device reboot, and Emergent account deletion.

## Screens
1. **Home** (`/(tabs)/index.tsx`) — today's date, today's workouts, last workout, quick actions.
2. **Calendario** (`/(tabs)/calendar.tsx`) — monthly view, marked days, add/view workouts per day.
3. **Storico** (`/(tabs)/history.tsx`) — all workouts, filters by muscle group + free-text search across exercise names and notes.
4. **Progressi** (`/(tabs)/progress.tsx`) — exercise selector, max weight chart, volume, frequency, per-session history.
5. **Impostazioni** (`/(tabs)/settings.tsx`) — theme (dark/light/auto), custom muscle groups CRUD, link to templates.
6. **Workout editor** (`/workout/[id].tsx`) — create/edit/view; supports duplicate, move date, delete, save as template.
7. **Modelli** (`/templates/index.tsx`) — list templates; expand to view; use to seed a new workout; delete.

## Data Model
- **Workout**: date (YYYY-MM-DD), notes, exercises[]
- **Exercise**: muscle_group, name (required), rest_seconds, notes/tipologia (free text), weight_type (weighted / bodyweight / bodyweight_plus / bodyweight_assisted), sets[]
- **Set**: reps, weight (kg) — per-set values allowed; quick "apply to all" supported
- **Template**: name, notes, exercises[] (same shape)
- **MuscleGroup**: name, is_custom, sort_order (13 defaults seeded on first launch)

## Key Features
- Per-set reps and weight editing + "Applica a tutte" quick mode
- Rest presets (30/45/60/90/120/180s) + custom seconds
- Rest timer overlay with vibration + haptic on end
- Exercise reordering (up/down), duplicate, delete
- Muscle group picker with inline "add new"
- Bodyweight options (con peso aggiuntivo / assistito)
- Search history by muscle group AND text (matches exercise name OR notes/tipologia)
- Simple bar chart for weight progression
- Dark / Light / Auto theme
- Confirm dialogs for destructive actions
- Toasts for feedback

## Tech
- Expo SDK 54, expo-router (file-based routing, tabs group)
- React Native components only
- expo-haptics + Vibration API for rest timer
- @expo/vector-icons (Ionicons)
- SafeAreaProvider + insets on all screens
- StyleSheet + theme tokens (no CSS/className)

## Not Included (deferred by user)
- Backup/Restore JSON/CSV (to be added later if credits remain)
- Custom audio bip (using system vibration + haptics only)
