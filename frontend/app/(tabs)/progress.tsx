import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import { useTheme } from "@/src/theme/ThemeContext";
import { radius, spacing, typography } from "@/src/theme/colors";
import { Card } from "@/src/components/UI";
import { OptionPicker } from "@/src/components/Modals";
import { SimpleBarChart } from "@/src/components/SimpleBarChart";
import {
  getAllExerciseNames,
  getExerciseHistory,
  ExerciseHistoryPoint,
} from "@/src/db/workouts";
import { formatShortNoYear } from "@/src/utils/date";

export default function ProgressScreen() {
  const { colors } = useTheme();
  const [names, setNames] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<ExerciseHistoryPoint[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const loadNames = useCallback(async () => {
    const list = await getAllExerciseNames();
    setNames(list);
    if (!selected && list.length > 0) {
      setSelected(list[0]);
    }
  }, [selected]);

  useFocusEffect(
    useCallback(() => {
      loadNames();
    }, [loadNames])
  );

  const loadHistory = useCallback(async (name: string) => {
    const h = await getExerciseHistory(name);
    setHistory(h);
  }, []);

  React.useEffect(() => {
    if (selected) loadHistory(selected);
  }, [selected, loadHistory]);

  const stats = useMemo(() => {
    if (history.length === 0) return { max: 0, totalVol: 0, freq: 0 };
    const max = Math.max(...history.map((p) => p.max_weight));
    const totalVol = history.reduce((s, p) => s + p.total_volume, 0);
    return { max, totalVol, freq: history.length };
  }, [history]);

  const chartPoints = useMemo(
    () =>
      history.slice(-8).map((h) => ({
        x: h.workout_id,
        y: h.max_weight,
        label: formatShortNoYear(h.date),
      })),
    [history]
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
        <Text style={[styles.title, { color: colors.onSurface }]}>Progressi</Text>

        {names.length === 0 ? (
          <Card testID="progress-empty">
            <Text style={{ color: colors.onSurfaceSecondary, textAlign: "center" }}>
              Dati insufficienti. Registra più allenamenti per vedere i progressi.
            </Text>
          </Card>
        ) : (
          <>
            <TouchableOpacity
              testID="progress-select-exercise"
              onPress={() => setPickerOpen(true)}
              style={[
                styles.selector,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
              ]}
            >
              <View>
                <Text style={{ color: colors.onSurfaceSecondary, fontSize: typography.sm, fontWeight: "700", letterSpacing: 1 }}>
                  ESERCIZIO
                </Text>
                <Text style={{ color: colors.onSurface, fontSize: typography.lg, fontWeight: "700", marginTop: 4 }}>
                  {selected || "Seleziona"}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={22} color={colors.onSurfaceSecondary} />
            </TouchableOpacity>

            <View style={styles.statsGrid}>
              <StatBox label="Max (kg)" value={stats.max.toString()} colors={colors} testID="stat-max" />
              <StatBox
                label="Volume tot."
                value={`${Math.round(stats.totalVol)}`}
                colors={colors}
                testID="stat-vol"
              />
              <StatBox
                label="Frequenza"
                value={stats.freq.toString()}
                colors={colors}
                testID="stat-freq"
              />
            </View>

            <Text style={[styles.subtitle, { color: colors.onSurfaceSecondary }]}>
              ANDAMENTO PESO (kg)
            </Text>
            <SimpleBarChart points={chartPoints} testID="progress-chart" />

            <Text style={[styles.subtitle, { color: colors.onSurfaceSecondary, marginTop: spacing.xl }]}>
              STORICO CARICHI
            </Text>
            {history
              .slice()
              .reverse()
              .map((h, i) => (
                <Card key={i} style={{ marginBottom: spacing.sm }} testID={`progress-row-${i}`}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View>
                      <Text style={{ color: colors.brand, fontWeight: "700" }}>
                        {formatShortNoYear(h.date)}
                      </Text>
                      <Text style={{ color: colors.onSurface, marginTop: 4 }}>
                        {h.set_count} serie • {h.total_reps} reps • Max {h.max_weight}kg
                      </Text>
                      {h.notes ? (
                        <Text style={{ color: colors.onSurfaceSecondary, marginTop: 4, fontStyle: "italic" }}>
                          {h.notes}
                        </Text>
                      ) : null}
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ color: colors.onSurfaceSecondary, fontSize: typography.sm }}>
                        Volume
                      </Text>
                      <Text style={{ color: colors.onSurface, fontWeight: "700", fontSize: typography.lg }}>
                        {Math.round(h.total_volume)}kg
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
          </>
        )}
      </ScrollView>

      <OptionPicker
        visible={pickerOpen}
        title="Seleziona esercizio"
        options={names}
        selected={selected}
        onSelect={setSelected}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

function StatBox({ label, value, colors, testID }: { label: string; value: string; colors: any; testID?: string }) {
  return (
    <View
      testID={testID}
      style={[
        styles.statBox,
        { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
      ]}
    >
      <Text style={{ color: colors.onSurfaceSecondary, fontSize: typography.sm, fontWeight: "700" }}>
        {label}
      </Text>
      <Text style={{ color: colors.brand, fontSize: typography.xxl, fontWeight: "800", marginTop: 4 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.xxl,
    fontWeight: "800",
    marginBottom: spacing.lg,
  },
  subtitle: {
    fontSize: typography.sm,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
});
