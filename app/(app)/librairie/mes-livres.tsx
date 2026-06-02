/**
 * Mes livres achetés — Oracle Plus
 * Affiche tous les livres achetés avec couverture, date d'achat,
 * bouton Lire et bouton Télécharger.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BookMarked, BookOpen, Download, RefreshCw } from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { BackButton } from '../../../src/components/common/BackButton';
import { useTheme } from '../../../src/theme';
import { LivreAchat, LibrairieService, Livre } from '../../../src/services/librairie.service';

export default function MesLivres() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [achats, setAchats]   = useState<LivreAchat[]>([]);
  const [loading, setLoading] = useState(true);
  const [dlError, setDlError] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const data = await LibrairieService.getMyPurchases();
    // Garder uniquement les achats payés
    setAchats(data.filter((a) => a.status === 'paid' || a.status === 'success'));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDownload(achat: LivreAchat) {
    if (!achat.book) return;
    const result = await LibrairieService.telechargerPdf(achat.book);
    if (result.error) {
      setDlError((prev) => ({ ...prev, [achat.livreId]: result.error! }));
    }
  }

  function handleRead(achat: LivreAchat) {
    if (!achat.book) return;
    router.push(`/librairie/reader?id=${achat.book.id}&title=${encodeURIComponent(achat.book.title)}` as any);
  }

  function formatDate(iso?: string) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <BackButton />
        <Text style={[s.headerTitle, { color: colors.text }]}>Mes livres achetés</Text>
        <TouchableOpacity onPress={load} style={s.refreshBtn}>
          <AppIcon icon={RefreshCw} size={18} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : achats.length === 0 ? (
        <View style={s.center}>
          <AppIcon icon={BookMarked} size={52} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={[s.emptyTitle, { color: colors.text }]}>Aucun livre acheté</Text>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>
            Vos livres achetés apparaîtront ici.
          </Text>
          <TouchableOpacity
            style={[s.browseBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Parcourir la librairie</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={achats}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PurchaseRow
              achat={item}
              colors={colors}
              error={dlError[item.livreId]}
              onRead={() => handleRead(item)}
              onDownload={() => handleDownload(item)}
              formatDate={formatDate}
            />
          )}
          ListFooterComponent={<View style={{ height: 40 }} />}
        />
      )}
    </View>
  );
}

function PurchaseRow({ achat, colors, error, onRead, onDownload, formatDate }: {
  achat: LivreAchat; colors: any; error?: string;
  onRead: () => void; onDownload: () => void;
  formatDate: (iso?: string) => string;
}) {
  const book = achat.book;
  return (
    <View style={[s.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Couverture */}
      <View style={s.cover}>
        {book?.coverUrl
          ? <Image source={{ uri: book.coverUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          : <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
              <AppIcon icon={BookOpen} size={24} color={colors.textTertiary} strokeWidth={1.5} />
            </View>
        }
      </View>
      {/* Infos */}
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[s.bookTitle, { color: colors.text }]} numberOfLines={2}>
          {book?.title ?? 'Livre'}
        </Text>
        {book?.author ? (
          <Text style={[s.bookAuthor, { color: colors.textSecondary }]} numberOfLines={1}>{book.author}</Text>
        ) : null}
        <Text style={[s.purchaseDate, { color: colors.textTertiary }]}>
          Acheté le {formatDate(achat.paidAt ?? achat.createdAt)}
        </Text>
        {error ? <Text style={{ color: '#EF4444', fontSize: 11 }}>{error}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <TouchableOpacity style={[s.btn, { backgroundColor: colors.primary }]} onPress={onRead}>
            <AppIcon icon={BookOpen} size={13} color="#fff" strokeWidth={2.5} />
            <Text style={s.btnTxt}>Lire</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, { backgroundColor: '#10B981' }]} onPress={onDownload}>
            <AppIcon icon={Download} size={13} color="#fff" strokeWidth={2.5} />
            <Text style={s.btnTxt}>Télécharger</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, gap: 10 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800' },
  refreshBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:  { fontSize: 18, fontWeight: '800' },
  emptyText:   { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  browseBtn:   { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  row:         { flexDirection: 'row', gap: 14, padding: 14, borderRadius: 14, borderWidth: 1 },
  cover:       { width: 64, height: 88, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  bookTitle:   { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  bookAuthor:  { fontSize: 12 },
  purchaseDate:{ fontSize: 11 },
  btn:         { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  btnTxt:      { color: '#fff', fontSize: 12, fontWeight: '700' },
});
