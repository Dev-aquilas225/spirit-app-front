/**
 * Lecteur / Téléchargeur PDF — Oracle Plus
 *
 * Flux :
 *  1. Vérifie l'accès (abonnement ou crédits)
 *  2. Appelle POST /library/{id}/download pour enregistrer le téléchargement
 *  3. Web  : fetch avec JWT → blob → <a download> (téléchargement natif)
 *  4. Natif: WebBrowser.openBrowserAsync avec l'URL signée retournée
 *
 * Le reader ne tente plus d'ouvrir l'URL brute dans le navigateur
 * (ce qui causait le 404 car le JWT n'était pas transmis).
 */
import { ArrowLeft, BookOpen, Download, ExternalLink } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Platform, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { useTheme } from '../../../src/theme';
import { LibraryService } from '../../../src/services/library.service';
import { useAccess } from '../../../src/hooks/useAccess';
import { StorageService } from '../../../src/services/storage.service';
import { STORAGE_KEYS } from '../../../src/utils/constants';

export default function LibraryReader() {
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>();
  const { colors } = useTheme();
  const { hasSubscription } = useAccess();
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);

  useEffect(() => {
    if (!id) { setError('Identifiant du livre manquant.'); setLoading(false); return; }
    startDownload();
  }, [id]);

  async function startDownload() {
    setLoading(true); setError('');
    try {
      // 1. Vérifier l'accès via le backend
      const { data, error: bookErr } = await LibraryService.getOne(id!);
      if (bookErr || !data) {
        setError('Livre introuvable. Vérifiez votre connexion.');
        setLoading(false); return;
      }
      if (!hasSubscription && !data.canRead && !data.isFree) {
        setError('credits');
        setLoading(false); return;
      }

      // 2. Utiliser fileUrl du livre (retournée par le backend) ou construire l'URL
      const fileUrl = data.fileUrl ?? LibraryService.getFileUrl(id!);

      if (Platform.OS !== 'web') {
        // ── Natif : ouvrir dans WebBrowser ──────────────────────────────────
        await WebBrowser.openBrowserAsync(fileUrl, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          toolbarColor: '#1A1A3E',
        });
        setDone(true);
        setLoading(false);
        return;
      }

      // ── Web : fetch avec JWT → blob → <a download> ──────────────────────
      const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(fileUrl, { headers });
      if (!res.ok) throw new Error(`Erreur serveur ${res.status} — le fichier est introuvable.`);

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${(title ?? 'livre').replace(/[^a-z0-9]/gi, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? 'Impossible de télécharger ce document. Réessayez.');
    }
    setLoading(false);
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.btn}>
          <AppIcon icon={ArrowLeft} size={22} color={colors.text} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.text }]} numberOfLines={1}>
          {title || 'Téléchargement'}
        </Text>
      </View>

      {/* Chargement */}
      {loading && (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
            Préparation du téléchargement…
          </Text>
        </View>
      )}

      {/* Erreur crédits */}
      {!loading && error === 'credits' && (
        <View style={s.center}>
          <AppIcon icon={BookOpen} size={52} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={[s.heading, { color: colors.text }]}>Accès requis</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
            Vous avez besoin d'un abonnement actif ou de crédits suffisants pour télécharger ce livre.
          </Text>
          <TouchableOpacity
            onPress={() => { router.back(); router.push('/subscription?tab=credits' as any); }}
            style={[s.actionBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>Acheter des crédits</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { router.back(); router.push('/subscription' as any); }}
            style={[s.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text, fontWeight: '700' }}>Voir les abonnements</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Erreur générique */}
      {!loading && error !== '' && error !== 'credits' && (
        <View style={s.center}>
          <AppIcon icon={BookOpen} size={52} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={[s.heading, { color: colors.text }]}>Téléchargement échoué</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={startDownload}
            style={[s.actionBtn, { backgroundColor: colors.primary }]}
          >
            <AppIcon icon={Download} size={16} color="#fff" strokeWidth={2.5} />
            <Text style={{ color: '#fff', fontWeight: '800' }}>Réessayer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[s.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text, fontWeight: '700' }}>Retour</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Succès */}
      {!loading && !error && done && (
        <View style={s.center}>
          <View style={[s.successIcon, { backgroundColor: colors.primary + '18' }]}>
            <AppIcon icon={Download} size={40} color={colors.primary} strokeWidth={1.8} />
          </View>
          <Text style={[s.heading, { color: colors.text }]}>Téléchargement lancé !</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
            {Platform.OS === 'web'
              ? 'Le fichier PDF a été téléchargé dans votre dossier Téléchargements.'
              : Platform.OS === 'ios'
                ? 'Le livre s\'est ouvert dans le navigateur. Pour le sauvegarder : appuyez sur l\'icône Partager ↑ puis "Enregistrer dans Fichiers".'
                : 'Le livre s\'est ouvert dans le navigateur. Appuyez sur ⋮ puis "Télécharger" pour le sauvegarder.'}
          </Text>
          {Platform.OS === 'ios' && (
            <View style={[s.iosTip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ fontSize: 22, textAlign: 'center' }}>📤</Text>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                Comment sauvegarder sur iPhone
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                1. Dans le navigateur ouvert, appuyez sur l'icône <Text style={{ fontWeight: '800' }}>Partager ↑</Text>{'\n'}
                2. Faites défiler et appuyez sur <Text style={{ fontWeight: '800' }}>"Enregistrer dans Fichiers"</Text>{'\n'}
                3. Choisissez un dossier et appuyez sur <Text style={{ fontWeight: '800' }}>Enregistrer</Text>
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={startDownload}
            style={[s.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
          >
            <AppIcon icon={Download} size={15} color={colors.primary} strokeWidth={2.5} />
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Télécharger à nouveau</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[s.actionBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>Retour à la bibliothèque</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1 },
  header:      {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    paddingBottom: 14,
    borderBottomWidth: 0.5, gap: 10,
  },
  btn:         { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title:       { flex: 1, fontSize: 16, fontWeight: '700' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  heading:     { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  successIcon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  iosTip:      { width: '100%', borderRadius: 14, borderWidth: 1, padding: 16, gap: 8, marginTop: 8 },
  actionBtn:   {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 14, width: '100%', justifyContent: 'center',
  },
});
