import { router, useLocalSearchParams } from "expo-router";
import { AlertCircle, CheckCircle } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "../../src/components/common/AppIcon";
import { useAuthStore } from "../../src/store/auth.store";
import { useTheme } from "../../src/theme";

/**
 * Écran callback — intercepte le deep link spiritapp://auth/callback
 * avec les tokens en paramètres et connecte l'utilisateur.
 */
export default function AuthCallbackScreen() {
  const { colors } = useTheme();
  const { accessToken, refreshToken } = useLocalSearchParams<{
    accessToken: string;
    refreshToken: string;
  }>();

  const loginWithTokens = useAuthStore((s) => s.loginWithTokens);
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    async function authenticate() {
      if (!accessToken || !refreshToken) {
        setErrorMsg("Lien invalide. Veuillez redemander un lien de connexion.");
        setStatus("error");
        return;
      }

      const success = await loginWithTokens(accessToken, refreshToken);
      if (success) {
        router.replace("/(tabs)");
      } else {
        setErrorMsg("Connexion échouée. Veuillez redemander un lien de connexion.");
        setStatus("error");
      }
    }

    authenticate();
  }, [accessToken, refreshToken]);

  if (status === "loading") {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          Connexion en cours…
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppIcon
        icon={AlertCircle}
        size={56}
        color="#EF4444"
        strokeWidth={1.8}
      />
      <Text style={[styles.errorTitle, { color: colors.text }]}>
        Connexion impossible
      </Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {errorMsg}
      </Text>
      <Text
        style={[styles.link, { color: colors.primary }]}
        onPress={() => router.replace("/(auth)/login")}
      >
        Retour à l'écran de connexion
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  message: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  errorTitle: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  link: { fontSize: 14, textDecorationLine: "underline", marginTop: 8 },
});
