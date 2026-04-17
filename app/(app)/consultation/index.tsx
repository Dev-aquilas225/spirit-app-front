import { router } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  Calendar,
  ChevronRight,
  Heart,
  Lightbulb,
  MessageCircle,
} from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import { PremiumGuard } from "../../../src/components/auth/PremiumGuard";
import { AppIcon } from "../../../src/components/common/AppIcon";
import { BackButton } from "../../../src/components/common/BackButton";
import { Button } from "../../../src/components/common/Button";
import { Card } from "../../../src/components/common/Card";
import { ScreenWrapper } from "../../../src/components/common/ScreenWrapper";
import { useI18n } from "../../../src/i18n";
import { useTheme } from "../../../src/theme";

function ConsultationContent() {
  const { colors, spacing } = useTheme();
  const { t } = useI18n();

  return (
    <ScreenWrapper scrollable padded>
      <BackButton style={{ marginBottom: 24 }} fallback="/(app)/(tabs)/home"/>

      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <AppIcon
          icon={Calendar}
          size={48}
          color={colors.primary}
          strokeWidth={1.8}
        />
      </View>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "800",
          color: colors.text,
          textAlign: "center",
        }}
      >
        {t.consultation.title}
      </Text>
      <Text
        style={{
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: 8,
          marginBottom: 32,
        }}
      >
        {t.consultation.subtitle}
      </Text>

      {(
        [
          { icon: Heart, ...t.consultation.types[0] },
          { icon: MessageCircle, ...t.consultation.types[1] },
          { icon: Lightbulb, ...t.consultation.types[2] },
        ] satisfies { icon: LucideIcon; title: string; desc: string }[]
      ).map((type) => (
        <Card
          key={type.title}
          onPress={() => router.push("/(app)/consultation/form")}
          style={{ marginBottom: spacing.md }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <AppIcon
              icon={type.icon}
              size={26}
              color={colors.primary}
              strokeWidth={2.2}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", color: colors.text }}>
                {type.title}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 13,
                  marginTop: 2,
                }}
              >
                {type.desc}
              </Text>
            </View>
            <AppIcon
              icon={ChevronRight}
              size={18}
              color={colors.textTertiary}
              strokeWidth={2.2}
            />
          </View>
        </Card>
      ))}

      <Button
        label={t.consultation.myConsults}
        variant="outline"
        fullWidth
        onPress={() => router.push("/(app)/consultation/my-consultations")}
        style={{ marginTop: 8 }}
      />
    </ScreenWrapper>
  );
}

export default function ConsultationScreen() {
  const { t } = useI18n();
  return (
    <PremiumGuard featureName={t.consultation.featureName}>
      <ConsultationContent />
    </PremiumGuard>
  );
}
