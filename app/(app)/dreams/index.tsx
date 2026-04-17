import { CloudMoon, MessageCircle, NotebookPen } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { PremiumGuard } from "../../../src/components/auth/PremiumGuard";
import { AppIcon } from "../../../src/components/common/AppIcon";
import { BackButton } from "../../../src/components/common/BackButton";
import { Button } from "../../../src/components/common/Button";
import { Card } from "../../../src/components/common/Card";
import { getMockAIResponse } from "../../../src/data/messages.data";
import { useI18n } from "../../../src/i18n";
import { useTheme } from "../../../src/theme";
import { formatDate, simulateApiDelay } from "../../../src/utils/helpers";

interface DreamResult {
  description: string;
  interpretation: string;
  date: string;
}

function DreamsContent() {
  const { colors, spacing } = useTheme();
  const { t } = useI18n();
  const [dream, setDream] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DreamResult | null>(null);

  async function handleInterpret() {
    if (!dream.trim() || dream.trim().length < 20) return;
    setLoading(true);
    await simulateApiDelay(2000);
    const interpretation = getMockAIResponse(`dream: ${dream}`);
    setResult({
      description: dream,
      interpretation,
      date: new Date().toISOString(),
    });
    setLoading(false);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.deepBlue ?? "#1A1A3E", paddingTop: 56 },
        ]}
      >
        <BackButton variant="dark" style={{ marginBottom: 12 }} fallback="/(app)/(tabs)/home"/>
        <View style={styles.headerTitleRow}>
          <AppIcon icon={CloudMoon} size={20} color="#fff" strokeWidth={2.4} />
          <Text style={styles.headerTitle}>{t.dreams.title}</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {t.dreams.subtitle}
        </Text>
      </View>

      <View style={{ padding: spacing.base, gap: spacing.lg }}>
        {/* Instructions */}
        <Card>
          <View style={styles.instructionsTitleRow}>
            <AppIcon
              icon={NotebookPen}
              size={16}
              color={colors.text}
              strokeWidth={2.4}
            />
            <Text
              style={{ fontSize: 14, fontWeight: "700", color: colors.text }}
            >
              {t.dreams.howTitle}
            </Text>
          </View>
          {[
            t.dreams.step1,
            t.dreams.step2,
            t.dreams.step3,
          ].map((step, i) => (
            <Text
              key={i}
              style={{
                color: colors.textSecondary,
                fontSize: 13,
                marginBottom: 4,
              }}
            >
              {i + 1}. {step}
            </Text>
          ))}
        </Card>

        {/* Input */}
        <View>
          <Text
            style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}
          >
            {t.dreams.dreamLabel}
          </Text>
          <View
            style={[
              styles.textArea,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              value={dream}
              onChangeText={setDream}
              placeholder={t.dreams.dreamPh}
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
          <Text
            style={{ color: colors.textTertiary, fontSize: 12, marginTop: 4 }}
          >
            {t.dreams.charCount(dream.length)}
          </Text>
        </View>

        <Button
          label={loading ? t.dreams.interpreting : t.dreams.interpret}
          variant="gold"
          fullWidth
          loading={loading}
          disabled={dream.trim().length < 20}
          onPress={handleInterpret}
        />

        {/* Result */}
        {result && (
          <View
            style={[
              styles.resultCard,
              {
                backgroundColor: colors.premiumBackground,
                borderColor: colors.premiumBorder,
              },
            ]}
          >
            <View style={styles.resultLabelRow}>
              <AppIcon
                icon={MessageCircle}
                size={14}
                color="#C9A84C"
                strokeWidth={2.6}
              />
              <Text
                style={{ fontSize: 12, color: "#C9A84C", fontWeight: "700" }}
              >
                {t.dreams.resultLabel(formatDate(result.date))}
              </Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 15, lineHeight: 26 }}>
              {result.interpretation}
            </Text>
            <View
              style={[
                styles.divider,
                { backgroundColor: colors.premiumBorder },
              ]}
            />
            <Text
              style={{
                color: colors.textTertiary,
                fontSize: 12,
                fontStyle: "italic",
              }}
            >
              {t.dreams.disclaimer}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

export default function DreamsScreen() {
  const { t } = useI18n();
  return (
    <PremiumGuard featureName={t.dreams.featureName}>
      <DreamsContent />
    </PremiumGuard>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 24 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },
  instructionsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  textArea: { borderWidth: 1.5, borderRadius: 12, padding: 14 },
  textInput: { fontSize: 15, minHeight: 120, lineHeight: 24 },
  resultCard: { padding: 16, borderRadius: 16, borderWidth: 1.5 },
  resultLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  divider: { height: 1, marginVertical: 12 },
});
