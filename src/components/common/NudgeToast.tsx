/**
 * NudgeToast — non-blocking behavioral nudge banner
 *
 * Slides in from the top, auto-dismisses after 6 seconds.
 * Tapping navigates to the suggested route.
 * Never blocks navigation or interaction.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Sparkles, X } from 'lucide-react-native';
import { useNudgeStore } from '../../store/nudge.store';
import { AppIcon } from './AppIcon';

const AUTO_DISMISS_MS = 6000;

export function NudgeToast() {
  const { visible, message, route, hideNudge } = useNudgeStore();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();

      // Auto-dismiss
      timerRef.current = setTimeout(() => dismiss(), AUTO_DISMISS_MS);
    } else {
      dismiss(false);
    }

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible]);

  const dismiss = (animate = true) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (animate) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => hideNudge());
    } else {
      translateY.setValue(-100);
      opacity.setValue(0);
    }
  };

  const handlePress = () => {
    dismiss();
    if (route) router.push(route as any);
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[s.container, { transform: [{ translateY }], opacity }]}
      pointerEvents="box-none"
    >
      <TouchableOpacity style={s.toast} onPress={handlePress} activeOpacity={0.9}>
        <View style={s.iconWrap}>
          <AppIcon icon={Sparkles} size={18} color="#C9A84C" strokeWidth={2.2} />
        </View>
        <Text style={s.message} numberOfLines={2}>{message}</Text>
        <TouchableOpacity onPress={() => dismiss()} style={s.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <AppIcon icon={X} size={14} color="rgba(255,255,255,0.6)" strokeWidth={2.5} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: 9999,
    // Does not block touches below
  },
  toast: {
    backgroundColor: '#1A1A3E',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(201,168,76,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  closeBtn: {
    padding: 2,
  },
});
