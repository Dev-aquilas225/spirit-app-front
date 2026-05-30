/**
 * NoCreditsBanner — s'affiche en bas de l'écran dès que les crédits sont épuisés.
 * Propose de recharger ou de s'abonner. Disparaît si l'utilisateur est abonné.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Crown, Zap } from 'lucide-react-native';
import { router } from 'expo-router';
import { AppIcon } from '../common/AppIcon';
import { useAccess } from '../../hooks/useAccess';
import { CreditGate } from './CreditGate';
import type { CreditAction } from '../../store/credits.store';

interface Props {
  action: CreditAction;
}

export function NoCreditsBanner({ action }: Props) {
  const { hasSubscription, credits, canPerform } = useAccess();
  const [gateVisible, setGateVisible] = useState(false);

  // Masqué si abonné ou si l'utilisateur a encore des crédits
  if (hasSubscription || canPerform(action)) return null;

  return (
    <>
      <View style={s.banner}>
        <View style={s.left}>
          <AppIcon icon={Zap} size={18} color="#F59E0B" strokeWidth={2.5} />
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Crédits épuisés</Text>
            <Text style={s.sub}>Rechargez ou passez à l'abonnement pour continuer.</Text>
          </View>
        </View>
        <View style={s.actions}>
          <TouchableOpacity
            style={[s.btn, s.btnOutline]}
            onPress={() => setGateVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={s.btnOutlineTxt}>Recharger</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.btn, s.btnGold]}
            onPress={() => router.push('/subscription?tab=credits' as any)}
            activeOpacity={0.8}
          >
            <AppIcon icon={Crown} size={13} color="#0B1628" strokeWidth={2.5} />
            <Text style={s.btnGoldTxt}>S'abonner</Text>
          </TouchableOpacity>
        </View>
      </View>

      <CreditGate
        visible={gateVisible}
        action={action}
        onSuccess={() => setGateVisible(false)}
        onClose={() => setGateVisible(false)}
      />
    </>
  );
}

const s = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(245,158,11,0.30)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F59E0B',
  },
  sub: {
    fontSize: 11,
    color: 'rgba(245,158,11,0.75)',
    marginTop: 1,
    lineHeight: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: 'rgba(245,158,11,0.50)',
  },
  btnOutlineTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  btnGold: {
    backgroundColor: '#C9A84C',
  },
  btnGoldTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B1628',
  },
});
