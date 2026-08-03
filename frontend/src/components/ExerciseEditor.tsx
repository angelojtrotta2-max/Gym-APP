import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/theme/ThemeContext";
import { radius, spacing, typography } from "@/src/theme/colors";
import { ExerciseRow, SetRow, WeightType } from "@/src/db/types";
import { OptionPicker } from "./Modals";
import { RestTimer } from "./RestTimer";
import * as Haptics from "expo-haptics";

const QUICK_REST = [30, 45, 60, 90, 120, 180];

const WEIGHT_TYPE_LABELS: Record<WeightType, string> = {
  weighted: "Peso",
  bodyweight: "Corpo libero",
  bodyweight_plus: "C.L. + peso",
  bodyweight_assisted: "C.L. assistito",
};

interface Props {
  exercise: ExerciseRow;
  index: number;
  muscleGroups: string[];
  onChange: (ex: ExerciseRow) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onAddMuscleGroup: () => void;
}

export function ExerciseEditor({
  exercise,
  index,
  muscleGroups,
  onChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onAddMuscleGroup,
}: Props) {
  const { colors } = useTheme();
  const [mgOpen, setMgOpen] = useState(false);
  const [weightTypeOpen, setWeightTypeOpen] = useState(false);
  const [restOpen, setRestOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);

  const update = (patch: Partial<ExerciseRow>) => onChange({ ...exercise, ...patch });
  const updateSet = (i: number, patch: Partial<SetRow>) => {
    const sets = exercise.sets.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    onChange({ ...exercise, sets });
  };
  const addSet = () => {
    const last = exercise.sets[exercise.sets.length - 1];
    const newSet: SetRow = {
      set_index: exercise.sets.length,
      reps: last?.reps ?? 10,
      weight: last?.weight ?? 0,
    };
    onChange({ ...exercise, sets: [...exercise.sets, newSet] });
    Haptics.selectionAsync().catch(() => {});
  };
  const deleteSet = (i: number) => {
    if (exercise.sets.length <= 1) return;
    const sets = exercise.sets.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, set_index: idx }));
    onChange({ ...exercise, sets });
  };

  const applyToAll = () => {
    const first = exercise.sets[0];
    if (!first) return;
    const sets = exercise.sets.map((s, i) => ({ ...s, reps: first.reps, weight: first.weight }));
    onChange({ ...exercise, sets });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const isBodyweight = exercise.weight_type === "bodyweight";

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
      ]}
      testID={`exercise-card-${index}`}
    >
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[styles.badge, { backgroundColor: colors.brand }]}
        >
          <Text style={{ color: colors.onBrand, fontWeight: "800" }}>#{index + 1}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: spacing.xs }}>
          {onMoveUp ? (
            <TouchableOpacity testID={`ex-up-${index}`} onPress={onMoveUp} style={styles.iconBtn}>
              <Ionicons name="chevron-up" size={20} color={colors.onSurfaceSecondary} />
            </TouchableOpacity>
          ) : null}
          {onMoveDown ? (
            <TouchableOpacity testID={`ex-down-${index}`} onPress={onMoveDown} style={styles.iconBtn}>
              <Ionicons name="chevron-down" size={20} color={colors.onSurfaceSecondary} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity testID={`ex-dup-${index}`} onPress={onDuplicate} style={styles.iconBtn}>
            <Ionicons name="copy" size={18} color={colors.onSurfaceSecondary} />
          </TouchableOpacity>
          <TouchableOpacity testID={`ex-del-${index}`} onPress={onDelete} style={styles.iconBtn}>
            <Ionicons name="trash" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Muscle Group */}
      <TouchableOpacity
        testID={`ex-mg-${index}`}
        onPress={() => setMgOpen(true)}
        style={[styles.selectRow, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}
      >
        <Text style={{ color: colors.onSurfaceSecondary, fontSize: typography.sm, fontWeight: "700" }}>
          GRUPPO
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ color: colors.onSurface, fontWeight: "700" }}>{exercise.muscle_group}</Text>
          <Ionicons name="chevron-down" size={18} color={colors.onSurfaceSecondary} />
        </View>
      </TouchableOpacity>

      {/* Name */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.onSurfaceSecondary }]}>ESERCIZIO</Text>
        <TextInput
          testID={`ex-name-${index}`}
          value={exercise.name}
          onChangeText={(v) => update({ name: v })}
          placeholder="Nome esercizio"
          placeholderTextColor={colors.onSurfaceSecondary}
          style={[styles.input, { color: colors.onSurface, backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}
        />
      </View>

      {/* Weight type */}
      <TouchableOpacity
        testID={`ex-wtype-${index}`}
        onPress={() => setWeightTypeOpen(true)}
        style={[styles.selectRow, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}
      >
        <Text style={{ color: colors.onSurfaceSecondary, fontSize: typography.sm, fontWeight: "700" }}>
          TIPO
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ color: colors.onSurface, fontWeight: "700" }}>
            {WEIGHT_TYPE_LABELS[exercise.weight_type]}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.onSurfaceSecondary} />
        </View>
      </TouchableOpacity>

      {/* Sets */}
      <View style={{ marginTop: spacing.md }}>
        <View style={styles.setsHeader}>
          <Text style={[styles.setsHeaderCell, { color: colors.onSurfaceSecondary, flex: 0.6 }]}>SERIE</Text>
          <Text style={[styles.setsHeaderCell, { color: colors.onSurfaceSecondary, flex: 1 }]}>REPS</Text>
          <Text style={[styles.setsHeaderCell, { color: colors.onSurfaceSecondary, flex: 1 }]}>
            {isBodyweight ? "—" : "PESO (kg)"}
          </Text>
          <View style={{ width: 32 }} />
        </View>
        {exercise.sets.map((s, i) => (
          <View key={i} style={styles.setRow} testID={`set-row-${index}-${i}`}>
            <View style={[styles.setIdx, { backgroundColor: colors.surfaceTertiary, flex: 0.6 }]}>
              <Text style={{ color: colors.onSurface, fontWeight: "700" }}>{i + 1}</Text>
            </View>
            <TextInput
              testID={`set-reps-${index}-${i}`}
              value={String(s.reps)}
              onChangeText={(v) => updateSet(i, { reps: parseInt(v || "0", 10) || 0 })}
              keyboardType="number-pad"
              style={[styles.setInput, { color: colors.onSurface, backgroundColor: colors.surfaceTertiary, borderColor: colors.border, flex: 1 }]}
            />
            <TextInput
              testID={`set-weight-${index}-${i}`}
              value={String(s.weight)}
              onChangeText={(v) => updateSet(i, { weight: parseFloat(v.replace(",", ".")) || 0 })}
              keyboardType="decimal-pad"
              editable={!isBodyweight}
              style={[
                styles.setInput,
                {
                  color: isBodyweight ? colors.onSurfaceSecondary : colors.onSurface,
                  backgroundColor: colors.surfaceTertiary,
                  borderColor: colors.border,
                  flex: 1,
                  opacity: isBodyweight ? 0.5 : 1,
                },
              ]}
            />
            <TouchableOpacity
              testID={`set-del-${index}-${i}`}
              onPress={() => deleteSet(i)}
              style={{ width: 32, alignItems: "center" }}
            >
              <Ionicons name="close" size={18} color={colors.onSurfaceSecondary} />
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.setActions}>
          <TouchableOpacity
            testID={`ex-add-set-${index}`}
            onPress={addSet}
            style={[styles.smallBtn, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}
          >
            <Ionicons name="add" size={16} color={colors.onSurface} />
            <Text style={{ color: colors.onSurface, fontWeight: "700" }}>Serie</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID={`ex-apply-all-${index}`}
            onPress={applyToAll}
            style={[styles.smallBtn, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}
          >
            <Ionicons name="repeat" size={16} color={colors.onSurface} />
            <Text style={{ color: colors.onSurface, fontWeight: "700" }}>Applica a tutte</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rest */}
      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
        <TouchableOpacity
          testID={`ex-rest-${index}`}
          onPress={() => setRestOpen(true)}
          style={[styles.selectRow, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border, flex: 1 }]}
        >
          <Text style={{ color: colors.onSurfaceSecondary, fontSize: typography.sm, fontWeight: "700" }}>
            RIPOSO
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: colors.onSurface, fontWeight: "700" }}>
              {exercise.rest_seconds}s
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.onSurfaceSecondary} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          testID={`ex-start-timer-${index}`}
          onPress={() => setTimerOpen(true)}
          style={[styles.timerBtn, { backgroundColor: colors.brand }]}
        >
          <Ionicons name="timer" size={20} color={colors.onBrand} />
        </TouchableOpacity>
      </View>

      {/* Notes / tipologia */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.onSurfaceSecondary }]}>NOTE / TIPOLOGIA</Text>
        <TextInput
          testID={`ex-notes-${index}`}
          value={exercise.notes || ""}
          onChangeText={(v) => update({ notes: v })}
          placeholder="es. forza, dropset, superset..."
          placeholderTextColor={colors.onSurfaceSecondary}
          multiline
          style={[
            styles.input,
            { color: colors.onSurface, backgroundColor: colors.surfaceTertiary, borderColor: colors.border, minHeight: 44 },
          ]}
        />
      </View>

      <OptionPicker
        visible={mgOpen}
        title="Gruppo muscolare"
        options={muscleGroups}
        selected={exercise.muscle_group}
        onSelect={(v) => update({ muscle_group: v })}
        onClose={() => setMgOpen(false)}
        allowAddNew
        onAddNew={onAddMuscleGroup}
      />
      <OptionPicker
        visible={weightTypeOpen}
        title="Tipo di peso"
        options={Object.values(WEIGHT_TYPE_LABELS)}
        selected={WEIGHT_TYPE_LABELS[exercise.weight_type]}
        onSelect={(label) => {
          const entry = Object.entries(WEIGHT_TYPE_LABELS).find(([, l]) => l === label);
          if (entry) update({ weight_type: entry[0] as WeightType });
        }}
        onClose={() => setWeightTypeOpen(false)}
      />
      <RestPicker
        visible={restOpen}
        current={exercise.rest_seconds}
        onSelect={(v) => update({ rest_seconds: v })}
        onClose={() => setRestOpen(false)}
      />
      <RestTimer visible={timerOpen} seconds={exercise.rest_seconds} onClose={() => setTimerOpen(false)} />
    </View>
  );
}

