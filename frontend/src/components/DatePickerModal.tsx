import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/theme/ThemeContext";
import { radius, spacing, typography } from "@/src/theme/colors";
import { MonthCalendar } from "./MonthCalendar";

interface Props {
  visible: boolean;
  value: string;
  onChange: (date: string) => void;
  onClose: () => void;
}

export function DatePickerModal({ visible, value, onChange, onClose }: Props) {
  const { colors } = useTheme();
  const [temp, setTemp] = useState(value);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.onSurface }]}>Seleziona data</Text>
            <TouchableOpacity testID="date-picker-close" onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
          <MonthCalendar
            selectedDate={temp}
            markedDates={new Set()}
            onSelectDate={setTemp}
          />
          <TouchableOpacity
            testID="date-picker-confirm"
            onPress={() => {
              onChange(temp);
              onClose();
            }}
            style={[styles.confirmBtn, { backgroundColor: colors.brand }]}
          >
            <Text style={{ color: colors.onBrand, fontWeight: "700", fontSize: typography.lg }}>
              Conferma
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: typography.xl, fontWeight: "700" },
  confirmBtn: {
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
});
