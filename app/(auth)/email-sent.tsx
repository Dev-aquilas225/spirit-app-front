import { router, useLocalSearchParams } from "expo-router";
import { Mail, RefreshCw } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppIcon } from "../../src/components/common/AppIcon";
import { BackButton } from "../../src/components/common/BackButton";
import { AuthService } from "../../src/services/auth.service";
import { useTheme } from "../../src/theme";

const RESEND_DELAY = 60;

export default function EmailSentScreen() {
  const { colors, spacing } = useTheme();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [countdown, setCountdown] = useState(RESEND_DELAY);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((p) => p - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  async function handleResend() {
    if (countdown > 0 || resending || !email) return;
    setResending(true);
    setResendError(null);
    setResendSuccess(false);

    const result = await AuthService.sendMagicLink(email);
    setResending(false);

    if (result.error) {
      setResendError(result.error);
    } else {
      setResendSuccess(true);
      setCountdown(RESEND_DELAY);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <BackButton style={styles.backBtn} />

      {/* Icône */}
      <View style={styles.iconWrap}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.primary + "18" },
          ]}
        >
          <AppIcon
            icon={Mail}
            size={48}
            color={colors.primary}
            strokeWidth={1.6}
          />
        </View>
      </View>

      {/* Titre */}
      <Text style={[styles.title, { color: colors.text }]}>
        Vérifiez votre email
      </Text>

      {/* Sous-titre */}
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Nous avons envoyé un lien de connexion à
      </Text>
      <Text style={[styles.email, { color: colors.primary }]}>
        {email}
      </Text>
      <Text
        style={[styles.hint, { color: colors.textSecondary, marginTop: 16 }]}
      >
        Cliquez sur le lien dans l'email pour vous connecter automatiquement.
        Le lien est valable 15 minutes.
      </Text>

      {/* Feedback renvoyer */}
      {resendSuccess && (
        <Text style={[styles.successText, { color: "#22c55e" }]}>
          Nouveau lien envoyé !
        </Text>
      )}
      {resendError && (
        <Text style={[styles.errorText, { color: "#EF4444" }]}>
          {resendError}
        </Text>
      )}

      {/* Bouton renvoyer */}
      <TouchableOpacity
        style={[
          styles.resendBtn,
          {
            backgroundColor:
              countdown > 0 ? colors.surfaceSecondary : colors.primary + "18",
            borderRadius: 12,
          },
        ]}
        onPress={handleResend}
        disabled={countdown > 0 || resending}
        activeOpacity={0.7}
      >
        <AppIcon
          icon={RefreshCw}
          size={16}
          color={countdown > 0 ? colors.textTertiary : colors.primary}
          strokeWidth={2.4}
        />
        <Text
          style={[
            styles.resendText,
            { color: countdown > 0 ? colors.textTertiary : colors.primary },
          ]}
        >
          {resending
            ? "Envoi en cours…"
            : countdown > 0
            ? `Renvoyer dans ${countdown}s`
            : "Renvoyer le lien"}
        </Text>
      </TouchableOpacity>

      {/* Changer d'email */}
      <TouchableOpacity
        style={styles.changeEmailBtn}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Text style={[styles.changeEmailText, { color: colors.textSecondary }]}>
          Changer d'adresse email
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  backBtn: { alignSelf: "flex-start", marginBottom: 16 },
  iconWrap: { marginTop: 32, marginBottom: 28 },
  iconCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 12 },
  subtitle: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  email: { fontSize: 16, fontWeight: "700", textAlign: "center", marginTop: 4 },
  hint: { fontSize: 13, textAlign: "center", lineHeight: 20, paddingHorizontal: 8 },
  successText: { fontSize: 14, fontWeight: "600", marginTop: 16 },
  errorText: { fontSize: 13, marginTop: 12, textAlign: "center" },
  resendBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 32,
  },
  resendText: { fontSize: 15, fontWeight: "600" },
  changeEmailBtn: { marginTop: 20, paddingVertical: 8 },
  changeEmailText: { fontSize: 14, textDecorationLine: "underline" },
});
