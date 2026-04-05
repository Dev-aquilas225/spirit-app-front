import { router, useLocalSearchParams } from "expo-router";
import { Delete, MessageCircle, ShieldCheck } from "lucide-react-native";
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

// otp.tsx — vérification OTP
// mode=register → verify-otp → new-password (setpin)
// mode=reset    → stocke code → new-password (reset)

const OTP_LENGTH = 4;
const RESEND_DELAY = 60;

export default function OTPScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { phone, mode } = useLocalSearchParams<{
    phone: string;
    mode: "register" | "reset";
  }>();

  const { isLoading, clearError } = useAuth();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_DELAY);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const isRegister = mode === "register";

  // Countdown pour renvoyer le code
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Auto-submit dès que 4 chiffres saisis
  useEffect(() => {
    if (otp.length === OTP_LENGTH) {
      handleVerify(otp);
    }
  }, [otp]);

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

  async function handleVerify(code: string) {
    if (!phone) return;
    setLoading(true);
    setError(null);

    if (isRegister) {
      // Nouveau compte → vérifier OTP → obtenir tempToken → définir PIN
      const result = await AuthService.verifyOtp(phone, code);
      setLoading(false);
      if (result.error || !result.data) {
        setError(result.error ?? t.auth.otpError);
        triggerShake();
        setTimeout(() => { setOtp(""); setError(null); clearError(); }, 700);
        return;
      }
      // Naviguer vers new-password avec le setupToken pour /auth/set-pin
      router.replace({
        pathname: "/(auth)/new-password",
        params: { phone, mode: "setpin", tempToken: result.data.setupToken },
      });
    } else {
      // Reset password → pas besoin d'appel API ici, on stocke le code OTP
      // Le reset-password endpoint prend directement {phone, otp, newPin}
      setLoading(false);
      router.replace({
        pathname: "/(auth)/new-password",
        params: { phone, mode: "reset", otpCode: code },
      });
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    setCountdown(RESEND_DELAY);
    setOtp("");
    setError(null);
    if (isRegister) {
      await AuthService.sendOtp(phone ?? "");
    } else {
      await AuthService.forgotPassword(phone ?? "");
    }
  }

  function pressKey(key: string) {
    if (loading || otp.length >= OTP_LENGTH) return;
    setOtp((p) => p + key);
  }

  function pressBackspace() {
    if (loading) return;
    setOtp((p) => p.slice(0, -1));
  }

  // ── Dots ──────────────────────────────────────────────────────────────────
  function renderDots() {
    return (
      <Animated.View
        style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}
      >
        {Array.from({ length: OTP_LENGTH }).map((_, i) => {
          const filled = i < otp.length;
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
      <BackButton style={styles.backBtn} disabled={loading} />

      {/* Icône */}
      <View style={styles.logoWrap}>
        <AppIcon
          icon={isRegister ? MessageCircle : ShieldCheck}
          size={64}
          color={colors.primary}
          strokeWidth={1.8}
        />
      </View>

      {/* Numéro */}
      <Text style={[styles.phoneLabel, { color: colors.textSecondary }]}>
        {phone}
      </Text>

      {/* Titre */}
      <Text style={[styles.title, { color: colors.text }]}>
        {isRegister ? t.auth.otpTitleRegister : t.auth.otpTitleReset}
      </Text>

      {/* Sous-titre */}
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {isRegister ? t.auth.otpSubtitleRegister : t.auth.otpSubtitleReset}
      </Text>

      {/* Indicateur dots */}
      <View style={styles.dotsContainer}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          renderDots()
        )}
      </View>

      {/* Message erreur ou hint */}
      {error ? (
        <Text style={[styles.hintText, { color: "#EF4444" }]}>{error}</Text>
      ) : (
        <Text style={[styles.hintText, { color: colors.textSecondary }]}>
          {t.auth.otpHint}
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

      {/* Renvoyer le code */}
      <TouchableOpacity
        style={styles.resendBtn}
        onPress={handleResend}
        disabled={countdown > 0 || loading}
      >
        <Text
          style={[
            styles.resendText,
            { color: countdown > 0 ? colors.textTertiary : colors.primary },
          ]}
        >
          {countdown > 0
            ? t.auth.otpResendTimer(countdown)
            : t.auth.otpResend}
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
  logoWrap: { marginTop: 16 },
  phoneLabel: { fontSize: 15, marginTop: 4 },
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
  resendBtn: { paddingVertical: 8 },
  resendText: { fontSize: 14, textDecorationLine: "underline" },
});
