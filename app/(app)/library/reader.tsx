/**
 * Lecteur PDF intégré — Oracle Plus
 * Affiche le PDF directement dans l'app (pas de téléchargement).
 * Web : <iframe> | Natif : WebView
 */
import { ArrowLeft, BookOpen, RefreshCw } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { useTheme } from '../../../src/theme';
import { LibraryService } from '../../../src/services/library.service';
import { useAccess } from '../../../src/hooks/useAccess';
import { StorageService } from '../../../src/services/storage.service';
import { STORAGE_KEYS } from '../../../src/utils/constants';

let WebView: any = null;
if (Platform.OS !== 'web') {
  try { WebView = require('react-native-webview').WebView; } catch {}
}

export default function LibraryReader() {
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>();
  const { colors } = useTheme();
  const { hasSubscription } = useAccess();
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [token, setToken]     = useState('');

  useEffect(() => {
    if (!id) { setError('Identifiant manquant.'); setLoading(false); return; }
    prepare();
  }, [id]);

  async function prepare() {
    setLoading(true); setError('');
    try {
      const data = await LibraryService.getOne(id!);
      if (!data) { setError('Livre introuvable.'); setLoading(false); return; }

      // Accès : livre payant non acheté
      if ((data.tokenCost ?? 0) > 0 && !data.purchased) {
        setError('access'); setLoading(false); return;
      }

      // Utiliser l'endpoint /download qui vérifie l'achat et sert le fichier
      const apiBase = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.oracle-plus.online').replace(/\/$/, '');
      const downloadUrl = `${apiBase}/api/v1/library/${id}/download`;

      const tok = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN) ?? '';
      setToken(tok);
      setFileUrl(downloadUrl);
    } catch (e: any) {
      setError(e?.message ?? 'Impossible de charger ce livre.');
    }
    setLoading(false);
  }

  // Sur web : passer le token en query param pour l'iframe
  const iframeUrl = fileUrl && token
    ? `${fileUrl}?token=${encodeURIComponent(token)}`
    : fileUrl;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.btn}>
          <AppIcon icon={ArrowLeft} size={22} color={colors.text} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.text }]} numberOfLines={1}>{title || 'Lecture'}</Text>
        {fileUrl
          ? <TouchableOpacity onPress={prepare} style={s.btn}><AppIcon icon={RefreshCw} size={18} color={colors.textSecondary} strokeWidth={2} /></TouchableOpacity>
          : <View style={s.btn} />}
      </View>

      {loading && (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Chargement du livre…</Text>
        </View>
      )}

      {!loading && error === 'access' && (
        <View style={s.center}>
          <AppIcon icon={BookOpen} size={52} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={[s.heading, { color: colors.text }]}>Abonnement requis</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
            Abonnez-vous pour lire tous les livres de la bibliothèque.
          </Text>
          <TouchableOpacity onPress={() => router.replace('/subscription' as any)} style={[s.btn2, { backgroundColor: colors.primary }]}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Voir les abonnements</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={[s.btn2, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>Retour</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && error !== '' && error !== 'access' && (
        <View style={s.center}>
          <AppIcon icon={BookOpen} size={52} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={[s.heading, { color: colors.text }]}>Erreur de chargement</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>{error}</Text>
          <TouchableOpacity onPress={prepare} style={[s.btn2, { backgroundColor: colors.primary }]}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Réessayer</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={[s.btn2, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>Retour</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && fileUrl && (
        Platform.OS === 'web'
          ? <View style={{ flex: 1 }}>
              {/* @ts-ignore */}
              <iframe src={iframeUrl} style={{ flex: 1, width: '100%', height: '100%', border: 'none' }} title={title ?? 'Livre'} />
            </View>
          : WebView
            ? <WebView
                // Google Docs viewer pour afficher le PDF dans WebView Android/iOS
                source={{ uri: `https://docs.google.com/gviewer?embedded=true&url=${encodeURIComponent(iframeUrl)}` }}
                style={{ flex: 1 }}
                startInLoadingState
                renderLoading={() => (
                  <View style={s.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Chargement du PDF…</Text>
                  </View>
                )}
                onError={() => setError("Impossible d'afficher ce PDF.")}
              />
            : <View style={s.center}><Text style={{ color: colors.textSecondary }}>Lecteur non disponible.</Text></View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 52 : 16, paddingBottom: 14, borderBottomWidth: 0.5, gap: 10 },
  btn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  btn2:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, width: '100%', justifyContent: 'center' },
  title:     { flex: 1, fontSize: 16, fontWeight: '700' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  heading:   { fontSize: 20, fontWeight: '800', textAlign: 'center' },
});
