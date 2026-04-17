import React, { useEffect, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  ScrollView,
} from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { router } from 'expo-router';
import {
  BookOpen,
  Check,
  Crown,
  Folder,
  Lightbulb,
  Lock,
  RefreshCw,
  ShieldBan,
  X,
} from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { useI18n } from '../../../../src/i18n';
import { useTheme } from '../../../../src/theme';
import { useSubscription } from '../../../../src/hooks/useSubscription';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { Button } from '../../../../src/components/common/Button';
import { BackButton } from '../../../../src/components/common/BackButton';
import { EmptyState } from '../../../../src/components/common/EmptyState';
import { LoadingSpinner } from '../../../../src/components/common/LoadingSpinner';
import { LibraryService, type LibraryBook } from '../../../../src/services/library.service';
import { StorageService } from '../../../../src/services/storage.service';
import { STORAGE_KEYS } from '../../../../src/utils/constants';

type LibraryView = 'list' | 'detail' | 'reader';

function BookCard({ book, onPress }: { book: LibraryBook; onPress: () => void }) {
  const { colors, shadows, borderRadius: br } = useTheme();
  const { t } = useI18n();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border, ...shadows.md }]}
    >
      <View style={[s.cover, { backgroundColor: colors.surfaceSecondary, borderRadius: br.md }]}>
        <AppIcon icon={BookOpen} size={40} color={colors.primary} strokeWidth={1.8} />
        <View
          style={[
            s.lockBadge,
            { backgroundColor: book.isLocked ? colors.primary : '#10B981' },
          ]}
        >
          <AppIcon
            icon={book.isLocked ? Lock : Check}
            size={12}
            color="#fff"
            strokeWidth={2.6}
          />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.bookTitle, { color: colors.text }]} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={[s.author, { color: colors.textSecondary }]}>
          {book.author || t.library.defaultAuthor}
        </Text>
        <View style={s.metaRow}>
          {book.category ? (
            <Text
              style={[
                s.metaTag,
                { backgroundColor: colors.surfaceSecondary, color: colors.textSecondary },
              ]}
            >
              {book.category}
            </Text>
          ) : null}
          {book.pages ? (
            <Text
              style={[
                s.metaTag,
                { backgroundColor: colors.surfaceSecondary, color: colors.textSecondary },
              ]}
            >
              {t.library.pages(book.pages)}
            </Text>
          ) : null}
          <Text
            style={[
              s.metaTag,
              book.isFree
                ? { backgroundColor: '#D1FAE5', color: '#10B981' }
                : { backgroundColor: colors.primaryPale ?? '#EDE9FE', color: colors.primary },
            ]}
          >
            {book.isFree ? t.common.free : t.common.premium}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function LibraryContent() {
  const { colors, spacing } = useTheme();
  const { t, language } = useI18n();
  const { isActive: isSubscribed } = useSubscription();
  const [view, setView] = useState<LibraryView>('list');
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerError, setReaderError] = useState<string | null>(null);
  const [readerToken, setReaderToken] = useState<string | null>(null);
  const [readerWebUrl, setReaderWebUrl] = useState<string | null>(null);
  const [readerAttempt, setReaderAttempt] = useState(0);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    ScreenCapture.preventScreenCaptureAsync().catch(() => undefined);

    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function run() {
      setIsLoading(true);
      const nextBooks = await LibraryService.getAll();

      if (isCancelled) {
        return;
      }

      setBooks(nextBooks);

      // Refresh the selected book without adding it to deps (avoids infinite loop).
      // Use functional update so we read the latest selectedBook without depending on it.
      setSelectedBook((prev) => {
        if (!prev) return null;
        return nextBooks.find((book) => book.id === prev.id) ?? null;
      });

      setIsLoading(false);
    }

    void run();

    return () => {
      isCancelled = true;
    };
  }, [isSubscribed, reloadNonce]);

  // If the selected book disappears (e.g. unpublished), go back to list.
  useEffect(() => {
    if (!selectedBook) {
      setView((currentView) => (currentView === 'list' ? currentView : 'list'));
    }
  }, [selectedBook]);

  useEffect(() => {
    if (view !== 'reader' || !selectedBook) {
      setReaderToken(null);
      setReaderError(null);
      return;
    }

    const currentBook = selectedBook;
    let isCancelled = false;

    async function prepareReader() {
      setReaderLoading(true);
      setReaderError(null);

      const token = await StorageService.get<string>(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        if (!isCancelled) {
          setReaderError(t.library.sessionExpired);
          setReaderLoading(false);
        }
        return;
      }

      if (Platform.OS === 'web') {
        try {
          const response = await fetch(LibraryService.getFileUrl(currentBook.id), {
            headers: { Authorization: `Bearer ${token}`, 'Accept-Language': language },
          });

          if (!response.ok) {
            throw new Error(`Erreur ${response.status}`);
          }

          const blob = await response.blob();
          const nextUrl = URL.createObjectURL(blob);

          if (isCancelled) {
            URL.revokeObjectURL(nextUrl);
            return;
          }

          setReaderWebUrl((previousUrl) => {
            if (previousUrl) {
              URL.revokeObjectURL(previousUrl);
            }
            return nextUrl;
          });
        } catch (error) {
          if (!isCancelled) {
            setReaderError(
              error instanceof Error
                ? error.message
                : t.library.pdfLoadError,
            );
          }
        } finally {
          if (!isCancelled) {
            setReaderLoading(false);
          }
        }

        return;
      }

      if (!isCancelled) {
        setReaderToken(token);
        setReaderLoading(false);
      }
    }

    prepareReader();

    return () => {
      isCancelled = true;
    };
  }, [language, readerAttempt, t.library.pdfLoadError, t.library.sessionExpired, view, selectedBook]);

  useEffect(() => {
    return () => {
      if (readerWebUrl) {
        URL.revokeObjectURL(readerWebUrl);
      }
    };
  }, [readerWebUrl]);

  function openDetail(book: LibraryBook) {
    setSelectedBook(book);
    setView('detail');
  }

  function closeReader() {
    setReaderToken(null);
    setReaderError(null);
    setReaderLoading(false);
    setReaderWebUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      return null;
    });
    setView('detail');
  }

  async function handleReadButton() {
    if (!selectedBook) return;

    if (selectedBook.isLocked) {
      router.push('/(app)/subscription');
      return;
    }

    setReaderAttempt((currentAttempt) => currentAttempt + 1);
    setView('reader');
  }

  if (view === 'reader' && selectedBook) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={[
            s.readerTopBar,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity onPress={closeReader}>
            <AppIcon icon={X} size={18} color={colors.primary} strokeWidth={2.6} />
          </TouchableOpacity>
          <Text
            style={{
              color: colors.text,
              fontWeight: '600',
              fontSize: 14,
              flex: 1,
              textAlign: 'center',
            }}
            numberOfLines={1}
          >
            {selectedBook.title}
          </Text>
          <View style={{ width: 18 }} />
        </View>

        {readerLoading ? (
          <LoadingSpinner fullScreen message={t.library.readerLoading} />
        ) : readerError ? (
          <EmptyState
            icon={<AppIcon icon={ShieldBan} size={46} color={colors.primary} strokeWidth={2} />}
            title={t.library.readerUnavailableTitle}
            message={readerError}
            actionLabel={t.common.retry}
            onAction={() => setReaderAttempt((currentAttempt) => currentAttempt + 1)}
          />
        ) : Platform.OS === 'web' ? (
          readerWebUrl ? (
            // react-native-webview does not support web — use a plain iframe instead
            React.createElement('iframe', {
              src: readerWebUrl,
              style: { flex: 1, width: '100%', height: '100%', border: 'none' },
            })
          ) : (
            <LoadingSpinner fullScreen message={t.library.readerPreparing} />
          )
        ) : readerToken ? (
          <WebView
            source={{
              uri: LibraryService.getFileUrl(selectedBook.id),
              headers: { Authorization: `Bearer ${readerToken}`, 'Accept-Language': language },
            }}
            style={s.readerWebview}
            startInLoadingState
            renderLoading={() => <LoadingSpinner fullScreen message={t.library.readerLoading} />}
          />
        ) : (
          <LoadingSpinner fullScreen message={t.library.readerPreparing} />
        )}
      </View>
    );
  }

  if (view === 'detail' && selectedBook) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[s.header, { backgroundColor: '#1A1A3E' }]}>
          <BackButton
            variant="dark"
            onPress={() => setView('list')}
            style={{ marginBottom: 16 }}
          />
          <View style={{ alignItems: 'center', paddingBottom: 24 }}>
            <View>
              <AppIcon icon={BookOpen} size={64} color="#C9A84C" strokeWidth={1.6} />
              {selectedBook.isLocked ? (
                <View style={[s.detailLockBadge, { backgroundColor: colors.primary }]}>
                  <AppIcon icon={Lock} size={16} color="#fff" strokeWidth={2.6} />
                </View>
              ) : null}
            </View>
            <Text style={[s.detailTitle, { color: '#fff' }]}>{selectedBook.title}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>
              {selectedBook.author || t.library.defaultAuthor}
            </Text>
            <View style={s.badgesRow}>
              {selectedBook.category ? (
                <View
                  style={[
                    s.badge,
                    { backgroundColor: 'rgba(201,168,76,0.2)', borderColor: '#C9A84C' },
                  ]}
                >
                  <View style={s.badgeRow}>
                    <AppIcon icon={Folder} size={14} color="#C9A84C" strokeWidth={2.4} />
                    <Text style={{ color: '#C9A84C', fontSize: 12 }}>
                      {selectedBook.category}
                    </Text>
                  </View>
                </View>
              ) : null}
              {selectedBook.pages ? (
                <View style={[s.badge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                    {t.library.pages(selectedBook.pages)}
                  </Text>
                </View>
              ) : null}
              <View
                style={[
                  s.badge,
                  selectedBook.isFree
                    ? { backgroundColor: 'rgba(16,185,129,0.2)', borderColor: '#10B981' }
                    : { backgroundColor: 'rgba(124,58,237,0.2)', borderColor: '#A78BFA' },
                ]}
              >
                <View style={s.badgeRow}>
                  <AppIcon
                    icon={selectedBook.isFree ? Check : Crown}
                    size={14}
                    color={selectedBook.isFree ? '#10B981' : '#A78BFA'}
                    strokeWidth={2.4}
                  />
                  <Text
                    style={{
                      color: selectedBook.isFree ? '#10B981' : '#A78BFA',
                      fontSize: 12,
                    }}
                  >
                    {selectedBook.isFree ? t.common.free : t.common.premium}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.base }}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>
            {t.library.sectionAbout}
          </Text>
          <Text style={[s.description, { color: colors.textSecondary }]}>
            {selectedBook.description || t.library.noDescription}
          </Text>

          <View style={[s.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={s.infoRow}>
              <Text style={{ color: colors.textSecondary }}>{t.library.formatLabel}</Text>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{t.library.formatPdf}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={{ color: colors.textSecondary }}>{t.library.accessLabel}</Text>
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                {selectedBook.isFree ? t.library.accessFree : t.library.accessSubscribers}
              </Text>
            </View>
            <View style={s.infoRow}>
              <Text style={{ color: colors.textSecondary }}>{t.library.statusLabel}</Text>
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                {selectedBook.canRead ? t.library.statusAvailable : t.library.statusLocked}
              </Text>
            </View>
          </View>

          {selectedBook.canRead ? (
            <Button
              label={t.library.startReading}
              variant="gold"
              fullWidth
              size="lg"
              style={{ marginTop: 24 }}
              onPress={handleReadButton}
            />
          ) : (
            <View style={{ marginTop: 24, gap: 12 }}>
              <View
                style={[
                  s.premiumBanner,
                  {
                    backgroundColor: colors.primaryPale ?? '#EDE9FE',
                    borderColor: colors.primary,
                  },
                ]}
              >
                <AppIcon icon={Crown} size={26} color={colors.primary} strokeWidth={2.2} />
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: '700',
                    fontSize: 15,
                    textAlign: 'center',
                  }}
                >
                  {t.library.premiumTitle}
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    textAlign: 'center',
                    marginTop: 4,
                    lineHeight: 20,
                  }}
                >
                  {t.library.premiumMsg}
                </Text>
              </View>
              <Button
                label={t.library.subscribeRead}
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[
          s.header,
          { backgroundColor: '#1A1A3E', padding: spacing.base, paddingTop: 56 },
        ]}
      >
        <View style={s.headerTitleRow}>
          <AppIcon icon={BookOpen} size={24} color="#fff" strokeWidth={2.2} />
          <Text style={s.headerTitle}>{t.library.title}</Text>
        </View>
        <Text style={s.headerSub}>{t.library.subtitle(books.length)}</Text>
        {!isSubscribed && books.some((book) => book.isFree) ? (
          <View
            style={[
              s.freeBanner,
              { backgroundColor: 'rgba(201,168,76,0.15)', borderColor: '#C9A84C' },
            ]}
          >
            <View style={s.freeBannerRow}>
              <AppIcon icon={Lightbulb} size={14} color="#C9A84C" strokeWidth={2.4} />
              <Text style={{ color: '#C9A84C', fontSize: 12 }}>
                {t.library.freeBanner}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen message={t.common.loading} />
      ) : books.length === 0 ? (
        <EmptyState
          icon={<AppIcon icon={BookOpen} size={48} color={colors.primary} strokeWidth={2} />}
          title={t.library.emptyTitle}
          message={t.library.emptyMsg}
          actionLabel={t.common.refresh}
          onAction={() => setReloadNonce((currentNonce) => currentNonce + 1)}
        />
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.base, gap: 12 }}
          renderItem={({ item }) => <BookCard book={item} onPress={() => openDetail(item)} />}
          ListFooterComponent={
            <Button
              label={t.library.refreshLibrary}
              variant="ghost"
              icon={<AppIcon icon={RefreshCw} size={16} color={colors.primary} strokeWidth={2.2} />}
              onPress={() => setReloadNonce((currentNonce) => currentNonce + 1)}
              style={{ marginTop: 8, marginBottom: spacing.lg }}
            />
          }
        />
      )}
    </View>
  );
}

export default function LibraryScreen() {
  return <LibraryContent />;
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 16 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  freeBanner: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  freeBannerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  card: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  cover: { width: 72, height: 100, alignItems: 'center', justifyContent: 'center' },
  lockBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  author: { fontSize: 12, marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaTag: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  detailTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  detailLockBadge: {
    position: 'absolute',
    top: 0,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 24 },
  infoCard: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  premiumBanner: { padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  readerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  readerWebview: { flex: 1 },
});
