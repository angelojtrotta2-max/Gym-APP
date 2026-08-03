import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import { useTheme } from "@/src/theme/ThemeContext";
import { radius, spacing, typography } from "@/src/theme/colors";
import { Card } from "@/src/components/UI";
import { MonthCalendar } from "@/src/components/MonthCalendar";
import {
  getWorkoutDatesInMonth,
  listWorkoutsByDate,
  WorkoutSummary,
} from "@/src/db/workouts";
import { formatLong, todayIso } from "@/src/utils/date";

export default function CalendarScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [selected, setSelected] = useState(todayIso());
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [monthKey, setMonthKey] = useState<string>("");

  const loadMonth = useCallback(async (year: number, month: number) => {
    const set = await getWorkoutDatesInMonth(year, month);
    setMarked(set);
    setMonthKey(`${year}-${month}`);
  }, []);

  const loadSelected = useCallback(async (date: string) => {
    const list = await listWorkoutsByDate(date);
    setWorkouts(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSelected(selected);
      const d = new Date(selected);
      loadMonth(d.getFullYear(), d.getMonth() + 1);
    }, [selected, loadSelected, loadMonth])
  );

  const handleSelectDate = (date: string) => {
    setSelected(date);
    loadSelected(date);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
        <Text style={[styles.title, { color: colors.onSurface }]}>Calendario</Text>

        <MonthCalendar
          selectedDate={selected}
          markedDates={marked}
          onSelectDate={handleSelectDate}
          onMonthChange={loadMonth}
        />

        <View style={styles.selectedHeader}>
          <Text style={[styles.selectedDate, { color: colors.onSurface }]}>
            {formatLong(selected)}
          </Text>
          <TouchableOpacity
            testID="cal-add-workout"
            onPress={() => router.push(`/workout/new?date=${selected}`)}
            style={[styles.addBtn, { backgroundColor: colors.brand }]}
          >
            <Ionicons name="add" size={18} color={colors.onBrand} />
            <Text style={{ color: colors.onBrand, fontWeight: "700" }}>Aggiungi</Text>
          </TouchableOpacity>
        </View>

        {workouts.length === 0 ? (
          <Card testID="cal-empty">
            <Text style={{ color: colors.onSurfaceSecondary, textAlign: "center" }}>
              Nessun allenamento in questa data
            </Text>
          </Card>
        ) : (
          workouts.map((w) => (
            <Card
              key={w.id}
              testID={`cal-workout-${w.id}`}
              onPress={() => router.push(`/workout/${w.id}`)}
              style={{ marginBottom: spacing.sm }}
            >
              <View style={styles.workoutRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.workoutTitle, { color: colors.onSurface }]}>
                    {w.muscle_groups.join(" • ") || "Allenamento"}
                  </Text>
                  <Text style={{ color: colors.onSurfaceSecondary, marginTop: 4 }}>
                    {w.exercise_count} esercizi • Volume {Math.round(w.total_volume)} kg
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={colors.onSurfaceSecondary} />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.xxl,
    fontWeight: "800",
    marginBottom: spacing.lg,
  },
  selectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  selectedDate: {
    flex: 1,
    fontSize: typography.lg,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: radius.md,
  },
  workoutRow: { flexDirection: "row", alignItems: "center" },
  workoutTitle: { fontSize: typography.lg, fontWeight: "700" },
});
