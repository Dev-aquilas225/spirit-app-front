import { Heart, History, MessageCircle, Shield } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView,
  Platform, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';

import { ChatBubble } from '../../../src/components/ai/ChatBubble';
import { ChatInput } from '../../../src/components/ai/ChatInput';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { BackButton } from '../../../src/components/common/BackButton';
import { EmptyState } from '../../../src/components/common/EmptyState';
import { FadeInView } from '../../../src/components/common/FadeInView';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { useAIChat } from '../../../src/hooks/useAIChat';
import { useAccess } from '../../../src/hooks/useAccess';
import { useAuthStore } from '../../../src/store/auth.store';
import { useTheme } from '../../../src/theme';
import { AIConversation } from '../../../src/types/content.types';
import { formatDate, truncateText } from '../../../src/utils/helpers';

type TabView = 'chat' | 'history';

export default function AccompagnementsScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.firstName?.trim() || user?.name?.split(' ')[0] || '';
  const [view, setView] = useState<TabView>('chat');
  const { hasSubscription, canPerform } = useAccess();
  const canAccess = hasSubscription || canPerform('accompagnement');

  const {
    messages, conversations, isLoading, isSending,
    startNewConversation, sendMessage, loadConversation, deleteConversation,
  } = useAIChat('accompagnement');

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => { startNewConversation(); }, [startNewConversation]);

  useEffect(() => {
    if (messages.length > 0) {
      const t = setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
      return () => clearTimeout(t);
    }
  }, [messages.length]);

  function handleDelete(conv: AIConversation) {
    Alert.alert('Supprimer', 'Supprimer ce suivi ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteConversation(conv.id) },
    ]);
  }

  if (!canAccess) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#080B14' }}>
        <AppIcon icon={Shield} size={52} color="#F472B6" strokeWidth={1.6} />
        <Text style={{ color: '#F0EDE8', fontSize: 20, fontWeight: '800', marginTop: 20, textAlign: 'center' }}>Crédits insuffisants</Text>
        <Text style={{ color: 'rgba(240,237,232,0.45)', fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 22 }}>
          Rechargez vos crédits pour accéder au suivi spirituel.
        </Text>
      </View>
    );
  }

  const HeaderBlock = (
    <View style={[s.header, { backgroundColor: '#080B14' }]}>
      <View style={s.headerRow}>
        <BackButton />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <View style={s.titleRow}>
            <AppIcon icon={Heart} size={16} color="#F472B6" strokeWidth={2.6} />
            <Text style={s.title}>{view === 'chat' ? 'Suivi spirituel' : 'Mes suivis'}</Text>
          </View>
          <Text style={s.sub}>Accompagnement personnalisé par l'IA</Text>
        </View>
        <TouchableOpacity
          onPress={() => setView(view === 'chat' ? 'history' : 'chat')}
          style={[s.iconBtn, { backgroundColor: 'rgba(255,255,255,0.08)' }]}
          activeOpacity={0.8}
        >
          <AppIcon icon={view === 'chat' ? History : MessageCircle} size={18} color="#fff" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (view === 'history') {
    return (
      <FadeInView style={{ flex: 1, backgroundColor: colors.background }}>
        {HeaderBlock}
        {conversations.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <EmptyState
              icon={<AppIcon icon={Heart} size={48} color="#F472B6" strokeWidth={1.8} />}
              title="Aucun suivi"
              message="Commencez votre premier suivi spirituel personnalisé."
              actionLabel="Nouveau suivi"
              onAction={() => setView('chat')}
            />
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => {
              const preview = item?.title?.trim() || item.messages.find((m) => m.role === 'user')?.content?.trim();
              return (
                <TouchableOpacity
                  onPress={async () => { await loadConversation(item.id); setView('chat'); }}
                  onLongPress={() => handleDelete(item)}
                  style={[s.convCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  activeOpacity={0.85}
                >
                  <View style={s.convIcon}>
                    <AppIcon icon={Heart} size={16} color="#F472B6" strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: colors.text, fontSize: 14 }}>
                      {preview ? truncateText(preview, 45) : 'Suivi spirituel'}
                    </Text>
                    <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 4 }}>
                      {item.messages.length} échange(s) · {formatDate(item.updatedAt || item.createdAt)}
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FadeInView style={{ flex: 1 }}>
        {HeaderBlock}
        {isLoading ? (
          <LoadingSpinner fullScreen message="Connexion au guide spirituel…" />
        ) : messages.length === 0 ? (
          <View style={{ flex: 1 }} />
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
            <ActivityIndicator size="small" color="#F472B6" style={{ marginRight: 6 }} />
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontStyle: 'italic' }}>
              Votre guide prépare une réponse…
            </Text>
          </View>
        )}
        <ChatInput onSend={sendMessage} loading={isSending} placeholder="Partagez votre situation spirituelle…" />
      </FadeInView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header:   { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16 },
  headerRow:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title:    { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  sub:      { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  iconBtn:  { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  convCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  convIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(244,114,182,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  typing:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 0.5 },
});
