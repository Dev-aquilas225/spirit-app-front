/**
 * Callback Paystack pour l'achat d'un livre.
 * Paystack redirige ici après paiement : /library/callback?reference=ORP-xxx
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import { http } from '../../../src/services/http.client';
import { useTheme } from '../../../src/theme';
import { AppIcon } from '../../../src/components/common/AppIcon';

export default function LibraryCallbackScreen() {
  const { colors } = useTheme();
  const { reference } = useLocalSearchParams<{ reference?: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    verify();
  }, []);

  async function verify() {
    let ref = reference ?? '';
    let bookId = '';

    if (typeof localStorage !== 'undefined') {
      bookId = localStorage.getItem('pending_book_id') ?? '';
      if (!ref) ref = localStorage.getItem('pending_book_ref') ?? '';
    }

    if (!ref) { setStatus('error'); return; }

    try {
      await http.post('/library/purchase/verify', { reference: ref, bookId }).catch(() =>
        http.get(`/subscriptions/verify/${ref}`)
      );
      // Nettoyer localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('pending_book_id');
        localStorage.removeItem('pending_book_title');
        localStorage.removeItem('pending_book_ref');
      }
      setStatus('success');
      setTimeout(() => router.replace('/(app)/(tabs)/library' as any), 2500);
    } catch {
      setStatus('error');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32 }}>
      {status === 'loading' && (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Vérification du paiement…</Text>
        </>
      )}
      {status === 'success' && (
        <>
          <AppIcon icon={CheckCircle2} size={64} color="#10B981" strokeWidth={1.5} />
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center' }}>Achat confirmé !</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>Vous pouvez maintenant télécharger votre livre.</Text>
        </>
      )}
      {status === 'error' && (
        <>
          <AppIcon icon={XCircle} size={64} color="#EF4444" strokeWidth={1.5} />
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center' }}>Vérification échouée</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>Le paiement n'a pas pu être confirmé. Contactez le support.</Text>
        </>
      )}
    </View>
  );
}
