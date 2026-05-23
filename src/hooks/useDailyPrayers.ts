import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useDailyPrayers } from '../../../src/hooks/useDailyPrayers';
import { useTheme } from "../../../src/theme";
import { Sun, Moon, Copy, Volume2, Square, RefreshCw } from 'lucide-react-native';
import { FadeInView } from "../../../src/components/common/FadeInView";

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function PrayerProgramScreen() {
  const { colors } = useTheme();
  const { morning, evening, isLoading, error, refresh, currentlyPlayingId } = useDailyPrayers();

  // Programmation des notifications à chaque fois que les prières sont chargées
  useEffect(() => {
    if (morning || evening) {
      programmerNotifications();
    }
  }, [morning, evening]);

  const programmerNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    // Notification Matin (06h00)
    if (morning) {
      const texte = morning.text || morning.content || "";
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🌅 Prière du Matin",
          body: texte.substring(0, 60) + "...",
        },
        trigger: { hour: 6, minute: 0, repeats: true } as any,
      });
    }

    // Notification Soir (20h00)
    if (evening) {
      const texte = evening.text || evening.content || "";
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🌌 Prière du Soir",
          body: texte.substring(0, 60) + "...",
        },
        trigger: { hour: 20, minute: 0, repeats: true } as any,
      });
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background ?? '#0F172A' }]}>
        <ActivityIndicator size="large" color="#C9A84C" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background ?? '#0F172A' }]}>
      <FadeInView>
        <Text style={styles.headerTitle}>Prières Prophétiques</Text>
        
        {/* SECTION MATIN */}
        {morning && (
          <View style={[styles.card, { backgroundColor: colors.surface ?? '#1E293B' }]}>
            <View style={styles.cardHeader}>
              <Sun size={24} color="#C9A84C" />
              <Text style={styles.prayerTitle}>Prière du Matin</Text>
            </View>
            <Text style={styles.prayerText}>{morning.text || morning.content}</Text>
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={morning.copyText}>
                <Copy size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Copier</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, currentlyPlayingId === 'morning' ? styles.btnStop : styles.btnPlay]} 
                onPress={currentlyPlayingId === 'morning' ? morning.stopAudio : morning.playAudio}
              >
                {currentlyPlayingId === 'morning' ? <Square size={18} color="#fff" /> : <Volume2 size={18} color="#fff" />}
                <Text style={styles.actionButtonText}>{currentlyPlayingId === 'morning' ? "Arrêter" : "Écouter"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SECTION SOIR */}
        {evening && (
          <View style={[styles.card, { backgroundColor: colors.surface ?? '#1E293B' }]}>
            <View style={styles.cardHeader}>
              <Moon size={24} color="#C9A84C" />
              <Text style={styles.prayerTitle}>Prière du Soir</Text>
            </View>
            <Text style={styles.prayerText}>{evening.text || evening.content}</Text>
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={evening.copyText}>
                <Copy size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Copier</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, currentlyPlayingId === 'evening' ? styles.btnStop : styles.btnPlay]} 
                onPress={currentlyPlayingId === 'evening' ? evening.stopAudio : evening.playAudio}
              >
                {currentlyPlayingId === 'evening' ? <Square size={18} color="#fff" /> : <Volume2 size={18} color="#fff" />}
                <Text style={styles.actionButtonText}>{currentlyPlayingId === 'evening' ? "Arrêter" : "Écouter"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', marginTop: 40, marginBottom: 20 },
  card: { borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  prayerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  prayerText: { fontSize: 15, color: '#e2e8f0', lineHeight: 24, marginBottom: 20 },
  actionsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  actionButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, flex: 1, justifyContent: 'center' },
  actionButtonText: { color: '#fff', marginLeft: 8, fontWeight: '600' },
  btnPlay: { backgroundColor: '#C9A84C' },
  btnStop: { backgroundColor: '#ef4444' }
});