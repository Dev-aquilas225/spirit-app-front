import React, { useEffect, Component } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { useAuthStore }  from '../src/store/auth.store';
import { useThemeStore } from '../src/store/theme.store';
import { useTheme }      from '../src/theme';
import { PWAInstallBanner } from '../src/components/common/PWAInstallBanner';
import { NudgeToast }    from '../src/components/common/NudgeToast';
import { DailyBonus }    from '../src/components/gamification/DailyBonus';
import { useSmartNudges } from '../src/hooks/useSmartNudges';

// ── ErrorBoundary — évite les crash blancs sur erreur JS ─────────────────────
interface EBState { hasError: boolean; error?: Error }
class ErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  state: EBState = { hasError: false };
  static getDerivedStateFromError(error: Error): EBState { return { hasError: true, error }; }
  componentDidCatch(error: Error) { console.error('[ErrorBoundary]', error); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={eb.root}>
        <Text style={eb.icon}>✦</Text>
        <Text style={eb.title}>Une erreur est survenue</Text>
        <Text style={eb.msg}>{this.state.error?.message ?? 'Erreur inconnue'}</Text>
        <TouchableOpacity style={eb.btn} onPress={() => { this.setState({ hasError: false }); router.replace('/home'); }}>
          <Text style={eb.btnTxt}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
const eb = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0B1628', alignItems: 'center', justifyContent: 'center', padding: 32 },
  icon:   { fontSize: 40, color: '#C9A84C', marginBottom: 16 },
  title:  { fontSize: 20, fontWeight: '800', color: '#FDF8EE', marginBottom: 8, textAlign: 'center' },
  msg:    { fontSize: 13, color: 'rgba(253,248,238,0.55)', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  btn:    { backgroundColor: '#C9A84C', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24 },
  btnTxt: { fontSize: 14, fontWeight: '700', color: '#0B1628' },
});

// ── Nudge layer ───────────────────────────────────────────────────────────────
function NudgeLayer() { useSmartNudges(); return <NudgeToast />; }

// ── Inner layout (accès au thème) ─────────────────────────────────────────────
function InnerLayout() {
  const { colors } = useTheme();
  const bg = colors.background;

  return (
    <Stack screenOptions={{
      headerShown: false,
      animation: 'fade',
      animationDuration: 220,
      contentStyle: { backgroundColor: bg },
    }}>
      <Stack.Screen name="index"  options={{ contentStyle: { backgroundColor: bg } }} />
      <Stack.Screen name="(auth)" options={{ contentStyle: { backgroundColor: bg } }} />
      <Stack.Screen name="(app)"  options={{ contentStyle: { backgroundColor: bg } }} />
      <Stack.Screen name="auth"   options={{ contentStyle: { backgroundColor: bg } }} />
    </Stack>
  );
}

// ── Root layout ───────────────────────────────────────────────────────────────
export default function RootLayout() {
  const initializeTheme = useThemeStore((s) => s.initialize);
  const initializeAuth  = useAuthStore((s) => s.initialize);
  const language = useAuthStore((s) => s.user?.language ?? 'fr');

  useEffect(() => {
    initializeTheme();
    initializeAuth().catch(() => {});
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PWAInstallBanner />
          <NudgeLayer />
          <DailyBonus />
          <InnerLayout />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
