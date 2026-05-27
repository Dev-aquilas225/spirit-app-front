import { Tabs } from 'expo-router';
import { BookOpen, CloudMoon, Eye, Home, Sparkles, User as UserIcon } from 'lucide-react-native';
import React, { useRef, useEffect } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/theme';

function TabIcon({ icon: Icon, focused, color }: { icon: any; focused: boolean; color: string }) {
  const scale   = useRef(new Animated.Value(focused ? 1.1 : 0.9)).current;
  const opacity = useRef(new Animated.Value(focused ? 1 : 0.5)).current;
  const glow    = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: focused ? 1.15 : 0.9, tension: 140, friction: 8, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: focused ? 1 : 0.5, duration: 200, useNativeDriver: true }),
      Animated.timing(glow,    { toValue: focused ? 1 : 0, duration: 250, useNativeDriver: false }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View style={[
      st.iconWrap,
      focused && st.iconWrapActive,
      { transform: [{ scale }], opacity },
    ]}>
      <Icon size={21} color={color} strokeWidth={focused ? 2.5 : 1.8} />
      {focused && <View style={[st.dot, { backgroundColor: color }]} />}
    </Animated.View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const TAB_H = Platform.select({ ios: 82, android: 66, default: 60 + insets.bottom });
  const PAD_B = Platform.select({ ios: 24, android: 8, default: 8 + insets.bottom });

  return (
    <Tabs screenOptions={{
      headerShown: false,
      animation: 'shift',
      tabBarActiveTintColor:   colors.primary,
      tabBarInactiveTintColor: colors.tabBarInactive,
      tabBarStyle: {
        backgroundColor: colors.tabBar,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        height: TAB_H,
        paddingBottom: PAD_B,
        paddingTop: 6,
        ...Platform.select({
          web: { boxShadow: `0 -1px 0 ${colors.border}, 0 -4px 20px rgba(201,168,76,0.08)` },
          default: {
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.10,
            shadowRadius: 12,
            elevation: 16,
          },
        }),
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2, marginTop: 1 },
    }}>
      {/* Dashboard en premier — écran d'accueil */}
      <Tabs.Screen
        name="dashboard/index"
        options={{ tabBarLabel: 'Accueil', tabBarIcon: ({ color, focused }) => <TabIcon icon={Home} focused={focused} color={color} /> }}
      />
      <Tabs.Screen
        name="home/index"
        options={{ tabBarLabel: 'Rêves', tabBarIcon: ({ color, focused }) => <TabIcon icon={CloudMoon} focused={focused} color={color} /> }}
      />
      <Tabs.Screen
        name="ai/index"
        options={{ tabBarLabel: 'Voyance', tabBarIcon: ({ color, focused }) => <TabIcon icon={Eye} focused={focused} color={color} /> }}
      />
      <Tabs.Screen
        name="prayers/index"
        options={{ tabBarLabel: 'Prière', tabBarIcon: ({ color, focused }) => <TabIcon icon={Sparkles} focused={focused} color={color} /> }}
      />
      <Tabs.Screen
        name="library/index"
        options={{ tabBarLabel: 'Bibliothèque', tabBarIcon: ({ color, focused }) => <TabIcon icon={BookOpen} focused={focused} color={color} /> }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{ tabBarLabel: 'Profil', tabBarIcon: ({ color, focused }) => <TabIcon icon={UserIcon} focused={focused} color={color} /> }}
      />
    </Tabs>
  );
}

const st = StyleSheet.create({
  iconWrap:       { width: 40, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, position: 'relative' },
  iconWrapActive: { backgroundColor: 'rgba(201,168,76,0.14)' },
  dot:            { position: 'absolute', bottom: -3, width: 4, height: 4, borderRadius: 2 },
});
