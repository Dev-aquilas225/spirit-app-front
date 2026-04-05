import { router, useLocalSearchParams } from "expo-router";
import { Delete, KeyRound } from "lucide-react-native";
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
import { AuthService } from "../../src/services/auth.service";
import { useTheme } from "../../src/theme";

const PIN_LENGTH = 4;

type Step = "new" | "confirm";

export default function NewPasswordScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { phone, mode, tempToken, otpCode } = useLocalSearchParams<{
    phone: string;
    mode: "setpin" | "reset";
    tempToken?: string;
    otpCode?: string;
  }>();

  const { setPin: storePinAndLogin } = useAuth();
  const [step, setStep] = useState<Step>("new");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSetPin = mode === "setpin"; // Nouveau compte → définir PIN
  const isReset  = mode === "reset";  // Mot de passe oublié → nouveau PIN

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const currentPin = step === "new" ? newPin : confirmPin;
  const setCurrentPin = step === "new" ? setNewPin : setConfirmPin;

  useEffect(() => {
    if (currentPin.length === PIN_LENGTH) {
      handleStepComplete(currentPin);
    }
  }, [currentPin]);

  function triggerShake() {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function handleStepComplete(pin: string) {
    if (step === "new") {
      // Passer à la confirmation
      setStep("confirm");
      return;
    }

    // Étape confirmation : vérifier que les deux PIN correspondent
    if (pin !== newPin) {
      setError(t.auth.pinMismatch);
      triggerShake();
      setTimeout(() => {
        setConfirmPin("");
        setError(null);
      }, 700);
      return;
    }

    setLoading(true);

    if (isReset) {
      // Réinitialisation → POST /auth/reset-password {phone, otp, newPin}
      const result = await AuthService.resetPassword(phone ?? "", otpCode ?? "", newPin);
      setLoading(false);
      if (result.error) {
        setError(result.error);
        triggerShake();
        setTimeout(() => { setConfirmPin(""); setError(null); }, 700);
        return;
      }
      // Succès → connexion avec le nouveau PIN
      router.replace({ pathname: "/(auth)/pin", params: { phone } });
    } else {
      // setpin ou mode absent → POST /auth/set-pin avec tempToken
      const success = await storePinAndLogin(pin, tempToken ?? "");
      setLoading(false);
      if (success) {
        // Nouveau compte → toujours diriger vers la complétion du profil
        router.replace("/(app)/complete-profile");
      } else {
        setError(t.auth.pinSetError);
        triggerShake();
        setTimeout(() => { setConfirmPin(""); setError(null); }, 700);
      }
    }
  }

  function pressKey(key: string) {
    if (loading || currentPin.length >= PIN_LENGTH) return;
    setCurrentPin((p) => p + key);
  }

  function pressBackspace() {
    if (loading) return;
    if (currentPin.length > 0) {
      setCurrentPin((p) => p.slice(0, -1));
    } else if (step === "confirm") {
      // Retour à l'étape précédente si on efface sur un champ vide
      setStep("new");
      setNewPin("");
    }
  }

  // ── Dots ──────────────────────────────────────────────────────────────────
  function renderDots() {
    return (
      <Animated.View
        style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}
      >
        {Array.from({ length: PIN_LENGTH }).map((_, i) => {
          const filled = i < currentPin.length;
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

  // ── Touches ───────────────────────────────────────────────────────────────
  function renderKey(value: string | null) {
    if (value === null) return <View key="empty" style={styles.keyPlaceholder} />;
    if (value === "⌫") {
      return (
        <TouchableOpacity
          key="backspace"
          style={styles.key}
          onPress={pressBackspace}
          activeOpacity={0.6}
          disabled={loading}
        >
          <AppIcon icon={Delete} size={24} color={colors.text} strokeWidth={2.6} />
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        key={value}
        style={styles.key}
        onPress={() => pressKey(value)}
        activeOpacity={0.6}
        disabled={loading}
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
      <BackButton
        style={styles.backBtn}
        disabled={loading}
        onPress={
          step === "confirm"
            ? () => { setStep("new"); setConfirmPin(""); setError(null); }
            : undefined
        }
      />

      {/* Icône */}
      <View style={styles.logoWrap}>
        <AppIcon icon={KeyRound} size={64} color={colors.primary} strokeWidth={1.8} />
      </View>

      {/* Indicateur d'étape */}
      <View style={styles.stepsRow}>
        <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
        <View
          style={[
            styles.stepDot,
            {
              backgroundColor:
                step === "confirm" ? colors.primary : colors.primary + "33",
            },
          ]}
        />
      </View>

      {/* Numéro */}
      <Text style={[styles.phoneLabel, { color: colors.textSecondary }]}>
        {phone}
      </Text>

      {/* Titre */}
      <Text style={[styles.title, { color: colors.text }]}>
        {step === "new" ? t.auth.newPinTitle : t.auth.confirmPinTitle}
      </Text>

      {/* Sous-titre */}
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {step === "new" ? t.auth.newPinSubtitle : t.auth.confirmPinSubtitle}
      </Text>

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          renderDots()
        )}
      </View>

      {/* Erreur ou hint */}
      {error ? (
        <Text style={[styles.hintText, { color: "#EF4444" }]}>{error}</Text>
      ) : (
        <Text style={[styles.hintText, { color: colors.textSecondary }]}>
          {step === "new" ? t.auth.newPinHint : t.auth.confirmPinHint}
        </Text>
      )}

      {/* Clavier */}
      <View style={styles.numpad}>
        {rows.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((k) => renderKey(k))}
          </View>
        ))}
      </View>

      {/* Espace placeholder pour l'équilibre visuel */}
      <View style={{ height: 24 }} />
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
  logoWrap: { marginTop: 16 },
  stepsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  phoneLabel: { fontSize: 15, marginTop: 2 },
  title: { fontSize: 22, fontWeight: "700", marginTop: 4, textAlign: "center" },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  dotsContainer: {
    height: 36,
    justifyContent: "center",
    marginVertical: 8,
  },
  dotsRow: { flexDirection: "row", gap: 20 },
  dot: { width: 18, height: 18, borderRadius: 9 },
  hintText: { fontSize: 13, textAlign: "center", fontWeight: "500" },
  numpad: { width: "100%", maxWidth: 320, gap: 4 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  key: {
    flex: 1,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    borderRadius: 12,
  },
  keyPlaceholder: { flex: 1, height: 72, marginHorizontal: 4 },
  keyText: { fontSize: 28, fontWeight: "400" },
});
