import { ArrowLeft, BookOpen } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { AppIcon } from '../../../src/components/common/AppIcon';
import { useTheme } from '../../../src/theme';
import { http } from '../../../src/services/http.client';

// PdfViewer uniquement sur web
let PdfViewer: React.ComponentType<{ pdfData: ArrayBuffer }> | null = null;
if (Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  PdfViewer = require('../../../src/components/pdf/PdfViewer').PdfViewer;
}

export default function LibraryReader() {
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>();
  const { colors } = useTheme();
  const [pdfData, setPdfData]   = useState<ArrayBuffer | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');

    http.getRaw(`/library/${id}/file`)
      .then((buf) => setPdfData(buf))
      .catch(() => setError('Impossible de charger ce document.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.8}>
          <AppIcon icon={ArrowLeft} size={22} color={colors.text} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {title || 'Lecture'}
        </Text>
        <AppIcon icon={BookOpen} size={20} color={colors.textTertiary} strokeWidth={1.8} />
      </View>

      {/* Contenu */}
      {loading && (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Chargement du document…</Text>
        </View>
      )}

      {!loading && error !== '' && (
        <View style={s.center}>
          <AppIcon icon={BookOpen} size={48} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={{ color: colors.textSecondary, marginTop: 16, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity onPress={() => router.back()} style={[s.retryBtn, { backgroundColor: colors.primary }]}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retour</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && error === '' && pdfData && PdfViewer && (
        <PdfViewer pdfData={pdfData} />
      )}

      {!loading && error === '' && pdfData && !PdfViewer && (
        <View style={s.center}>
          <Text style={{ color: colors.textSecondary }}>Lecture PDF non disponible sur cette plateforme.</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14, borderBottomWidth: 0.5, gap: 10 },
  backBtn:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  retryBtn:  { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
});
