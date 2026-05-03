/**
 * Paystack Callback Page — Oracle Plus
 *
 * Cette page est atteinte dans 2 cas :
 *
 * 1. VERSION WEB (navigateur) :
 *    Paystack redirige ici → https://bo.oracle-plus.online/subscription/callback?reference=ORP-xxx
 *    La page affiche un message de succès et tente de fermer l'onglet.
 *
 * 2. VERSION MOBILE (deep link) :
 *    Si la variable PAYSTACK_CALLBACK_URL = oracleplus://subscription/callback,
 *    expo-web-browser intercepte le redirect et ferme le navigateur AVANT que
 *    cette page soit rendue. Cette page n'est donc jamais affichée sur mobile.
 *    Elle sert de fallback si l'interception échoue.
 */
import React, { useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../../src/theme';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { Button } from '../../../src/components/common/Button';

export default function PaystackCallbackScreen() {
  const { colors } = useTheme();
  const { reference, trxref } = useLocalSearchParams<{ reference?: string; trxref?: string }>();
  const ref = reference || trxref || '';
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Sur web : tenter de fermer l'onglet après 3 secondes
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(tick);
          tryReturn();
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, []);

  function tryReturn() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Essayer de fermer l'onglet (fonctionne si ouvert par window.open)
      window.close();
      // Si l'onglet ne se ferme pas (navigateur bloque), rediriger vers l'accueil de l'app
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } else {
      // Mobile fallback : ouvrir le deep link vers la page de succès
      Linking.openURL('oracleplus://subscription/success').catch(() => {
        router.replace('/(app)/subscription/success');
      });
    }
  }

  return (
    <View style={[s.centered, { backgroundColor: colors.background }]}>
      {/* Icône succès */}
      <View style={s.iconWrap}>
        <AppIcon icon={CheckCircle} size={64} color="#10B981" strokeWidth={1.6} />
      </View>

      {/* Titre */}
      <Text style={[s.title, { color: colors.text }]}>Paiement reçu !</Text>

      {/* Message */}
      <Text style={[s.msg, { color: colors.textSecondary }]}>
        Ton accès VIP Oracle Plus s'active automatiquement.{'\n'}
        Retourne sur l'application pour continuer.
      </Text>

      {/* Référence */}
      {ref ? (
        <View style={[s.refBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ color: colors.textTertiary, fontSize: 11 }}>Référence de paiement</Text>
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 2 }}>
            {ref}
          </Text>
        </View>
      ) : null}

      {/* Bouton retour */}
      <View style={{ width: '100%', paddingHorizontal: 32, gap: 12, marginTop: 8 }}>
        <Button
          label={`Retour à Oracle Plus${countdown > 0 ? ` (${countdown}s)` : ''}`}
          variant="gold"
          fullWidth
          onPress={tryReturn}
        />
        <Text style={{ color: colors.textTertiary, fontSize: 12, textAlign: 'center' }}>
          L'onglet se fermera automatiquement dans {countdown > 0 ? `${countdown}s` : 'un instant'}…
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16,185,129,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  msg: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  refBox: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
});
