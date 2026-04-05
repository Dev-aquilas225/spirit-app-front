import { ChevronRight, Code, Home, Send } from 'lucide-react-native';
import type { OpaqueColorValue, StyleProp, TextStyle } from 'react-native';

type IconSymbolName = keyof typeof MAPPING;
type IconSymbolWeight = 'ultralight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black';

/**
 * Map SF Symbol names (used by the starter template) to Lucide icons.
 */
const MAPPING = {
  'house.fill': Home,
  'paperplane.fill': Send,
  'chevron.left.forwardslash.chevron.right': Code,
  'chevron.right': ChevronRight,
} as const;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: IconSymbolWeight;
}) {
  const Icon = MAPPING[name];
  return <Icon color={color as string} size={size} style={style as never} />;
}
