/**
 * Lecteur PDF — Librairie Oracle Plus
 * Web : <iframe> avec token en query param
 * Natif : WebView avec Google Docs viewer (fallback universel)
 * Accès vérifié côté backend avant de servir le fichier.
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, BookOpen, Download, RefreshCw } from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { useTheme } from '../../../src/theme';
import { LibrairieService } from '../../../src/services/librairie.service';
import { StorageService } from '../../../src/services/storage.service';
import { STORAGE_KEYS } from '../../../src/utils/constants';

let WebView: any = null;
if (Platform.OS !== 'web') {
  try { WebView = require('react-native-webview').WebView; } catch {}
}

export default function LibrairieReader() {
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [readUrl, setReadUrl] = useState('');

  useEffect(() => {
    if (!id) { setError('Identifiant manquant.'); setLoading(false); return; }
    prepare();
  }, [id]);

  async function prepare() {
    setLoading(true); setError('');
    try {
      const book = await LibrairieService.getOne(id!);
      if (!book) { setError('Livre introuvable.'); setLoading(false); return; }
      if (!book.purchased && book.priceFcfa > 0) {
        setError('access'); setLoading(false); return;
      }
      const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN) ?? '';
      setReadUrl(LibrairieService.getReadUrl(id!, token));
    } catch (e: any) {
      setError(e?.message ?? 'Impossible de charger ce livre.');
    }
    setLoading(false);
  }

  async function handleDownload() {
    const book = await LibrairieService.getOne(id!);
    if (!book) return;
    await LibrairieService.telechargerPdf(book);
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.btn}>
          <AppIcon icon={ArrowLeft} size={22} color={colors.text} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.text }]} numberOfLines={1}>{decodeURIComponent(title ?? 'Lecture')}</Text>
        {readUrl ? (
          <TouchableOpacity onPress={handleDownload} style={s.btn}>
            <AppIcon icon={Download} size={18} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <View style={s.btn} />
        )}
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
          <Text style={[s.heading, { color: colors.text }]}>Achat requis</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
            Ce livre doit être acheté avant de pouvoir être lu.
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={[s.actionBtn, { backgroundColor: colors.primary }]}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Retour à la librairie</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && error !== '' && error !== 'access' && (
        <View style={s.center}>
          <AppIcon icon={BookOpen} size={52} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={[s.heading, { color: colors.text }]}>Erreur de chargement</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>{error}</Text>
          <TouchableOpacity onPress={prepare} style={[s.actionBtn, { backgroundColor: colors.primary }]}>
            <AppIcon icon={RefreshCw} size={16} color="#fff" strokeWidth={2} />
            <Text style={{ color: '#fff', fontWeight: '800' }}>Réessayer</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={[s.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>Retour</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && readUrl && (
        Platform.OS === 'web'
          ? (
            <View style={{ flex: 1 }}>
              {/* @ts-ignore */}
              <iframe
                src={readUrl}
                style={{ flex: 1, width: '100%', height: '100%', border: 'none' }}
                title={title ?? 'Livre'}
              />
            </View>
          )
          : WebView
            ? (
              <WebView
                source={{ uri: `https://docs.google.com/gviewer?embedded=true&url=${encodeURIComponent(readUrl)}` }}
                style={{ flex: 1 }}
                startInLoadingState
                renderLoading={() => (
                  <View style={s.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Chargement du PDF…</Text>
                  </View>
                )}
                onError={() => setError("Impossible d'afficher ce PDF. Essayez de le télécharger.")}
              />
            )
            : (
              <View style={s.center}>
                <Text style={{ color: colors.textSecondary }}>Lecteur non disponible sur cet appareil.</Text>
                <TouchableOpacity onPress={handleDownload} style={[s.actionBtn, { backgroundColor: colors.primary }]}>
                  <AppIcon icon={Download} size={16} color="#fff" strokeWidth={2} />
                  <Text style={{ color: '#fff', fontWeight: '800' }}>Télécharger le PDF</Text>
                </TouchableOpacity>
              </View>
            )
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1 },
  header:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 52 : 16, paddingBottom: 14, borderBottomWidth: 0.5, gap: 10 },
  btn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title:     { flex: 1, fontSize: 16, fontWeight: '700' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  heading:   { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, width: '100%', justifyContent: 'center' },
});
