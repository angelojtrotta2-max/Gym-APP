export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  surface: string;
  onSurface: string;
  surfaceSecondary: string;
  onSurfaceSecondary: string;
  surfaceTertiary: string;
  onSurfaceTertiary: string;
  brand: string;
  onBrand: string;
  brandSecondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  border: string;
  borderStrong: string;
  divider: string;
  overlay: string;
}

export const darkColors: ThemeColors = {
  surface: '#09090B',
  onSurface: '#F4F4F5',
  surfaceSecondary: '#18181B',
  onSurfaceSecondary: '#A1A1AA',
  surfaceTertiary: '#27272A',
  onSurfaceTertiary: '#D4D4D8',
  brand: '#FF5A00',
  onBrand: '#FAFAFA',
  brandSecondary: '#C2410C',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  border: '#27272A',
  borderStrong: '#3F3F46',
  divider: '#27272A',
  overlay: 'rgba(0,0,0,0.75)',
};

export const lightColors: ThemeColors = {
  surface: '#FAFAFA',
  onSurface: '#09090B',
  surfaceSecondary: '#F4F4F5',
  onSurfaceSecondary: '#52525B',
  surfaceTertiary: '#E4E4E7',
  onSurfaceTertiary: '#18181B',
  brand: '#EA580C',
  onBrand: '#FFFFFF',
  brandSecondary: '#C2410C',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',
  border: '#E4E4E7',
  borderStrong: '#D4D4D8',
  divider: '#E4E4E7',
  overlay: 'rgba(0,0,0,0.5)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const typography = {
  sm: 12,
  base: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};
