import { router, useLocalSearchParams } from "expo-router";
import { AlertCircle } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppIcon } from "../../src/components/common/AppIcon";
import { AuthService } from "../../src/services/auth.service";
import { useAuthStore } from "../../src/store/auth.store";
import { useTheme } from "../../src/theme";

/**
 * Écran callback — gère deux cas :
 * 1. Magic link : /callback?token=<magic_token>
 *    → vérifie le token auprès du backend, récupère les JWT, connecte l'utilisateur
 * 2. OAuth deep link : /callback?accessToken=...&refreshToken=...
 *    → connecte directement avec les JWT reçus
 */
export default function AuthCallbackScreen() {
  const { colors } = useTheme();
  const { token, accessToken, refreshToken } = useLocalSearchParams<{
    token?: string;
    accessToken?: string;
    refreshToken?: string;
  }>();

  const loginWithTokens = useAuthStore((s) => s.loginWithTokens);
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    authenticate();
  }, []);

  async function authenticate() {
    // Cas 1 : magic link token
    if (token) {
      const result = await AuthService.verifyMagicLink(token);
      if (result.error || !result.data) {
        setErrorMsg(result.error ?? "Lien invalide ou expiré.");
        setStatus("error");
        return;
      }
      await finishLogin(result.data.accessToken, result.data.refreshToken);
      return;
    }

    // Cas 2 : JWT directs (OAuth)
    if (accessToken && refreshToken) {
      await finishLogin(accessToken, refreshToken);
      return;
    }

    setErrorMsg("Lien invalide. Veuillez redemander un lien de connexion.");
    setStatus("error");
  }

  async function finishLogin(at: string, rt: string) {
    const success = await loginWithTokens(at, rt);
    if (!success) {
      setErrorMsg("Connexion échouée. Veuillez redemander un lien de connexion.");
      setStatus("error");
      return;
    }
    const profileComplete = useAuthStore.getState().isProfileComplete;
    if (!profileComplete) {
      router.replace("/complete-profile");
    } else {
      router.replace("/dashboard");
    }
  }

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
      <AppIcon icon={AlertCircle} size={56} color="#EF4444" strokeWidth={1.8} />
      <Text style={[styles.errorTitle, { color: colors.text }]}>
        Connexion impossible
      </Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {errorMsg}
      </Text>
      <TouchableOpacity onPress={() => router.replace("/login")}>
        <Text style={[styles.link, { color: colors.primary }]}>
          Retour à l'écran de connexion
        </Text>
      </TouchableOpacity>
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
