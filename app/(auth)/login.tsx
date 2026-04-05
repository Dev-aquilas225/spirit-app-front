import { router } from "expo-router";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Lock,
  MessageCircle,
  Phone,
  Search,
  X,
} from "lucide-react-native";
import React, { useRef, useState } from "react";
import { AuthService } from "../../src/services/auth.service";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AppIcon } from "../../src/components/common/AppIcon";
import { Button } from "../../src/components/common/Button";
import { useI18n } from "../../src/i18n";
import { useTheme } from "../../src/theme";
import { COUNTRIES } from "../../src/utils/constants";

type Country = (typeof COUNTRIES)[number];

const DEFAULT_COUNTRY = COUNTRIES[0]; // Côte d'Ivoire

function getCountryDisplayName(code: string, fallback: string, language: string) {
  try {
    return (
      new Intl.DisplayNames([language], { type: "region" }).of(code) ??
      fallback
    );
  } catch {
    return fallback;
  }
}

export default function LoginScreen() {
  const { colors, spacing, borderRadius: br } = useTheme();
  const { t, language } = useI18n();

  const [selectedCountry, setSelectedCountry] =
    useState<Country>(DEFAULT_COUNTRY);
  const [localNumber, setLocalNumber] = useState("");
  const [phoneError, setPhoneError] = useState<string | undefined>(undefined);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [checking, setChecking] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const fullPhone = selectedCountry.dialCode + localNumber.replace(/\s/g, "");

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      getCountryDisplayName(c.code, c.name, language)
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      c.dialCode.includes(search),
  );

  async function handleContinue() {
    const cleaned = localNumber.replace(/\s/g, "");
    if (!cleaned || cleaned.length < 6) {
      setPhoneError(t.auth.phoneInvalid);
      return;
    }
    setPhoneError(undefined);
    setChecking(true);
    // POST /auth/register → 201 = nouveau compte (OTP envoyé), 409 = existant
    const result = await AuthService.register(fullPhone);
    setChecking(false);

    if (result.error && !result.isNew) {
      setPhoneError(result.error);
      return;
    }

    if (result.isNew) {
      // Nouveau compte → OTP envoyé → écran vérification
      router.push({ pathname: "/(auth)/otp", params: { phone: fullPhone, mode: "register" } });
    } else {
      // Compte existant (409) → écran PIN
      router.push({ pathname: "/(auth)/pin", params: { phone: fullPhone } });
    }
  }

  function selectCountry(country: Country) {
    setSelectedCountry(country);
    setSearch("");
    setPickerVisible(false);
    setTimeout(() => inputRef.current?.focus(), 150);
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

        <Text style={[styles.title, { color: colors.text }]}>{t.auth.welcome}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t.auth.loginSubtitle}
        </Text>

        {/* ── Champ téléphone avec indicatif ── */}
        <View style={{ marginTop: spacing["2xl"] }}>
          <Text
            style={[
              styles.label,
              { color: colors.textSecondary, marginBottom: spacing.xs },
            ]}
          >
            {t.auth.phoneLabel}
          </Text>

          <View
            style={[
              styles.phoneRow,
              {
                borderColor: phoneError ? "#EF4444" : colors.border,
                backgroundColor: colors.surface,
                borderRadius: br.md,
              },
            ]}
          >
            {/* Sélecteur d'indicatif */}
            <TouchableOpacity
              style={[styles.dialSelector, { borderRightColor: colors.border }]}
              onPress={() => setPickerVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.flagText}>{selectedCountry.flag}</Text>
              <Text style={[styles.dialCode, { color: colors.text }]}>
                {selectedCountry.dialCode}
              </Text>
              <AppIcon
                icon={ChevronDown}
                size={16}
                color={colors.textSecondary}
                strokeWidth={2.8}
              />
            </TouchableOpacity>

            {/* Champ numéro local */}
            <TextInput
              ref={inputRef}
              style={[styles.numberInput, { color: colors.text }]}
              placeholder={t.auth.phonePlaceholder}
              placeholderTextColor={colors.textTertiary}
              value={localNumber}
              onChangeText={(v) => {
                setLocalNumber(v);
                if (phoneError) setPhoneError(undefined);
              }}
              keyboardType="phone-pad"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
          </View>

          {phoneError && (
            <Text style={[styles.errorText, { marginTop: 4 }]}>
              {phoneError}
            </Text>
          )}

          {/* Numéro complet en aperçu */}
          {localNumber.length > 0 && (
            <View style={styles.previewRow}>
              <AppIcon
                icon={Phone}
                size={14}
                color={colors.textSecondary}
                strokeWidth={2.4}
              />
              <Text
                style={[styles.previewPhone, { color: colors.textSecondary }]}
              >
                {fullPhone}
              </Text>
            </View>
          )}
        </View>

        <Button
          label={t.auth.continue}
          variant="gold"
          fullWidth
          size="lg"
          loading={checking}
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
              {t.auth.loginInfoNew}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Modal sélecteur de pays ── */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        />
        <SafeAreaView
          style={[styles.modalSheet, { backgroundColor: colors.surface }]}
        >
          {/* Barre de titre */}
          <View
            style={[styles.sheetHeader, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {t.auth.pickDialCode}
            </Text>
            <TouchableOpacity onPress={() => setPickerVisible(false)}>
              <AppIcon
                icon={X}
                size={18}
                color={colors.primary}
                strokeWidth={2.6}
              />
            </TouchableOpacity>
          </View>

          {/* Barre de recherche */}
          <View
            style={[
              styles.searchRow,
              { backgroundColor: colors.surfaceSecondary, borderRadius: 10 },
            ]}
          >
            <AppIcon
              icon={Search}
              size={16}
              color={colors.textSecondary}
              strokeWidth={2.6}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t.auth.searchCountry}
              placeholderTextColor={colors.textTertiary}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
          </View>

          {/* Liste des pays */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.countryRow,
                  item.code === selectedCountry.code && {
                    backgroundColor: colors.primary + "18",
                  },
                ]}
                onPress={() => selectCountry(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <Text style={[styles.countryName, { color: colors.text }]}>
                  {getCountryDisplayName(item.code, item.name, language)}
                </Text>
                <Text
                  style={[styles.countryDial, { color: colors.textSecondary }]}
                >
                  {item.dialCode}
                </Text>
                {item.code === selectedCountry.code && (
                  <AppIcon
                    icon={Check}
                    size={18}
                    color={colors.primary}
                    strokeWidth={3}
                  />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  height: 1,
                  backgroundColor: colors.border + "44",
                  marginHorizontal: 16,
                }}
              />
            )}
            keyboardShouldPersistTaps="handled"
          />
        </SafeAreaView>
      </Modal>
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

  // Champ téléphone
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    overflow: "hidden",
  },
  dialSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 4,
    borderRightWidth: 1.5,
  },
  flagText: { fontSize: 22 },
  dialCode: { fontSize: 15, fontWeight: "600" },
  numberInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  errorText: { fontSize: 12, color: "#EF4444" },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 6,
  },
  previewPhone: { fontSize: 12 },

  infoCard: { padding: 16, marginTop: 24 },
  infoText: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000044",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: 17, fontWeight: "700" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  countryFlag: { fontSize: 24 },
  countryName: { flex: 1, fontSize: 15 },
  countryDial: { fontSize: 14, fontWeight: "600" },
});
