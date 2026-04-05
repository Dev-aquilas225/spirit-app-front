import { ChevronRight, Code, Home, Send } from 'lucide-react-native';
import type { StyleProp, ViewStyle } from 'react-native';

type IconSymbolName = keyof typeof MAPPING;
type IconSymbolWeight = 'ultralight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black';

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
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: IconSymbolWeight;
}) {
  const Icon = MAPPING[name];
  return <Icon color={color} size={size} style={style as never} />;
}
