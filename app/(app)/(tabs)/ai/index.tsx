import { router } from 'expo-router';
import { Eye, User } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatBubble } from '../../../../src/components/ai/ChatBubble';
import { ChatInput } from '../../../../src/components/ai/ChatInput';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { CreditGate } from '../../../../src/components/credits/CreditGate';
import { NoCreditsBanner } from '../../../../src/components/credits/NoCreditsBanner';
import { useCreditsStore } from '../../../../src/store/credits.store';
import { FadeInView } from '../../../../src/components/common/FadeInView';
import { LoadingSpinner } from '../../../../src/components/common/LoadingSpinner';

import { useAIChat } from '../../../../src/hooks/useAIChat';
import { useAccess } from '../../../../src/hooks/useAccess';
import { useAuthStore } from '../../../../src/store/auth.store';
import { useTheme } from '../../../../src/theme';
import { Testimonials } from '../../../../src/components/home/Testimonials';

/**
 * Onglet "Connaître le futur" — Prophète Georges Tchingankong
 * chatType: 'prophet' → section 'prophetic_consultation' dans le prompt admin
 * Distinct de /consultation/chat (chatType: 'consultation')
 */
export default function FuturScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { hasSubscription, canPerform } = useAccess();
  const fetchBalance = useCreditsStore((s) => s.fetchBalance);
  const canAccess = hasSubscription || canPerform('prophetic_consultation');

  // Resynchroniser le solde depuis le backend à chaque ouverture de l'onglet
  useEffect(() => { fetchBalance().catch(() => {}); }, []);

  const {
    messages,
    isLoading,
    isSending,
    startNewConversation,
    sendMessage,
    creditGateVisible,
    creditAction,
    onCreditSuccess,
    closeCreditGate,
  } = useAIChat('prophet'); // 'prophet' → section 'prophetic_consultation' dans le prompt admin

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => { startNewConversation(); }, [startNewConversation]);

  useEffect(() => {
    if (messages.length > 0) {
      const t = setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
      return () => clearTimeout(t);
    }
  }, [messages.length]);

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
    <View style={[s.header, { backgroundColor: '#0D1B2A', paddingTop: insets.top + 12 }]}>
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={s.headerTitleRow}>
            <AppIcon icon={Eye} size={18} color="#34D399" strokeWidth={2.6} />
            <Text style={s.headerTitle}>Connaître le futur</Text>
          </View>
          <Text style={s.headerSub}>Révélations prophétiques · Prophète Georges</Text>
        </View>
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
            renderItem={({ item, index }) => <ChatBubble message={item} isLatest={index === messages.length - 1 && item.role === 'assistant'} shareType="prophecy" />}
            contentContainerStyle={{ paddingVertical: 16 }}
            removeClippedSubviews
            maxToRenderPerBatch={8}
            windowSize={10}
            inverted={false}
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

        <NoCreditsBanner action="prophetic_consultation" />

        <ChatInput
          onSend={sendMessage}
          loading={isSending}
          placeholder="Posez votre question prophétique ici…"
        />

        <CreditGate
          visible={!!creditGateVisible && !!creditAction}
          action={creditAction}
          onSuccess={onCreditSuccess}
          onClose={closeCreditGate}
        />
      </FadeInView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header:         { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle:    { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  headerSub:      { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2, fontWeight: '500' },
  iconBtn:        { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  typing:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 0.5 },
});
