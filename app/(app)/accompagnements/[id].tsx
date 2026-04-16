import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Bell, CheckCircle, Circle, MessageCircle, Star } from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { BackButton } from '../../../src/components/common/BackButton';
import { Button } from '../../../src/components/common/Button';
import { useTheme } from '../../../src/theme';
import { StorageService } from '../../../src/services/storage.service';
import { AIService } from '../../../src/services/ai.service';
import { useAuthStore } from '../../../src/store/auth.store';

const PROGRAMME_DATA: Record<string, {
  title: string;
  color: string;
  days: { day: number; theme: string; prayer: string }[];
}> = {
  foyer: {
    title: 'Foyer & Mariage',
    color: '#C9A84C',
    days: [
      { day: 1, theme: 'Restauration de l\'amour', prayer: 'Seigneur, restaure l\'amour dans mon foyer...' },
      { day: 2, theme: 'Communication et paix', prayer: 'Que ta paix règne dans nos échanges...' },
      { day: 3, theme: 'Protection divine', prayer: 'Protège mon foyer de tout esprit contraire...' },
      { day: 4, theme: 'Unité spirituelle', prayer: 'Que nous soyons un comme Toi et le Père êtes un...' },
      { day: 5, theme: 'Pardon et réconciliation', prayer: 'Aide-nous à nous pardonner comme Tu nous pardonnes...' },
      { day: 6, theme: 'Bénédictions et prospérité', prayer: 'Bénis notre foyer de toutes les bénédictions célestes...' },
      { day: 7, theme: 'Consécration finale', prayer: 'Nous consacrons notre foyer à Ta gloire pour toujours...' },
    ],
  },
  enfants: {
    title: 'Suivi des enfants',
    color: '#7C3AED',
    days: [
      { day: 1, theme: 'Protection et santé', prayer: 'Seigneur, protège mes enfants de tout mal...' },
      { day: 2, theme: 'Réussite scolaire', prayer: 'Donne-leur sagesse et intelligence pour leurs études...' },
      { day: 3, theme: 'Caractère et valeurs', prayer: 'Forme leur caractère selon Ta Parole...' },
      { day: 4, theme: 'Relations saines', prayer: 'Enttoure-les de bonnes fréquentations...' },
      { day: 5, theme: 'Vocation et avenir', prayer: 'Révèle-leur Ta vocation pour leur vie...' },
      { day: 6, theme: 'Foi et engagement', prayer: 'Affermis leur foi dès leur jeunesse...' },
      { day: 7, theme: 'Couverture spirituelle', prayer: 'Je couvre mes enfants du sang de Jésus...' },
    ],
  },
  projets: {
    title: 'Projets & Réussite',
    color: '#0EA5E9',
    days: [
      { day: 1, theme: 'Vision et clarté', prayer: 'Seigneur, clarifie ma vision et mes objectifs...' },
      { day: 2, theme: 'Faveur divine', prayer: 'Accorde-moi Ta faveur auprès des hommes...' },
      { day: 3, theme: 'Ressources et financement', prayer: 'Pourvois à tous mes besoins pour ce projet...' },
      { day: 4, theme: 'Portes ouvertes', prayer: 'Ouvre les portes que personne ne peut fermer...' },
      { day: 5, theme: 'Sagesse d\'exécution', prayer: 'Donne-moi la sagesse pour bien exécuter...' },
      { day: 6, theme: 'Résistance et persévérance', prayer: 'Fortifie-moi pour ne pas abandonner...' },
      { day: 7, theme: 'Décollage et récolte', prayer: 'C\'est le temps de ma percée, je la déclare aujourd\'hui...' },
    ],
  },
  travail: {
    title: 'Travail & Finances',
    color: '#10B981',
    days: [
      { day: 1, theme: 'Faveur professionnelle', prayer: 'Donne-moi faveur et grâce dans mon milieu de travail...' },
      { day: 2, theme: 'Bénédiction financière', prayer: 'Bénis le travail de mes mains...' },
      { day: 3, theme: 'Promotion et élévation', prayer: 'Élève-moi selon Ta volonté...' },
      { day: 4, theme: 'Intégrité et excellence', prayer: 'Aide-moi à être excellent en toutes choses...' },
      { day: 5, theme: 'Destruction des blocages', prayer: 'Brise toute malédiction sur mes finances...' },
      { day: 6, theme: 'Abondance et surplus', prayer: 'Que j\'aie en abondance pour donner aux autres...' },
      { day: 7, theme: 'Gestion et sagesse', prayer: 'Donne-moi sagesse pour gérer ce que Tu me confies...' },
    ],
  },
  concours: {
    title: 'Concours & Examens',
    color: '#F59E0B',
    days: [
      { day: 1, theme: 'Intelligence divine', prayer: 'Seigneur, donne-moi une intelligence surnaturelle...' },
      { day: 2, theme: 'Mémoire et concentration', prayer: 'Affermis ma mémoire et ma concentration...' },
      { day: 3, theme: 'Paix et calme', prayer: 'Que Ta paix garde mon cœur et mon esprit...' },
      { day: 4, theme: 'Faveur des correcteurs', prayer: 'Donne-moi faveur auprès des examinateurs...' },
      { day: 5, theme: 'Destruction de l\'échec', prayer: 'Je brise tout esprit d\'échec en mon nom...' },
      { day: 6, theme: 'Confirmation', prayer: 'Confirme mon succès par Ta Parole...' },
      { day: 7, theme: 'Victoire déclarée', prayer: 'Je déclare la victoire sur cet examen au nom de Jésus...' },
    ],
  },
  addictions: {
    title: 'Délivrance & Addictions',
    color: '#EF4444',
    days: [
      { day: 1, theme: 'Reconnaissance et soumission', prayer: 'Je reconnais mon besoin de délivrance, Seigneur...' },
      { day: 2, theme: 'Rupture des liens', prayer: 'Brise tout lien d\'esclavage dans ma vie...' },
      { day: 3, theme: 'Renouvellement de l\'esprit', prayer: 'Renouvelle mon esprit selon Ta Parole...' },
      { day: 4, theme: 'Remplacement par le Saint-Esprit', prayer: 'Remplis le vide en moi de Ton Esprit...' },
      { day: 5, theme: 'Résistance et armure', prayer: 'Revêts-moi de l\'armure complète de Dieu...' },
      { day: 6, theme: 'Restauration et dignité', prayer: 'Restaure ma dignité et ma valeur...' },
      { day: 7, theme: 'Liberté déclarée', prayer: 'Si le Fils vous affranchit, vous serez réellement libres...' },
    ],
  },
  sante: {
    title: 'Guérison & Santé',
    color: '#EC4899',
    days: [
      { day: 1, theme: 'Foi pour la guérison', prayer: 'Je crois que par Ses meurtrissures je suis guéri...' },
      { day: 2, theme: 'Prière d\'intercession', prayer: 'Seigneur, touche mon corps et restaure ma santé...' },
      { day: 3, theme: 'Destruction de la maladie', prayer: 'Je commande à tout esprit de maladie de partir...' },
      { day: 4, theme: 'Force et vitalité', prayer: 'Renouvelle ma force comme celle de l\'aigle...' },
      { day: 5, theme: 'Déclaration de guérison', prayer: 'Je déclare que je suis guéri au nom de Jésus...' },
      { day: 6, theme: 'Action de grâce anticipée', prayer: 'Je Te remercie pour ma guérison totale...' },
      { day: 7, theme: 'Témoignage et marche', prayer: 'Je marche dans ma guérison et je témoigne de Ta gloire...' },
    ],
  },
};

