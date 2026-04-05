import { router } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  Bell, Check, ChevronRight, CreditCard, Crown,
  FileText, Gift, Globe, LogOut, MessageCircle,
  Pencil, Settings, ShieldCheck, X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, Modal, Pressable, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { AppIcon } from "../../../../src/components/common/AppIcon";
import { Card } from "../../../../src/components/common/Card";
import { useAuth } from "../../../../src/hooks/useAuth";
import { usePremiumAccess } from "../../../../src/hooks/usePremiumAccess";
import { useSubscription } from "../../../../src/hooks/useSubscription";
import { useI18n } from "../../../../src/i18n";
import { useAuthStore } from "../../../../src/store/auth.store";
import { useTheme } from "../../../../src/theme";
import { Gender, Language } from "../../../../src/types/auth.types";

/* ─── Config genre (même palette que complete-profile) ─────────────────────── */

interface GenderCfg { bg: string; fg: string; emoji: string }
const GENDER_CFG: Record<Gender, GenderCfg> = {
  male:   { bg: '#DBEAFE', fg: '#1D4ED8', emoji: '👨' },
  female: { bg: '#FCE7F3', fg: '#BE185D', emoji: '👩' },
  other:  { bg: '#EDE9FE', fg: '#6D28D9', emoji: '🧑' },
};
const DEFAULT_CFG: GenderCfg = { bg: 'rgba(255,255,255,0.15)', fg: '#fff', emoji: '🧑' };

/* ─── Avatar header ─────────────────────────────────────────────────────────── */

function HeaderAvatar({ firstName = '', lastName = '', gender }: { firstName?: string; lastName?: string; gender?: Gender }) {
  const cfg = gender ? GENDER_CFG[gender] : DEFAULT_CFG;
  const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase();

  return (
    <View style={{ position: 'relative', marginBottom: 12 }}>
      <View style={[styles.avatarCircle, { backgroundColor: cfg.bg }]}>
        {initials ? (
          <Text style={[styles.avatarInitials, { color: cfg.fg }]}>{initials}</Text>
        ) : (
          <Text style={{ fontSize: 34 }}>{cfg.emoji}</Text>
        )}
      </View>
      {gender && (
        <View style={[styles.avatarBadge, { backgroundColor: cfg.fg }]}>
          <Text style={{ fontSize: 11 }}>{cfg.emoji}</Text>
        </View>
      )}
    </View>
  );
}

/* ─── MenuItem ──────────────────────────────────────────────────────────────── */

function MenuItem({ icon, label, onPress, badge, value, danger = false }: {
  icon: LucideIcon; label: string; onPress: () => void;
  badge?: string; value?: string; danger?: boolean;
}) {
  const { colors } = useTheme();
  const labelColor = danger ? '#EF4444' : colors.text;
  return (
    <TouchableOpacity onPress={onPress} style={[styles.menuItem, { borderBottomColor: colors.border }]}>
      <View style={{ marginRight: 14 }}>
        <AppIcon icon={icon} size={20} color={labelColor} strokeWidth={2.2} />
      </View>
      <Text style={[styles.menuLabel, { color: labelColor }]}>{label}</Text>
      {value && <Text style={[styles.menuValue, { color: colors.textSecondary }]}>{value}</Text>}
      {badge && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{badge}</Text>
        </View>
      )}
      <AppIcon icon={ChevronRight} size={18} color={colors.textTertiary} strokeWidth={2.2} />
    </TouchableOpacity>
  );
}

/* ─── Modal modifier le profil ──────────────────────────────────────────────── */

function EditProfileModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, spacing } = useTheme();
  const { user, updateUser, isLoading, clearError } = useAuth();
  const { t } = useI18n();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName,  setLastName]  = useState(user?.lastName  ?? '');
  const [gender,    setGender]    = useState<Gender | undefined>(user?.gender);

  async function handleSave() {
    clearError();
    const success = await updateUser({ firstName, lastName, gender });
    if (success) onClose();
  }

  const canSave = firstName.trim().length >= 2 && lastName.trim().length >= 2;

  const genderLabels: Record<Gender, string> = {
    male:   t.profile.male,
    female: t.profile.female,
    other:  t.profile.other,
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Titre */}
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>{t.profile.editModalTitle}</Text>
          <TouchableOpacity onPress={onClose}>
            <AppIcon icon={X} size={22} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.base, gap: 20 }} keyboardShouldPersistTaps="handled">
          {/* Aperçu avatar */}
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <HeaderAvatar firstName={firstName} lastName={lastName} gender={gender} />
          </View>

          {/* Prénom */}
          <View style={{ gap: 6 }}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>{t.profile.firstName}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t.profile.firstNamePh}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
            />
          </View>

          {/* Nom */}
          <View style={{ gap: 6 }}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>{t.profile.lastName}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={lastName}
              onChangeText={setLastName}
              placeholder={t.profile.lastNamePh}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
            />
          </View>

          {/* Genre */}
          <View style={{ gap: 8 }}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>{t.profile.genre}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(Object.entries(GENDER_CFG) as [Gender, GenderCfg][]).map(([val, cfg]) => {
                const selected = gender === val;
                return (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setGender(val)}
                    style={[
                      styles.genderCard,
                      {
                        backgroundColor: selected ? cfg.bg : colors.surface,
                        borderColor: selected ? cfg.fg : colors.border,
                        borderWidth: selected ? 2 : 1,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 24 }}>{cfg.emoji}</Text>
                    <Text style={[{ fontSize: 12, fontWeight: '600', color: selected ? cfg.fg : colors.textSecondary }]}>
                      {genderLabels[val]}
                    </Text>
                    {selected && (
                      <View style={[styles.genderCheck, { backgroundColor: cfg.fg }]}>
                        <AppIcon icon={Check} size={10} color="#fff" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Bouton */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave || isLoading}
            style={[styles.saveBtn, { backgroundColor: canSave ? '#C9A84C' : colors.border }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnLabel}>{t.common.save}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ─── Modal langue ──────────────────────────────────────────────────────────── */

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English',  flag: '🇬🇧' },
];

function LanguageModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const { t } = useI18n();
  const setLanguage = useAuthStore((s) => s.setLanguage);
  const [saving, setSaving] = useState(false);

  async function handleSelect(lang: Language) {
    setSaving(true);
    await setLanguage(lang);
    setSaving(false);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, styles.sheetShort, { backgroundColor: colors.background }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>{t.profile.langModalTitle}</Text>
          <TouchableOpacity onPress={onClose}>
            <AppIcon icon={X} size={22} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        <View style={{ padding: spacing.base, gap: 10 }}>
          {LANGUAGES.map((lang) => {
            const selected = user?.language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => handleSelect(lang.code)}
                disabled={saving}
                style={[
                  styles.langOption,
                  {
                    backgroundColor: selected ? colors.primary + '15' : colors.surface,
                    borderColor: selected ? colors.primary : colors.border,
                    borderWidth: selected ? 2 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 28 }}>{lang.flag}</Text>
                <Text style={[styles.langLabel, { color: colors.text }]}>{lang.label}</Text>
                {selected && (
                  <View style={[styles.langCheck, { backgroundColor: colors.primary }]}>
                    <AppIcon icon={Check} size={12} color="#fff" strokeWidth={3} />
                  </View>
                )}
                {saving && selected && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 'auto' }} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

/* ─── Écran principal ───────────────────────────────────────────────────────── */

export default function ProfileScreen() {
  const { colors, spacing } = useTheme();
  const { user, logout } = useAuth();
  const { isPremium } = usePremiumAccess();
  const { daysUntilExpiry } = useSubscription();
  const { t } = useI18n();

  const [editVisible, setEditVisible] = useState(false);
  const [langVisible, setLangVisible] = useState(false);

  const langLabel = LANGUAGES.find(l => l.code === user?.language)?.label ?? t.settings.french;

  const genderLabels: Record<Gender, string> = {
    male:   t.profile.male,
    female: t.profile.female,
    other:  t.profile.other,
  };

  function handleLogout() {
    Alert.alert(t.profile.logoutTitle, t.profile.logoutMsg, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.profile.logout, style: 'destructive',
        onPress: () => { logout(); router.replace('/(auth)/login'); },
      },
    ]);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.deepBlue ?? '#1A1A3E', paddingTop: 56 }]}>
        <HeaderAvatar firstName={user?.firstName} lastName={user?.lastName} gender={user?.gender} />

        <Text style={styles.name}>
          {user?.firstName && user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : user?.name ?? t.common.loading}
        </Text>
        <Text style={styles.phone}>{user?.phone}</Text>
        {user?.gender && (
          <Text style={styles.genderTag}>
            {GENDER_CFG[user.gender]?.emoji} {genderLabels[user.gender]}
          </Text>
        )}

        {isPremium ? (
          <View style={[styles.premiumBadge, { backgroundColor: 'rgba(201,168,76,0.3)', borderColor: '#C9A84C' }]}>
            <View style={styles.premiumRow}>
              <AppIcon icon={Crown} size={16} color="#C9A84C" strokeWidth={2.4} />
              <Text style={{ color: '#C9A84C', fontWeight: '700', fontSize: 13 }}>
                {t.profile.premiumBadge(daysUntilExpiry)}
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/(app)/subscription')}
            style={[styles.premiumBadge, { backgroundColor: 'rgba(201,168,76,0.2)', borderColor: '#C9A84C' }]}
          >
            <View style={styles.premiumRow}>
              <AppIcon icon={Crown} size={16} color="#C9A84C" strokeWidth={2.4} />
              <Text style={{ color: '#C9A84C', fontWeight: '600', fontSize: 13 }}>{t.profile.upgradeBadge}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ padding: spacing.base, gap: spacing.md }}>
        {/* Mon compte */}
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.profile.sectionAccount}</Text>
          <Card padding="none">
            <MenuItem icon={Pencil}  label={t.profile.editProfile}    onPress={() => setEditVisible(true)} />
            <MenuItem icon={Bell}    label={t.profile.notifications}  onPress={() => router.push('/(app)/notifications')} />
            <MenuItem
              icon={Globe}
              label={t.profile.language}
              value={langLabel}
              onPress={() => setLangVisible(true)}
            />
          </Card>
        </View>

        {/* Abonnement */}
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.profile.sectionSubscription}</Text>
          <Card padding="none">
            {!isPremium && (
              <MenuItem icon={Crown}   label={t.profile.subscribeCta} onPress={() => router.push('/(app)/subscription')} badge={t.common.premium.toUpperCase()} />
            )}
            {isPremium && (
              <MenuItem icon={Settings} label={t.profile.manageSubscription} onPress={() => router.push('/(app)/subscription/manage')} />
            )}
            <MenuItem icon={CreditCard} label={t.profile.paymentHistory} onPress={() => router.push('/(app)/subscription/history')} />
          </Card>
        </View>

        {/* Communauté */}
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.profile.sectionCommunity}</Text>
          <Card padding="none">
            <MenuItem icon={Gift}          label={t.profile.referral} onPress={() => router.push('/(app)/referral')} />
            <MenuItem icon={MessageCircle} label={t.profile.support}  onPress={() => router.push('/(app)/support')} />
          </Card>
        </View>

        {/* Légal */}
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.profile.sectionLegal}</Text>
          <Card padding="none">
            <MenuItem icon={FileText}    label={t.profile.terms}   onPress={() => router.push('/(app)/legal/terms')} />
            <MenuItem icon={ShieldCheck} label={t.profile.privacy} onPress={() => router.push('/(app)/legal/privacy')} />
          </Card>
        </View>

        {/* Déconnexion */}
        <Card padding="none">
          <MenuItem icon={LogOut} label={t.profile.logout} onPress={handleLogout} danger />
        </Card>

        <Text style={[styles.version, { color: colors.textTertiary }]}>{t.profile.version}</Text>
      </View>

      {/* Modals */}
      <EditProfileModal visible={editVisible} onClose={() => setEditVisible(false)} />
      <LanguageModal    visible={langVisible} onClose={() => setLangVisible(false)} />
    </ScrollView>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingBottom: 32, paddingHorizontal: 16 },

  avatarCircle: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 34, fontWeight: '700' },
  avatarBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#1A1A3E',
  },

  name: { fontSize: 22, fontWeight: '800', color: '#fff' },
  phone: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  genderTag: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3 },

  premiumBadge: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  premiumRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },

  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  menuLabel: { fontSize: 15, flex: 1 },
  menuValue: { fontSize: 13, marginRight: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginRight: 8 },

  version: { textAlign: 'center', fontSize: 12, paddingBottom: 16 },

  /* Bottom sheets */
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', overflow: 'hidden' },
  sheetShort: { maxHeight: '50%' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  sheetTitle: { fontSize: 17, fontWeight: '700' },

  /* Edit form */
  inputLabel: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },

  genderCard: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', gap: 4, position: 'relative' },
  genderCheck: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

  saveBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  saveBtnLabel: { fontSize: 15, fontWeight: '800', color: '#fff' },

  /* Language */
  langOption: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14 },
  langLabel: { fontSize: 16, fontWeight: '600', flex: 1 },
  langCheck: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
