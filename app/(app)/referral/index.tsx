import { useSafeAreaInsets } from 'react-native-safe-area-context';
/**
 * Parrainage Oracle Plus
 * Parrain + filleul gagnent chacun 200 crédits à l'inscription du filleul.
 */
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Share, StyleSheet, Text, TouchableOpacity, View, FlatList, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Copy, Gift, Share2, Users, Zap, CheckCircle } from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { BackButton } from '../../../src/components/common/BackButton';
import { useTheme } from '../../../src/theme';
import { useAuth } from '../../../src/hooks/useAuth';
import { ReferralsService, Referral } from '../../../src/services/referrals.service';
import { useCreditsStore } from '../../../src/store/credits.store';

const REFERRAL_BONUS = 200; // crédits offerts aux deux

export default function ReferralScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const credits = useCreditsStore((s) => s.credits);

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const appUrl = process.env.EXPO_PUBLIC_APP_URL ?? 'https://oracle-plus.online';

  useEffect(() => {
    (async () => {
      const data = await ReferralsService.getMine();
      if (data) {
        setCode(data.referralCode);
        setReferrals(data.referrals ?? []);
      } else {
        setCode(user?.referralCode ?? '');
      }
      setLoading(false);
    })();
  }, []);

  const handleCopy = async () => {
    if (!code) return;
    if (Platform.OS === 'web' && navigator?.clipboard) {
      await navigator.clipboard.writeText(code);
    } else {
      await Share.share({ message: code });
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    const msg = `🔮 Oracle Plus — Guide spirituel africain\n\nUtilise mon code de parrainage *${code}* et reçois 200 crédits offerts à l'inscription !\n\n👉 ${appUrl}`;
    await Share.share({ message: msg });
  };

  const totalEarned = referrals.length * REFERRAL_BONUS;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: '#1A1A3E' }]}>
        <View style={s.deco1} /><View style={s.deco2} />
        <View style={s.headerRow}>
          <BackButton variant="dark" fallback="/home" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={s.headerTitle}>Parrainage</Text>
            <Text style={s.headerSub}>Invitez et gagnez ensemble</Text>
          </View>
          <AppIcon icon={Gift} size={28} color="#C9A84C" strokeWidth={1.8} />
        </View>
      </View>

      <FlatList
        data={referrals}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, gap: 16 }}
        ListHeaderComponent={() => (
          <>
            {/* Bonus card */}
            <View style={[s.bonusCard, { backgroundColor: '#1A1A3E' }]}>
              <View style={s.bonusRow}>
                <View style={s.bonusIcon}>
                  <AppIcon icon={Zap} size={24} color="#C9A84C" strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.bonusTitle}>+{REFERRAL_BONUS} crédits chacun</Text>
                  <Text style={s.bonusSub}>Vous et votre filleul recevez {REFERRAL_BONUS} crédits dès son inscription</Text>
                </View>
              </View>
              <View style={s.bonusStats}>
                <View style={s.bonusStat}>
                  <Text style={s.bonusStatValue}>{referrals.length}</Text>
                  <Text style={s.bonusStatLabel}>Filleuls</Text>
                </View>
                <View style={s.bonusStatDivider} />
                <View style={s.bonusStat}>
                  <Text style={s.bonusStatValue}>{totalEarned.toLocaleString()}</Text>
                  <Text style={s.bonusStatLabel}>Crédits gagnés</Text>
                </View>
                <View style={s.bonusStatDivider} />
                <View style={s.bonusStat}>
                  <Text style={s.bonusStatValue}>{credits.toLocaleString()}</Text>
                  <Text style={s.bonusStatLabel}>Solde actuel</Text>
                </View>
              </View>
            </View>

            {/* Code */}
            <View style={[s.codeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.codeLabel, { color: colors.textSecondary }]}>Votre code de parrainage</Text>
              <View style={s.codeRow}>
                <Text style={[s.codeValue, { color: colors.text }]}>{code || '—'}</Text>
                <TouchableOpacity style={[s.copyBtn, { backgroundColor: copied ? 'rgba(16,185,129,0.15)' : 'rgba(201,168,76,0.15)', borderColor: copied ? '#10B981' : '#C9A84C' }]} onPress={handleCopy}>
                  <AppIcon icon={copied ? CheckCircle : Copy} size={16} color={copied ? '#10B981' : '#C9A84C'} strokeWidth={2.2} />
                  <Text style={[s.copyBtnText, { color: copied ? '#10B981' : '#C9A84C' }]}>{copied ? 'Copié !' : 'Copier'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Share CTA */}
            <TouchableOpacity style={s.shareCta} onPress={handleShare} activeOpacity={0.85}>
              <AppIcon icon={Share2} size={20} color="#1A1A3E" strokeWidth={2.4} />
              <Text style={s.shareCtaText}>Partager mon lien de parrainage</Text>
            </TouchableOpacity>

            {/* How it works */}
            <View style={[s.howCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.howTitle, { color: colors.text }]}>Comment ça marche ?</Text>
              {[
                { n: '1', text: `Partagez votre code unique à vos amis` },
                { n: '2', text: `Votre ami s'inscrit avec votre code` },
                { n: '3', text: `Vous recevez tous les deux ${REFERRAL_BONUS} crédits instantanément` },
              ].map((step) => (
                <View key={step.n} style={s.howRow}>
                  <View style={s.howNum}>
                    <Text style={s.howNumText}>{step.n}</Text>
                  </View>
                  <Text style={[s.howText, { color: colors.textSecondary }]}>{step.text}</Text>
                </View>
              ))}
            </View>

            {/* Referrals list header */}
            {referrals.length > 0 && (
              <View style={s.listHeader}>
                <AppIcon icon={Users} size={16} color="#C9A84C" strokeWidth={2.2} />
                <Text style={[s.listHeaderText, { color: colors.text }]}>
                  Mes filleuls ({referrals.length})
                </Text>
              </View>
            )}
          </>
        )}
        ListEmptyComponent={loading ? (
          <ActivityIndicator color="#C9A84C" style={{ marginTop: 8 }} />
        ) : (
          <View style={[s.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppIcon icon={Users} size={32} color={colors.textTertiary} strokeWidth={1.5} />
            <Text style={[s.emptyText, { color: colors.textSecondary }]}>
              Aucun filleul pour l'instant.{'\n'}Partagez votre code pour commencer !
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[s.referralRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={s.referralAvatar}>
              <Text style={s.referralAvatarText}>{item.phone?.[0] ?? '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.referralPhone, { color: colors.text }]}>{item.phone}</Text>
              <Text style={[s.referralDate, { color: colors.textTertiary }]}>
                Inscrit le {new Date(item.joinedAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <View style={s.referralBonus}>
              <AppIcon icon={Zap} size={12} color="#C9A84C" strokeWidth={2.5} />
              <Text style={s.referralBonusText}>+{REFERRAL_BONUS}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingTop: 0, paddingBottom: 20, overflow: 'hidden', position: 'relative' },
  deco1: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(201,168,76,0.1)', top: -50, right: -30 },
  deco2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(99,102,241,0.12)', bottom: -30, left: -20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  bonusCard: { borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  bonusRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  bonusIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(201,168,76,0.15)', alignItems: 'center', justifyContent: 'center' },
  bonusTitle: { fontSize: 18, fontWeight: '900', color: '#C9A84C' },
  bonusSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 3, lineHeight: 17 },
  bonusStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12 },
  bonusStat: { flex: 1, alignItems: 'center' },
  bonusStatValue: { fontSize: 20, fontWeight: '900', color: '#C9A84C' },
  bonusStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  bonusStatDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)' },
  codeCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  codeLabel: { fontSize: 12, fontWeight: '600', marginBottom: 10 },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeValue: { fontSize: 24, fontWeight: '900', letterSpacing: 3 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  copyBtnText: { fontSize: 13, fontWeight: '700' },
  shareCta: { backgroundColor: '#C9A84C', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  shareCtaText: { fontSize: 16, fontWeight: '900', color: '#1A1A3E' },
  howCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  howTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  howNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(201,168,76,0.15)', alignItems: 'center', justifyContent: 'center' },
  howNumText: { color: '#C9A84C', fontWeight: '800', fontSize: 13 },
  howText: { flex: 1, fontSize: 13, lineHeight: 20 },
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listHeaderText: { fontSize: 15, fontWeight: '800' },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  referralRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  referralAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(201,168,76,0.15)', alignItems: 'center', justifyContent: 'center' },
  referralAvatarText: { fontSize: 16, fontWeight: '800', color: '#C9A84C' },
  referralPhone: { fontSize: 14, fontWeight: '600' },
  referralDate: { fontSize: 12, marginTop: 2 },
  referralBonus: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(201,168,76,0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  referralBonusText: { fontSize: 12, fontWeight: '700', color: '#C9A84C' },
});
