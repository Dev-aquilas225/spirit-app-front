import { router, type Href } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  Bell,
  BookOpen,
  Calendar,
  ChevronRight,
  CloudMoon,
  Crown,
  Hand,
  Heart,
  Lightbulb,
  Lock,
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
  Dimensions,
} from "react-native";
import { AppIcon } from "../../../../src/components/common/AppIcon";
import { PremiumBanner } from "../../../../src/components/subscription/PremiumBanner";
import { getTodayMessage } from "../../../../src/data/messages.data";
import { useAuth } from "../../../../src/hooks/useAuth";
import { usePremiumAccess } from "../../../../src/hooks/usePremiumAccess";
import { useDailyPrayers } from "../../../../src/hooks/useDailyPrayers";
import { useI18n } from "../../../../src/i18n";
import { useTheme } from "../../../../src/theme";
import { formatDate } from "../../../../src/utils/helpers";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface QuickAction {
  icon: LucideIcon;
  labelKey: "prayer" | "ai" | "library" | "consultation" | "dreams" | "prophet" | "accompagnements";
  route: Href;
  color: string;
  lightBg: string;
  darkBg: string;
  premium?: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: Heart,
    labelKey: "prayer",
    route: "/(app)/prayer-program",
    color: "#F59E0B",
    lightBg: "#FFF7E0",
    darkBg: "rgba(245,158,11,0.18)",
    premium: true,
  },
  {
    icon: MessageCircle,
    labelKey: "ai",
    route: "/(app)/(tabs)/ai",
    color: "#7C3AED",
    lightBg: "#EDE9FE",
    darkBg: "rgba(124,58,237,0.18)",
  },
  {
    icon: BookOpen,
    labelKey: "library",
    route: "/(app)/(tabs)/library",
    color: "#3B82F6",
    lightBg: "#DBEAFE",
    darkBg: "rgba(59,130,246,0.18)",
  },
  {
    icon: Lightbulb,
    labelKey: "consultation",
    route: "/(app)/formations",
    color: "#10B981",
    lightBg: "#D1FAE5",
    darkBg: "rgba(16,185,129,0.18)",
  },
  {
    icon: CloudMoon,
    labelKey: "dreams",
    route: "/(app)/dreams",
    color: "#6366F1",
    lightBg: "#E0E7FF",
    darkBg: "rgba(99,102,241,0.18)",
    premium: true,
  },
  {
    icon: Calendar,
    labelKey: "prophet",
    route: "/(app)/consultation",
    color: "#EC4899",
    lightBg: "#FCE7F3",
    darkBg: "rgba(236,72,153,0.18)",
    premium: true,
  },
  {
    icon: Users,
    labelKey: "accompagnements",
    route: "/(app)/accompagnements",
    color: "#C9A84C",
    lightBg: "#FFF7E0",
    darkBg: "rgba(201,168,76,0.18)",
    premium: true,
  },
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

  const firstName = user?.firstName ?? user?.name?.split(" ")[0] ?? "";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── HEADER PREMIUM ───────────────────────────────────────── */}
      <View style={s.headerWrap}>
        {/* Cercles décoratifs spirituels */}
        <View style={s.deco1} />
        <View style={s.deco2} />

        {/* Ligne d'accueil utilisateur */}
        <View style={[s.headerTop, { paddingTop: 60, paddingHorizontal: 20 }]}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={s.greeting}>
                {t.home.greeting(firstName)}
              </Text>
              <AppIcon icon={Hand} size={18} color="#FFD580" strokeWidth={2.4} />
            </View>
            <Text style={s.date}>{today}</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {isPremium && (
              <View style={s.premiumBadge}>
                <AppIcon icon={Crown} size={11} color="#C9A84C" strokeWidth={2.4} />
                <Text style={s.premiumBadgeText}>VIP</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => router.push("/(app)/notifications")}
              style={s.notifBtn}
              activeOpacity={0.8}
            >
              <AppIcon icon={Bell} size={19} color="#fff" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Boîte d'affichage du verset du jour */}
        {todayMessage && (
          <View style={[s.verseBox, { marginHorizontal: 20, marginTop: 18 }]}>
            <Text style={s.verseQuote}>"</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.verseText} numberOfLines={3}>
                {todayMessage.content}
              </Text>
              {todayMessage.verse && (
                <Text style={s.verseRef}>— {todayMessage.verse}</Text>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 24 }} />
      </View>

      <View style={{ paddingHorizontal: spacing.base, gap: 24 }}>

        {/* ── PRIÈRES DU JOUR ────────────────────────────────────── */}
        {todayPrayers.length > 0 && (
          <View>
            <View style={s.sectionHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={[s.sectionDot, { backgroundColor: "#F59E0B" }]} />
                <Text style={[s.sectionTitle, { color: colors.text }]}>
                  {t.home.dailyPrayers}
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/(app)/(tabs)/prayers")} activeOpacity={0.7}>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>
                  {t.common.seeAll}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              {todayPrayers.map((prayer) => {
                const isMorning = prayer.period === "morning";
                const accentColor = isMorning ? "#F59E0B" : "#9B7FD4";
                const bgColor = isMorning
                  ? isDark ? "rgba(245,158,11,0.12)" : "#FFF7E0"
                  : isDark ? "rgba(155,127,212,0.12)" : "#F3F0FF";
                return (
                  <TouchableOpacity
                    key={prayer.id}
                    onPress={() => router.push("/(app)/(tabs)/prayers")}
                    style={[s.prayerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    activeOpacity={0.85}
                  >
                    <View style={[s.prayerAccent, { backgroundColor: accentColor }]} />

                    <View style={[s.prayerIconCircle, { backgroundColor: bgColor }]}>
                      <AppIcon
                        icon={isMorning ? Sunrise : Sunset}
                        size={18}
                        color={accentColor}
                        strokeWidth={2.4}
                      />
                    </View>

                    <View style={{ flex: 1, paddingRight: 4 }}>
                      <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }} numberOfLines={1}>
                        {prayer.theme}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 3 }}>
                        {prayer.verseReference}
                      </Text>
                    </View>

                    <View style={[s.readPill, { backgroundColor: accentColor + "18" }]}>
                      <Text style={{ color: accentColor, fontSize: 11, fontWeight: "700" }}>
                        {t.common.read}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── ACCÈS RAPIDE - GRILLE RECALCULÉE ET PARFAITE ────────── */}
        <View style={{ marginBottom: 10 }}>
          <View style={s.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={[s.sectionDot, { backgroundColor: colors.primary }]} />
              <Text style={[s.sectionTitle, { color: colors.text }]}>
                {t.home.quickAccess}
              </Text>
            </View>
          </View>

          <View style={s.grid}>
            {QUICK_ACTIONS.map((action) => {
              const isLocked = action.premium && !isPremium;
              const iconBg = isDark ? action.darkBg : action.lightBg;
              const handlePress = isLocked
                ? () => router.push("/(app)/subscription")
                : () => router.push(action.route);

              return (
                <TouchableOpacity
                  key={action.labelKey}
                  onPress={handlePress}
                  style={[
                    s.actionCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isLocked ? action.color + "40" : colors.border,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <View style={[s.actionIconWrap, { backgroundColor: iconBg }]}>
                      <AppIcon
                        icon={action.icon}
                        size={20}
                        color={action.color}
                        strokeWidth={2.2}
                      />
                      {isLocked && (
                        <View style={[s.lockDot, { backgroundColor: action.color }]}>
                          <AppIcon icon={Lock} size={8} color="#fff" strokeWidth={3} />
                        </View>
                      )}
                    </View>

                    <View style={[s.actionArrow, { backgroundColor: action.color + "12" }]}>
                      <AppIcon icon={ChevronRight} size={10} color={action.color} strokeWidth={3} />
                    </View>
                  </View>

                  <Text
                    style={[
                      s.actionLabel,
                      { color: isLocked ? action.color : colors.text, marginTop: 4 },
                    ]}
                    numberOfLines={2}
                  >
                    {t.home.actions[action.labelKey]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── BANNIÈRE ABONNEMENT EN BAS ─────────────────────────── */}
        {!isPremium && (
          <View style={{ marginTop: -4 }}>
            <PremiumBanner />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  /* Header */
  headerWrap: {
    backgroundColor: "#1A1A3E",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    overflow: "hidden",
    position: "relative",
  },
  deco1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(124,58,237,0.18)",
    top: -70,
    right: -40,
  },
  deco2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(201,168,76,0.12)",
    bottom: -40,
    left: -30,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  greeting: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.1,
  },
  date: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    marginTop: 4,
    fontWeight: "500",
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(201,168,76,0.2)",
    borderWidth: 1,
    borderColor: "#C9A84C",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  premiumBadgeText: {
    color: "#C9A84C",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  /* Verset */
  verseBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  verseQuote: {
    fontSize: 44,
    lineHeight: 38,
    color: "#C9A84C",
    fontWeight: "900",
    marginTop: -4,
  },
  verseText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 22,
    fontStyle: "italic",
  },
  verseRef: {
    color: "#C9A84C",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },

  /* Sections */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  sectionDot: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },

  /* Prières */
  prayerCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    overflow: "hidden",
    position: "relative",
  },
  prayerAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  prayerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  readPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },

  /* Grille intelligente adaptée aux écrans Samsung */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  actionCard: {
    width: (SCREEN_WIDTH - 42) / 2, // Calcule automatiquement la moitié exacte moins les marges
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    justifyContent: "space-between",
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  lockDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  actionArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
});
