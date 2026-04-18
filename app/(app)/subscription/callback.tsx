/**
 * Paystack Callback Page
 *
 * Paystack redirige ici après le paiement (nouvel onglet) :
 *   https://bo.oracle-plus.online/subscription/callback?reference=ORP-xxx
 *
 * Ce n'est PAS cette page qui vérifie le paiement — c'est le polling dans
 * payment.tsx qui le fait automatiquement. Cette page sert juste à :
 *   1. Confirmer visuellement à l'utilisateur que le paiement est reçu
 *   2. Le renvoyer sur l'application (fermer l'onglet ou naviguer)
 */
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { Button } from '../../../src/components/common/Button';

export default function PaystackCallbackScreen() {
  const { colors } = useTheme();

  // Sur web, tenter de fermer cet onglet après 1 seconde
  // (ne fonctionne que si l'onglet a été ouvert par window.open)
  useEffect(() => {
    const t = setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.close();
      }
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={[s.centered, { backgroundColor: colors.background }]}>
      <AppIcon icon={CheckCircle} size={72} color="#10B981" strokeWidth={1.6} />

      <View style={{ alignItems: 'center', gap: 8, marginTop: 24 }}>
        <Text style={[s.title, { color: colors.text }]}>Paiement reçu !</Text>
        <Text style={[s.msg, { color: colors.textSecondary }]}>
          Retourne sur l'application.{'\n'}
          Ton accès VIP s'active automatiquement.
        </Text>
      </View>

      <View style={{ width: '100%', marginTop: 32, paddingHorizontal: 32, gap: 12 }}>
        <Button
          label="Retour à l'application"
          variant="gold"
          fullWidth
          onPress={() => {
            // Fermer cet onglet si possible, sinon naviguer vers l'accueil
            if (typeof window !== 'undefined') {
              window.close();
            }
            router.replace('/(app)/(tabs)/home');
          }}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title:    { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  msg:      { fontSize: 15, textAlign: 'center', lineHeight: 24, color: '#999' },
});
