import { router } from "expo-router";
import { Crown, MessageCircle } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../theme";
import { AppIcon } from "../common/AppIcon";

interface PremiumBannerProps {
  compact?: boolean;
}

export function PremiumBanner({ compact = false }: PremiumBannerProps) {
  const { colors, spacing, borderRadius: br } = useTheme();

  if (compact) {
    return (
      <TouchableOpacity
        onPress={() => router.push("/(app)/subscription")}
        style={[
          styles.compact,
          {
            backgroundColor: colors.premiumBackground,
            borderColor: colors.premiumBorder,
            borderRadius: br.md,
          },
        ]}
        activeOpacity={0.85}
      >
        <View style={styles.compactRow}>
          <AppIcon
            icon={MessageCircle}
            size={16}
            color="#C9A84C"
            strokeWidth={2.4}
          />
          <Text style={styles.compactText}>
            Passer Premium — 5 000 FCFA/mois
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => router.push("/(app)/subscription")}
      activeOpacity={0.85}
      style={[
        styles.banner,
        {
          backgroundColor: colors.premiumBackground,
          borderColor: colors.premiumBorder,
          borderRadius: br.xl,
          padding: spacing.base,
          marginHorizontal: spacing.base,
        },
      ]}
    >
      <AppIcon
        icon={Crown}
        size={26}
        color={colors.primary}
        strokeWidth={2.2}
      />
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.primary }]}>
          Passez Premium
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Accès illimité IA, Livres, Formations & plus
        </Text>
      </View>
      <Text style={[styles.price, { color: colors.primary }]}>
        5 000{"\n"}FCFA/mois
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    gap: 12,
  },
  textContainer: { flex: 1 },
  title: { fontSize: 15, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 2 },
  price: { fontSize: 12, fontWeight: "700", textAlign: "right" },
  compact: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  compactText: { fontSize: 13, fontWeight: "600", color: "#C9A84C" },
});
