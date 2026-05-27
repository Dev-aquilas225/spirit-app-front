import { router } from 'expo-router';
import { Eye, History, MessageCircle, User } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ChatBubble } from '../../../src/components/ai/ChatBubble';
import { ChatInput } from '../../../src/components/ai/ChatInput';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { EmptyState } from '../../../src/components/common/EmptyState';
import { FadeInView } from '../../../src/components/common/FadeInView';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';

import { useAIChat } from '../../../src/hooks/useAIChat';
import { useAccess } from '../../../src/hooks/useAccess';
import { useAuthStore } from '../../../src/store/auth.store';
import { useTheme } from '../../../src/theme';
import { AIConversation } from '../../../src/types/content.types';
import { formatDate, truncateText } from '../../../src/utils/helpers';
import { Testimonials } from '../../../src/components/home/Testimonials';

type TabView = 'chat' | 'history';

export default function FuturScreen() {
  const { colors, spacing } = useTheme();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.firstName?.trim() || user?.name?.split(' ')[0] || '';
  const [view, setView] = useState<TabView>('chat');
  const { hasSubscription, canPerform } = useAccess();
  // Accès autorisé si abonné OU si l'utilisateur a assez de crédits
  const canAccess = hasSubscription || canPerform('prophetic_consultation');

  const {
    messages,
    conversations,
    isLoading,
    isSending,
    startNewConversation,
    sendMessage,
    loadConversation,
    deleteConversation,
  } = useAIChat('consultation');

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => { startNewConversation(); }, [startNewConversation]);

  useEffect(() => {
    if (messages.length > 0) {
      const t = setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
      return () => clearTimeout(t);
    }
  }, [messages.length]);

  function handleDeleteConv(conv: AIConversation) {
    Alert.alert('Supprimer', 'Supprimer cette consultation ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteConversation(conv.id) },
    ]);
  }

  if (!canAccess) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#0D1B2A' }}>
        <AppIcon icon={Eye} size={52} color="#34D399" strokeWidth={1.6} />
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 20, textAlign: 'center' }}>
          Crédits insuffisants
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 22 }}>
          Rechargez vos crédits pour accéder à la guidance prophétique.
        </Text>
      </View>
    );
  }

  // ── Header ──────────────────────────────────────────────────────────────────
  const HeaderBlock = (
    <View style={[s.header, { backgroundColor: '#0D1B2A' }]}>
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={s.headerTitleRow}>
            <AppIcon icon={Eye} size={18} color="#34D399" strokeWidth={2.6} />
            <Text style={s.headerTitle}>
              {view === 'chat' ? 'Connaître le futur' : 'Mes consultations'}
            </Text>
          </View>
          <Text style={s.headerSub}>
            {view === 'chat'
              ? 'Guidance prophétique & révélation spirituelle'
              : 'Historique de vos consultations'}
          </Text>
        </View>

        {view === 'chat' && (
          <TouchableOpacity
            onPress={() => setView('history')}
            style={[s.iconBtn, { backgroundColor: 'rgba(255,255,255,0.10)' }]}
            activeOpacity={0.8}
          >
            <AppIcon icon={History} size={18} color="#fff" strokeWidth={2.2} />
          </TouchableOpacity>
        )}

        {view === 'history' && (
          <TouchableOpacity
            onPress={() => setView('chat')}
            style={[s.iconBtn, { backgroundColor: 'rgba(255,255,255,0.10)' }]}
            activeOpacity={0.8}
          >
            <AppIcon icon={MessageCircle} size={18} color="#fff" strokeWidth={2.2} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => router.push('/profile')}
          style={[s.iconBtn, { backgroundColor: 'rgba(255,255,255,0.10)', marginLeft: 4 }]}
          activeOpacity={0.8}
        >
          <AppIcon icon={User} size={18} color="#fff" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Historique ───────────────────────────────────────────────────────────────
  if (view === 'history') {
    return (
      <FadeInView style={{ flex: 1, backgroundColor: colors.background }}>
        {HeaderBlock}
        {conversations.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <EmptyState
              icon={<AppIcon icon={Eye} size={48} color="#34D399" strokeWidth={1.8} />}
              title="Aucune consultation"
              message="Posez votre première question prophétique pour recevoir une guidance spirituelle."
              actionLabel="Nouvelle consultation"
              onAction={() => setView('chat')}
            />
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: spacing.base }}
            renderItem={({ item }) => {
              const preview =
                item?.title?.trim() ||
                item.messages.find((m) => m.role === 'user')?.content?.trim() ||
                item.messages[0]?.content?.trim();
              return (
                <TouchableOpacity
                  onPress={async () => { await loadConversation(item.id); setView('chat'); }}
                  onLongPress={() => handleDeleteConv(item)}
                  style={[s.convCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  activeOpacity={0.85}
                >
                  <View style={s.convIcon}>
                    <AppIcon icon={MessageCircle} size={16} color="#34D399" strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: colors.text, fontSize: 14 }}>
                      {preview ? truncateText(preview, 45) : 'Consultation prophétique'}
                    </Text>
                    <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 4 }}>
                      {item.messages.length} échange(s) • {formatDate(item.updatedAt || item.createdAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </FadeInView>
    );
  }

  // ── Chat ─────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FadeInView style={{ flex: 1 }}>
        {HeaderBlock}

        {isLoading ? (
          <LoadingSpinner fullScreen message="Connexion prophétique..." />
        ) : messages.length === 0 ? (
          <ScrollView contentContainerStyle={{ paddingVertical: 24, gap: 24 }} showsVerticalScrollIndicator={false}>
            <Testimonials />
          </ScrollView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => <ChatBubble message={item} isLatest={index === messages.length - 1 && item.role === 'assistant'} />}
            contentContainerStyle={{ paddingVertical: 16 }}
          />
        )}

        {isSending && (
          <View style={[s.typing, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <ActivityIndicator size="small" color="#34D399" style={{ marginRight: 4 }} />
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontStyle: 'italic', fontWeight: '500' }}>
              Le prophète consulte les révélations…
            </Text>
          </View>
        )}

        <ChatInput
          onSend={sendMessage}
          loading={isSending}
          placeholder="Posez votre question prophétique ici…"
        />
      </FadeInView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header:         { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16 },
  headerRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle:    { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  headerSub:      { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2, fontWeight: '500' },
  iconBtn:        { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  convCard:       { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  convIcon:       { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(52,211,153,0.10)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  emptyChat:      { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  illustrationCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(52,211,153,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)' },
  emptyTitle:     { fontSize: 20, fontWeight: '800', textAlign: 'center', letterSpacing: 0.2 },
  emptySub:       { fontSize: 14, textAlign: 'center', marginTop: 12, lineHeight: 22, paddingHorizontal: 8 },
  suggestion:     { padding: 14, borderRadius: 12, borderWidth: 1 },
  suggestionRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bullet:         { width: 6, height: 6, borderRadius: 3 },
  typing:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 0.5 },
});
