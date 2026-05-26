/**
 * DailyBonus — Récompense quotidienne de connexion
 * Affiche un modal la première fois que l'utilisateur ouvre l'app chaque jour.
 * Donne 50 crédits gratuits + XP.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Sparkles, Star, Zap } from 'lucide-react-native';
import { AppIcon } from '../common/AppIcon';
import { useTheme } from '../../theme';
import { StorageService } from '../../services/storage.service';
import { useCreditsStore } from '../../store/credits.store';
import { useGamificationStore } from '../../store/gamification.store';
import { useAuthStore } from '../../store/auth.store';

const KEY_LAST_BONUS = '@oracle/last_daily_bonus';
const BONUS_CREDITS  = 50;

export function DailyBonus() {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const scale = useRef(new Animated.Value(0.8)).current;
  const fade  = useRef(new Animated.Value(0)).current;

  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const fetchBalance    = useCreditsStore(s => s.fetchBalance);
  const addXp           = useGamificationStore(s => s.addXp);
  const streak          = useGamificationStore(s => s.streak);

  useEffect(() => {
    if (!isAuthenticated) return;
    checkBonus();
  }, [isAuthenticated]);

  async function checkBonus() {
    const last  = await StorageService.get<string>(KEY_LAST_BONUS);
    const today = new Date().toISOString().split('T')[0];
    if (last === today) return;
    // Attendre 3s après le chargement pour ne pas perturber le splash
    setTimeout(() => {
      setVisible(true);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(fade,  { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }, 3000);
  }

  async function claim() {
    if (claimed) return;
    setClaimed(true);
    const today = new Date().toISOString().split('T')[0];
    await StorageService.set(KEY_LAST_BONUS, today);
    // Ajouter XP localement
    await addXp(20);
    // Recharger le solde (le backend a déjà crédité via le cron ou on fait un appel direct)
    await fetchBalance().catch(() => {});
    setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setVisible(false));
    }, 1500);
  }

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={() => setVisible(false)}>
      <Animated.View style={[st.overlay, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => !claimed && setVisible(false)} />
        <Animated.View style={[st.card, { backgroundColor: colors.surface, transform: [{ scale }] }]}>
          {/* Étoiles décoratives */}
          <Text style={st.stars}>✦ ✦ ✦</Text>

          <View style={[st.iconWrap, { backgroundColor: colors.primaryPale, borderColor: colors.primary + '40' }]}>
            <AppIcon icon={Sparkles} size={36} color={colors.primary} strokeWidth={1.5} />
          </View>

          <Text style={[st.title, { color: colors.text }]}>Bonus quotidien !</Text>
          <Text style={[st.sub, { color: colors.textSecondary }]}>
            Vous êtes de retour 🙏{'\n'}Voici votre récompense du jour
          </Text>

          {/* Récompenses */}
          <View style={st.rewards}>
            <View style={[st.rewardItem, { backgroundColor: colors.primaryPale, borderColor: colors.primary + '30' }]}>
              <AppIcon icon={Zap} size={18} color={colors.primary} strokeWidth={2} />
              <Text style={[st.rewardTxt, { color: colors.primary }]}>+{BONUS_CREDITS} crédits</Text>
            </View>
            <View style={[st.rewardItem, { backgroundColor: 'rgba(245,158,11,0.10)', borderColor: 'rgba(245,158,11,0.25)' }]}>
              <AppIcon icon={Star} size={18} color="#F59E0B" strokeWidth={2} />
              <Text style={[st.rewardTxt, { color: '#F59E0B' }]}>+20 XP</Text>
            </View>
          </View>

          {streak > 1 && (
            <Text style={[st.streak, { color: colors.textTertiary }]}>
              🔥 {streak} jours consécutifs — continuez !
            </Text>
          )}

          <TouchableOpacity
            style={[st.btn, { backgroundColor: colors.primary, opacity: claimed ? 0.6 : 1 }]}
            onPress={claim}
            disabled={claimed}
            activeOpacity={0.85}
          >
            <Text style={[st.btnTxt, { color: colors.buttonPrimaryText }]}>
              {claimed ? '✓ Réclamé !' : 'Réclamer mon bonus'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card:       { width: '100%', maxWidth: 340, borderRadius: 24, padding: 28, alignItems: 'center', gap: 12,
                ...Platform.select({ web: { boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 20 } }) },
  stars:      { fontSize: 16, color: '#C9A84C', letterSpacing: 8 },
  iconWrap:   { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  title:      { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  sub:        { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  rewards:    { flexDirection: 'row', gap: 12, marginVertical: 4 },
  rewardItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  rewardTxt:  { fontSize: 15, fontWeight: '800' },
  streak:     { fontSize: 12, textAlign: 'center' },
  btn:        { width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  btnTxt:     { fontSize: 15, fontWeight: '800' },
});
