import { MessageCircle } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme";
import { AIMessage } from "../../types/content.types";
import { formatTime } from "../../utils/helpers";
import { AppIcon } from "../common/AppIcon";

interface ChatBubbleProps {
  message: AIMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const { colors, spacing, borderRadius: br } = useTheme();
  const isUser = message.role === "user";
  const rawContent = message.content as unknown;
  const safeContent =
    typeof rawContent === "string"
      ? rawContent
      : rawContent &&
          typeof rawContent === "object" &&
          "content" in rawContent &&
          typeof rawContent.content === "string"
        ? rawContent.content
        : "";

  return (
    <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
      {!isUser && (
        <View style={styles.avatarWrap}>
          <AppIcon
            icon={MessageCircle}
            size={18}
            color={colors.primary}
            strokeWidth={2.2}
          />
        </View>
      )}

      <View
        style={[
          styles.bubble,
          {
            maxWidth: "80%",
            padding: spacing.md,
            borderRadius: br.lg,
          },
          isUser
            ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
            : {
                backgroundColor: colors.surface,
                borderBottomLeftRadius: 4,
                borderWidth: 1,
                borderColor: colors.border,
              },
        ]}
      >
        <Text
          style={[
            styles.text,
            { color: isUser ? "#fff" : colors.text, lineHeight: 22 },
          ]}
        >
          {safeContent}
        </Text>
        <Text
          style={[
            styles.time,
            { color: isUser ? "rgba(255,255,255,0.7)" : colors.textTertiary },
          ]}
        >
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  rowLeft: { justifyContent: "flex-start" },
  rowRight: { justifyContent: "flex-end" },
  avatarWrap: { marginRight: 6, marginBottom: 4 },
  bubble: {},
  text: { fontSize: 15 },
  time: { fontSize: 11, marginTop: 4, textAlign: "right" },
});
