import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import { useTheme } from "@/src/theme/ThemeContext";
import { radius, spacing, typography } from "@/src/theme/colors";
import { Card } from "@/src/components/UI";
import {
  getLastWorkout,
  listWorkoutsByDate,
  WorkoutSummary,
} from "@/src/db/workouts";
import { formatLong, todayIso, formatShort } from "@/src/utils/date";

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [today, setToday] = useState<WorkoutSummary[]>([]);
  const [last, setLast] = useState<WorkoutSummary | null>(null);
  const [loaded, setLoaded] = useState(false);
  const dateStr = todayIso();

  const load = useCallback(async () => {
    const [t, l] = await Promise.all([listWorkoutsByDate(dateStr), getLastWorkout()]);
    setToday(t);
    setLast(l);
    setLoaded(true);
  }, [dateStr]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.appName, { color: colors.brand }]}>GYM LOG</Text>
            <Text style={[styles.appSub, { color: colors.onSurfaceSecondary }]}>Offline</Text>
          </View>
        </View>

        <Text style={[styles.date, { color: colors.onSurface }]}>{formatLong(dateStr)}</Text>

        {/* Today card */}
        <Text style={[styles.sectionTitle, { color: colors.onSurfaceSecondary }]}>
          ALLENAMENTO DI OGGI
        </Text>
        {today.length === 0 ? (
          <Card testID="home-today-empty">
            <Text style={{ color: colors.onSurfaceSecondary, marginBottom: spacing.md }}>
              Nessun allenamento programmato per oggi
            </Text>
            <TouchableOpacity
              testID="home-new-workout-btn"
              onPress={() => router.push(`/workout/new?date=${dateStr}`)}
              style={[styles.primaryCta, { backgroundColor: colors.brand }]}
            >
              <Ionicons name="add" size={20} color={colors.onBrand} />
              <Text style={[styles.primaryCtaText, { color: colors.onBrand }]}>
                Nuovo allenamento
              </Text>
            </TouchableOpacity>
          </Card>
        ) : (
          today.map((w) => (
            <Card
              key={w.id}
              testID={`home-today-workout-${w.id}`}
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

        {/* Last workout */}
        {last && today.length > 0 && last.id !== today[0]?.id ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.onSurfaceSecondary, marginTop: spacing.xl }]}>
              ULTIMO ALLENAMENTO
            </Text>
            <Card
              testID="home-last-workout"
              onPress={() => router.push(`/workout/${last.id}`)}
            >
              <View style={styles.workoutRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.workoutTitle, { color: colors.onSurface }]}>
                    {last.muscle_groups.join(" • ") || "Allenamento"}
                  </Text>
                  <Text style={{ color: colors.onSurfaceSecondary, marginTop: 4 }}>
                    {formatShort(last.date)} • {last.exercise_count} esercizi
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={colors.onSurfaceSecondary} />
              </View>
            </Card>
          </>
        ) : last && today.length === 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.onSurfaceSecondary, marginTop: spacing.xl }]}>
              ULTIMO ALLENAMENTO
            </Text>
            <Card
              testID="home-last-workout"
              onPress={() => router.push(`/workout/${last.id}`)}
            >
              <View style={styles.workoutRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.workoutTitle, { color: colors.onSurface }]}>
                    {last.muscle_groups.join(" • ") || "Allenamento"}
                  </Text>
                  <Text style={{ color: colors.onSurfaceSecondary, marginTop: 4 }}>
                    {formatShort(last.date)} • {last.exercise_count} esercizi
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={colors.onSurfaceSecondary} />
              </View>
            </Card>
          </>
        ) : null}

        {/* Quick actions grid */}
        <Text
          style={[styles.sectionTitle, { color: colors.onSurfaceSecondary, marginTop: spacing.xl }]}
        >
          AZIONI RAPIDE
        </Text>
        <View style={styles.grid}>
          <QuickAction
            testID="quick-new"
            icon="add-circle"
            label="Nuovo"
            onPress={() => router.push(`/workout/new?date=${dateStr}`)}
          />
          <QuickAction
            testID="quick-calendar"
            icon="calendar"
            label="Calendario"
            onPress={() => router.push("/(tabs)/calendar")}
          />
          <QuickAction
            testID="quick-history"
            icon="time"
            label="Storico"
            onPress={() => router.push("/(tabs)/history")}
          />
          <QuickAction
            testID="quick-templates"
            icon="albums"
            label="Modelli"
            onPress={() => router.push("/templates")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  testID,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.quickAction,
        { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
      ]}
    >
      <Ionicons name={icon} size={26} color={colors.brand} />
      <Text style={[styles.quickLabel, { color: colors.onSurface }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  appName: { fontSize: 28, fontWeight: "900", letterSpacing: 1 },
  appSub: { fontSize: typography.sm, fontWeight: "600", letterSpacing: 2, textTransform: "uppercase" },
  date: {
    fontSize: typography.lg,
    fontWeight: "600",
    marginBottom: spacing.xl,
    textTransform: "capitalize",
  },
  sectionTitle: {
    fontSize: typography.sm,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  primaryCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  primaryCtaText: { fontWeight: "700", fontSize: typography.lg },
  workoutRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  workoutTitle: {
    fontSize: typography.lg,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  quickAction: {
    width: "47%",
    aspectRatio: 1.6,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    flexGrow: 1,
  },
  quickLabel: { fontWeight: "700", fontSize: typography.base },
});
