import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '../../../src/theme';
import { BackButton } from '../../../src/components/common/BackButton';

export default function PrivacyScreen() {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.surface, paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <BackButton style={{ marginBottom: 8 }} />
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>Politique de confidentialité</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.base }}>
        {[
          { title: 'Données collectées', content: 'Nous collectons : nom, numéro de téléphone, pays, langue, historique de prières, conversations IA (stockées localement).' },
          { title: 'Utilisation des données', content: 'Vos données sont utilisées uniquement pour personnaliser votre expérience spirituelle et gérer votre abonnement.' },
          { title: 'Sécurité', content: 'Vos données sont chiffrées et stockées de façon sécurisée. L\'accès est strictement limité aux services essentiels.' },
          { title: 'Vos droits', content: 'Vous pouvez demander la suppression de vos données à tout moment en contactant support@spiritapp.com.' },
          { title: 'Cookies', content: 'En version web, nous utilisons des cookies techniques essentiels uniquement. Aucun cookie publicitaire n\'est utilisé.' },
        ].map((section) => (
          <View key={section.title} style={{ marginBottom: 20 }}>
            <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15, marginBottom: 6 }}>{section.title}</Text>
            <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>{section.content}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
