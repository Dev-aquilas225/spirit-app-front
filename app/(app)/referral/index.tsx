import React from 'react';
import { View, Text, Share, StyleSheet } from 'react-native';
import { Gift } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { useAuth } from '../../../src/hooks/useAuth';
import { ScreenWrapper } from '../../../src/components/common/ScreenWrapper';
import { BackButton } from '../../../src/components/common/BackButton';
import { GoldCard } from '../../../src/components/common/Card';
import { Button } from '../../../src/components/common/Button';
import { AppIcon } from '../../../src/components/common/AppIcon';

export default function ReferralScreen() {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();

  async function handleShare() {
    await Share.share({
      message: `Rejoins Oracle Plus — ta plateforme spirituelle ! Utilise mon code de parrainage ${user?.referralCode} pour bénéficier d'un avantage.`,
      url: 'https://spiritapp.com',
    });
  }

  return (
    <ScreenWrapper scrollable padded>
      <BackButton style={{ marginBottom: 24 }} />

      <View style={{ alignItems: 'center', marginBottom: 32 }}>
        <View style={{ marginBottom: 16 }}>
          <AppIcon icon={Gift} size={64} color={colors.primary} strokeWidth={1.8} />
        </View>
        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
          Programme de parrainage
        </Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 8, fontSize: 14, lineHeight: 22 }}>
          Invitez vos proches et bénéficiez d’avantages exclusifs pour chaque abonné parrainé.
        </Text>
      </View>

      <GoldCard style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: '#C9A84C', fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
          VOTRE CODE DE PARRAINAGE
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: 2 }}>
            {user?.referralCode}
          </Text>
          <Button label="Copier" variant="outline" size="sm" onPress={() => {}} />
        </View>
      </GoldCard>

      <Button
        label="Partager mon code"
        variant="gold"
        fullWidth
        size="lg"
        onPress={handleShare}
      />

      <View style={{ marginTop: 32, gap: spacing.md }}>
        <Text style={{ fontWeight: '700', color: colors.text, fontSize: 16 }}>Comment ça marche</Text>
        {[
          { step: '1', text: 'Partagez votre code unique avec vos proches' },
          { step: '2', text: 'Ils s\'inscrivent avec votre code' },
          { step: '3', text: 'Quand ils s\'abonnent, vous gagnez des avantages' },
        ].map((item) => (
          <View key={item.step} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{item.step}</Text>
            </View>
            <Text style={{ color: colors.textSecondary, flex: 1, lineHeight: 22 }}>{item.text}</Text>
          </View>
        ))}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
