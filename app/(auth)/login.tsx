import { router } from "expo-router";
import { ArrowRight, Lock, Mail, MessageCircle } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { AuthService } from "../../src/services/auth.service";
import { useAuthStore, isUserProfileComplete } from "../../src/store/auth.store";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppIcon } from "../../src/components/common/AppIcon";
import { Button } from "../../src/components/common/Button";
import { useI18n } from "../../src/i18n";
import { useTheme } from "../../src/theme";

// Requis pour que le popup Google se ferme correctement sur web/native
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { colors, spacing, borderRadius: br } = useTheme();
  const { t } = useI18n();
  const loginWithTokens = useAuthStore((s) => s.loginWithTokens);

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId:     process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
    iosClientId:     process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const idToken = response.params?.id_token ?? (response.authentication as any)?.idToken;
      if (idToken) {
        handleGoogleToken(idToken);
      } else {
        setEmailError("Impossible de récupérer le token Google");
        setGoogleLoading(false);
      }
    } else if (response?.type === "error") {
      setEmailError(response.error?.message ?? "Erreur Google OAuth");
      setGoogleLoading(false);
    } else if (response?.type === "dismiss" || response?.type === "cancel") {
      setGoogleLoading(false);
    }
  }, [response]);

  async function handleGoogleToken(idToken: string) {
    setGoogleLoading(true);
    const result = await AuthService.googleSignIn(idToken);

    if (result.error || !result.data) {
      setGoogleLoading(false);
      setEmailError(result.error ?? "Erreur de connexion Google");
      return;
    }

    // Met à jour le store Zustand et récupère le profil complet
    const ok = await loginWithTokens(result.data.accessToken, result.data.refreshToken);
    setGoogleLoading(false);

    if (!ok) {
      setEmailError("Erreur lors de la connexion");
      return;
    }

    // Rediriger : si profil incomplet → compléter, sinon → app
    if (!isUserProfileComplete(result.data.user)) {
      router.replace("/(app)/complete-profile");
    } else {
      router.replace("/(app)/(tabs)/home");
    }
  }

  async function handleGooglePress() {
    setEmailError(undefined);
    setGoogleLoading(true);
    await promptAsync();
    // Le reste est géré dans le useEffect sur `response`
  }

  // ── Magic link ────────────────────────────────────────────────────────────
  function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  async function handleContinue() {
    const cleaned = email.trim().toLowerCase();
    if (!cleaned || !isValidEmail(cleaned)) {
      setEmailError("Adresse email invalide");
      return;
    }
    setEmailError(undefined);
    setLoading(true);
    const result = await AuthService.sendMagicLink(cleaned);
    setLoading(false);

    if (result.error) {
      setEmailError(result.error);
      return;
    }

    router.push({ pathname: "/(auth)/email-sent", params: { email: cleaned } });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { padding: spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <AppIcon
            icon={MessageCircle}
            size={64}
            color={colors.primary}
            strokeWidth={1.8}
          />
          <Text style={[styles.appName, { color: colors.primary }]}>
            Oracle Plus
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {t.auth.welcome}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Connectez-vous ou créez votre compte
        </Text>

        {/* ── Bouton Google ─────────────────────────────────────────────── */}
        <View style={{ marginTop: spacing["2xl"] }}>
          <Button
            label={googleLoading ? "Connexion en cours…" : "Continuer avec Google"}
            variant="outline"
            fullWidth
            size="lg"
            loading={googleLoading}
            disabled={!request || googleLoading}
            onPress={handleGooglePress}
            icon={
              !googleLoading ? (
                // Logo Google (SVG inline via React.createElement pour compatibilité RN Web)
                <GoogleLogo />
              ) : undefined
            }
            iconPosition="left"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}
            textStyle={{ color: colors.text }}
          />
        </View>

        {/* ── Séparateur ────────────────────────────────────────────────── */}
        <View style={[styles.separator, { marginVertical: spacing.lg }]}>
          <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.separatorText, { color: colors.textTertiary, backgroundColor: colors.background }]}>
            ou
          </Text>
          <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
        </View>

        {/* ── Champ email (magic link) ───────────────────────────────────── */}
        <Text
          style={[
            styles.label,
            { color: colors.textSecondary, marginBottom: spacing.xs },
          ]}
        >
          Adresse email
        </Text>

        <View
          style={[
            styles.inputRow,
            {
              borderColor: emailError ? "#EF4444" : colors.border,
              backgroundColor: colors.surface,
              borderRadius: br.md,
            },
          ]}
        >
          <AppIcon
            icon={Mail}
            size={18}
            color={colors.textSecondary}
            strokeWidth={2.2}
            style={{ marginLeft: 14 }}
          />
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="vous@exemple.com"
            placeholderTextColor={colors.textTertiary}
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (emailError) setEmailError(undefined);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />
        </View>

        {emailError && (
          <Text style={[styles.errorText, { marginTop: 4 }]}>
            {emailError}
          </Text>
        )}

        <Button
          label={t.auth.continue}
          variant="gold"
          fullWidth
          size="lg"
          loading={loading}
          onPress={handleContinue}
          icon={
            <AppIcon
              icon={ArrowRight}
              size={18}
              color="#fff"
              strokeWidth={2.6}
            />
          }
          iconPosition="right"
          style={{ marginTop: spacing.md }}
        />

        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.surfaceSecondary, borderRadius: 12 },
          ]}
        >
          <View style={styles.infoRow}>
            <AppIcon
              icon={Lock}
              size={16}
              color={colors.textSecondary}
              strokeWidth={2.6}
            />
            <Text
              style={[
                styles.infoText,
                { color: colors.textSecondary, flex: 1 },
              ]}
            >
              Connexion sécurisée. Aucun mot de passe requis.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Logo Google en SVG — compatible React Native Web + native via react-native-svg */
