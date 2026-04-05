import { router } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Crown,
  FileText,
  Gift,
  Globe,
  LogOut,
  MessageCircle,
  Moon,
  Pencil,
  Settings,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react-native";
import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppIcon } from "../../../../src/components/common/AppIcon";
import { Card } from "../../../../src/components/common/Card";
import { useAuth } from "../../../../src/hooks/useAuth";
import { usePremiumAccess } from "../../../../src/hooks/usePremiumAccess";
import { useSubscription } from "../../../../src/hooks/useSubscription";
import { useTheme } from "../../../../src/theme";

interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  badge?: string;
  danger?: boolean;
}

function MenuItem({
  icon,
  label,
  onPress,
  badge,
  danger = false,
}: MenuItemProps) {
  const { colors } = useTheme();
  const labelColor = danger ? "#EF4444" : colors.text;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
    >
      <View style={{ marginRight: 14 }}>
        <AppIcon icon={icon} size={20} color={labelColor} strokeWidth={2.2} />
      </View>
      <Text style={[styles.menuLabel, { color: labelColor }]}>{label}</Text>
      {badge && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
            {badge}
          </Text>
        </View>
      )}
      <View style={{ marginLeft: "auto" }}>
        <AppIcon
          icon={ChevronRight}
          size={18}
          color={colors.textTertiary}
          strokeWidth={2.2}
        />
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { colors, spacing } = useTheme();
  const { user, logout } = useAuth();
  const { isPremium } = usePremiumAccess();
  const { daysUntilExpiry } = useSubscription();

  function handleLogout() {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
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
          { backgroundColor: colors.deepBlue ?? "#1A1A3E", paddingTop: 56 },
        ]}
      >
        <View style={styles.avatarCircle}>
          <AppIcon icon={UserIcon} size={32} color="#fff" strokeWidth={2.2} />
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
        <Text style={styles.country}>
          {user?.country} • {user?.language?.toUpperCase()}
        </Text>

        {isPremium ? (
          <View
            style={[
              styles.premiumBadge,
              {
                backgroundColor: "rgba(201,168,76,0.3)",
                borderColor: "#C9A84C",
              },
            ]}
          >
            <View style={styles.premiumRow}>
              <AppIcon
                icon={Crown}
                size={16}
                color="#C9A84C"
                strokeWidth={2.4}
              />
              <Text
                style={{ color: "#C9A84C", fontWeight: "700", fontSize: 13 }}
              >
                Membre Premium — {daysUntilExpiry}j restants
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => router.push("/(app)/subscription")}
            style={[
              styles.premiumBadge,
              {
                backgroundColor: "rgba(201,168,76,0.2)",
                borderColor: "#C9A84C",
              },
            ]}
          >
            <View style={styles.premiumRow}>
              <AppIcon
                icon={MessageCircle}
                size={16}
                color="#C9A84C"
                strokeWidth={2.4}
              />
              <Text
                style={{ color: "#C9A84C", fontWeight: "600", fontSize: 13 }}
              >
                Passer Premium
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ padding: spacing.base, gap: spacing.md }}>
        {/* Account */}
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            MON COMPTE
          </Text>
          <Card padding="none">
            <MenuItem
              icon={Pencil}
              label="Modifier le profil"
              onPress={() => {}}
            />
            <MenuItem
              icon={Bell}
              label="Notifications"
              onPress={() => router.push("/(app)/notifications")}
            />
            <MenuItem
              icon={Globe}
              label="Langue & Région"
              onPress={() => router.push("/(app)/settings")}
            />
            <MenuItem
              icon={Moon}
              label="Apparence"
              onPress={() => router.push("/(app)/settings")}
            />
          </Card>
        </View>

        {/* Subscription */}
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            ABONNEMENT
          </Text>
          <Card padding="none">
            {!isPremium && (
              <MenuItem
                icon={Crown}
                label="S'abonner — 5 000 FCFA/mois"
                onPress={() => router.push("/(app)/subscription")}
                badge="PREMIUM"
              />
            )}
            {isPremium && (
              <MenuItem
                icon={Settings}
                label="Gérer mon abonnement"
                onPress={() => router.push("/(app)/subscription/manage")}
              />
            )}
            <MenuItem
              icon={CreditCard}
              label="Historique paiements"
              onPress={() => router.push("/(app)/subscription/history")}
            />
          </Card>
        </View>

        {/* Community */}
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            COMMUNAUTÉ
          </Text>
          <Card padding="none">
            <MenuItem
              icon={Gift}
              label="Parrainage"
              onPress={() => router.push("/(app)/referral")}
            />
            <MenuItem
              icon={MessageCircle}
              label="Support"
              onPress={() => router.push("/(app)/support")}
            />
          </Card>
        </View>

        {/* Legal */}
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            LÉGAL
          </Text>
          <Card padding="none">
            <MenuItem
              icon={FileText}
              label="Conditions d'utilisation"
              onPress={() => router.push("/(app)/legal/terms")}
            />
            <MenuItem
              icon={ShieldCheck}
              label="Politique de confidentialité"
              onPress={() => router.push("/(app)/legal/privacy")}
            />
          </Card>
        </View>

        {/* Logout */}
        <Card padding="none">
          <MenuItem
            icon={LogOut}
            label="Se déconnecter"
            onPress={handleLogout}
            danger
          />
        </Card>

        <Text style={[styles.version, { color: colors.textTertiary }]}>
          Oracle Plus v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", paddingBottom: 32, paddingHorizontal: 16 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  name: { fontSize: 22, fontWeight: "800", color: "#fff" },
  phone: { fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  country: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  premiumBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  premiumRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  menuLabel: { fontSize: 15, flex: 1 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 8,
  },
  version: { textAlign: "center", fontSize: 12, paddingBottom: 16 },
});
