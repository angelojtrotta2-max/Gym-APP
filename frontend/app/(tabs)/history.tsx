import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import { useTheme } from "@/src/theme/ThemeContext";
import { radius, spacing, typography } from "@/src/theme/colors";
import { Card } from "@/src/components/UI";
import { OptionPicker } from "@/src/components/Modals";
import {
  listWorkoutsFiltered,
  WorkoutFilter,
  WorkoutSummary,
} from "@/src/db/workouts";
import { listMuscleGroups } from "@/src/db/muscleGroups";
import { formatShort } from "@/src/utils/date";

export default function HistoryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<string | undefined>(undefined);
  const [groups, setGroups] = useState<string[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(async () => {
    const filter: WorkoutFilter = {};
    if (muscleGroup) filter.muscleGroup = muscleGroup;
    if (search.trim()) {
      // Search across exercise name AND notes/tipologia
      filter.exerciseName = search.trim();
    }
    let list = await listWorkoutsFiltered(filter);
    // Also allow search matching in notes text
    if (search.trim()) {
      const notesFilter: WorkoutFilter = { notesText: search.trim() };
      if (muscleGroup) notesFilter.muscleGroup = muscleGroup;
      const notesMatch = await listWorkoutsFiltered(notesFilter);
      const combined = new Map<number, WorkoutSummary>();
      for (const w of list) combined.set(w.id, w);
      for (const w of notesMatch) combined.set(w.id, w);
      list = Array.from(combined.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
    }
    setWorkouts(list);
  }, [search, muscleGroup]);

  useFocusEffect(
    useCallback(() => {
      listMuscleGroups().then((mg) => setGroups(mg.map((m) => m.name)));
      load();
    }, [load])
  );

  useEffect(() => {
    load();
  }, [search, muscleGroup, load]);

  const clearFilters = () => {
    setSearch("");
    setMuscleGroup(undefined);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
        <Text style={[styles.title, { color: colors.onSurface }]}>Storico</Text>

        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.onSurfaceSecondary} />
          <TextInput
            testID="history-search"
            style={[styles.searchInput, { color: colors.onSurface }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Cerca esercizio o note..."
            placeholderTextColor={colors.onSurfaceSecondary}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={colors.onSurfaceSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.md }}
          style={{ marginBottom: spacing.sm }}
        >
          <TouchableOpacity
            testID="history-filter-group"
            onPress={() => setPickerOpen(true)}
            style={[
              styles.chip,
              {
                backgroundColor: muscleGroup ? colors.brand : colors.surfaceSecondary,
                borderColor: muscleGroup ? colors.brand : colors.border,
              },
            ]}
          >
            <Ionicons
              name="fitness"
              size={14}
              color={muscleGroup ? colors.onBrand : colors.onSurface}
            />
            <Text style={{ color: muscleGroup ? colors.onBrand : colors.onSurface, fontWeight: "700" }}>
              {muscleGroup || "Gruppo muscolare"}
            </Text>
          </TouchableOpacity>
          {(muscleGroup || search) && (
            <TouchableOpacity
              testID="history-clear-filters"
              onPress={clearFilters}
              style={[styles.chip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
            >
              <Ionicons name="close" size={14} color={colors.onSurface} />
              <Text style={{ color: colors.onSurface, fontWeight: "700" }}>Pulisci</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}>
        {workouts.length === 0 ? (
          <Card testID="history-empty">
            <Text style={{ color: colors.onSurfaceSecondary, textAlign: "center" }}>
              Nessun allenamento trovato. Inizia ad allenarti!
            </Text>
          </Card>
        ) : (
          workouts.map((w) => (
            <Card
              key={w.id}
              testID={`history-workout-${w.id}`}
              onPress={() => router.push(`/workout/${w.id}`)}
              style={{ marginBottom: spacing.sm }}
            >
              <View style={styles.workoutRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.workoutDate, { color: colors.brand }]}>
                    {formatShort(w.date)}
                  </Text>
                  <Text style={[styles.workoutTitle, { color: colors.onSurface }]}>
                    {w.muscle_groups.join(" • ") || "Allenamento"}
                  </Text>
                  <Text style={{ color: colors.onSurfaceSecondary, marginTop: 4 }}>
                    {w.exercise_count} esercizi • Vol {Math.round(w.total_volume)} kg
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={colors.onSurfaceSecondary} />
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <OptionPicker
        visible={pickerOpen}
        title="Filtra per gruppo"
        options={groups}
        selected={muscleGroup}
        onSelect={setMuscleGroup}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.xxl,
    fontWeight: "800",
    marginBottom: spacing.md,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.base,
  },
  chip: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexShrink: 0,
  },
  workoutRow: { flexDirection: "row", alignItems: "center" },
  workoutDate: {
    fontSize: typography.sm,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  workoutTitle: { fontSize: typography.lg, fontWeight: "700" },
});
