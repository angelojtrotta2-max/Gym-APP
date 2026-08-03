import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";

import { useTheme } from "@/src/theme/ThemeContext";
import { radius, spacing, typography } from "@/src/theme/colors";
import { Card } from "@/src/components/UI";
import { ExerciseEditor } from "@/src/components/ExerciseEditor";
import { DatePickerModal } from "@/src/components/DatePickerModal";
import { ConfirmDialog, OptionPicker } from "@/src/components/Modals";
import { useToast } from "@/src/components/Toast";
import { formatLong, todayIso } from "@/src/utils/date";
import { ExerciseRow, WorkoutRow } from "@/src/db/types";
import {
  createWorkout,
  deleteWorkout,
  duplicateWorkout,
  getWorkoutById,
  moveWorkoutToDate,
  updateWorkout,
} from "@/src/db/workouts";
import { listMuscleGroups, addMuscleGroup } from "@/src/db/muscleGroups";
import { saveTemplate, getTemplateById } from "@/src/db/templates";

function newExercise(defaultGroup: string): ExerciseRow {
  return {
    muscle_group: defaultGroup || "Petto",
    name: "",
    rest_seconds: 60,
    notes: "",
    weight_type: "weighted",
    sort_order: 0,
    sets: [{ set_index: 0, reps: 10, weight: 0 }],
  };
}

