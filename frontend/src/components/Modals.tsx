import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import { radius, spacing, typography } from '@/src/theme/colors';

interface ConfirmProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  destructive,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
          {message ? (
            <Text style={[styles.msg, { color: colors.onSurfaceSecondary }]}>{message}</Text>
          ) : null}
          <View style={styles.row}>
            <TouchableOpacity
              testID="confirm-cancel"
              onPress={onCancel}
              style={[styles.btn, { backgroundColor: colors.surfaceTertiary }]}
            >
              <Text style={{ color: colors.onSurface, fontWeight: '700' }}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="confirm-ok"
              onPress={onConfirm}
              style={[styles.btn, { backgroundColor: destructive ? colors.error : colors.brand }]}
            >
              <Text style={{ color: '#FFF', fontWeight: '700' }}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface PickerProps {
  visible: boolean;
  title: string;
  options: string[];
  selected?: string;
  onSelect: (v: string) => void;
  onClose: () => void;
  allowAddNew?: boolean;
  onAddNew?: () => void;
}

export function OptionPicker({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  allowAddNew,
  onAddNew,
}: PickerProps) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay, justifyContent: 'flex-end' }]}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
          ]}
        >
          <View style={styles.sheetHeader}>
            <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
            <TouchableOpacity testID="picker-close" onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 400 }}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                testID={`picker-option-${opt}`}
                onPress={() => {
                  onSelect(opt);
                  onClose();
                }}
                style={[
                  styles.optionRow,
                  { borderBottomColor: colors.divider },
                  selected === opt && { backgroundColor: colors.surfaceTertiary },
                ]}
              >
                <Text style={{ color: colors.onSurface, fontSize: typography.lg }}>{opt}</Text>
                {selected === opt ? (
                  <Ionicons name="checkmark" size={22} color={colors.brand} />
                ) : null}
              </TouchableOpacity>
            ))}
            {allowAddNew ? (
              <TouchableOpacity
                testID="picker-add-new"
                onPress={() => {
                  onClose();
                  onAddNew?.();
                }}
                style={[styles.optionRow, { borderBottomColor: colors.divider }]}
              >
                <Text style={{ color: colors.brand, fontSize: typography.lg, fontWeight: '700' }}>
                  + Aggiungi nuovo
                </Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: { fontSize: typography.xl, fontWeight: '700' },
  msg: { fontSize: typography.base, marginTop: spacing.sm, marginBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
