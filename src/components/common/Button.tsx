import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '../../theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  disabled,
  ...props
}: ButtonProps) {
  const { colors, borderRadius: br, spacing } = useTheme();

  const sizeStyles: Record<Size, { paddingVertical: number; paddingHorizontal: number; borderRadius: number }> = {
    sm: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: br.sm },
    md: { paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.lg, borderRadius: br.md },
    lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: br.lg },
  };

  const textSizes: Record<Size, number> = { sm: 13, md: 15, lg: 17 };

  const variantStyles: Record<Variant, { container: ViewStyle; text: TextStyle }> = {
    primary: {
      container: { backgroundColor: colors.primary },
      text: { color: '#fff' },
    },
    gold: {
      container: { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
      text: { color: '#fff' },
    },
    secondary: {
      container: { backgroundColor: colors.surfaceSecondary },
      text: { color: colors.text },
    },
    outline: {
      container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
      text: { color: colors.primary },
    },
    ghost: {
      container: { backgroundColor: 'transparent' },
      text: { color: colors.primary },
    },
    danger: {
      container: { backgroundColor: '#EF4444' },
      text: { color: '#fff' },
    },
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant].container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles[variant].text.color} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            style={[
              styles.text,
              { fontSize: textSizes[size], color: variantStyles[variant].text.color },
              icon ? { marginLeft: iconPosition === 'left' ? 6 : 0, marginRight: iconPosition === 'right' ? 6 : 0 } : {},
              textStyle,
            ]}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
  },
});
