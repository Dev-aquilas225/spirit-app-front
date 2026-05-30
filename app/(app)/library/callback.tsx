/**
 * Callback de retour depuis Paystack vers la bibliothèque.
 * Redirige simplement vers la bibliothèque — l'accès est géré
 * par le flag canRead retourné par le backend.
 */
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../../src/theme';

export default function LibraryCallbackScreen() {
  const { colors } = useTheme();

  useEffect(() => {
    // Nettoyer les éventuelles clés localStorage laissées par d'anciens flux
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('pending_book_id');
      localStorage.removeItem('pending_book_title');
      localStorage.removeItem('pending_book_ref');
    }
    // Rediriger vers la bibliothèque après un court délai
    const t = setTimeout(() => router.replace('/(app)/(tabs)/library' as any), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
