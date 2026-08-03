import React, { useCallback, useState } from "react";
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
import { ConfirmDialog } from "@/src/components/Modals";
import { useToast } from "@/src/components/Toast";
import {
  listMuscleGroups,
  addMuscleGroup,
  deleteMuscleGroup,
} from "@/src/db/muscleGroups";
import { MuscleGroupRow } from "@/src/db/types";

export default function SettingsScreen() {
  const { colors, pref, setPref } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const [groups, setGroups] = useState<MuscleGroupRow[]>([]);
  const [newGroup, setNewGroup] = useState("");
  const [pendingDelete, setPendingDelete] = useState<MuscleGroupRow | null>(null);

  const load = useCallback(async () => {
    const list = await listMuscleGroups();
    setGroups(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = async () => {
    const name = newGroup.trim();
    if (!name) return;
    try {
      await addMuscleGroup(name);
      setNewGroup("");
      toast.show("Gruppo aggiunto");
      load();
    } catch (e: any) {
      toast.show(e?.message || "Errore aggiunta", "error");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteMuscleGroup(pendingDelete.id);
    toast.show("Gruppo eliminato");
    setPendingDelete(null);
    load();
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
        <Text style={[styles.title, { color: colors.onSurface }]}>Impostazioni</Text>

        <Text style={[styles.section, { color: colors.onSurfaceSecondary }]}>TEMA</Text>
        <Card>
          <View style={styles.themeRow}>
            {(["dark", "light", "auto"] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                testID={`theme-${mode}`}
                onPress={() => setPref(mode)}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: pref === mode ? colors.brand : colors.surfaceTertiary,
                  },
                ]}
              >
                <Ionicons
                  name={mode === "dark" ? "moon" : mode === "light" ? "sunny" : "phone-portrait"}
                  size={18}
                  color={pref === mode ? colors.onBrand : colors.onSurface}
                />
                <Text
                  style={{
                    color: pref === mode ? colors.onBrand : colors.onSurface,
                    fontWeight: "700",
                    marginLeft: spacing.xs,
                  }}
                >
                  {mode === "dark" ? "Scuro" : mode === "light" ? "Chiaro" : "Auto"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Text style={[styles.section, { color: colors.onSurfaceSecondary }]}>MODELLI</Text>
        <Card testID="settings-templates-card" onPress={() => router.push("/templates")}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="albums" size={22} color={colors.brand} />
            <Text style={{ color: colors.onSurface, fontSize: typography.lg, fontWeight: "700", marginLeft: spacing.md, flex: 1 }}>
              Gestisci modelli
            </Text>
            <Ionicons name="chevron-forward" size={22} color={colors.onSurfaceSecondary} />
          </View>
        </Card>

        <Text style={[styles.section, { color: colors.onSurfaceSecondary }]}>GRUPPI MUSCOLARI</Text>
        <Card>
          <View style={styles.addRow}>
            <TextInput
              testID="mg-input"
              style={[
                styles.mgInput,
                { color: colors.onSurface, backgroundColor: colors.surfaceTertiary, borderColor: colors.border },
              ]}
              placeholder="Nuovo gruppo muscolare"
              placeholderTextColor={colors.onSurfaceSecondary}
              value={newGroup}
              onChangeText={setNewGroup}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <TouchableOpacity
              testID="mg-add"
              onPress={handleAdd}
              style={[styles.addBtn, { backgroundColor: colors.brand }]}
            >
              <Ionicons name="add" size={22} color={colors.onBrand} />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: spacing.md }}>
            {groups.map((g) => (
              <View
                key={g.id}
                style={[styles.mgRow, { borderBottomColor: colors.divider }]}
                testID={`mg-row-${g.id}`}
              >
                <Text style={{ color: colors.onSurface, fontSize: typography.base, flex: 1 }}>
                  {g.name}
                </Text>
                {g.is_custom ? (
                  <TouchableOpacity
                    testID={`mg-delete-${g.id}`}
                    onPress={() => setPendingDelete(g)}
                  >
                    <Ionicons name="trash" size={20} color={colors.error} />
                  </TouchableOpacity>
                ) : (
                  <Text style={{ color: colors.onSurfaceSecondary, fontSize: typography.sm }}>Default</Text>
                )}
              </View>
            ))}
          </View>
        </Card>

        <Text style={[styles.section, { color: colors.onSurfaceSecondary }]}>INFO</Text>
        <Card>
          <Text style={{ color: colors.onSurface, fontSize: typography.lg, fontWeight: "700" }}>
            Gym Log Offline
          </Text>
          <Text style={{ color: colors.onSurfaceSecondary, marginTop: 4 }}>
            Tutti i dati sono salvati esclusivamente sul dispositivo tramite SQLite.
          </Text>
          <Text style={{ color: colors.onSurfaceSecondary, marginTop: spacing.xs }}>
            Nessun account, nessuna connessione richiesta.
          </Text>
        </Card>
      </ScrollView>

      <ConfirmDialog
        visible={!!pendingDelete}
        title="Elimina gruppo"
        message={`Vuoi eliminare "${pendingDelete?.name}"?`}
        destructive
        confirmText="Elimina"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.xxl,
    fontWeight: "800",
    marginBottom: spacing.lg,
  },
  section: {
    fontSize: typography.sm,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  themeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  themeBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  addRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  mgInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.base,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  mgRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
});
