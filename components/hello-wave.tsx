import Animated from 'react-native-reanimated';
import { Hand } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export function HelloWave() {
  const theme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const color = Colors[theme].text;

  return (
    <Animated.View
      style={{
        marginTop: -6,
        animationName: {
          '50%': { transform: [{ rotate: '25deg' }] },
        },
        animationIterationCount: 4,
        animationDuration: '300ms',
      }}>
      <Hand size={28} color={color} strokeWidth={2.2} />
    </Animated.View>
  );
}
