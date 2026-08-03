import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import { radius, spacing, typography } from '@/src/theme/colors';

interface RestTimerProps {
  visible: boolean;
  seconds: number;
  onClose: () => void;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function RestTimer({ visible, seconds, onClose }: RestTimerProps) {
  const { colors } = useTheme();
  const [remaining, setRemaining] = useState(seconds);
  const [paused, setPaused] = useState(false);
  const interval = useRef<number | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (visible) {
      setRemaining(seconds);
      setPaused(false);
      finishedRef.current = false;
    }
  }, [visible, seconds]);

  useEffect(() => {
    if (!visible || paused) return;
    interval.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (!finishedRef.current) {
            finishedRef.current = true;
            Vibration.vibrate([0, 400, 200, 400]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000) as unknown as number;
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [visible, paused]);

  const addTime = (delta: number) => {
    setRemaining((r) => Math.max(0, r + delta));
    finishedRef.current = false;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.onSurfaceSecondary }]}>Timer Riposo</Text>
          <Text testID="rest-timer-remaining" style={[styles.time, { color: remaining === 0 ? colors.brand : colors.onSurface }]}>
            {formatTime(remaining)}
          </Text>

          <View style={styles.controls}>
            <TouchableOpacity
              testID="rest-timer-minus"
              onPress={() => addTime(-15)}
              style={[styles.controlBtn, { backgroundColor: colors.surfaceTertiary }]}
            >
              <Text style={[styles.controlText, { color: colors.onSurface }]}>-15s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="rest-timer-toggle"
              onPress={() => setPaused((p) => !p)}
              style={[styles.controlBtnLarge, { backgroundColor: colors.brand }]}
            >
              <Ionicons
                name={paused ? 'play' : 'pause'}
                size={28}
                color={colors.onBrand}
              />
            </TouchableOpacity>
            <TouchableOpacity
              testID="rest-timer-plus"
              onPress={() => addTime(15)}
              style={[styles.controlBtn, { backgroundColor: colors.surfaceTertiary }]}
            >
              <Text style={[styles.controlText, { color: colors.onSurface }]}>+15s</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            testID="rest-timer-close"
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.surfaceTertiary }]}
          >
            <Text style={{ color: colors.onSurface, fontWeight: '700' }}>
              {remaining === 0 ? 'Chiudi' : 'Salta'}
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.base,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  time: {
    fontSize: 72,
    fontWeight: '800',
    marginVertical: spacing.lg,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  controlBtn: {
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnLarge: {
    height: 64,
    width: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlText: { fontWeight: '700', fontSize: typography.base },
  closeBtn: {
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