export default function WorkoutEditorScreen() {
  const params = useLocalSearchParams<{ id: string; date?: string; template?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();
  const isNew = params.id === "new";

  const [date, setDate] = useState<string>(params.date || todayIso());
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [movePickerOpen, setMovePickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveTplOpen, setSaveTplOpen] = useState(false);
  const [tplName, setTplName] = useState("");
  const [addMgOpen, setAddMgOpen] = useState(false);
  const [newMgName, setNewMgName] = useState("");
  const [loaded, setLoaded] = useState(false);

  const loadMuscleGroups = useCallback(async () => {
    const list = await listMuscleGroups();
    setMuscleGroups(list.map((m) => m.name));
    return list.map((m) => m.name);
  }, []);

  const loadWorkout = useCallback(async () => {
    const mgs = await loadMuscleGroups();
    if (isNew) {
      // Check for template
      if (params.template) {
        const tpl = await getTemplateById(parseInt(params.template as string, 10));
        if (tpl) {
          setExercises(
            tpl.exercises.map((e) => ({
              ...e,
              id: undefined,
              workout_id: undefined,
              sets: e.sets.map((s) => ({ ...s, id: undefined })),
            }))
          );
          setNotes(tpl.notes || "");
        } else {
          setExercises([newExercise(mgs[0] || "Petto")]);
        }
      } else {
        setExercises([newExercise(mgs[0] || "Petto")]);
      }
      setLoaded(true);
    } else {
      const wid = parseInt(params.id as string, 10);
      const w = await getWorkoutById(wid);
      if (!w) {
        toast.show("Allenamento non trovato", "error");
        router.back();
        return;
      }
      setDate(w.date);
      setNotes(w.notes || "");
      setExercises(w.exercises);
      setLoaded(true);
    }
  }, [isNew, params.id, params.template, loadMuscleGroups]);

  useEffect(() => {
    loadWorkout();
  }, []);

  const updateEx = (i: number, ex: ExerciseRow) => {
    setExercises((prev) => prev.map((e, idx) => (idx === i ? ex : e)));
  };
  const addExercise = () => {
    setExercises((prev) => [...prev, newExercise(muscleGroups[0] || "Petto")]);
  };
  const deleteEx = (i: number) => {
    setExercises((prev) => prev.filter((_, idx) => idx !== i));
  };
  const duplicateEx = (i: number) => {
    setExercises((prev) => {
      const target = prev[i];
      const copy: ExerciseRow = {
        ...target,
        id: undefined,
        workout_id: undefined,
        sets: target.sets.map((s) => ({ ...s, id: undefined })),
      };
      const next = [...prev];
      next.splice(i + 1, 0, copy);
      return next;
    });
  };
  const moveEx = (i: number, dir: -1 | 1) => {
    setExercises((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const handleAddMuscleGroup = () => {
    setAddMgOpen(true);
  };
  const confirmAddMg = async () => {
    const name = newMgName.trim();
    if (!name) return;
    try {
      await addMuscleGroup(name);
      await loadMuscleGroups();
      setNewMgName("");
      setAddMgOpen(false);
      toast.show("Gruppo aggiunto");
    } catch (e: any) {
      toast.show(e?.message || "Errore", "error");
    }
  };

  const validate = (): string | null => {
    if (exercises.length === 0) return "Aggiungi almeno un esercizio";
    for (let i = 0; i < exercises.length; i++) {
      const e = exercises[i];
      if (!e.name.trim()) return `Esercizio ${i + 1}: nome mancante`;
      if (!e.muscle_group.trim()) return `Esercizio ${i + 1}: gruppo mancante`;
      if (e.sets.length === 0) return `Esercizio ${i + 1}: nessuna serie`;
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast.show(err, "error");
      return;
    }
    const payload = {
      date,
      notes: notes.trim() || null,
      exercises: exercises.map((e, i) => ({ ...e, sort_order: i })),
    };
    try {
      if (isNew) {
        const id = await createWorkout(payload);
        toast.show("Allenamento salvato");
        router.replace(`/workout/${id}`);
      } else {
        await updateWorkout(parseInt(params.id as string, 10), payload);
        toast.show("Allenamento aggiornato");
      }
    } catch (e: any) {
      toast.show(e?.message || "Errore salvataggio", "error");
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    await deleteWorkout(parseInt(params.id as string, 10));
    toast.show("Allenamento eliminato");
    router.back();
  };

  const handleDuplicate = async () => {
    if (isNew) return;
    const newId = await duplicateWorkout(parseInt(params.id as string, 10), todayIso());
    toast.show("Allenamento duplicato");
    router.replace(`/workout/${newId}`);
  };

  const handleMoveDate = async (newDate: string) => {
    if (isNew) {
      setDate(newDate);
      return;
    }
    await moveWorkoutToDate(parseInt(params.id as string, 10), newDate);
    setDate(newDate);
    toast.show(`Spostato al ${newDate}`);
  };

  const handleSaveTemplate = async () => {
    const name = tplName.trim();
    if (!name) {
      toast.show("Inserisci un nome", "error");
      return;
    }
    await saveTemplate({
      name,
      notes: notes.trim() || null,
      exercises: exercises.map((e, i) => ({
        ...e,
        sort_order: i,
        id: undefined,
        workout_id: undefined,
      })),
    });
    setSaveTplOpen(false);
    setTplName("");
    toast.show("Modello salvato");
  };

  if (!loaded) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.surface }}>
        <View style={{ padding: spacing.xl }}>
          <Text style={{ color: colors.onSurfaceSecondary }}>Caricamento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.surface }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Sticky Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity testID="wo-back" onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
            {isNew ? "Nuovo allenamento" : "Modifica"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date */}
          <TouchableOpacity
            testID="wo-date-btn"
            onPress={() => setDatePickerOpen(true)}
            style={[
              styles.dateBtn,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
            ]}
          >
            <Ionicons name="calendar" size={22} color={colors.brand} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={{ color: colors.onSurfaceSecondary, fontSize: typography.sm, fontWeight: "700", letterSpacing: 1 }}>
                DATA
              </Text>
              <Text style={{ color: colors.onSurface, fontSize: typography.lg, fontWeight: "700", marginTop: 2, textTransform: "capitalize" }}>
                {formatLong(date)}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={22} color={colors.onSurfaceSecondary} />
          </TouchableOpacity>

          {/* Actions bar (only for existing) */}
          {!isNew ? (
            <View style={styles.actionsBar}>
              <ActionBtn testID="wo-duplicate" icon="copy" label="Duplica" onPress={handleDuplicate} />
              <ActionBtn
                testID="wo-move"
                icon="arrow-forward"
                label="Sposta"
                onPress={() => setMovePickerOpen(true)}
              />
              <ActionBtn
                testID="wo-save-template"
                icon="albums"
                label="Modello"
                onPress={() => setSaveTplOpen(true)}
              />
              <ActionBtn
                testID="wo-delete"
                icon="trash"
                label="Elimina"
                onPress={() => setConfirmDelete(true)}
                danger
              />
            </View>
          ) : null}

          {/* Exercises */}
          {exercises.map((ex, i) => (
            <ExerciseEditor
              key={i}
              index={i}
              exercise={ex}
              muscleGroups={muscleGroups}
              onChange={(e) => updateEx(i, e)}
              onDelete={() => deleteEx(i)}
              onDuplicate={() => duplicateEx(i)}
              onMoveUp={i > 0 ? () => moveEx(i, -1) : undefined}
              onMoveDown={i < exercises.length - 1 ? () => moveEx(i, 1) : undefined}
              onAddMuscleGroup={handleAddMuscleGroup}
            />
          ))}

          {/* Add exercise */}
          <TouchableOpacity
            testID="wo-add-exercise"
            onPress={addExercise}
            style={[
              styles.addExercise,
              { borderColor: colors.brand, backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <Ionicons name="add-circle" size={22} color={colors.brand} />
            <Text style={{ color: colors.brand, fontWeight: "800", fontSize: typography.lg }}>
              Aggiungi esercizio
            </Text>
          </TouchableOpacity>

          {/* General notes */}
          <View style={{ marginTop: spacing.lg }}>
            <Text style={[styles.label, { color: colors.onSurfaceSecondary }]}>
              NOTE GENERALI SESSIONE
            </Text>
            <TextInput
              testID="wo-notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Es: sessione pesante, buona forma..."
              placeholderTextColor={colors.onSurfaceSecondary}
              multiline
              style={[
                styles.notesInput,
                { color: colors.onSurface, backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
              ]}
            />
          </View>
        </ScrollView>

        {/* Sticky save button */}
        <View style={[styles.saveBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            testID="wo-save"
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: colors.brand }]}
          >
            <Ionicons name="checkmark-circle" size={22} color={colors.onBrand} />
            <Text style={{ color: colors.onBrand, fontWeight: "800", fontSize: typography.lg }}>
              {isNew ? "Salva allenamento" : "Aggiorna"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modals */}
      <DatePickerModal
        visible={datePickerOpen}
        value={date}
        onChange={setDate}
        onClose={() => setDatePickerOpen(false)}
      />
      <DatePickerModal
        visible={movePickerOpen}
        value={date}
        onChange={handleMoveDate}
        onClose={() => setMovePickerOpen(false)}
      />
      <ConfirmDialog
        visible={confirmDelete}
        title="Elimina allenamento"
        message="Questa operazione non può essere annullata."
        destructive
        confirmText="Elimina"
        onConfirm={() => {
          setConfirmDelete(false);
          handleDelete();
        }}
        onCancel={() => setConfirmDelete(false)}
      />

      {/* Save Template */}
      {saveTplOpen ? (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity
            style={[styles.overlay, { backgroundColor: colors.overlay }]}
            onPress={() => setSaveTplOpen(false)}
            activeOpacity={1}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[styles.dialogCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
              onPress={() => {}}
            >
              <Text style={{ color: colors.onSurface, fontSize: typography.xl, fontWeight: "700" }}>
                Salva come modello
              </Text>
              <TextInput
                testID="tpl-name-input"
                value={tplName}
                onChangeText={setTplName}
                placeholder="Nome modello"
                placeholderTextColor={colors.onSurfaceSecondary}
                style={{
                  marginTop: spacing.md,
                  height: 48,
                  borderRadius: radius.md,
                  backgroundColor: colors.surfaceTertiary,
                  paddingHorizontal: spacing.md,
                  color: colors.onSurface,
                  fontSize: typography.base,
                }}
                autoFocus
              />
              <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.lg }}>
                <TouchableOpacity
                  onPress={() => setSaveTplOpen(false)}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: radius.md,
                    backgroundColor: colors.surfaceTertiary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: colors.onSurface, fontWeight: "700" }}>Annulla</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="tpl-save-confirm"
                  onPress={handleSaveTemplate}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: radius.md,
                    backgroundColor: colors.brand,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: colors.onBrand, fontWeight: "700" }}>Salva</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Add Muscle Group */}
      {addMgOpen ? (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity
            style={[styles.overlay, { backgroundColor: colors.overlay }]}
            onPress={() => setAddMgOpen(false)}
            activeOpacity={1}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[styles.dialogCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
              onPress={() => {}}
            >
              <Text style={{ color: colors.onSurface, fontSize: typography.xl, fontWeight: "700" }}>
                Nuovo gruppo
              </Text>
              <TextInput
                testID="new-mg-input"
                value={newMgName}
                onChangeText={setNewMgName}
                placeholder="Nome gruppo"
                placeholderTextColor={colors.onSurfaceSecondary}
                autoFocus
                style={{
                  marginTop: spacing.md,
                  height: 48,
                  borderRadius: radius.md,
                  backgroundColor: colors.surfaceTertiary,
                  paddingHorizontal: spacing.md,
                  color: colors.onSurface,
                  fontSize: typography.base,
                }}
              />
              <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.lg }}>
                <TouchableOpacity
                  onPress={() => setAddMgOpen(false)}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: radius.md,
                    backgroundColor: colors.surfaceTertiary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: colors.onSurface, fontWeight: "700" }}>Annulla</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="new-mg-confirm"
                  onPress={confirmAddMg}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: radius.md,
                    backgroundColor: colors.brand,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: colors.onBrand, fontWeight: "700" }}>Aggiungi</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function ActionBtn({
  icon,
  label,
  onPress,
  danger,
  testID,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  danger?: boolean;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      style={[
        styles.actionBtn,
        { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
      ]}
    >
      <Ionicons name={icon} size={18} color={danger ? colors.error : colors.brand} />
      <Text
        style={{
          color: danger ? colors.error : colors.onSurface,
          fontSize: typography.sm,
          fontWeight: "700",
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    height: 56,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: typography.lg,
    fontWeight: "700",
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  actionsBar: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionBtn: {
    flex: 1,
    aspectRatio: 1.2,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  addExercise: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: "dashed",
    marginTop: spacing.sm,
  },
  label: {
    fontSize: typography.sm,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 80,
    fontSize: typography.base,
    textAlignVertical: "top",
  },
  saveBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
    borderTopWidth: 1,
  },
  saveBtn: {
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  dialogCard: {
    width: "100%",
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
  },
});
