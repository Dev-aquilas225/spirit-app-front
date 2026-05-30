/**
 * Lecteur PDF — Oracle Plus
 * 1. Récupère les métadonnées du livre (fileUrl)
 * 2. Web : charge le PDF via http.getRaw → PdfViewer, fallback lien direct
 * 3. Natif : ouvre dans WebBrowser
 * 4. Accès vérifié (abonnement ou crédits)
 */
import { ArrowLeft, BookOpen, ExternalLink } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { useTheme } from '../../../src/theme';
import { http } from '../../../src/services/http.client';
import { LibraryService } from '../../../src/services/library.service';
import { useAccess } from '../../../src/hooks/useAccess';

let PdfViewer: React.ComponentType<{ pdfData: ArrayBuffer }> | null = null;
if (Platform.OS === 'web') {
  try { PdfViewer = require('../../../src/components/pdf/PdfViewer').PdfViewer; } catch {}
}

export default function LibraryReader() {
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>();
  const { colors } = useTheme();
  const { hasSubscription, credits } = useAccess();
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) { setError('Identifiant du livre manquant.'); setLoading(false); return; }
    load();
  }, [id]);

  async function load() {
    setLoading(true); setError('');
    try {
      const { data, error: bookErr } = await LibraryService.getOne(id!);
      if (bookErr || !data) { setError('Livre introuvable. Vérifiez votre connexion.'); setLoading(false); return; }
      if (!hasSubscription && !data.canRead && !data.isFree) {
        setError('Crédits insuffisants pour accéder à ce livre.'); setLoading(false); return;
      }
      const url = data.fileUrl ?? LibraryService.getFileUrl(id!);
      setFileUrl(url);
      if (Platform.OS !== 'web') {
        await WebBrowser.openBrowserAsync(url);
        router.back(); return;
      }
      try {
        const buf = await http.getRaw(`/library/${id}/file`);
        setPdfData(buf);
      } catch { /* fileUrl déjà défini — fallback lien direct */ }
    } catch { setError('Impossible de charger ce document. Réessayez.'); }
    setLoading(false);
  }

  const openExternal = () => {
    if (!fileUrl) return;
    if (Platform.OS === 'web') window.open(fileUrl, '_blank');
    else Linking.openURL(fileUrl);
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.btn}>
          <AppIcon icon={ArrowLeft} size={22} color={colors.text} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.text }]} numberOfLines={1}>{title || 'Lecture'}</Text>
        {fileUrl && (
          <TouchableOpacity onPress={openExternal} style={s.btn}>
            <AppIcon icon={ExternalLink} size={18} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Chargement…</Text>
        </View>
      )}

      {!loading && error !== '' && (
        <View style={s.center}>
          <AppIcon icon={BookOpen} size={48} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={{ color: colors.textSecondary, marginTop: 16, textAlign: 'center', lineHeight: 22 }}>{error}</Text>
          {error.includes('Crédits') && (
            <TouchableOpacity onPress={() => { router.back(); router.push('/subscription?tab=credits' as any); }}
              style={[s.actionBtn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>Acheter des crédits</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.back()}
            style={[s.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>Retour</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && pdfData && PdfViewer && <PdfViewer pdfData={pdfData} />}

      {!loading && !error && !pdfData && fileUrl && (
        <View style={s.center}>
          <AppIcon icon={BookOpen} size={48} color={colors.primary} strokeWidth={1.5} />
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16, marginTop: 16 }}>{title}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
            Appuyez pour ouvrir le document PDF.
          </Text>
          <TouchableOpacity onPress={openExternal} style={[s.actionBtn, { backgroundColor: colors.primary }]}>
            <AppIcon icon={ExternalLink} size={16} color="#fff" strokeWidth={2.5} />
            <Text style={{ color: '#fff', fontWeight: '800' }}>Ouvrir le PDF</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 52 : 16, paddingBottom: 14, borderBottomWidth: 0.5, gap: 10 },
  btn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title:     { flex: 1, fontSize: 16, fontWeight: '700' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14, marginTop: 8 },
});