function RestPicker({
  visible,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  current: number;
  onSelect: (v: number) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const [custom, setCustom] = useState(String(current));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)" }} onPress={onClose} activeOpacity={1}>
        <View style={{ flex: 1 }} />
      </TouchableOpacity>
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.surfaceSecondary,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          padding: spacing.lg,
          paddingBottom: spacing.xxl,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={styles.header}>
          <Text style={{ color: colors.onSurface, fontSize: typography.xl, fontWeight: "700" }}>
            Tempo di riposo
          </Text>
          <TouchableOpacity testID="rest-picker-close" onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.onSurface} />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.lg }}>
          {QUICK_REST.map((v) => (
            <TouchableOpacity
              key={v}
              testID={`rest-quick-${v}`}
              onPress={() => {
                onSelect(v);
                onClose();
              }}
              style={{
                paddingHorizontal: spacing.lg,
                height: 44,
                borderRadius: radius.md,
                backgroundColor: v === current ? colors.brand : colors.surfaceTertiary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: v === current ? colors.onBrand : colors.onSurface, fontWeight: "700" }}>
                {v}s
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ color: colors.onSurfaceSecondary, marginTop: spacing.lg, fontSize: typography.sm, fontWeight: "700" }}>
          PERSONALIZZATO (secondi)
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
          <TextInput
            testID="rest-custom-input"
            value={custom}
            onChangeText={setCustom}
            keyboardType="number-pad"
            style={{
              flex: 1,
              height: 48,
              borderRadius: radius.md,
              backgroundColor: colors.surfaceTertiary,
              color: colors.onSurface,
              paddingHorizontal: spacing.md,
              fontSize: typography.lg,
            }}
          />
          <TouchableOpacity
            testID="rest-custom-apply"
            onPress={() => {
              const n = parseInt(custom, 10);
              if (!isNaN(n) && n > 0) {
                onSelect(n);
                onClose();
              }
            }}
            style={{
              paddingHorizontal: spacing.lg,
              height: 48,
              borderRadius: radius.md,
              backgroundColor: colors.brand,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.onBrand, fontWeight: "700" }}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  badge: {
    paddingHorizontal: spacing.md,
    height: 28,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    height: 52,
    marginBottom: spacing.sm,
  },
  field: {
    marginTop: spacing.sm,
  },
  label: {
    fontSize: typography.sm,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.base,
    height: 44,
  },
  setsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  setsHeaderCell: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  setIdx: {
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  setInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: radius.md,
    textAlign: "center",
    fontSize: typography.lg,
    fontWeight: "700",
  },
  setActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  timerBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
