/**
 * NotifBlockedBanner — s'affiche en haut de l'app si les notifications sont désactivées.
 * Invite l'utilisateur à les réactiver dans les paramètres système.
 */
import React, { useState } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bell, X } from 'lucide-react-native';
import { AppIcon } from './AppIcon';

interface Props {
  visible: boolean;
}

export function NotifBlockedBanner({ visible }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (!visible || dismissed) return null;

  function openSettings() {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else if (Platform.OS === 'android') {
      Linking.openSettings();
    } else {
      // Web — on ne peut pas ouvrir les paramètres directement
      alert('Activez les notifications dans les paramètres de votre navigateur (icône 🔒 dans la barre d\'adresse).');
    }
  }

  return (
    <View style={s.banner}>
      <AppIcon icon={Bell} size={16} color="#F59E0B" strokeWidth={2.5} />
      <View style={{ flex: 1 }}>
        <Text style={s.title}>Notifications désactivées</Text>
        <Text style={s.sub}>Activez-les pour recevoir vos prières et rappels quotidiens.</Text>
      </View>
      <TouchableOpacity style={s.btn} onPress={openSettings} activeOpacity={0.8}>
        <Text style={s.btnTxt}>Activer</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setDismissed(true)} style={s.close}>
        <AppIcon icon={X} size={14} color="rgba(245,158,11,0.7)" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245,158,11,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  title: { fontSize: 12, fontWeight: '800', color: '#F59E0B' },
  sub:   { fontSize: 11, color: 'rgba(245,158,11,0.75)', marginTop: 1 },
  btn:   { backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  btnTxt:{ fontSize: 12, fontWeight: '800', color: '#1A1A3E' },
  close: { padding: 4 },
});