function GoogleLogo() {
  if (Platform.OS === "web") {
    return React.createElement(
      "svg" as any,
      { width: 20, height: 20, viewBox: "0 0 48 48" },
      React.createElement("path", {
        fill: "#FFC107",
        d: "M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z",
      }),
      React.createElement("path", {
        fill: "#FF3D00",
        d: "M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z",
      }),
      React.createElement("path", {
        fill: "#4CAF50",
        d: "M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-8L6.2 33.3C9.5 39.6 16.2 44 24 44z",
      }),
      React.createElement("path", {
        fill: "#1976D2",
        d: "M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.3 4.2-4.3 5.6l6.2 5.2C41.3 35.4 44 30 44 24c0-1.3-.1-2.6-.4-3.9z",
      }),
    );
  }

  // Native : SVG via react-native-svg si disponible, sinon texte "G"
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Svg, Path } = require("react-native-svg");
    return (
      <Svg width={20} height={20} viewBox="0 0 48 48">
        <Path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
        <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <Path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-8L6.2 33.3C9.5 39.6 16.2 44 24 44z" />
        <Path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.3 4.2-4.3 5.6l6.2 5.2C41.3 35.4 44 30 44 24c0-1.3-.1-2.6-.4-3.9z" />
      </Svg>
    );
  } catch {
    return (
      <Text style={{ fontSize: 18, fontWeight: "bold", color: "#4285F4" }}>G</Text>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 24,
  },
  appName: { fontSize: 22, fontWeight: "800", marginTop: 4 },
  title: { fontSize: 28, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 15, textAlign: "center", marginTop: 8, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: "500" },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  separatorLine: { flex: 1, height: 1 },
  separatorText: {
    fontSize: 13,
    paddingHorizontal: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    overflow: "hidden",
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  errorText: { fontSize: 12, color: "#EF4444" },
  infoCard: { padding: 16, marginTop: 24 },
  infoText: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
});
