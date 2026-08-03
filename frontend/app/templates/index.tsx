import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import { useTheme } from "@/src/theme/ThemeContext";
import { radius, spacing, typography } from "@/src/theme/colors";
import { Card } from "@/src/components/UI";
import { ConfirmDialog } from "@/src/components/Modals";
import { useToast } from "@/src/components/Toast";
import { listTemplates, deleteTemplate, getTemplateById } from "@/src/db/templates";
import { TemplateRow } from "@/src/db/types";
import { todayIso } from "@/src/utils/date";

export default function TemplatesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [pending, setPending] = useState<TemplateRow | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, TemplateRow>>({});

  const load = useCallback(async () => {
    const list = await listTemplates();
    setTemplates(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggleExpand = async (t: TemplateRow) => {
    if (expanded === t.id) {
      setExpanded(null);
      return;
    }
    if (!details[t.id!]) {
      const full = await getTemplateById(t.id!);
      if (full) setDetails((prev) => ({ ...prev, [t.id!]: full }));
    }
    setExpanded(t.id!);
  };

  const applyTemplate = (id: number) => {
    router.push(`/workout/new?date=${todayIso()}&template=${id}`);
  };

  const confirmDelete = async () => {
    if (!pending) return;
    await deleteTemplate(pending.id!);
    toast.show("Modello eliminato");
    setPending(null);
    load();
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity testID="tpl-back" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Modelli</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
        {templates.length === 0 ? (
          <Card testID="tpl-empty">
            <Text style={{ color: colors.onSurfaceSecondary, textAlign: "center" }}>
              Nessun modello salvato. Salva un allenamento come modello dalla schermata di modifica.
            </Text>
          </Card>
        ) : (
          templates.map((t) => {
            const isOpen = expanded === t.id;
            const full = details[t.id!];
            return (
              <Card key={t.id} testID={`tpl-${t.id}`} style={{ marginBottom: spacing.sm }}>
                <TouchableOpacity onPress={() => toggleExpand(t)} activeOpacity={0.7}>
                  <View style={styles.rowHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tplTitle, { color: colors.onSurface }]}>{t.name}</Text>
                      {t.notes ? (
                        <Text
                          style={{ color: colors.onSurfaceSecondary, marginTop: 4 }}
                          numberOfLines={2}
                        >
                          {t.notes}
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons
                      name={isOpen ? "chevron-up" : "chevron-down"}
                      size={22}
                      color={colors.onSurfaceSecondary}
                    />
                  </View>
                </TouchableOpacity>

                {isOpen && full ? (
                  <View style={{ marginTop: spacing.md }}>
                    {full.exercises.map((ex, i) => (
                      <View
                        key={i}
                        style={[styles.exRow, { borderColor: colors.border }]}
                      >
                        <Text style={{ color: colors.brand, fontWeight: "700", fontSize: typography.sm }}>
                          {ex.muscle_group.toUpperCase()}
                        </Text>
                        <Text style={{ color: colors.onSurface, fontSize: typography.base, fontWeight: "700" }}>
                          {ex.name}
                        </Text>
                        <Text style={{ color: colors.onSurfaceSecondary, fontSize: typography.sm, marginTop: 2 }}>
                          {ex.sets.length} serie • riposo {ex.rest_seconds}s
                          {ex.notes ? ` • ${ex.notes}` : ""}
                        </Text>
                      </View>
                    ))}
                    <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
                      <TouchableOpacity
                        testID={`tpl-use-${t.id}`}
                        onPress={() => applyTemplate(t.id!)}
                        style={[styles.useBtn, { backgroundColor: colors.brand }]}
                      >
                        <Ionicons name="play" size={16} color={colors.onBrand} />
                        <Text style={{ color: colors.onBrand, fontWeight: "700" }}>Usa modello</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID={`tpl-del-${t.id}`}
                        onPress={() => setPending(t)}
                        style={[styles.delBtn, { backgroundColor: colors.surfaceTertiary }]}
                      >
                        <Ionicons name="trash" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </Card>
            );
          })
        )}
      </ScrollView>

      <ConfirmDialog
        visible={!!pending}
        title="Elimina modello"
        message={`Vuoi eliminare il modello "${pending?.name}"?`}
        destructive
        confirmText="Elimina"
        onConfirm={confirmDelete}
        onCancel={() => setPending(null)}
      />
    </SafeAreaView>
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
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: typography.lg, fontWeight: "700" },
  rowHeader: { flexDirection: "row", alignItems: "center" },
  tplTitle: { fontSize: typography.lg, fontWeight: "700" },
  exRow: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: 2,
  },
  useBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 44,
    borderRadius: radius.md,
  },
  delBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
