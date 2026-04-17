import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CheckCircle, XCircle } from 'lucide-react-native';
import { AuthService } from '../../src/services/auth.service';
import { useAuthStore } from '../../src/store/auth.store';

export default function VerifyMagicLinkScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const loginWithTokens = useAuthStore((s) => s.loginWithTokens);

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Lien invalide ou manquant.');
      return;
    }
    verify();
  }, [token]);

  async function verify() {
    setStatus('loading');
    const result = await AuthService.verifyMagicLink(token as string);

    if (result.error || !result.data) {
      setStatus('error');
      setErrorMessage(result.error ?? 'Lien invalide ou expiré.');
      return;
    }

    // Mettre à jour le store Zustand avec les tokens
    const ok = await loginWithTokens(result.data.accessToken, result.data.refreshToken);
    if (!ok) {
      setStatus('error');
      setErrorMessage('Impossible de vous connecter. Veuillez réessayer.');
      return;
    }

    setStatus('success');
    // Rediriger vers l'app principale après un court délai
    setTimeout(() => {
      router.replace('/(app)/(tabs)/home');
    }, 800);
  }

  if (status === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#c9a227" />
        <Text style={styles.loadingText}>Vérification en cours…</Text>
      </View>
    );
  }

  if (status === 'success') {
    return (
      <View style={styles.container}>
        <CheckCircle size={64} color="#10B981" strokeWidth={1.5} />
        <Text style={styles.title}>Connexion réussie !</Text>
        <Text style={styles.subtitle}>Redirection vers l'application…</Text>
      </View>
    );
  }

  // Error state
  return (
    <View style={styles.container}>
      <XCircle size={64} color="#EF4444" strokeWidth={1.5} />
      <Text style={styles.title}>Lien invalide</Text>
      <Text style={styles.errorText}>{errorMessage}</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.buttonText}>Retour à la connexion</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    fontSize: 56,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  button: {
    backgroundColor: '#c9a227',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
