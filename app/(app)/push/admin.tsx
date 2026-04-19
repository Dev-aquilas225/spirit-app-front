import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Bell, RefreshCw, Send, Sunrise, Sunset, Users } from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { BackButton } from '../../../src/components/common/BackButton';
import { Card } from '../../../src/components/common/Card';
import { http } from '../../../src/services/http.client';
import { useTheme } from '../../../src/theme';

interface PushStats {
  total: number;
  withUser: number;
  anonymous: number;
}

export default function AdminPushScreen() {
  const { colors, spacing } = useTheme();
  const [stats,   setStats]   = useState<PushStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await http.get<PushStats>('/push/admin/stats');
      setStats(data);
    } catch {
      setStats(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  async function triggerPush(type: 'morning' | 'evening' | 'test') {
    setSending(type);
    try {
      const endpoint =
        type === 'morning' ? '/push/admin/trigger-morning'
        : type === 'evening' ? '/push/admin/trigger-evening'
        : '/push/test';
      await http.post(endpoint, {});
      const label = type === 'morning' ? 'Matin' : type === 'evening' ? 'Soir' : 'Test';
      if (Platform.OS === 'web') {
        window.alert(`✅ Push "${label}" envoyé à ${stats?.total ?? 0} abonné(s)`);
      } else {
        Alert.alert('Envoyé', `Push "${label}" envoyé à ${stats?.total ?? 0} abonné(s)`);
      }
    } catch (e: any) {
      const msg = e?.message ?? 'Erreur inconnue';
      if (Platform.OS === 'web') window.alert(`❌ Erreur : ${msg}`);
      else Alert.alert('Erreur', msg);
    }
    setSending(null);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#1A1A3E', paddingTop: 56 }]}>
        <BackButton variant="dark" style={{ alignSelf: 'flex-start', marginBottom: 16 }} fallback="/(app)/(tabs)/profile" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <AppIcon icon={Bell} size={28} color="#C9A84C" strokeWidth={2} />
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>Notifications Push</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              Diagnostic et déclenchement manuel
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.base, gap: 20, paddingBottom: 60 }}>

        {/* Stats */}
        <View>
          <Text style={[styles.section, { color: colors.textSecondary }]}>ABONNEMENTS</Text>
          {loading ? (
            <Card>
              <ActivityIndicator color="#C9A84C" />
            </Card>
          ) : stats === null ? (
            <Card>
              <Text style={{ color: '#EF4444', textAlign: 'center' }}>
                Impossible de charger les stats (VAPID non configuré ?)
              </Text>
            </Card>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <StatCard label="Total" value={stats.total}    color="#C9A84C" icon={Users}  colors={colors} />
              <StatCard label="Connectés" value={stats.withUser}  color="#10B981" icon={Bell}   colors={colors} />
              <StatCard label="Anonymes" value={stats.anonymous} color="#6366F1" icon={Send}   colors={colors} />
            </View>
          )}
        </View>

        {/* Actions */}
        <View>
          <Text style={[styles.section, { color: colors.textSecondary }]}>DÉCLENCHER UN PUSH</Text>
          <View style={{ gap: 10 }}>

            <ActionBtn
              icon={Sunrise}
              label="Push du matin (6h)"
              subtitle="Prière du matin — comme le cron 6h"
              color="#F59E0B"
              loading={sending === 'morning'}
              onPress={() => triggerPush('morning')}
              colors={colors}
            />

            <ActionBtn
              icon={Sunset}
              label="Push du soir (18h)"
              subtitle="Prière du soir — comme le cron 18h"
              color="#6366F1"
              loading={sending === 'evening'}
              onPress={() => triggerPush('evening')}
              colors={colors}
            />

            <ActionBtn
              icon={Send}
              label="Push de test"
              subtitle="Message de test pour vérifier que tout fonctionne"
              color="#10B981"
              loading={sending === 'test'}
              onPress={() => triggerPush('test')}
              colors={colors}
            />

          </View>
        </View>

        {/* Aide */}
        <Card>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
            Comment diagnostiquer ?
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 20 }}>
            1. Vérifiez que "Total" est {">"} 0 (des abonnés sont enregistrés){'\n'}
            2. Appuyez sur "Push de test" et attendez la notification{'\n'}
            3. Si rien n'arrive : désactivez et réactivez les notifications dans votre profil{'\n'}
            4. Sur iOS : l'appli doit être installée sur l'écran d'accueil (iOS 16.4+){'\n'}
            5. Vérifiez que VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY sont configurés sur le serveur
          </Text>
        </Card>

        {/* Refresh */}
        <TouchableOpacity
          onPress={loadStats}
          style={[styles.refreshBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <AppIcon icon={RefreshCw} size={16} color={colors.text} strokeWidth={2} />
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>Rafraîchir les stats</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

/* ─── Sous-composants ─────────────────────────────────────────────────────── */

function StatCard({ label, value, color, icon, colors }: any) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border, flex: 1 }]}>
      <AppIcon icon={icon} size={20} color={color} strokeWidth={2} />
      <Text style={{ fontSize: 24, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

function ActionBtn({ icon, label, subtitle, color, loading, onPress, colors }: any) {
  return (
    <Card padding="none" onPress={loading ? undefined : onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
        <View style={[styles.actionIcon, { backgroundColor: `${color}1A` }]}>
          {loading
            ? <ActivityIndicator size="small" color={color} />
            : <AppIcon icon={icon} size={22} color={color} strokeWidth={2} />
          }
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{label}</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{subtitle}</Text>
        </View>
        <AppIcon icon={Send} size={16} color={color} strokeWidth={2} />
      </View>
    </Card>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  header:     { paddingHorizontal: 20, paddingBottom: 24 },
  section:    { fontSize: 12, fontWeight: '700', marginBottom: 10, letterSpacing: 0.5 },
  statCard:   { borderWidth: 1, borderRadius: 14, padding: 16, alignItems: 'center', gap: 6 },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  refreshBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderRadius: 12, paddingVertical: 12,
  },
});
