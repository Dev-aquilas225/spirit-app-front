import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useI18n } from '../../../src/i18n';
import { useTheme } from '../../../src/theme';
import { BackButton } from '../../../src/components/common/BackButton';
import { Card } from '../../../src/components/common/Card';
import { formatDate } from '../../../src/utils/helpers';

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const { t } = useI18n();

  // Date du jour formatée proprement pour faire officiel
  const dateMiseAJour = formatDate(new Date().toISOString());

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      
      {/* Header Premium - Inspire la confiance et le respect */}
      <View style={[styles.header, { backgroundColor: colors.deepBlue ?? '#1A1A3E', paddingTop: insets.top + 12 }]}>
        <BackButton variant="dark" style={{ marginBottom: 12 }} fallback="/profile" />
        <Text style={styles.headerTitle}>{t.legal.termsTitle}</Text>
        <Text style={styles.headerSubtitle}>
          {t.legal.updatedOn(dateMiseAJour)}
        </Text>
      </View>

      {/* Contenu des sections légales */}
      <ScrollView 
        contentContainerStyle={{ padding: spacing.base, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {t.legal.termsSections.map((section, index) => (
          <Card key={section.title || index} style={styles.legalCard}>
            
            {/* Titre de la section avec une petite barre dorée discrète à gauche */}
            <View style={styles.titleRow}>
              <View style={styles.goldIndicator} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {section.title}
              </Text>
            </View>

            {/* Texte de loi / CGU */}
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
              {section.content}
            </Text>

          </Card>
        ))}

        {/* Note de respect et de déni de responsabilité spirituel en bas de page */}
        <View style={styles.footerNote}>
          <Text style={{ color: colors.textTertiary, fontSize: 11, textAlign: 'center', fontStyle: 'italic', lineHeight: 16 }}>
            En utilisant l'application Oracle Plus, vous acceptez pleinement ces règles de conduite et nos conditions de services spirituels.
          </Text>
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  header: { 
    padding: 16, 
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)'
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#fff',
    letterSpacing: 0.3
  },
  headerSubtitle: { 
    fontSize: 12, 
    color: 'rgba(255,255,255,0.5)', 
    marginTop: 6,
    fontWeight: '500'
  },
  legalCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 1, // Ombre légère sur Android
    shadowColor: '#000', // Ombre sur iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8
  },
  goldIndicator: {
    width: 4,
    height: 16,
    backgroundColor: '#C9A84C', // Rappel de la couleur Or d'Oracle Plus
    borderRadius: 2
  },
  sectionTitle: { 
    fontWeight: '700', 
    fontSize: 15,
    letterSpacing: 0.2
  },
  sectionContent: { 
    fontSize: 14, 
    lineHeight: 22,
    textAlign: 'justify' // Aligné proprement comme un vrai contrat
  },
  footerNote: {
    marginTop: 20,
    paddingHorizontal: 24,
    alignItems: 'center'
  }
});
