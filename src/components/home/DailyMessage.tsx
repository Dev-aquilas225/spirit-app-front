/**
 * DailyMessage — Verset / message spirituel du jour.
 * Affiché en haut de l'onglet Rêves. Contenu statique rotatif (7 jours).
 * Inclut un bouton Partager tracké par userId.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { AppIcon } from '../common/AppIcon';
import { ShareButton } from '../common/ShareButton';
import { useTheme } from '../../theme';

const MESSAGES = [
  { verse: 'Car je connais les projets que j\'ai formés sur vous, dit l\'Éternel, projets de paix et non de malheur.', ref: 'Jérémie 29:11' },
  { verse: 'Je puis tout par celui qui me fortifie.', ref: 'Philippiens 4:13' },
  { verse: 'L\'Éternel est mon berger : je ne manquerai de rien.', ref: 'Psaume 23:1' },
  { verse: 'Confie-toi en l\'Éternel de tout ton cœur, et ne t\'appuie pas sur ta sagesse.', ref: 'Proverbes 3:5' },
  { verse: 'Cherchez premièrement le royaume et la justice de Dieu ; et toutes ces choses vous seront données par-dessus.', ref: 'Matthieu 6:33' },
  { verse: 'Ne crains rien, car je suis avec toi ; ne promène pas des regards inquiets, car je suis ton Dieu.', ref: 'Ésaïe 41:10' },
  { verse: 'Remets ton sort à l\'Éternel, mets en lui ta confiance, et il agira.', ref: 'Psaume 37:5' },
];

function getTodayMessage() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return MESSAGES[dayOfYear % MESSAGES.length];
}

export function DailyMessage() {
  const { colors } = useTheme();
  const msg = getTodayMessage();
  const fullText = `"${msg.verse}" — ${msg.ref}`;

  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: 'rgba(201,168,76,0.25)' }]}>
      <View style={st.top}>
        <View style={st.iconWrap}>
          <AppIcon icon={Sparkles} size={14} color="#C9A84C" strokeWidth={2.4} />
        </View>
        <Text style={[st.label, { color: '#C9A84C' }]}>Message du jour</Text>
        <ShareButton type="daily" content={fullText} compact />
      </View>
      <Text style={[st.verse, { color: colors.text }]}>"{msg.verse}"</Text>
      <Text style={[st.ref, { color: colors.textTertiary }]}>{msg.ref}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  card:    { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 4 },
  top:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  iconWrap:{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(201,168,76,0.12)', alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, flex: 1 },
  verse:   { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  ref:     { fontSize: 12, marginTop: 6, fontWeight: '600' },
});
