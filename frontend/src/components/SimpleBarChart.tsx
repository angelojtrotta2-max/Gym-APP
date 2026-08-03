import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme/ThemeContext';
import { radius, spacing, typography } from '@/src/theme/colors';

interface Point {
  x: number; // sequential index or timestamp
  y: number; // weight
  label: string; // date short
}

interface Props {
  points: Point[];
  height?: number;
  testID?: string;
}

// Simple bar chart drawn with Views. Good enough for weight progression.
export function SimpleBarChart({ points, height = 180, testID }: Props) {
  const { colors } = useTheme();
  if (points.length === 0) {
    return (
      <View testID={testID} style={[styles.empty, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <Text style={{ color: colors.onSurfaceSecondary }}>Nessun dato</Text>
      </View>
    );
  }
  const max = Math.max(...points.map((p) => p.y), 1);
  const min = 0;
  return (
    <View
      testID={testID}
      style={[styles.container, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
    >
      <View style={[styles.chartArea, { height }]}>
        {points.map((p, i) => {
          const h = ((p.y - min) / (max - min || 1)) * (height - 32);
          return (
            <View key={i} style={styles.barCol}>
              <Text style={[styles.barValue, { color: colors.onSurfaceSecondary }]}>{p.y}</Text>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(4, h),
                    backgroundColor: colors.brand,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {points.map((p, i) => (
          <Text key={i} style={[styles.label, { color: colors.onSurfaceSecondary }]} numberOfLines={1}>
            {p.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  bar: {
    width: '60%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barValue: { fontSize: 10, fontWeight: '700' },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
  },
  label: {
    flex: 1,
    fontSize: 10,
    textAlign: 'center',
  },
  empty: {
    padding: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
});
