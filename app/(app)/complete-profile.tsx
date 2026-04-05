import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { User, Users } from 'lucide-react-native';
import { useTheme } from '../../src/theme';
import { useAuthStore } from '../../src/store/auth.store';
import { useI18n } from '../../src/i18n';
import { Gender } from '../../src/types/auth.types';
import { AppIcon } from '../../src/components/common/AppIcon';

/* ─── Config genre ──────────────────────────────────────────────────────────── */

interface GenderOption {
  value: Gender;
  emoji: string;
  /** Couleur de fond de l'avatar */
  bg: string;
  /** Couleur de l'icône */
  fg: string;
}

const GENDER_OPTIONS: GenderOption[] = [
  { value: 'male',   emoji: '👨', bg: '#DBEAFE', fg: '#1D4ED8' },
  { value: 'female', emoji: '👩', bg: '#FCE7F3', fg: '#BE185D' },
  { value: 'other',  emoji: '🧑', bg: '#EDE9FE', fg: '#6D28D9' },
];

function getGenderOption(gender: Gender | null): GenderOption {
  return GENDER_OPTIONS.find(g => g.value === gender) ?? GENDER_OPTIONS[2];
}

/* ─── Aperçu avatar ─────────────────────────────────────────────────────────── */

function AvatarPreview({
  firstName,
  lastName,
  gender,
}: {
  firstName: string;
  lastName: string;
  gender: Gender | null;
}) {
  const opt = getGenderOption(gender);
  const initials =
    [firstName.trim()[0], lastName.trim()[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase() || '?';

  return (
    <View style={styles.avatarWrap}>
      <View style={[styles.avatarCircle, { backgroundColor: opt.bg }]}>
        {initials !== '?' ? (
          <Text style={[styles.avatarInitials, { color: opt.fg }]}>{initials}</Text>
        ) : (
          <Text style={styles.avatarEmoji}>{opt.emoji}</Text>
        )}
      </View>
      {/* Badge genre */}
      {gender && (
        <View style={[styles.avatarBadge, { backgroundColor: opt.fg }]}>
          <Text style={{ fontSize: 12 }}>{opt.emoji}</Text>
        </View>
      )}
    </View>
  );
}

/* ─── Écran ─────────────────────────────────────────────────────────────────── */

export default function CompleteProfileScreen() {
  const { colors, spacing } = useTheme();
  const { completeProfile, isLoading, error, clearError } = useAuthStore();
  const { t } = useI18n();

  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [gender,    setGender]    = useState<Gender | null>(null);

  const canSubmit = firstName.trim().length >= 2 && lastName.trim().length >= 2 && gender !== null;

  async function handleSubmit() {
    if (!canSubmit || !gender) return;
    clearError();
    const success = await completeProfile(firstName.trim(), lastName.trim(), gender);
    if (success) {
      router.replace('/(app)/(tabs)/home');
    }
  }

  const genderLabels: Record<Gender, string> = {
    male:   t.completeProfile.male,
    female: t.completeProfile.female,
    other:  t.completeProfile.other,
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* En-tête */}
      <View style={[styles.header, { backgroundColor: colors.deepBlue ?? '#1A1A3E' }]}>
        <Text style={styles.headerTitle}>{t.completeProfile.welcome}</Text>
        <Text style={styles.headerSubtitle}>
          {t.completeProfile.subtitle}
        </Text>
      </View>

      <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.xl, gap: spacing.lg }}>
        {/* Avatar preview */}
        <View style={{ alignItems: 'center', marginBottom: spacing.sm }}>
          <AvatarPreview firstName={firstName} lastName={lastName} gender={gender} />
          <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
            {t.completeProfile.avatarHint}
          </Text>
        </View>

        {/* Prénom */}
        <View>
          <Text style={[styles.label, { color: colors.text }]}>{t.completeProfile.firstName} *</Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
            }]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t.completeProfile.firstNamePh}
            placeholderTextColor={colors.textTertiary ?? colors.textSecondary}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>

        {/* Nom */}
        <View>
          <Text style={[styles.label, { color: colors.text }]}>{t.completeProfile.lastName} *</Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
            }]}
            value={lastName}
            onChangeText={setLastName}
            placeholder={t.completeProfile.lastNamePh}
            placeholderTextColor={colors.textTertiary ?? colors.textSecondary}
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>

        {/* Genre */}
        <View>
          <Text style={[styles.label, { color: colors.text }]}>{t.completeProfile.gender} *</Text>
          <View style={styles.genderRow}>
            {GENDER_OPTIONS.map((opt) => {
              const selected = gender === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setGender(opt.value)}
                  style={[
                    styles.genderCard,
                    {
                      backgroundColor: selected ? opt.bg : colors.surface,
                      borderColor: selected ? opt.fg : colors.border,
                      borderWidth: selected ? 2 : 1,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text style={styles.genderEmoji}>{opt.emoji}</Text>
                  <Text style={[
                    styles.genderLabel,
                    { color: selected ? opt.fg : colors.textSecondary },
                  ]}>
                    {genderLabels[opt.value]}
                  </Text>
                  {selected && (
                    <View style={[styles.genderCheck, { backgroundColor: opt.fg }]}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Erreur */}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: '#FEE2E2' }]}>
            <Text style={{ color: '#DC2626', fontSize: 13, textAlign: 'center' }}>{error}</Text>
          </View>
        )}

        {/* Bouton */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSubmit || isLoading}
          style={[
            styles.submitBtn,
            {
              backgroundColor: canSubmit ? '#C9A84C' : colors.border,
              opacity: isLoading ? 0.7 : 1,
            },
          ]}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnLabel}>{t.common.continue}</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.mandatory, { color: colors.textSecondary }]}>
          * {t.common.required}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingBottom: 48 },

  header: {
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerSubtitle: {
    fontSize: 14, color: 'rgba(255,255,255,0.65)',
    textAlign: 'center', lineHeight: 22,
  },

  /* Avatar */
  avatarWrap: { position: 'relative', width: 96, height: 96, marginBottom: 4 },
  avatarCircle: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 36, fontWeight: '700' },
  avatarEmoji: { fontSize: 40 },
  avatarBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarHint: { fontSize: 12, marginTop: 6 },

  /* Form */
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16,
  },

  /* Genre */
  genderRow: { flexDirection: 'row', gap: 10 },
  genderCard: {
    flex: 1, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', gap: 6,
    position: 'relative',
  },
  genderEmoji: { fontSize: 28 },
  genderLabel: { fontSize: 13, fontWeight: '600' },
  genderCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Submit */
  submitBtn: {
    height: 54, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnLabel: { fontSize: 16, fontWeight: '800', color: '#fff' },

  errorBanner: { padding: 12, borderRadius: 8 },
  mandatory: { fontSize: 12, textAlign: 'center' },
});
