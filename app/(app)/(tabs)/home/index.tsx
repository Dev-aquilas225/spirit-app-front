import { router, type Href } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  Bell,
  BookOpen,
  Calendar,
  CloudMoon,
  Crown,
  GraduationCap,
  Hand,
  Heart,
  Lightbulb,
  MessageCircle,
  Sunrise,
  Sunset,
  Users,
} from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppIcon } from "../../../../src/components/common/AppIcon";
import { Card, GoldCard } from "../../../../src/components/common/Card";
import { PremiumBanner } from "../../../../src/components/subscription/PremiumBanner";
import { getTodayMessage } from "../../../../src/data/messages.data";
import { useAuth } from "../../../../src/hooks/useAuth";
import { usePremiumAccess } from "../../../../src/hooks/usePremiumAccess";
import { useDailyPrayers } from "../../../../src/hooks/useDailyPrayers";
import { useI18n } from "../../../../src/i18n";
import { useTheme } from "../../../../src/theme";
import { formatDate } from "../../../../src/utils/helpers";

const QUICK_ACTIONS_CONFIG = [
  { icon: Heart,         labelKey: "prayer"       as const, route: "/(app)/prayer-program"  as const },
  { icon: MessageCircle, labelKey: "ai"           as const, route: "/(app)/(tabs)/ai"        as const },
  { icon: BookOpen,      labelKey: "library"      as const, route: "/(app)/(tabs)/library"   as const },
  { icon: Lightbulb,     labelKey: "consultation" as const, route: "/(app)/formations"       as const },
  { icon: CloudMoon,     labelKey: "dreams"       as const, route: "/(app)/dreams"           as const },
  { icon: Calendar,      labelKey: "prophet"      as const, route: "/(app)/consultation"     as const },
  { icon: Users,         labelKey: "accompagnements" as const, route: "/(app)/accompagnements" as const },
];

export default function HomeScreen() {
  const { colors, spacing, isDark } = useTheme();
  const { user } = useAuth();
  const { isPremium } = usePremiumAccess();
  const { t } = useI18n();

  const todayMessage = getTodayMessage();
  const { list: dailyPrayers } = useDailyPrayers();
  const todayPrayers = dailyPrayers.slice(0, 2);
  const today = formatDate(new Date().toISOString());

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.deepBlue ?? "#1A1A3E",
            padding: spacing.xl,
            paddingTop: 60,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <View style={styles.greetingRow}>
              <Text style={styles.greeting}>
                {t.home.greeting(user?.name?.split(" ")[0] ?? "")}
              </Text>
              <AppIcon icon={Hand} size={18} color="#fff" strokeWidth={2.4} />
            </View>
            <Text style={styles.date}>{today}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(app)/notifications")}
            style={[
              styles.notifBtn,
              { backgroundColor: "rgba(255,255,255,0.15)" },
            ]}
          >
            <AppIcon icon={Bell} size={20} color="#fff" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        {isPremium && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: "rgba(201,168,76,0.2)",
                borderColor: "#C9A84C",
              },
            ]}
          >
            <View style={styles.premiumBadgeRow}>
              <AppIcon
                icon={Crown}
                size={14}
                color="#C9A84C"
                strokeWidth={2.4}
              />
              <Text
                style={{ color: "#C9A84C", fontSize: 12, fontWeight: "700" }}
              >
                {t.common.premium}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={{ padding: spacing.base, gap: spacing.base }}>
        {/* Message spirituel du jour */}
        {todayMessage && (
          <GoldCard>
            <Text
              style={{
                fontSize: 11,
                color: "#C9A84C",
                fontWeight: "700",
                marginBottom: 8,
                letterSpacing: 1,
              }}
            >
              {t.home.todayMessage}
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: colors.text,
                lineHeight: 24,
                fontStyle: "italic",
              }}
            >
              “{todayMessage.content}”
            </Text>
            {todayMessage.verse && (
              <Text
                style={{
                  color: "#C9A84C",
                  fontSize: 12,
                  marginTop: 12,
                  fontWeight: "600",
                }}
              >
                — {todayMessage.verse}
              </Text>
            )}
          </GoldCard>
        )}

        {/* Prière du jour */}
        {todayPrayers.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t.home.dailyPrayers}
              </Text>
              <TouchableOpacity onPress={() => router.push("/(app)/(tabs)/prayers")}>
                <Text style={{ color: colors.primary, fontSize: 13 }}>{t.common.seeAll}</Text>
              </TouchableOpacity>
            </View>
            {todayPrayers.map((prayer) => (
              <Card
                key={prayer.id}
                onPress={() => router.push("/(app)/(tabs)/prayers")}
                style={{ marginBottom: 8 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={[
                    styles.prayerIconWrap,
                    { backgroundColor: prayer.period === "morning"
                        ? (isDark ? "rgba(201,168,76,0.18)" : "#FFF7E0")
                        : (isDark ? "rgba(124,92,191,0.20)" : "#EDE9FF") },
                  ]}>
                    <AppIcon
                      icon={prayer.period === "morning" ? Sunrise : Sunset}
                      size={20}
                      color={prayer.period === "morning" ? "#C9A84C" : "#9B7FD4"}
                      strokeWidth={2.4}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }} numberOfLines={1}>
                      {prayer.theme}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                      {prayer.verseReference}
                    </Text>
                  </View>
                  <View style={[styles.readHint, { backgroundColor: colors.primary + "1A" }]}>
                    <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "600" }}>{t.common.read}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Quick actions */}
        <View>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, marginBottom: 12 },
            ]}
          >
            {t.home.quickAccess}
          </Text>
          <View style={styles.grid}>
            {QUICK_ACTIONS_CONFIG.map((action) => (
              <TouchableOpacity
                key={action.labelKey}
                onPress={() => router.push(action.route)}
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={{ marginBottom: 6 }}>
                  <AppIcon
                    icon={action.icon}
                    size={26}
                    color={colors.primary}
                    strokeWidth={2.2}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    textAlign: "center",
                  }}
                >
                  {t.home.actions[action.labelKey]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Premium banner for free users */}
        {!isPremium && <PremiumBanner />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {},
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  greetingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  greeting: { fontSize: 20, fontWeight: "700", color: "#fff" },
  date: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  premiumBadgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  prayerIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  readHint: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionBtn: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
