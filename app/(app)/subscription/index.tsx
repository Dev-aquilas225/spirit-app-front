import { router } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  BookOpen,
  Calendar,
  Check,
  ClipboardList,
  CloudMoon,
  Crown,
  GraduationCap,
  Heart,
  MessageCircle,
  TriangleAlert,
} from "lucide-react-native";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "../../../src/components/common/AppIcon";
import { BackButton } from "../../../src/components/common/BackButton";
import { Button } from "../../../src/components/common/Button";
import { GoldCard } from "../../../src/components/common/Card";
import { usePremiumAccess } from "../../../src/hooks/usePremiumAccess";
import { useSubscription } from "../../../src/hooks/useSubscription";
import { useTheme } from "../../../src/theme";
import { formatCurrency, formatDate } from "../../../src/utils/helpers";

const PREMIUM_FEATURES = [
  {
    icon: MessageCircle,
    label: "Discuter avec le prophète illimité",
    desc: "Posez autant de questions que vous voulez",
  },
  {
    icon: BookOpen,
    label: "Bibliothèque complète",
    desc: "4+ livres spirituels en lecture illimitée",
  },
  {
    icon: GraduationCap,
    label: "Formations",
    desc: "Accès à toutes nos formations spirituelles",
  },
  {
    icon: Calendar,
    label: "Consultations gratuites",
    desc: "1 consultation mensuelle avec un ministère",
  },
  {
    icon: Heart,
    label: "Prières complètes",
    desc: "Accès à toutes les prières du jour et archives",
  },
  {
    icon: CloudMoon,
    label: "Interprétation des rêves",
    desc: "Analyse de vos rêves et visions",
  },
  {
    icon: ClipboardList,
    label: "Programme personnalisé",
    desc: "Un programme de prière adapté à votre vie",
  },
] satisfies { icon: LucideIcon; label: string; desc: string }[];

export default function SubscriptionScreen() {
  const { colors, spacing } = useTheme();
  const { isPremium } = usePremiumAccess();
  const { subscription, daysUntilExpiry, isExpiringSoon } = useSubscription();

  if (isPremium && subscription) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={[
            styles.header,
            { paddingTop: 56, backgroundColor: colors.deepBlue ?? "#1A1A3E" },
          ]}
        >
          <BackButton
            variant="dark"
            style={{ marginBottom: 16, alignSelf: "flex-start" }}
          />
          <View style={{ marginBottom: 12 }}>
            <AppIcon icon={Crown} size={56} color="#C9A84C" strokeWidth={1.8} />
          </View>
          <Text style={styles.headerTitle}>Vous êtes Premium !</Text>
          <Text style={styles.headerSubtitle}>
            Tous les accès sont déverrouillés
          </Text>
        </View>

        <View style={{ padding: spacing.base, gap: spacing.md }}>
          <GoldCard>
            <Text style={{ color: "#C9A84C", fontWeight: "700", fontSize: 13 }}>
              MON ABONNEMENT
            </Text>
            <View style={{ marginTop: 12, gap: 8 }}>
              <View style={styles.infoRow}>
                <Text style={{ color: colors.textSecondary }}>Statut</Text>
                <Text style={{ color: "#10B981", fontWeight: "600" }}>
                  ● Actif
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={{ color: colors.textSecondary }}>Expire le</Text>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {formatDate(subscription.expiryDate)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={{ color: colors.textSecondary }}>
                  Jours restants
                </Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Text
                    style={{
                      color: isExpiringSoon ? "#F59E0B" : colors.text,
                      fontWeight: "600",
                    }}
                  >
                    {daysUntilExpiry} jours
                  </Text>
                  {isExpiringSoon ? (
                    <AppIcon
                      icon={TriangleAlert}
                      size={14}
                      color="#F59E0B"
                      strokeWidth={2.8}
                    />
                  ) : null}
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={{ color: colors.textSecondary }}>Montant</Text>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {formatCurrency(subscription.amount)}
                </Text>
              </View>
            </View>
          </GoldCard>

          {isExpiringSoon && (
            <Button
              label="Renouveler maintenant"
              variant="gold"
              fullWidth
              onPress={() => router.push("/(app)/subscription/payment")}
            />
          )}

          <Button
            label="Gérer mon abonnement"
            variant="outline"
            fullWidth
            onPress={() => router.push("/(app)/subscription/manage")}
          />

          <Button
            label="Historique des paiements"
            variant="ghost"
            fullWidth
            onPress={() => router.push("/(app)/subscription/history")}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: 56, backgroundColor: colors.deepBlue ?? "#1A1A3E" },
        ]}
      >
        <BackButton
          variant="dark"
          style={{ marginBottom: 16, alignSelf: "flex-start" }}
        />
        <View style={{ marginBottom: 12 }}>
          <AppIcon icon={Crown} size={56} color="#C9A84C" strokeWidth={1.8} />
        </View>
        <Text style={styles.headerTitle}>Oracle Plus Premium</Text>
        <Text style={styles.headerSubtitle}>
          Accès complet à votre croissance spirituelle
        </Text>
        <View style={styles.priceBadge}>
          <Text style={styles.price}>5 000 FCFA</Text>
          <Text style={styles.period}>/mois</Text>
        </View>
      </View>

      <View style={{ padding: spacing.base, gap: spacing.md }}>
        {/* Features */}
        <Text style={[{ fontSize: 16, fontWeight: "700", color: colors.text }]}>
          Ce qui est inclus
        </Text>
        {PREMIUM_FEATURES.map((feat) => (
          <View key={feat.label} style={styles.feature}>
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: colors.premiumBackground },
              ]}
            >
              <AppIcon
                icon={feat.icon}
                size={22}
                color={colors.primary}
                strokeWidth={2.2}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontWeight: "600", color: colors.text, fontSize: 14 }}
              >
                {feat.label}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                {feat.desc}
              </Text>
            </View>
            <AppIcon icon={Check} size={18} color="#10B981" strokeWidth={3} />
          </View>
        ))}

        <Button
          label="S'abonner maintenant — 5 000 FCFA/mois"
          variant="gold"
          fullWidth
          size="lg"
          onPress={() => router.push("/(app)/subscription/payment")}
          style={{ marginTop: 8 }}
        />

        <Text
          style={{
            color: colors.textTertiary,
            fontSize: 12,
            textAlign: "center",
          }}
        >
          Sans engagement • Annulable à tout moment • Renouvellement automatique
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", padding: 24, paddingBottom: 32 },
  headerEmoji: { fontSize: 56, marginBottom: 12 },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    marginTop: 6,
    textAlign: "center",
  },
  priceBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 16,
    backgroundColor: "rgba(201,168,76,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C9A84C",
  },
  price: { fontSize: 28, fontWeight: "800", color: "#C9A84C" },
  period: { fontSize: 14, color: "rgba(201,168,76,0.8)", marginLeft: 4 },
  feature: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
});
