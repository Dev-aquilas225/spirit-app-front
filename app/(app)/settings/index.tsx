import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Check, Moon, Settings, Smartphone, Sun } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { useThemeStore, ThemeMode } from '../../../src/store/theme.store';
import { ScreenWrapper } from '../../../src/components/common/ScreenWrapper';
import { Card } from '../../../src/components/common/Card';
import { BackButton } from '../../../src/components/common/BackButton';
import { AppIcon } from '../../../src/components/common/AppIcon';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'system', label: 'Auto', icon: Smartphone },
];

export default function SettingsScreen() {
  const { colors, spacing } = useTheme();
  const { mode, setMode } = useThemeStore();

  return (
    <ScreenWrapper scrollable padded>
      <BackButton style={{ marginBottom: 24 }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <AppIcon icon={Settings} size={22} color={colors.text} strokeWidth={2.4} />
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>Paramètres</Text>
      </View>

      <View style={{ gap: spacing.lg }}>

        {/* ── Apparence ─────────────────────────────────────── */}
        <View>
          <Text style={[styles.section, { color: colors.textSecondary }]}>APPARENCE</Text>
          <Card>
            <Text style={[styles.rowLabel, { color: colors.text, marginBottom: 12 }]}>
              Thème de l’application
            </Text>

            {/* Sélecteur 3 chips : Clair / Sombre / Auto */}
            <View style={styles.themeRow}>
              {THEME_OPTIONS.map((opt) => {
                const active = mode === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setMode(opt.value)}
                    activeOpacity={0.75}
                    style={[
                      styles.themeChip,
                      {
                        backgroundColor: active ? colors.primary : colors.surfaceSecondary,
                        borderColor:     active ? colors.primary : colors.border,
                        },
                    ]}
                  >
                    <View style={styles.themeIcon}>
                      <AppIcon icon={opt.icon} size={20} color={active ? '#fff' : colors.text} strokeWidth={2.4} />
                    </View>
                    <Text style={[styles.themeLabel, { color: active ? '#fff' : colors.text }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.hintRow}>
              <AppIcon
                icon={mode === 'system' ? Smartphone : mode === 'dark' ? Moon : Sun}
                size={14}
                color={colors.textSecondary}
                strokeWidth={2.6}
              />
              <Text style={[styles.hint, { color: colors.textSecondary, flex: 1 }]}>
                {mode === 'system'
                  ? "Suit automatiquement les préférences de votre appareil"
                  : mode === 'dark'
                  ? 'Mode sombre activé'
                  : 'Mode clair activé'}
              </Text>
            </View>
          </Card>
        </View>

        {/* ── Langue ────────────────────────────────────────── */}
        <View>
          <Text style={[styles.section, { color: colors.textSecondary }]}>LANGUE</Text>
          <Card>
            {['Français', 'English', 'العربية'].map((lang, i, arr) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.langRow,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                  },
                ]}
              >
                <Text style={{ color: colors.text }}>{lang}</Text>
                {lang === 'Français' && (
                  <AppIcon icon={Check} size={16} color={colors.primary} strokeWidth={3} />
                )}
              </TouchableOpacity>
            ))}
          </Card>
        </View>

        {/* ── Confidentialité ───────────────────────────────── */}
        <View>
          <Text style={[styles.section, { color: colors.textSecondary }]}>CONFIDENTIALITÉ</Text>
          <Card>
            <View style={styles.row}>
              <Text style={{ color: colors.text }}>Protection capture d’écran</Text>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Activée</Text>
            </View>
          </Card>
        </View>

      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  section: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  themeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 4,
  },
  themeIcon: {
    marginBottom: 2,
  },
  themeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
  },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
});