const MAX_FREE_QUESTIONS = 5;
const STORAGE_KEY_PREFIX = '@spirit/accompagnement_';

export default function AccompagnementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.role === 'subscriber';

  const programme = PROGRAMME_DATA[id ?? ''];
  const storageKey = `${STORAGE_KEY_PREFIX}${id}`;

  const [currentDay, setCurrentDay] = useState(1);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await StorageService.get<{ currentDay: number; completedDays: number[]; questionsUsed: number }>(storageKey);
      if (saved) {
        setCurrentDay(saved.currentDay ?? 1);
        setCompletedDays(saved.completedDays ?? []);
        setQuestionsUsed(saved.questionsUsed ?? 0);
      }
      setLoading(false);
    })();
  }, []);

  async function markDayComplete(day: number) {
    const updated = [...completedDays, day];
    const nextDay = Math.min(day + 1, 7);
    setCompletedDays(updated);
    setCurrentDay(nextDay);
    await StorageService.set(storageKey, { currentDay: nextDay, completedDays: updated, questionsUsed });
  }

  function handleAskQuestion() {
    const remaining = isPremium ? Infinity : MAX_FREE_QUESTIONS - questionsUsed;
    if (!isPremium && questionsUsed >= MAX_FREE_QUESTIONS) {
      Alert.alert(
        'Limite atteinte',
        'Vous avez atteint votre limite. Abonnez-vous ou choisissez un autre service.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: "S'abonner", onPress: () => router.push('/(app)/subscription') },
        ],
      );
      return;
    }
    // Naviguer vers le guide spirituel avec contexte
    router.push('/(app)/(tabs)/ai');
  }

  if (!programme) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Programme introuvable</Text>
      </View>
    );
  }

  const dayData = programme.days[currentDay - 1];
  const progressPct = (completedDays.length / 7) * 100;
  const questionsLeft = isPremium ? '∞' : Math.max(0, MAX_FREE_QUESTIONS - questionsUsed);
  const allDone = completedDays.length === 7;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: programme.color + 'CC' }]}>
        <BackButton variant="dark" style={{ marginBottom: 12 }} />
        <Text style={s.headerTitle}>{programme.title}</Text>
        <Text style={s.headerSub}>Programme spirituel de 7 jours</Text>

        {/* Barre de progression */}
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${progressPct}%`, backgroundColor: '#fff' }]} />
        </View>
        <Text style={s.progressText}>{completedDays.length}/7 jours complétés</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.base, gap: 16 }}>

        {allDone ? (
          /* ─ Félicitations ─ */
          <View style={[s.doneCard, { backgroundColor: programme.color + '18', borderColor: programme.color }]}>
            <AppIcon icon={Star} size={48} color={programme.color} strokeWidth={1.6} />
            <Text style={[s.doneTitle, { color: programme.color }]}>Programme terminé !</Text>
            <Text style={[s.doneSub, { color: colors.textSecondary }]}>
              Félicitations ! Vous avez complété les 7 jours du programme {programme.title}.
              Continuez à marcher dans vos déclarations.
            </Text>
          </View>
        ) : (
          /* ─ Jour actuel ─ */
          <View style={[s.dayCard, { backgroundColor: colors.surface, borderColor: programme.color + '40', borderWidth: 1.5 }]}>
            <View style={[s.dayBadge, { backgroundColor: programme.color }]}>
              <Text style={s.dayBadgeText}>Jour {currentDay}</Text>
            </View>
            <Text style={[s.dayTheme, { color: colors.text }]}>{dayData?.theme}</Text>
            <Text style={[s.dayPrayer, { color: colors.textSecondary }]}>{dayData?.prayer}</Text>

            <Button
              label={`✅ J'ai prié — Passer au jour ${currentDay + 1}`}
              variant="gold"
              fullWidth
              onPress={() => markDayComplete(currentDay)}
              style={{ marginTop: 16 }}
            />
          </View>
        )}

        {/* ─ Tous les jours ─ */}
        <Text style={[s.sectionTitle, { color: colors.text }]}>Programme complet</Text>
        {programme.days.map((d) => {
          const done = completedDays.includes(d.day);
          const active = d.day === currentDay && !allDone;
          return (
            <View
              key={d.day}
              style={[
                s.dayRow,
                { backgroundColor: colors.surface, borderColor: active ? programme.color : colors.border },
                active && { borderWidth: 1.5 },
              ]}
            >
              <AppIcon
                icon={done ? CheckCircle : Circle}
                size={20}
                color={done ? programme.color : colors.textTertiary}
                strokeWidth={2}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>
                  Jour {d.day} — {d.theme}
                </Text>
              </View>
              {done && <Text style={{ color: programme.color, fontSize: 11, fontWeight: '700' }}>✓ Fait</Text>}
              {active && <Text style={{ color: programme.color, fontSize: 11, fontWeight: '700' }}>En cours</Text>}
            </View>
          );
        })}

        {/* ─ Questions supplémentaires ─ */}
        <View style={[s.questionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={s.questionsHeader}>
            <AppIcon icon={MessageCircle} size={18} color={programme.color} strokeWidth={2.2} />
            <Text style={[s.questionsTitle, { color: colors.text }]}>Questions supplémentaires</Text>
            <View style={[s.questionsBadge, { backgroundColor: programme.color + '20' }]}>
              <Text style={{ color: programme.color, fontSize: 12, fontWeight: '700' }}>
                {questionsLeft} restante{questionsLeft !== 1 && questionsLeft !== '∞' ? 's' : ''}
              </Text>
            </View>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 12 }}>
            Posez jusqu'à {isPremium ? 'autant de questions que vous souhaitez' : `${MAX_FREE_QUESTIONS} questions`} à votre guide spirituel dans le cadre de ce programme.
          </Text>
          <Button
            label="Poser une question au guide spirituel"
            variant="outline"
            fullWidth
            onPress={handleAskQuestion}
            disabled={!isPremium && questionsUsed >= MAX_FREE_QUESTIONS}
          />
        </View>

        {/* ─ Activer les rappels ─ */}
        <TouchableOpacity
          style={[s.notifRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/(app)/notifications')}
        >
          <AppIcon icon={Bell} size={18} color={colors.primary} strokeWidth={2.2} />
          <Text style={{ flex: 1, color: colors.text, fontSize: 13, fontWeight: '500' }}>
            Activer les rappels quotidiens
          </Text>
          <Text style={{ color: colors.textTertiary }}>›</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 12 },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },

  doneCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  doneTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  doneSub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },

  dayCard: { borderRadius: 16, padding: 18 },
  dayBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  dayBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  dayTheme: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  dayPrayer: { fontSize: 14, lineHeight: 24, fontStyle: 'italic' },

  sectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },

  questionsCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  questionsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  questionsTitle: { flex: 1, fontSize: 14, fontWeight: '700' },
  questionsBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },

  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
});
