import React from 'react';
import { View, Text, Linking } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Mail, MessageCircle, Phone } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { ScreenWrapper } from '../../../src/components/common/ScreenWrapper';
import { Card } from '../../../src/components/common/Card';
import { BackButton } from '../../../src/components/common/BackButton';
import { AppIcon } from '../../../src/components/common/AppIcon';

const SUPPORT_OPTIONS = [
  { icon: Mail, label: 'Email', value: 'support@spiritapp.com', action: () => Linking.openURL('mailto:support@spiritapp.com') },
  { icon: Phone, label: 'WhatsApp', value: '+225 07 00 00 00 00', action: () => Linking.openURL('whatsapp://send?phone=22507000000') },
  { icon: MessageCircle, label: 'Chat en ligne', value: 'Disponible 8h-20h', action: () => {} },
] satisfies { icon: LucideIcon; label: string; value: string; action: () => void }[];

const FAQ = [
  { q: 'Comment annuler mon abonnement ?', a: 'Rendez-vous dans Profil > Abonnement > Gérer > Annuler.' },
  { q: 'Mon paiement a-t-il été débité ?', a: 'Vérifiez votre historique de paiements dans Profil > Historique paiements.' },
  { q: 'Puis-je utiliser l\'app sans connexion ?', a: 'Les prières et contenus chargés restent accessibles hors ligne.' },
];

export default function SupportScreen() {
  const { colors, spacing } = useTheme();

  return (
    <ScreenWrapper scrollable padded>
      <BackButton style={{ marginBottom: 24 }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <AppIcon icon={MessageCircle} size={22} color={colors.text} strokeWidth={2.4} />
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>Support</Text>
      </View>

      <View style={{ gap: spacing.lg }}>
        {/* Contact options */}
        <View>
          <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 12 }}>Nous contacter</Text>
          {SUPPORT_OPTIONS.map((opt) => (
            <Card key={opt.label} onPress={opt.action} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <AppIcon icon={opt.icon} size={22} color={colors.primary} strokeWidth={2.2} />
                <View>
                  <Text style={{ fontWeight: '600', color: colors.text }}>{opt.label}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{opt.value}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* FAQ */}
        <View>
          <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 12 }}>Questions fréquentes</Text>
          {FAQ.map((item) => (
            <Card key={item.q} style={{ marginBottom: 8 }}>
              <Text style={{ fontWeight: '600', color: colors.text, marginBottom: 6 }}>{item.q}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>{item.a}</Text>
            </Card>
          ))}
        </View>
      </View>
    </ScreenWrapper>
  );
}
