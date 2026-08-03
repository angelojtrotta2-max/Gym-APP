import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme/ThemeContext';
import { radius, spacing, typography } from '@/src/theme/colors';

type ToastCtx = {
  show: (msg: string, kind?: 'success' | 'error' | 'info') => void;
};

const Ctx = React.createContext<ToastCtx | null>(null);

export function useToast() {
  const c = React.useContext(Ctx);
  if (!c) throw new Error('ToastProvider missing');
  return c;
}

interface Toast {
  id: number;
  msg: string;
  kind: 'success' | 'error' | 'info';
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const show = (msg: string, kind: 'success' | 'error' | 'info' = 'success') => {
    const id = ++counter.current;
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  };

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <View pointerEvents="none" style={styles.stack}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} colors={colors} />
        ))}
      </View>
    </Ctx.Provider>
  );
}

function ToastItem({ toast, colors }: { toast: Toast; colors: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start();
  }, []);
  const bg =
    toast.kind === 'error' ? colors.error : toast.kind === 'info' ? colors.info : colors.success;
  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: bg,
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
        },
      ]}
    >
      <Text style={styles.toastText}>{toast.msg}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stack: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  toastText: { color: '#FFF', fontWeight: '700', fontSize: typography.base },
});
