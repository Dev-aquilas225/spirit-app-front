import { Heart, History, MessageCircle, User } from "lucide-react-native";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useAccess } from "../../../src/hooks/useAccess";

import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatBubble } from "../../../src/components/ai/ChatBubble";
import { ChatInput } from "../../../src/components/ai/ChatInput";
import { AppIcon } from "../../../src/components/common/AppIcon";
import { BackButton } from "../../../src/components/common/BackButton";
import { EmptyState } from "../../../src/components/common/EmptyState";
import { LoadingSpinner } from "../../../src/components/common/LoadingSpinner";
import { FadeInView } from "../../../src/components/common/FadeInView";

import { useAIChat } from "../../../src/hooks/useAIChat";
import { useI18n } from "../../../src/i18n";
import { useAuthStore } from "../../../src/store/auth.store";
import { useTheme } from "../../../src/theme";

import { AIConversation } from "../../../src/types/content.types";
import { formatDate, truncateText } from "../../../src/utils/helpers";

type PrayerView = "chat" | "history";

export default function PrayerProgramScreen() {
  const { colors, spacing } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const firstName =
    user?.firstName?.trim() ||
    user?.name?.split(" ")[0] ||
    "";

  const [view, setView] = useState<PrayerView>("chat");

  const { hasSubscription, canPerform } = useAccess();
  const canAccess = hasSubscription || canPerform('prayer_generation');

  const {
    messages,
    conversations,
    isLoading,
    isSending,
    startNewConversation,
    sendMessage,
    loadConversation,
    deleteConversation,
  } = useAIChat("prayer");

  const flatListRef = useRef<FlatList>(null);

  // ─────────────────────────────────────────────
  // Nouvelle conversation
  // ─────────────────────────────────────────────
  useEffect(() => {
    startNewConversation();
  }, [startNewConversation]);

  // ─────────────────────────────────────────────
  // Scroll automatique
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({
          animated: true,
        });
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  // ─────────────────────────────────────────────
  // Envoi message
  // ─────────────────────────────────────────────
  async function handleSend(text: string) {
    await sendMessage(text);
  }

  // ─────────────────────────────────────────────
  // Suppression conversation
  // ─────────────────────────────────────────────
  function handleDeleteConv(conv: AIConversation) {
    Alert.alert(
      "Supprimer",
      "Supprimer cette session de prière ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deleteConversation(conv.id),
        },
      ]
    );
  }

  // ─────────────────────────────────────────────
  // Guard Premium
  // ─────────────────────────────────────────────
  if (!canAccess) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.deepBlue ?? '#1A1A3E' }}>
        <AppIcon icon={Heart} size={52} color="#C9A84C" strokeWidth={1.6} />
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 20, textAlign: 'center' }}>
          Crédits insuffisants
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 22 }}>
          Rechargez vos crédits pour accéder à l'accompagnement de prière.
        </Text>
      </View>
    );
  }

  // ─────────────────────────────────────────────
  // Header
  // ─────────────────────────────────────────────
  const HeaderBlock = (
    <View
      style={[
        s.header,
        {
          backgroundColor: colors.deepBlue ?? "#1A1A3E",
          paddingTop: insets.top + 12,
        },
      ]}
    >
      <View style={s.headerRow}>
        <BackButton
          variant="dark"
          fallback="/home"
          style={{ marginRight: 8 }}
          onPress={
            view === "history"
              ? () => setView("chat")
              : undefined
          }
        />

        <View style={{ flex: 1 }}>
          <View style={s.headerTitleRow}>
            <AppIcon
              icon={Heart}
              size={18}
              color="#C9A84C"
              strokeWidth={2.6}
            />

            <Text style={s.headerTitle}>
              {view === "chat"
                ? "Prophète Georges"
                : "Mes sessions de prière"}
            </Text>
          </View>

          <Text style={s.headerSub}>
            {view === "chat"
              ? "Accompagnement et prière prophétique"
              : "Historique de vos requêtes au Seigneur"}
          </Text>
        </View>

        {/* Bouton historique */}
        {view === "chat" && (
          <TouchableOpacity
            onPress={() => setView("history")}
            style={[s.iconBtn, { backgroundColor: "rgba(255,255,255,0.12)" }]}
            activeOpacity={0.8}
          >
            <AppIcon icon={History} size={18} color="#fff" strokeWidth={2.2} />
          </TouchableOpacity>
        )}
        {/* Bouton profil */}
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          style={[s.iconBtn, { backgroundColor: "rgba(255,255,255,0.12)", marginLeft: 4 }]}
          activeOpacity={0.8}
        >
          <AppIcon icon={User} size={18} color="#fff" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─────────────────────────────────────────────
  // Vue Historique
  // ─────────────────────────────────────────────
  if (view === "history") {
    return (
      <FadeInView
        style={{
          flex: 1,
          backgroundColor: colors.background,
        }}
      >
        {HeaderBlock}

        {conversations.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
            }}
          >
            <EmptyState
              icon={
                <AppIcon
                  icon={Heart}
                  size={48}
                  color="#C9A84C"
                  strokeWidth={1.8}
                />
              }
              title="Aucune session enregistrée"
              message="Ouvrez votre cœur et commencez votre premier accompagnement de foi avec le Prophète Georges."
              actionLabel="Lancer une prière"
              onAction={() => setView("chat")}
            />
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              padding: spacing.base,
            }}
            renderItem={({ item }) => {
              const preview =
                item?.title?.trim() ||
                item.messages.find(
                  (m) => m.role === "user"
                )?.content?.trim() ||
                item.messages[0]?.content?.trim();

              return (
                <TouchableOpacity
                  onPress={async () => {
                    await loadConversation(item.id);
                    setView("chat");
                  }}
                  onLongPress={() =>
                    handleDeleteConv(item)
                  }
                  style={[
                    s.convCard,
                    {
                      backgroundColor:
                        colors.surface,
                      borderColor:
                        colors.border,
                    },
                  ]}
                  activeOpacity={0.85}
                >
                  <View style={s.goldIndicatorIcon}>
                    <AppIcon
                      icon={MessageCircle}
                      size={16}
                      color="#C9A84C"
                      strokeWidth={2.2}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontWeight: "700",
                        color: colors.text,
                        fontSize: 14,
                      }}
                    >
                      {preview
                        ? truncateText(preview, 45)
                        : "Session de prière"}
                    </Text>

                    <Text
                      style={{
                        color:
                          colors.textTertiary,
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      {item.messages.length} échange(s)
                      •{" "}
                      {formatDate(
                        item.updatedAt ||
                          item.createdAt
                      )}
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

  // ─────────────────────────────────────────────
  // Vue Chat
  // ─────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <FadeInView style={{ flex: 1 }}>
        {HeaderBlock}

        {isLoading ? (
          <LoadingSpinner
            fullScreen
            message="Connexion spirituelle..."
          />
        ) : messages.length === 0 ? (
          <View style={{ flex: 1 }} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <ChatBubble message={item} isLatest={index === messages.length - 1 && item.role === 'assistant'} />
            )}
            contentContainerStyle={{
              paddingVertical: 16,
            }}
          />
        )}

        {/* Typing */}
        {isSending && (
          <View
            style={[
              s.typing,
              {
                backgroundColor:
                  colors.surface,
                borderTopWidth: 0.5,
                borderTopColor:
                  colors.border,
              },
            ]}
          >
            <View style={s.typingRow}>
              <ActivityIndicator
                size="small"
                color="#C9A84C"
                style={{ marginRight: 4 }}
              />

              <Text
                style={{
                  color:
                    colors.textSecondary,
                  fontSize: 12,
                  fontStyle: "italic",
                  fontWeight: "500",
                }}
              >
                Le Prophète Georges intercède
                pour vous…
              </Text>
            </View>
          </View>
        )}

        <ChatInput
          onSend={handleSend}
          loading={isSending}
          placeholder="Écrivez votre fardeau ou votre prière ici…"
        />
      </FadeInView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.2,
  },

  headerSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    marginTop: 2,
    fontWeight: "500",
  },

  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  convCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    elevation: 1,
  },

  goldIndicatorIcon: {
    width: 40,
    height: 40,
    borderRadius: 17,
    backgroundColor:
      "rgba(201, 168, 76, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  emptyChat: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  illustrationCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor:
      "rgba(201, 168, 76, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor:
      "rgba(201, 168, 76, 0.2)",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.2,
  },

  emptySub: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
    paddingHorizontal: 8,
  },

  suggestion: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },

  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C9A84C",
  },

  typing: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});