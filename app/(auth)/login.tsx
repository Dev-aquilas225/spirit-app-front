import { router } from "expo-router";
import { ArrowRight, Lock, Mail, MessageCircle } from "lucide-react-native";
import React, { useState } from "react";
import { AuthService } from "../../src/services/auth.service";
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

export default function LoginScreen() {
  const { colors, spacing, borderRadius: br } = useTheme();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

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
          Entrez votre email pour recevoir un lien de connexion
        </Text>

        {/* Champ email */}
        <View style={{ marginTop: spacing["2xl"] }}>
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
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
          </View>

          {emailError && (
            <Text style={[styles.errorText, { marginTop: 4 }]}>
              {emailError}
            </Text>
          )}
        </View>

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
          style={{ marginTop: spacing.lg }}
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
              Un lien sécurisé vous sera envoyé par email. Aucun mot de passe requis.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
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
