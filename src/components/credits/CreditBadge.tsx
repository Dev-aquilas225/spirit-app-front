import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { useCreditsStore } from '../../store/credits.store';
import { router } from 'expo-router';

export function CreditBadge() {
  const credits = useCreditsStore((s) => s.credits);
  const isLow = credits < 100;

  return (
    <TouchableOpacity
      style={[s.badge, isLow && s.badgeLow]}
      onPress={() => router.push('/subscription' as any)}
    >
      <Zap size={13} color={isLow ? '#ff6b6b' : '#C9A84C'} fill={isLow ? '#ff6b6b' : '#C9A84C'} />
      <Text style={[s.text, isLow && s.textLow]}>{credits.toLocaleString()}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(201,168,76,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
  },
  badgeLow: {
    backgroundColor: 'rgba(255,107,107,0.15)',
    borderColor: 'rgba(255,107,107,0.3)',
  },
  text: { fontSize: 13, fontWeight: '700', color: '#C9A84C' },
  textLow: { color: '#ff6b6b' },
});
