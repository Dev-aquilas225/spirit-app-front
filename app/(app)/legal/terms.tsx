import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '../../../src/theme';
import { BackButton } from '../../../src/components/common/BackButton';

export default function TermsScreen() {
  const { colors, spacing } = useTheme();
  return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ backgroundColor: colors.surface, paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <BackButton style={{ marginBottom: 8 }} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>Conditions d’utilisation</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.base }}>
          <Text style={{ color: colors.textSecondary, marginBottom: 16, fontSize: 13 }}>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</Text>
          {[
          { title: '1. Acceptation des conditions', content: 'En utilisant Oracle Plus, vous acceptez les présentes conditions d\'utilisation. L\'application est destinée à un usage spirituel et éducatif personnel.' },
          { title: '2. Abonnement', content: 'L\'abonnement Premium est facturé 5 000 FCFA/mois. Il est renouvelé automatiquement sauf annulation au moins 24h avant le renouvellement.' },
          { title: '3. Contenu', content: 'Tout le contenu de l\'application (prières, formations, livres) est protégé par le droit d\'auteur. Toute reproduction non autorisée est interdite.' },
          { title: '4. Confidentialité', content: 'Vos données personnelles sont traitées conformément à notre politique de confidentialité. Nous ne vendons jamais vos données à des tiers.' },
          { title: '5. Limitation de responsabilité', content: 'Oracle Plus est un outil d\'accompagnement spirituel. Les conseils prodigués ne remplacent pas un suivi médical ou psychologique professionnel.' },
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
