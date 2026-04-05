import React from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { useTheme } from '../../theme';

export type AppIconProps = Omit<LucideProps, 'color' | 'size'> & {
  icon: LucideIcon;
  color?: string; 
  size?: number;
};

export function AppIcon({ icon: Icon, color, size = 20, strokeWidth = 2.2, ...rest }: AppIconProps) {
  const { colors } = useTheme();

  return <Icon color={color ?? colors.text} size={size} strokeWidth={strokeWidth} {...rest} />;
}

