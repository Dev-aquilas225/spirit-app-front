import { router } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  BookOpen,
  Briefcase,
  Check,
  CloudMoon,
  Compass,
  Crown,
  Globe,
  GraduationCap,
  Heart,
  Infinity,
  MessageCircle,
  Plane,
  ShoppingBag,
  Shield,
  Star,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react-native";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "../../../src/components/common/AppIcon";
import { BackButton } from "../../../src/components/common/BackButton";
import { Button } from "../../../src/components/common/Button";
import { GoldCard } from "../../../src/components/common/Card";
import { useI18n } from "../../../src/i18n";
import { usePremiumAccess } from "../../../src/hooks/usePremiumAccess";
import { useSubscription } from "../../../src/hooks/useSubscription";
import { useTheme } from "../../../src/theme";
import { formatCurrency, formatDate } from "../../../src/utils/helpers";

export default function SubscriptionScreen() {
  const { colors, spacing } = useTheme();
  const { t } = useI18n();
  const { isPremium } = usePremiumAccess();
  const { subscription, daysUntilExpiry, isExpiringSoon } = useSubscription();

  const PREMIUM_FEATURES: { icon: LucideIcon; label: string; desc: string }[] = [
    { icon: MessageCircle, label: "Consultation spirituelle générale",    desc: "Un espace d'échange libre pour obtenir une consultation ou révélation sur ta situation actuelle." },
    { icon: CloudMoon,     label: "Interprétation de rêves",              desc: "Analyse détaillée des symboles et messages reçus pendant le sommeil." },
    { icon: Compass,       label: "Éclaircissement sur un sujet précis",  desc: "Pour lever le doute sur une situation confuse ou une décision à prendre." },
    { icon: BookOpen,      label: "Conseils",                             desc: "Recommandations pratiques et spirituelles pour améliorer ton quotidien." },
    { icon: Globe,         label: "Orientation",                          desc: "Aide au choix de vie : carrière, déménagement, relations." },
    { icon: Heart,         label: "Prières personnalisées",               desc: "Rédaction de prières spécifiques adaptées aux besoins du moment." },
    { icon: ShoppingBag,   label: "Boutique spirituelle",                 desc: "Accès aux livres numériques." },
    { icon: Users,         label: "Accompagnement mari/femme",            desc: "Programme dédié à la préparation spirituelle pour le mariage." },
    { icon: Briefcase,     label: "Accompagnement pour trouver un travail", desc: "Soutien spirituel et conseils pour favoriser l'insertion professionnelle." },
    { icon: Plane,         label: "Accompagnement projet de voyage",      desc: "Protection et facilitation pour les démarches liées à l'étranger." },
    { icon: Shield,        label: "Accompagnement combat spirituel",      desc: "Soutien contre les addictions et les influences négatives." },
    { icon: GraduationCap, label: "Accompagnement concours/examen",       desc: "Prières et conseils de concentration pour réussir tes épreuves." },
    { icon: TrendingUp,    label: "Accompagnement pour mon travail",      desc: "Pour favoriser l'évolution de carrière ou résoudre des conflits professionnels." },
    { icon: Star,          label: "Connaître mon chiffre spirituel",      desc: "Service de numérologie spirituelle pour mieux comprendre ta mission de vie." },
    { icon: Users,         label: "Accompagnement suivi des enfants",     desc: "Conseils et prières pour la protection et l'éducation des enfants." },
  ];

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
          <Text style={styles.headerTitle}>{t.subscription.premiumTitle}</Text>
          <Text style={styles.headerSubtitle}>{t.subscription.premiumSubtitle}</Text>
        </View>

        <View style={{ padding: spacing.base, gap: spacing.md }}>
          <GoldCard>
            <Text style={{ color: "#C9A84C", fontWeight: "700", fontSize: 13 }}>
              {t.subscription.mySubscription}
            </Text>
            <View style={{ marginTop: 12, gap: 8 }}>
              <View style={styles.infoRow}>
                <Text style={{ color: colors.textSecondary }}>{t.subscription.status}</Text>
                <Text style={{ color: "#10B981", fontWeight: "600" }}>
                  {t.subscription.statusActive}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={{ color: colors.textSecondary }}>{t.subscription.expiresOn}</Text>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {formatDate(subscription.expiryDate)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={{ color: colors.textSecondary }}>
                  {t.subscription.daysLeft}
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
                    {daysUntilExpiry} {t.common.days}
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
                <Text style={{ color: colors.textSecondary }}>{t.subscription.amount}</Text>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {formatCurrency(subscription.amount)}
                </Text>
              </View>
            </View>
          </GoldCard>

          {isExpiringSoon && (
            <Button
              label={t.subscription.renewNow}
              variant="gold"
              fullWidth
              onPress={() => router.push("/(app)/subscription/payment")}
            />
          )}

          <Button
            label={t.subscription.manage}
            variant="outline"
            fullWidth
            onPress={() => router.push("/(app)/subscription/manage")}
          />

          <Button
            label={t.subscription.history}
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
        <Text style={styles.headerTitle}>{t.subscription.upgradeTitle}</Text>
        <Text style={styles.headerSubtitle}>{t.subscription.upgradeSubtitle}</Text>
        <View style={styles.priceBadge}>
          <Text style={styles.price}>{t.subscription.price}</Text>
          <Text style={styles.period}>{t.subscription.perMonth}</Text>
        </View>
      </View>

      <View style={{ padding: spacing.base, gap: spacing.md }}>

        {/* Titre section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            15 services inclus
          </Text>
          <View style={[styles.vipBadge, { backgroundColor: 'rgba(201,168,76,0.15)', borderColor: '#C9A84C' }]}>
            <AppIcon icon={Crown} size={12} color="#C9A84C" strokeWidth={2.5} />
            <Text style={styles.vipBadgeText}>VIP</Text>
          </View>
        </View>

        {/* Liste des 15 services */}
        <View style={[styles.servicesList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {PREMIUM_FEATURES.map((feat, index) => (
            <View
              key={feat.label}
              style={[
                styles.serviceRow,
                index < PREMIUM_FEATURES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              {/* Numéro */}
              <View style={[styles.serviceNum, { backgroundColor: colors.premiumBackground }]}>
                <Text style={[styles.serviceNumText, { color: colors.primary }]}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
              </View>

              {/* Icône */}
              <View style={[styles.serviceIcon, { backgroundColor: colors.premiumBackground }]}>
                <AppIcon icon={feat.icon} size={16} color={colors.primary} strokeWidth={2.2} />
              </View>

              {/* Texte */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.serviceLabel, { color: colors.text }]}>{feat.label}</Text>
                <Text style={[styles.serviceDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {feat.desc}
                </Text>
              </View>

              <AppIcon icon={Check} size={16} color="#10B981" strokeWidth={3} />
            </View>
          ))}
        </View>

        {/* Badge VIP Zéro limite */}
        <View style={[styles.zeroLimitCard, { backgroundColor: '#1A1A3E' }]}>
          <View style={styles.zeroLimitRow}>
            <AppIcon icon={Infinity} size={28} color="#C9A84C" strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={styles.zeroLimitTitle}>Privilège Abonné VIP</Text>
              <Text style={styles.zeroLimitSub}>Zéro limite sur tous les services</Text>
            </View>
            <View style={[styles.vipBadgeLarge, { backgroundColor: 'rgba(201,168,76,0.2)', borderColor: '#C9A84C' }]}>
              <Text style={styles.vipBadgeLargeText}>VIP</Text>
            </View>
          </View>
        </View>

        {/* CTA */}
        <Button
          label={t.subscription.subscribeCta}
          variant="gold"
          fullWidth
          size="lg"
          onPress={() => router.push("/(app)/subscription/payment")}
          style={{ marginTop: 4 }}
        />

        <Text style={{ color: colors.textTertiary, fontSize: 12, textAlign: "center" }}>
          {t.subscription.disclaimer}
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

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },

  /* Services list */
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  vipBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  vipBadgeText: { color: '#C9A84C', fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  servicesList: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  serviceNum: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  serviceNumText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  serviceIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  serviceLabel: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  serviceDesc: { fontSize: 11, lineHeight: 16, marginTop: 1 },

  /* Zero limit card */
  zeroLimitCard: { borderRadius: 16, padding: 18, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  zeroLimitRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  zeroLimitTitle: { color: '#C9A84C', fontWeight: '800', fontSize: 15 },
  zeroLimitSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },
  vipBadgeLarge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1.5 },
  vipBadgeLargeText: { color: '#C9A84C', fontWeight: '900', fontSize: 13, letterSpacing: 1.5 },
});
