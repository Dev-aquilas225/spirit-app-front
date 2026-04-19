import { Heart, History, MessageCircle } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
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
  const user = useAuthStore((s) => s.user);
  const firstName = user?.firstName?.trim() || user?.name?.split(" ")[0] || "";
  const [view, setView] = useState<PrayerView>("chat");

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

  useEffect(() => {
    startNewConversation();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100
      );
    }
  }, [messages.length]);

  async function handleSend(text: string) {
    await sendMessage(text);
  }

  function handleDeleteConv(conv: AIConversation) {
    Alert.alert("Supprimer", "Supprimer cette session de prière ?", [
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
        <BackButton
          variant="dark"
          fallback="/(app)/(tabs)/home"
          style={{ marginRight: 8 }}
          onPress={view === "history" ? () => setView("chat") : undefined}
        />
        <View style={{ flex: 1 }}>
          <View style={s.headerTitleRow}>
            <AppIcon icon={Heart} size={20} color="#C9A84C" strokeWidth={2.4} />
            <Text style={s.headerTitle}>
              {view === "chat" ? "Prophète Georges" : "Mes sessions de prière"}
            </Text>
          </View>
          <Text style={s.headerSub}>
            {view === "chat"
              ? "Prière et suivi spirituel progressif"
              : "Historique de vos échanges"}
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
    </View>
  );

  // ─── Vue Historique ───────────────────────────────────────────────────────
  if (view === "history") {
    return (
      <FadeInView style={{ backgroundColor: colors.background }}>
        {HeaderBlock}
        {conversations.length === 0 ? (
          <EmptyState
            icon={
              <AppIcon
                icon={Heart}
                size={48}
                color={colors.primary}
                strokeWidth={2}
              />
            }
            title="Aucune session de prière"
            message="Commencez votre premier accompagnement spirituel avec le Prophète Georges."
            actionLabel="Commencer"
            onAction={() => setView("chat")}
          />
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: spacing.base }}
            renderItem={({ item }) => {
              const preview =
                (item as any).title?.trim() ||
                item.messages.find((m) => m.role === "user")?.content?.trim() ||
                item.messages[0]?.content?.trim();
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
                      icon={Heart}
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
                      {preview
                        ? truncateText(preview, 50)
                        : "Session de prière"}
                    </Text>
                    <Text
                      style={{
                        color: colors.textTertiary,
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      {item.messages.length} message(s) •{" "}
                      {formatDate(item.updatedAt)}
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

  // ─── Vue Chat ─────────────────────────────────────────────────────────────
  return (
    <FadeInView style={{ backgroundColor: colors.background }}>
      {HeaderBlock}

      {isLoading ? (
        <LoadingSpinner fullScreen message="Chargement..." />
      ) : messages.length === 0 ? (
        <View style={s.emptyChat}>
          <View style={{ marginBottom: 16 }}>
            <AppIcon
              icon={Heart}
              size={52}
              color="#C9A84C"
              strokeWidth={1.8}
            />
          </View>
          <Text style={[s.emptyTitle, { color: colors.text }]}>
            {firstName
              ? `Bienvenue ${firstName}`
              : "Bienvenue"}
          </Text>
          <Text style={[s.emptySub, { color: colors.textSecondary }]}>
            Le Prophète Georges vous accompagne dans un chemin de prière progressif et personnalisé.{"\n\n"}Partagez ce qui pèse sur votre cœur pour commencer.
          </Text>
          <View style={{ marginTop: 24, width: "100%", gap: 8 }}>
            {[
              "J'ai besoin de prière pour ma situation financière",
              "Je traverses une période difficile dans ma famille",
              "J'ai besoin de paix intérieure et de guidance divine",
            ].map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                onPress={() => handleSend(suggestion)}
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
                    icon={Heart}
                    size={16}
                    color="#C9A84C"
                    strokeWidth={2.2}
                  />
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    {suggestion}
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
              icon={Heart}
              size={16}
              color="#C9A84C"
              strokeWidth={2.2}
            />
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              Le Prophète Georges prie pour vous…
            </Text>
          </View>
        </View>
      )}

      <ChatInput
        onSend={handleSend}
        loading={isSending}
        placeholder="Partagez votre cœur avec le Prophète Georges…"
      />
    </FadeInView>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
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
  emptyTitle: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  emptySub: { fontSize: 14, textAlign: "center", marginTop: 10, lineHeight: 22 },
  suggestion: { padding: 12, borderRadius: 10, borderWidth: 1 },
  suggestionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  typing: { paddingHorizontal: 16, paddingVertical: 8 },
  typingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
