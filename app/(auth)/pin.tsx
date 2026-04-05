import { router, useLocalSearchParams } from "expo-router";
import { Delete, MessageCircle } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppIcon } from "../../src/components/common/AppIcon";
import { BackButton } from "../../src/components/common/BackButton";
import { useAuth } from "../../src/hooks/useAuth";
import { useI18n } from "../../src/i18n";
import { useAuthStore } from "../../src/store/auth.store";
import { useTheme } from "../../src/theme";

const PIN_LENGTH = 4;

export default function PinScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { login, isLoading, error, clearError } = useAuth();
  const isProfileComplete = useAuthStore((s) => s.isProfileComplete);

  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);

  // Animation de secousse pour les erreurs
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Dès que 4 chiffres sont saisis, on tente la connexion
    if (pin.length === PIN_LENGTH) {
      handleSubmit(pin);
    }
  }, [pin]);

  useEffect(() => {
    if (error) {
      triggerShake();
      // Réinitialiser le PIN après erreur
      setTimeout(() => {
        setPin("");
        clearError();
      }, 600);
    }
  }, [error]);

  function triggerShake() {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }

  async function handleSubmit(currentPin: string) {
    if (!phone) return;
    const success = await login(phone, currentPin);
    if (success) {
      // Si le profil est incomplet → compléter d'abord
      const complete = useAuthStore.getState().isProfileComplete;
      router.replace(complete ? "/(app)/(tabs)/home" : "/(app)/complete-profile");
    }
  }

  function pressKey(key: string) {
    if (isLoading) return;
    if (pin.length < PIN_LENGTH) {
      setPin((prev) => prev + key);
    }
  }

  function pressBackspace() {
    if (isLoading) return;
    setPin((prev) => prev.slice(0, -1));
  }

  // ─── Rendu des 4 points ───────────────────────────────────────────────────
  function renderDots() {
    return (
      <Animated.View
        style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}
      >
        {Array.from({ length: PIN_LENGTH }).map((_, i) => {
          const filled = i < pin.length;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: filled ? colors.primary : "transparent",
                  borderColor: filled ? colors.primary : colors.primary + "55",
                  borderWidth: 2,
                },
              ]}
            />
          );
        })}
      </Animated.View>
    );
  }

  // ─── Rendu d'une touche du clavier ───────────────────────────────────────
  function renderKey(value: string | null) {
    if (value === null) {
      // Cellule vide
      return <View key="empty" style={styles.keyPlaceholder} />;
    }
    if (value === "⌫") {
      return (
        <TouchableOpacity
          key="backspace"
          style={styles.key}
          onPress={pressBackspace}
          activeOpacity={0.6}
          disabled={isLoading}
        >
          <AppIcon
            icon={Delete}
            size={24}
            color={colors.text}
            strokeWidth={2.6}
          />
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        key={value}
        style={[styles.key]}
        onPress={() => pressKey(value)}
        activeOpacity={0.6}
        disabled={isLoading}
      >
        <Text style={[styles.keyText, { color: colors.text }]}>{value}</Text>
      </TouchableOpacity>
    );
  }

  const rows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [null, "0", "⌫"],
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Bouton retour */}
      <BackButton style={styles.backBtn} disabled={isLoading} />

      {/* Logo */}
      <View style={styles.logoWrap}>
        <AppIcon
          icon={MessageCircle}
          size={64}
          color={colors.primary}
          strokeWidth={1.8}
        />
      </View>

      {/* Téléphone affiché */}
      <Text style={[styles.phoneLabel, { color: colors.textSecondary }]}>
        {phone}
      </Text>
      <Text style={[styles.title, { color: colors.text }]}>{t.auth.pinTitle}</Text>

      {/* Indicateur de chargement ou points */}
      <View style={styles.dotsContainer}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          renderDots()
        )}
      </View>

      {/* Message d'erreur */}
      {error ? (
        <Text style={[styles.errorText, { color: "#EF4444" }]}>{error}</Text>
      ) : (
        <Text style={[styles.hintText, { color: colors.textSecondary }]}>
          {t.auth.pinHint}
        </Text>
      )}

      {/* Clavier numérique */}
      <View style={styles.numpad}>
        {rows.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((k) => renderKey(k))}
          </View>
        ))}
      </View>

      {/* Lien oubli PIN */}
      <TouchableOpacity
        style={styles.forgotBtn}
        onPress={() => router.push("/(auth)/forgot-password")}
        disabled={isLoading}
      >
        <Text style={[styles.forgotText, { color: colors.primary }]}>
          {t.auth.pinForgot}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  backBtn: { alignSelf: "flex-start" },
  logoWrap: {
    marginTop: 16,
  },
  phoneLabel: {
    fontSize: 15,
    marginTop: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
  },
  dotsContainer: {
    height: 36,
    justifyContent: "center",
    marginVertical: 8,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 20,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  hintText: {
    fontSize: 13,
    textAlign: "center",
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
  },
  numpad: {
    width: "100%",
    maxWidth: 320,
    gap: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  key: {
    flex: 1,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    borderRadius: 12,
  },
  keyPlaceholder: {
    flex: 1,
    height: 72,
    marginHorizontal: 4,
  },
  keyText: {
    fontSize: 28,
    fontWeight: "400",
  },
  keyBackspace: {
    fontSize: 24,
    fontWeight: "400",
  },
  forgotBtn: {
    paddingVertical: 8,
  },
  forgotText: {
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
