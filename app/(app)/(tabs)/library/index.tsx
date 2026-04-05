import React, { useState } from 'react';
import {
  View, Text, FlatList, ScrollView,
  TouchableOpacity, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, BookOpen, Check, Crown, Folder, Lightbulb, Lock, X } from 'lucide-react-native';
import { useTheme } from '../../../../src/theme';
import { useSubscription } from '../../../../src/hooks/useSubscription';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { Button } from '../../../../src/components/common/Button';
import { BackButton } from '../../../../src/components/common/BackButton';
import { BOOKS_DATA } from '../../../../src/data/books.data';
import { Book } from '../../../../src/types/content.types';

type LibraryView = 'list' | 'detail' | 'reader';

// ─── Carte livre ──────────────────────────────────────────────────────────────
function BookCard({ book, onPress }: { book: Book; onPress: () => void }) {
  const { colors, shadows, borderRadius: br } = useTheme();
  const isPremium = book.access === 'premium';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border, ...shadows.md }]}
    >
      <View style={[s.cover, { backgroundColor: colors.surfaceSecondary, borderRadius: br.md }]}>
        <AppIcon icon={BookOpen} size={40} color={colors.primary} strokeWidth={1.8} />
        <View style={[s.lockBadge, { backgroundColor: isPremium ? colors.primary : '#10B981' }]}>
          <AppIcon icon={isPremium ? Lock : Check} size={12} color="#fff" strokeWidth={2.6} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.bookTitle, { color: colors.text }]} numberOfLines={2}>{book.title}</Text>
        <Text style={[s.author, { color: colors.textSecondary }]}>{book.author}</Text>
        <View style={s.metaRow}>
          <Text style={[s.metaTag, { backgroundColor: colors.surfaceSecondary, color: colors.textSecondary }]}>
            {book.category}
          </Text>
          <Text style={[s.metaTag, { backgroundColor: colors.surfaceSecondary, color: colors.textSecondary }]}>
            {book.pages} pages
          </Text>
          {isPremium ? (
            <Text style={[s.metaTag, { backgroundColor: colors.primaryPale ?? '#EDE9FE', color: colors.primary }]}>
              Premium
            </Text>
          ) : (
            <Text style={[s.metaTag, { backgroundColor: '#D1FAE5', color: '#10B981' }]}>
              Gratuit
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Contenu principal ────────────────────────────────────────────────────────
function LibraryContent() {
  const { colors, spacing } = useTheme();
  const { isActive: isSubscribed } = useSubscription();
  const [view, setView]         = useState<LibraryView>('list');
  const [selectedBook, setBook] = useState<Book | null>(null);
  const [chapter, setChapter]   = useState(0);

  function openDetail(book: Book) {
    setBook(book);
    setChapter(0);
    setView('detail');
  }

  function handleReadButton() {
    if (!selectedBook) return;
    if (selectedBook.access === 'premium' && !isSubscribed) {
      router.push('/(app)/subscription');
    } else {
      setChapter(0);
      setView('reader');
    }
  }

  // ── Lecteur ─────────────────────────────────────────────────────────────────
  if (view === 'reader' && selectedBook) {
    const currentChapter = selectedBook.chapters[chapter];
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Barre du haut */}
        <View style={[s.readerTopBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setView('detail')}>
            <AppIcon icon={X} size={18} color={colors.primary} strokeWidth={2.6} />
          </TouchableOpacity>
          <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14, flex: 1, textAlign: 'center' }} numberOfLines={1}>
            {selectedBook.title}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            {chapter + 1}/{selectedBook.chapters.length}
          </Text>
        </View>

        {/* Navigation chapitres */}
        <View style={[s.chapterNav, { backgroundColor: colors.surfaceSecondary }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>
            {selectedBook.chapters.map((ch, idx) => (
              <TouchableOpacity
                key={ch.id}
                onPress={() => setChapter(idx)}
                style={[s.chapterPill, {
                  backgroundColor: idx === chapter ? colors.primary : colors.surface,
                  borderColor: colors.border,
                }]}
              >
                <Text style={{ color: idx === chapter ? '#fff' : colors.textSecondary, fontSize: 12 }}>
                  Ch. {ch.order}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Contenu */}
        <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
          <Text style={[s.chapterTitle, { color: colors.text }]}>{currentChapter.title}</Text>
          <Text style={[s.chapterContent, { color: colors.text }]}>{currentChapter.content}</Text>
          <Text style={[s.chapterContent, { color: colors.text }]}>
            {`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`}
          </Text>
        </ScrollView>

        {/* Navigation bas */}
        <View style={[s.readerNav, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            disabled={chapter === 0}
            onPress={() => setChapter(chapter - 1)}
            style={{ opacity: chapter === 0 ? 0.3 : 1, padding: 8 }}
          >
            <View style={s.readerNavBtn}>
              <AppIcon icon={ArrowLeft} size={16} color={colors.primary} strokeWidth={2.6} />
              <Text style={{ color: colors.primary }}>Précédent</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={chapter === selectedBook.chapters.length - 1}
            onPress={() => setChapter(chapter + 1)}
            style={{ opacity: chapter === selectedBook.chapters.length - 1 ? 0.3 : 1, padding: 8 }}
          >
            <View style={s.readerNavBtn}>
              <Text style={{ color: colors.primary }}>Suivant</Text>
              <AppIcon icon={ArrowRight} size={16} color={colors.primary} strokeWidth={2.6} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Détail du livre ──────────────────────────────────────────────────────────
  if (view === 'detail' && selectedBook) {
    const isFree = selectedBook.access === 'free';
    const canRead = isFree || isSubscribed;

    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[s.header, { backgroundColor: '#1A1A3E' }]}>
          <BackButton variant="dark" onPress={() => setView('list')} style={{ marginBottom: 16 }} />
          <View style={{ alignItems: 'center', paddingBottom: 24 }}>
            <View>
              <AppIcon icon={BookOpen} size={64} color="#C9A84C" strokeWidth={1.6} />
              {!isFree && (
                <View style={[s.detailLockBadge, { backgroundColor: colors.primary }]}>
                  <AppIcon icon={Lock} size={16} color="#fff" strokeWidth={2.6} />
                </View>
              )}
            </View>
            <Text style={[s.detailTitle, { color: '#fff' }]}>{selectedBook.title}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>{selectedBook.author}</Text>
            <View style={s.badgesRow}>
              <View style={[s.badge, { backgroundColor: 'rgba(201,168,76,0.2)', borderColor: '#C9A84C' }]}>
                <View style={s.badgeRow}>
                  <AppIcon icon={Folder} size={14} color="#C9A84C" strokeWidth={2.4} />
                  <Text style={{ color: '#C9A84C', fontSize: 12 }}>{selectedBook.category}</Text>
                </View>
              </View>
              <View style={[s.badge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{selectedBook.pages} pages</Text>
              </View>
              <View style={[s.badge, {
                backgroundColor: isFree ? 'rgba(16,185,129,0.2)' : 'rgba(124,58,237,0.2)',
                borderColor: isFree ? '#10B981' : '#A78BFA',
              }]}>
                <View style={s.badgeRow}>
                  <AppIcon icon={isFree ? Check : Crown} size={14} color={isFree ? '#10B981' : '#A78BFA'} strokeWidth={2.4} />
                  <Text style={{ color: isFree ? '#10B981' : '#A78BFA', fontSize: 12 }}>
                    {isFree ? 'Gratuit' : 'Premium'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.base }}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>À propos</Text>
          <Text style={[s.description, { color: colors.textSecondary }]}>{selectedBook.description}</Text>

          <Text style={[s.sectionTitle, { color: colors.text, marginTop: 24 }]}>
            Chapitres ({selectedBook.chapters.length})
          </Text>
          {selectedBook.chapters.map((ch) => (
            <View key={ch.id} style={[s.chapterRow, { borderColor: colors.border }]}>
              <View style={[s.chapterNum, { backgroundColor: canRead ? colors.primary : colors.textTertiary }]}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{ch.order}</Text>
              </View>
              <Text style={{ color: colors.text, flex: 1, fontSize: 14 }}>{ch.title}</Text>
              {!canRead && <AppIcon icon={Lock} size={14} color={colors.textSecondary} />}
            </View>
          ))}

          {canRead ? (
            <Button
              label="Commencer la lecture"
              variant="gold"
              fullWidth
              size="lg"
              style={{ marginTop: 24 }}
              onPress={handleReadButton}
            />
          ) : (
            <View style={{ marginTop: 24, gap: 12 }}>
              <View style={[s.premiumBanner, { backgroundColor: colors.primaryPale ?? '#EDE9FE', borderColor: colors.primary }]}>
                <AppIcon icon={Crown} size={26} color={colors.primary} strokeWidth={2.2} />
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15, textAlign: 'center' }}>
                  Contenu Premium
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20 }}>
                  Abonnez-vous pour accéder à ce livre et à toute la bibliothèque spirituelle.
                </Text>
              </View>
              <Button
                label="S'abonner pour lire"
                variant="primary"
                fullWidth
                size="lg"
                icon={<AppIcon icon={Crown} size={18} color="#fff" strokeWidth={2.2} />}
                onPress={() => router.push('/(app)/subscription')}
              />
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Liste des livres ────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[s.header, { backgroundColor: '#1A1A3E', padding: spacing.base, paddingTop: 56 }]}>
        <View style={s.headerTitleRow}>
          <AppIcon icon={BookOpen} size={24} color="#fff" strokeWidth={2.2} />
          <Text style={s.headerTitle}>Bibliothèque</Text>
        </View>
        <Text style={s.headerSub}>{BOOKS_DATA.length} livres spirituels disponibles</Text>
        {!isSubscribed && (
          <View style={[s.freeBanner, { backgroundColor: 'rgba(201,168,76,0.15)', borderColor: '#C9A84C' }]}>
            <View style={s.freeBannerRow}>
              <AppIcon icon={Lightbulb} size={14} color="#C9A84C" strokeWidth={2.4} />
              <Text style={{ color: '#C9A84C', fontSize: 12 }}>
                1 livre gratuit · Abonnez-vous pour tout débloquer
              </Text>
            </View>
          </View>
        )}
      </View>
      <FlatList
        data={BOOKS_DATA}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.base, gap: 12 }}
        renderItem={({ item }) => <BookCard book={item} onPress={() => openDetail(item)} />}
      />
    </View>
  );
}

export default function LibraryScreen() {
  return <LibraryContent />;
}

const s = StyleSheet.create({
  // Liste
  header: { paddingHorizontal: 16 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  freeBanner: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  freeBannerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  card: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  cover: { width: 72, height: 100, alignItems: 'center', justifyContent: 'center' },
  lockBadge: { position: 'absolute', bottom: 4, right: 4, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bookTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  author: { fontSize: 12, marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaTag: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  // Détail
  detailTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  detailLockBadge: { position: 'absolute', top: 0, right: -8, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 24 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  chapterNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  premiumBanner: { padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  // Lecteur
  readerTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, borderBottomWidth: 1 },
  chapterNav: { paddingVertical: 8 },
  chapterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chapterTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  chapterContent: { fontSize: 16, lineHeight: 28 },
  readerNav: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderTopWidth: 1 },
  readerNavBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
