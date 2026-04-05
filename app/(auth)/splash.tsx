import { router } from "expo-router";
import { MessageCircle } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "../../src/components/common/AppIcon";
import { useI18n } from "../../src/i18n";
import { useTheme } from "../../src/theme";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace("/(auth)/onboarding");
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.deepBlue ?? "#1A1A3E" },
      ]}
    >
      {/* Stars background */}
      {[...Array(20)].map((_, i) => (
        <View
          key={i}
          style={[
            styles.star,
            {
              top: Math.random() * height,
              left: Math.random() * width,
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              backgroundColor: "#fff",
              opacity: Math.random() * 0.7 + 0.3,
            },
          ]}
        />
      ))}

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: "center",
        }}
      >
        <View style={styles.logo}>
          <AppIcon
            icon={MessageCircle}
            size={80}
            color="#C9A84C"
            strokeWidth={1.6}
          />
        </View>
        <Text style={styles.appName}>Oracle Plus</Text>
        <Text style={styles.tagline}>{t.auth.tagline}</Text>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === 0 ? "#C9A84C" : "rgba(255,255,255,0.3)",
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  star: { position: "absolute", borderRadius: 99 },
  logo: { marginBottom: 16 },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: "#C9A84C",
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    marginTop: 8,
    letterSpacing: 0.5,
  },
  footer: { position: "absolute", bottom: 60 },
  dots: { flexDirection: "row", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
