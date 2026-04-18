import { Tabs } from "expo-router";
import {
  BookOpen,
  Heart,
  Home,
  MessageCircle,
  User,
} from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useI18n } from "../../../src/i18n";
import { useTheme } from "../../../src/theme";

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor:
          colors.tabBarInactive ?? (isDark ? "#6B7280" : "#9CA3AF"),
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.select({ ios: 88, android: 72, default: 64 }),
          paddingBottom: Platform.select({ ios: 26, android: 10, default: 8 }),
          paddingTop: 6,
          // Cross-platform shadow (shadow* deprecated sur web en RN 0.83)
          ...Platform.select({
            web: {
              boxShadow: isDark
                ? "0 -3px 12px rgba(0,0,0,0.25)"
                : "0 -3px 12px rgba(124,58,237,0.07)",
            },
            default: {
              shadowColor: isDark ? "#000" : "#7C3AED",
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: isDark ? 0.25 : 0.07,
              shadowRadius: 12,
              elevation: 14,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          tabBarLabel: t.tabs.home,
          tabBarIcon: ({ color, focused }) => (
            <Home size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />

      <Tabs.Screen
        name="prayers/index"
        options={{
          tabBarLabel: t.prayers.title,
          tabBarIcon: ({ color, focused }) => (
            <Heart size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />

      <Tabs.Screen
        name="ai/index"
        options={{
          tabBarLabel: t.tabs.consultation,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "700",
            color: colors.primary,
          },
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                s.centerCircle,
                {
                  backgroundColor: focused
                    ? colors.primaryDark
                    : colors.primary,
                  shadowColor: colors.primary,
                },
              ]}
            >
              <MessageCircle size={22} color="#fff" strokeWidth={1.8} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="library/index"
        options={{
          tabBarLabel: t.tabs.library,
          tabBarIcon: ({ color, focused }) => (
            <BookOpen
              size={22}
              color={color}
              strokeWidth={focused ? 2.5 : 1.8}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile/index"
        options={{
          tabBarLabel: t.tabs.profile,
          tabBarIcon: ({ color, focused }) => (
            <User size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  centerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -14,
    ...Platform.select({
      web: { boxShadow: "0 4px 14px rgba(0,0,0,0.45)" },
      default: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
        elevation: 10,
      },
    }),
  },
});
