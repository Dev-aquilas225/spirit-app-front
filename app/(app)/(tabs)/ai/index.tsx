import { router } from "expo-router";
import { Ban, Crown, History, MessageCircle } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ChatBubble } from "../../../../src/components/ai/ChatBubble";
import { ChatInput } from "../../../../src/components/ai/ChatInput";
import { LimitBanner } from "../../../../src/components/ai/LimitBanner";
import { AppIcon } from "../../../../src/components/common/AppIcon";
import { BackButton } from "../../../../src/components/common/BackButton";
import { EmptyState } from "../../../../src/components/common/EmptyState";
import { LoadingSpinner } from "../../../../src/components/common/LoadingSpinner";
import { useAIChat } from "../../../../src/hooks/useAIChat";
import { useTheme } from "../../../../src/theme";
import { AIConversation } from "../../../../src/types/content.types";
import { FREE_AI_DAILY_LIMIT } from "../../../../src/utils/constants";
import { formatDate, truncateText } from "../../../../src/utils/helpers";

type AIView = "chat" | "history";

export default function AIScreen() {
  const { colors, spacing } = useTheme();
  const [view, setView] = useState<AIView>("chat");

  const {
    messages,
    conversations,
    remainingQuestions,
    isPremium,
    isLoading,
    isSending,
    limitReached,
    startNewConversation,
    sendMessage,
    loadConversation,
    deleteConversation,
  } = useAIChat();

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    startNewConversation();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    }
  }, [messages.length]);

  async function handleSend(text: string) {
    if (limitReached) {
      Alert.alert(
        "Limite atteinte",
        `Vous avez utilisé vos ${FREE_AI_DAILY_LIMIT} questions gratuites du jour. Abonnez-vous pour un accès illimité.`,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "S'abonner",
            onPress: () => router.push("/(app)/subscription"),
          },
        ],
      );
      return;
    }
    await sendMessage(text);
  }

  function handleDeleteConv(conv: AIConversation) {
    Alert.alert("Supprimer", "Cette action est irréversible.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => deleteConversation(conv.id),
      },
    ]);
  }

  // ─── Header ───────────────────────────────────────────────────────────────
  const HeaderBlock = (
    <View style={[s.header, { backgroundColor: "#1A1A3E" }]}>
      <View style={s.headerRow}>
        {view === "history" && (
          <BackButton
            variant="dark"
            onPress={() => setView("chat")}
            style={{ marginRight: 8 }}
          />
        )}
        <View style={{ flex: 1 }}>
          <View style={s.headerTitleRow}>
            <AppIcon
              icon={view === "chat" ? MessageCircle : History}
              size={20}
              color="#fff"
              strokeWidth={2.4}
            />
            <Text style={s.headerTitle}>
              {view === "chat" ? "Le prophète vous écoute" : "Historique"}
            </Text>
          </View>
          <Text style={s.headerSub}>
            {view === "chat" ? "" : "Vos conversations passées"}
          </Text>
        </View>
        {view === "chat" && (
          <TouchableOpacity
            onPress={() => setView("history")}
            style={[s.iconBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
          >
            <AppIcon icon={History} size={18} color="#fff" strokeWidth={2.4} />
          </TouchableOpacity>
        )}
      </View>
      {view === "chat" && (
        <View
          style={[
            s.badge,
            {
              backgroundColor:
                remainingQuestions === 0 && !isPremium
                  ? "rgba(239,68,68,0.2)"
                  : "rgba(201,168,76,0.2)",
              borderColor:
                remainingQuestions === 0 && !isPremium ? "#EF4444" : "#C9A84C",
            },
          ]}
        >
          <View style={s.badgeTextRow}>
            <AppIcon
              icon={
                isPremium
                  ? Crown
                  : remainingQuestions === 0
                    ? Ban
                    : MessageCircle
              }
              size={14}
              color={
                remainingQuestions === 0 && !isPremium ? "#EF4444" : "#C9A84C"
              }
              strokeWidth={2.6}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color:
                  remainingQuestions === 0 && !isPremium
                    ? "#EF4444"
                    : "#C9A84C",
              }}
            >
              {isPremium
                ? "Questions illimitées"
                : remainingQuestions === 0
                  ? "Limite atteinte aujourd'hui"
                  : `${remainingQuestions}/${FREE_AI_DAILY_LIMIT} questions restantes`}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  // ─── Vue Historique ───────────────────────────────────────────────────────
  if (view === "history") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {HeaderBlock}
        {conversations.length === 0 ? (
          <EmptyState
            icon={
              <AppIcon
                icon={MessageCircle}
                size={48}
                color={colors.primary}
                strokeWidth={2}
              />
            }
            title="Aucune conversation"
            message="Commencez à discuter avec l'Discuter avec le prophète pour voir votre historique ici."
            actionLabel="Nouvelle conversation"
            onAction={() => setView("chat")}
          />
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: spacing.base }}
            renderItem={({ item }) => {
              const lastMsg = item.messages[item.messages.length - 1];
              return (
                <TouchableOpacity
                  onPress={() => {
                    loadConversation(item.id);
                    setView("chat");
                  }}
                  onLongPress={() => handleDeleteConv(item)}
                  style={[
                    s.convCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={{ marginRight: 10 }}>
                    <AppIcon
                      icon={MessageCircle}
                      size={20}
                      color={colors.primary}
                      strokeWidth={2.2}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontWeight: "600",
                        color: colors.text,
                        fontSize: 14,
                      }}
                    >
                      {lastMsg
                        ? truncateText(lastMsg.content, 50)
                        : "Nouvelle conversation"}
                    </Text>
                    <Text
                      style={{
                        color: colors.textTertiary,
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      {item.messages.length} message
                      {item.messages.length > 1 ? "s" : ""} •{" "}
                      {formatDate(item.updatedAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    );
  }

  // ─── Vue Chat ─────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {HeaderBlock}
      <LimitBanner remaining={remainingQuestions} limitReached={limitReached} />

      {isLoading ? (
        <LoadingSpinner fullScreen message="Chargement..." />
      ) : messages.length === 0 ? (
        <View style={s.emptyChat}>
          <View style={{ marginBottom: 16 }}>
            <AppIcon
              icon={MessageCircle}
              size={48}
              color={colors.primary}
              strokeWidth={1.9}
            />
          </View>
          <Text style={[s.emptyTitle, { color: colors.text }]}>
            Pose ta question au prophète, il te repond a l'instant.
          </Text>
          <Text style={[s.emptySub, { color: colors.textSecondary }]}>
            Demandez conseil sur votre vie en generale, vos relations, vos
            affaires ..
          </Text>
          <View style={{ marginTop: 24, width: "100%", gap: 8 }}>
            {[
              "Prophète, je veux une consultation sur ma vie ?",
              "J'ai fait un rêve étrange, que signifie-t-il ?",
              "Je veux un suivie de prière, comment ça se passe ?",
            ].map((q) => (
              <TouchableOpacity
                key={q}
                onPress={() => handleSend(q)}
                style={[
                  s.suggestion,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={s.suggestionRow}>
                  <AppIcon
                    icon={MessageCircle}
                    size={16}
                    color={colors.textSecondary}
                    strokeWidth={2.2}
                  />
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    {q}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={{ paddingVertical: 16 }}
        />
      )}

      {isSending && (
        <View style={[s.typing, { backgroundColor: colors.surface }]}>
          <View style={s.typingRow}>
            <AppIcon
              icon={MessageCircle}
              size={16}
              color={colors.textSecondary}
              strokeWidth={2.2}
            />
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              L’assistant répond...
            </Text>
          </View>
        </View>
      )}

      <ChatInput
        onSend={handleSend}
        loading={isSending}
        disabled={limitReached}
        placeholder={
          limitReached
            ? "Limite atteinte — Abonnez-vous"
            : "Posez votre question spirituelle..."
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeTextRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  convCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptySub: { fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 22 },
  suggestion: { padding: 12, borderRadius: 10, borderWidth: 1 },
  suggestionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  typing: { paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1 },
  typingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
