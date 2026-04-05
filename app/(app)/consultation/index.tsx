import { router } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  Calendar,
  ChevronRight,
  Heart,
  MessageCircle,
  WandMessageCircle,
} from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import { PremiumGuard } from "../../../src/components/auth/PremiumGuard";
import { AppIcon } from "../../../src/components/common/AppIcon";
import { BackButton } from "../../../src/components/common/BackButton";
import { Button } from "../../../src/components/common/Button";
import { Card } from "../../../src/components/common/Card";
import { ScreenWrapper } from "../../../src/components/common/ScreenWrapper";
import { useTheme } from "../../../src/theme";

function ConsultationContent() {
  const { colors, spacing } = useTheme();

  return (
    <ScreenWrapper scrollable padded>
      <BackButton style={{ marginBottom: 24 }} />

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
        Consultations
      </Text>
      <Text
        style={{
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: 8,
          marginBottom: 32,
        }}
      >
        Réservez une consultation avec un membre de notre ministère
      </Text>

      {(
        [
          {
            icon: Heart,
            title: "Prière personnalisée",
            desc: "Session de prière dédiée à votre situation",
          },
          {
            icon: MessageCircle,
            title: "Conseil spirituel",
            desc: "Échangez avec un conseiller spirituel expérimenté",
          },
          {
            icon: WandMessageCircle,
            title: "Lecture prophétique",
            desc: "Recevez un mot prophétique pour votre vie",
          },
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
        label="Mes consultations"
        variant="outline"
        fullWidth
        onPress={() => router.push("/(app)/consultation/my-consultations")}
        style={{ marginTop: 8 }}
      />
    </ScreenWrapper>
  );
}

export default function ConsultationScreen() {
  return (
    <PremiumGuard featureName="Consultations">
      <ConsultationContent />
    </PremiumGuard>
  );
}
