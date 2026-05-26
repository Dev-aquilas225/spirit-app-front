/**
 * LoginModal — bottom sheet de connexion rapide
 * Google OAuth chargé uniquement à l'ouverture, jamais au montage.
 * expo-auth-session retiré du top-level pour éviter le crash au démarrage.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Modal, Platform,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { X, Shield, Sparkles } from 'lucide-react-native';
import { AppIcon } from '../common/AppIcon';
import { AuthService } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { useTheme } from '../../theme';

const ADMIN_EMAILS = (process.env.EXPO_PUBLIC_ADMIN_EMAIL ?? '').split(',').map((e: string) => e.trim());

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function LoginModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const loginWithTokens = useAuthStore((s) => s.loginWithTokens);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible]);

  const handlePostLogin = (email?: string | null, role?: string) => {
    onClose();
    const isAdmin = role === 'admin' || ADMIN_EMAILS.includes(email ?? '');
    if (isAdmin) {
      router.push('/admin');
    } else {
      const profileComplete = useAuthStore.getState().isProfileComplete;
      if (!profileComplete) router.push('/complete-profile');
    }
  };

  const handleGoogleToken = async (idToken: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await AuthService.googleSignIn(idToken);
      if (result.error || !result.data) {
        setError(result.error ?? 'Erreur de connexion Google');
        return;
      }
      const ok = await loginWithTokens(result.data.accessToken, result.data.refreshToken);
      if (!ok) { setError('Erreur lors de la connexion'); return; }
      const user = useAuthStore.getState().user;
      handlePostLogin(user?.email, user?.role);
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // GSI web — chargé uniquement quand la modal s'ouvre
  const gsiContainerId = 'login-modal-gsi';
  const [gsiReady, setGsiReady] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB;
    if (!clientId || clientId.startsWith('YOUR_')) return;

    function initGsi() {
      try {
        const g = (window as any).google;
        if (!g?.accounts?.id) return;
        g.accounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential: string }) => {
            if (response.credential) handleGoogleToken(response.credential);
          },
          auto_select: false,
          cancel_on_tap_outside: false,
        });
        setGsiReady(true);
      } catch {}
    }

    if ((window as any).google?.accounts?.id) {
      initGsi();
    } else {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = initGsi;
      document.head.appendChild(s);
      return () => { try { document.head.removeChild(s); } catch {} };
    }
  }, [visible]);

  useEffect(() => {
    if (!gsiReady || Platform.OS !== 'web' || !visible) return;
    try {
      const container = document.getElementById(gsiContainerId);
      if (!container) return;
      const g = (window as any).google;
      const w = container.offsetWidth || 320;
      g?.accounts?.id?.renderButton(container, {
        theme: 'filled_black', size: 'large', width: w,
        text: 'continue_with', logo_alignment: 'left', shape: 'pill',
      });
    } catch {}
  }, [gsiReady, visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[s.sheet, { backgroundColor: colors.card, transform: [{ translateY: slideAnim }] }]}>
        <View style={[s.handle, { backgroundColor: colors.border }]} />
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <AppIcon icon={X} size={18} color={colors.textSecondary} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={s.hero}>
          <View style={s.heroIcon}>
            <AppIcon icon={Sparkles} size={28} color="#C9A84C" strokeWidth={1.8} />
          </View>
          <Text style={[s.heroTitle, { color: colors.text }]}>Connexion à Oracle Plus</Text>
          <Text style={[s.heroSub, { color: colors.textSecondary }]}>
            Connectez-vous pour sauvegarder vos consultations.
          </Text>
        </View>

        <View style={[s.adminHint, { backgroundColor: 'rgba(201,168,76,0.1)', borderColor: 'rgba(201,168,76,0.25)' }]}>
          <AppIcon icon={Shield} size={14} color="#C9A84C" strokeWidth={2.2} />
          <Text style={s.adminHintText}>
            Les administrateurs sont redirigés automatiquement vers le panneau d'administration.
          </Text>
        </View>

        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color="#C9A84C" />
            <Text style={[s.loadingText, { color: colors.textSecondary }]}>Connexion en cours…</Text>
          </View>
        ) : (
          <View style={s.gsiWrap}>
            {Platform.OS === 'web' ? (
              <>
                <View id={gsiContainerId} style={s.gsiContainer} />
                {!gsiReady && (
                  <TouchableOpacity
                    style={s.googleFallback}
                    onPress={() => (window as any).google?.accounts?.id?.prompt()}
                  >
                    <Text style={s.googleFallbackText}>Continuer avec Google</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <TouchableOpacity style={s.googleBtn} onPress={() => setError('Google Login non configuré sur natif')} activeOpacity={0.85}>
                <Text style={s.googleBtnText}>Continuer avec Google</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {error ? <Text style={s.errorText}>{error}</Text> : null}
        <Text style={[s.disclaimer, { color: colors.textTertiary }]}>
          En continuant, vous acceptez nos conditions d'utilisation.
        </Text>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48, gap: 16 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  closeBtn: { position: 'absolute', top: 20, right: 20, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(128,128,128,0.12)', alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', gap: 10, paddingTop: 8 },
  heroIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(201,168,76,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)' },
  heroTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  adminHint: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  adminHintText: { flex: 1, fontSize: 12, color: '#C9A84C', lineHeight: 18 },
  loadingWrap: { alignItems: 'center', gap: 12, paddingVertical: 16 },
  loadingText: { fontSize: 14 },
  gsiWrap: { alignItems: 'center', width: '100%' },
  gsiContainer: { width: '100%', minHeight: 48 },
  googleFallback: { backgroundColor: '#1A1A3E', borderRadius: 50, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', width: '100%' },
  googleFallbackText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  googleBtn: { backgroundColor: '#1A1A3E', borderRadius: 50, paddingVertical: 15, alignItems: 'center', width: '100%' },
  googleBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  errorText: { color: '#EF4444', fontSize: 13, textAlign: 'center' },
  disclaimer: { fontSize: 11, textAlign: 'center', lineHeight: 16 },
});
