import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { useTheme } from '@/src/theme/ThemeContext';
import { radius, spacing, typography } from '@/src/theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  testID?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  testID,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme();
  const heights = { sm: 36, md: 44, lg: 52 };
  const paddings = { sm: 12, md: 16, lg: 20 };
  const fontSizes = { sm: typography.sm, md: typography.base, lg: typography.lg };

  const bg =
    variant === 'primary'
      ? colors.brand
      : variant === 'danger'
      ? colors.error
      : variant === 'secondary'
      ? colors.surfaceTertiary
      : 'transparent';

  const fg =
    variant === 'primary' || variant === 'danger'
      ? colors.onBrand
      : colors.onSurface;

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        {
          height: heights[size],
          paddingHorizontal: paddings[size],
          backgroundColor: bg,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: disabled ? 0.5 : 1,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {icon ? <View style={{ marginRight: spacing.sm }}>{icon}</View> : null}
      <Text
        style={[
          { color: fg, fontSize: fontSizes[size], fontWeight: '700' },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  testID?: string;
}

export function Card({ children, style, onPress, testID }: CardProps) {
  const { colors } = useTheme();
  const cardStyle = [
    {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radius.md,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    style,
  ];
  if (onPress) {
    return (
      <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.8} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }
  return (
    <View testID={testID} style={cardStyle}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({});
