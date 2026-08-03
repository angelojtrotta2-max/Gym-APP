import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import { radius, spacing, typography } from '@/src/theme/colors';

interface CalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  markedDates: Set<string>;
  onMonthChange?: (year: number, month: number) => void;
}

const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

const DAY_NAMES = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

function ymd(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function MonthCalendar({ selectedDate, onSelectDate, markedDates, onMonthChange }: CalendarProps) {
  const { colors } = useTheme();
  const [current, setCurrent] = useState(() => {
    const d = new Date(selectedDate);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  useEffect(() => {
    onMonthChange?.(current.year, current.month);
  }, [current.year, current.month]);

  const days = useMemo(() => {
    const first = new Date(current.year, current.month - 1, 1);
    const last = new Date(current.year, current.month, 0);
    const daysInMonth = last.getDate();
    // Convert JS day (0=Sun) to Mon-first (0=Mon)
    const firstDay = (first.getDay() + 6) % 7;
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [current]);

  const changeMonth = (delta: number) => {
    let y = current.year;
    let m = current.month + delta;
    if (m < 1) {
      m = 12;
      y--;
    } else if (m > 12) {
      m = 1;
      y++;
    }
    setCurrent({ year: y, month: m });
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <View style={styles.header}>
        <TouchableOpacity testID="cal-prev" onPress={() => changeMonth(-1)} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: colors.onSurface }]}>
          {MONTH_NAMES[current.month - 1]} {current.year}
        </Text>
        <TouchableOpacity testID="cal-next" onPress={() => changeMonth(1)} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={22} color={colors.onSurface} />
        </TouchableOpacity>
      </View>
      <View style={styles.dayHeader}>
        {DAY_NAMES.map((d, i) => (
          <Text key={i} style={[styles.dayHeaderText, { color: colors.onSurfaceSecondary }]}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {days.map((d, idx) => {
          if (d === null) return <View key={idx} style={styles.cell} />;
          const dateStr = ymd(current.year, current.month, d);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const hasWorkout = markedDates.has(dateStr);
          return (
            <TouchableOpacity
              key={idx}
              testID={`cal-day-${dateStr}`}
              onPress={() => onSelectDate(dateStr)}
              style={styles.cell}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.cellInner,
                  isSelected && { backgroundColor: colors.brand },
                  !isSelected && isToday && { borderWidth: 1, borderColor: colors.brand },
                ]}
              >
                <Text
                  style={[
                    styles.cellText,
                    { color: isSelected ? colors.onBrand : colors.onSurface },
                  ]}
                >
                  {d}
                </Text>
              </View>
              {hasWorkout && (
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: isSelected ? colors.onBrand : colors.brand },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navBtn: { padding: spacing.sm },
  monthTitle: { fontSize: typography.lg, fontWeight: '700', textTransform: 'capitalize' },
  dayHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.sm,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellInner: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: { fontSize: typography.base, fontWeight: '600' },
  dot: {
    width: 5,
    height: 5,
    borderRadius: radius.pill,
    marginTop: 2,
  },
});
