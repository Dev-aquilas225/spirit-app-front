import React from 'react';
import {
  ScrollView,
  StyleSheet,
  ViewStyle,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../theme';

const AnimatedSafeArea = Animated.createAnimatedComponent(SafeAreaView);

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  padded?: boolean;
  safeBottom?: boolean;
}

export function ScreenWrapper({
  children,
  scrollable = false,
  refreshing = false,
  onRefresh,
  style,
  contentStyle,
  padded = true,
  safeBottom = true,
}: ScreenWrapperProps) {
  const { colors, spacing, isDark } = useTheme();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
  };

  const innerStyle: ViewStyle = {
    flex: 1,
    paddingHorizontal: padded ? spacing.base : 0,
  };

  const entering = FadeInDown.duration(280).springify().damping(22).stiffness(180);

  if (scrollable) {
    return (
      <AnimatedSafeArea
        entering={entering}
        style={[containerStyle, style]}
        edges={safeBottom ? ['top', 'bottom'] : ['top']}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            { paddingBottom: spacing.xl },
            innerStyle,
            contentStyle,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </AnimatedSafeArea>
    );
  }

  return (
    <AnimatedSafeArea
      entering={entering}
      style={[containerStyle, style]}
      edges={safeBottom ? ['top', 'bottom'] : ['top']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <Animated.View style={[innerStyle, contentStyle]}>{children}</Animated.View>
    </AnimatedSafeArea>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
});
