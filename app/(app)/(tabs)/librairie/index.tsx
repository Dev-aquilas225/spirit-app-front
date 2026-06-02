/**
 * Librairie Spirituelle — Oracle Plus
 *
 * Règles :
 * - Chaque livre a un prix en FCFA (1 FCFA = 1 crédit).
 * - L'abonnement actif NE donne PAS accès aux livres.
 * - Tout le monde paie avec ses crédits (ou Paystack directement).
 * - Après paiement validé → PDF téléchargeable.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, Modal,
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { BookOpen, Download, Lock, Search, ShoppingCart, Unlock, X } from 'lucide-react-native';
import { useTheme } from '../../../../src/theme';
import { Livre, LibrairieService } from '../../../../src/services/librairie.service';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { useCreditsStore } from '../../../../src/store/credits.store';

const CATEGORIES = ['Tous', 'Spiritualité', 'Prophétie', 'Prières', 'Rêves', 'Délivrance', 'Formation', 'Autre'];
const POLL_INTERVAL = 4000;
const POLL_MAX      = 45; // 3 minutes

export default function LibrairieScreen() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { credits, fetchBalance } = useCreditsStore();

  const [livres,      setLivres]      = useState<Livre[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [category,    setCategory]    = useState('Tous');
  const [selected,    setSelected]    = useState<Livre | null>(null);
  const [paying,      setPaying]      = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pollStep,    setPollStep]    = useState<'idle' | 'waiting' | 'success' | 'failed'>('idle');
  const [countdown,   setCountdown]   = useState(0);

  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCount    = useRef(0);
  const currentRef   = useRef<string | null>(null); // référence Paystack en cours

  const stopAll = useCallback(() => {
    if (pollRef.current)  { clearInterval(pollRef.current);  pollRef.current  = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await LibrairieService.getAll(category === 'Tous' ? undefined : category);
    setLivres(data);
    setLoading(false);
  }, [category]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => () => stopAll(), [stopAll]);

  const filtered = livres.filter(b =>
    !search ||
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    (b.author ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // ── Lancer le paiement Paystack ───────────────────────────────────────────
  async function handleAcheter(livre: Livre) {
    if (livre.purchased) {
      handleTelecharger(livre);
      return;
    }
    setPaying(true);
    const result = await LibrairieService.initierPaiement(livre.id);
    setPaying(false);

    if (result.error || !result.authorizationUrl) {
      Alert.alert('Erreur', result.error ?? 'Impossible d\'initier le paiement');
      return;
    }

    const ref = result.reference!;
    currentRef.current = ref;
    setPollStep('waiting');
    pollCount.current = 0;

    // Ouvrir Paystack
    if (Platform.OS === 'web') {
      window.open(result.authorizationUrl, '_blank');
    } else {
      WebBrowser.openAuthSessionAsync(result.authorizationUrl, 'oracle-plus://').catch(() => {});
    }

    // Décompte 3 minutes
    setCountdown(POLL_MAX * (POLL_INTERVAL / 1000));
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);

    // Polling
    pollRef.current = setInterval(async () => {
      pollCount.current++;
      try {
        const status = await LibrairieService.verifierPaiement(ref);
        if (status.status === 'success') {
          stopAll();
          await LibrairieService.sauvegarderAchat(livre.id, ref);
          await fetchBalance();
          setLivres(prev => prev.map(b => b.id === livre.id ? { ...b, purchased: true } : b));
          if (selected?.id === livre.id) setSelected(prev => prev ? { ...prev, purchased: true } : prev);
          setPollStep('success');
          return;
        }
        if (status.status === 'failed' || status.status === 'cancelled') {
          stopAll();
          setPollStep('failed');
          return;
        }
      } catch { /* continuer */ }

      if (pollCount.current >= POLL_MAX) {
        stopAll();
        setPollStep('failed');
      }
    }, POLL_INTERVAL);
  }

  // ── Télécharger le PDF ────────────────────────────────────────────────────
  async function handleTelecharger(livre: Livre) {
    setDownloading(true);
    const result = await LibrairieService.telechargerPdf(livre);
    setDownloading(false);
    if (result.error) {
      Alert.alert('Erreur', result.error);
      return;
    }
    if (Platform.OS !== 'web') {
      Alert.alert('✅ Téléchargé', 'Le PDF a été enregistré sur votre appareil.');
    }
  }

  function resetPoll() {
    stopAll();
    setPollStep('idle');
    setCountdown(0);
    currentRef.current = null;
  }

  // ── Carte livre ───────────────────────────────────────────────────────────
  function LivreCard({ livre }: { livre: Livre }) {
    const isFree      = livre.priceFcfa === 0;
    const isPurchased = livre.purchased;
    const accessible  = isFree || isPurchased;

    return (
      <TouchableOpacity style={s.card} onPress={() => setSelected(livre)} activeOpacity={0.85}>
        <View style={s.coverWrap}>
          {livre.coverUrl
            ? <Image source={{ uri: livre.coverUrl }} style={s.cover} resizeMode="cover" />
            : <View style={[s.cover, s.coverFallback]}>
                <AppIcon icon={BookOpen} size={32} color="#C9A84C" strokeWidth={1.5} />
              </View>
          }
          <View style={[s.lockBadge, accessible ? s.lockOpen : s.lockClosed]}>
            <AppIcon icon={accessible ? Unlock : Lock} size={11} color="#fff" strokeWidth={2.5} />
          </View>
        </View>

        <Text style={[s.bookTitle, { color: colors.text }]} numberOfLines={2}>{livre.title}</Text>
        <Text style={[s.bookAuthor, { color: colors.textSecondary }]} numberOfLines={1}>{livre.author}</Text>

        {isFree
          ? <Text style={s.freeTag}>Gratuit</Text>
          : <Text style={[s.priceTag, isPurchased && s.paidTag]}>
              {isPurchased ? '✓ Acheté' : `${livre.priceFcfa} FCFA`}
            </Text>
        }

        <TouchableOpacity
          style={[s.quickBtn, accessible ? s.quickBtnGold : s.quickBtnOutline]}
          onPress={() => accessible ? handleTelecharger(livre) : setSelected(livre)}
        >
          <Text style={s.quickBtnTxt}>
            {accessible ? 'Télécharger' : `${livre.priceFcfa} FCFA`}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // ── Modal détail + paiement ───────────────────────────────────────────────
  function LivreModal() {
    if (!selected) return null;
    const isFree      = selected.priceFcfa === 0;
    const isPurchased = selected.purchased;
    const accessible  = isFree || isPurchased;

    // Écran de polling
    if (pollStep === 'waiting') {
      const mins = Math.floor(countdown / 60);
      const secs = countdown % 60;
      return (
        <Modal visible animationType="slide" transparent onRequestClose={() => { resetPoll(); setSelected(null); }}>
          <View style={s.modalOverlay}>
            <View style={[s.modalBox, { backgroundColor: colors.surface }]}>
              <ActivityIndicator color="#C9A84C" size="large" style={{ marginBottom: 16 }} />
              <Text style={[s.modalTitle, { color: colors.text }]}>Paiement en cours…</Text>
              <Text style={[s.modalDesc, { color: colors.textSecondary }]}>
                Complétez le paiement dans la page Paystack qui s'est ouverte.
              </Text>

              {/* Bandeau partenaire */}
              <View style={s.partnerBanner}>
                <Text style={{ fontSize: 15 }}>🔒</Text>
                <Text style={[s.partnerText, { flex: 1 }]}>
                  La transaction apparaîtra sous{' '}
                  <Text style={s.partnerName}>universdeslivres.squares</Text>
                  {' '}sur votre relevé — c'est notre partenaire financier.
                </Text>
              </View>

              <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 8 }}>
                Expire dans {mins}:{String(secs).padStart(2, '0')}
              </Text>
              <TouchableOpacity onPress={() => { resetPoll(); setSelected(null); }} style={{ marginTop: 16 }}>
                <Text style={{ color: colors.textTertiary, fontSize: 12, textDecorationLine: 'underline' }}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      );
    }

    // Succès
    if (pollStep === 'success') {
      return (
        <Modal visible animationType="slide" transparent onRequestClose={() => { resetPoll(); setSelected(null); }}>
          <View style={s.modalOverlay}>
            <View style={[s.modalBox, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 12 }}>✅</Text>
              <Text style={[s.modalTitle, { color: colors.text }]}>Paiement confirmé !</Text>
              <Text style={[s.modalDesc, { color: colors.textSecondary }]}>
                "{selected.title}" est maintenant disponible au téléchargement.
              </Text>
              <TouchableOpacity
                style={[s.actionBtn, s.downloadBtn, { marginTop: 20 }]}
                onPress={() => { resetPoll(); handleTelecharger(selected); }}
              >
                <AppIcon icon={Download} size={18} color="#fff" strokeWidth={2.5} />
                <Text style={s.actionBtnTxt}>Télécharger le PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { resetPoll(); setSelected(null); }} style={{ marginTop: 12 }}>
                <Text style={{ color: colors.textTertiary, fontSize: 13 }}>Plus tard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      );
    }

    // Échec
    if (pollStep === 'failed') {
      return (
        <Modal visible animationType="slide" transparent onRequestClose={() => { resetPoll(); setSelected(null); }}>
          <View style={s.modalOverlay}>
            <View style={[s.modalBox, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 12 }}>❌</Text>
              <Text style={[s.modalTitle, { color: colors.text }]}>Paiement non abouti</Text>
              <Text style={[s.modalDesc, { color: colors.textSecondary }]}>
                Le paiement a été annulé ou a expiré. Vous pouvez réessayer.
              </Text>
              <TouchableOpacity
                style={[s.actionBtn, s.buyBtn, { marginTop: 20 }]}
                onPress={() => { resetPoll(); handleAcheter(selected); }}
              >
                <Text style={s.actionBtnTxt}>Réessayer</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { resetPoll(); setSelected(null); }} style={{ marginTop: 12 }}>
                <Text style={{ color: colors.textTertiary, fontSize: 13 }}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      );
    }

    // Détail normal
    return (
      <Modal visible animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, { backgroundColor: colors.surface }]}>
            <TouchableOpacity style={s.modalClose} onPress={() => setSelected(null)}>
              <AppIcon icon={X} size={22} color={colors.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>

            {selected.coverUrl
              ? <Image source={{ uri: selected.coverUrl }} style={s.modalCover} resizeMode="cover" />
              : <View style={[s.modalCover, s.coverFallback]}>
                  <AppIcon icon={BookOpen} size={48} color="#C9A84C" strokeWidth={1.5} />
                </View>
            }

            <Text style={[s.modalTitle, { color: colors.text }]}>{selected.title}</Text>
            {selected.author
              ? <Text style={[s.modalAuthor, { color: colors.textSecondary }]}>{selected.author}</Text>
              : null}
            {selected.description
              ? <Text style={[s.modalDesc, { color: colors.textSecondary }]}>{selected.description}</Text>
              : null}

            {/* Prix */}
            <View style={s.priceRow}>
              <AppIcon
                icon={accessible ? Unlock : ShoppingCart}
                size={18}
                color={accessible ? '#10B981' : '#F59E0B'}
                strokeWidth={2.5}
              />
              <Text style={[s.priceLabel, { color: accessible ? '#10B981' : '#F59E0B' }]}>
                {isFree ? 'Gratuit' : isPurchased ? 'Déjà acheté' : `${selected.priceFcfa} FCFA`}
              </Text>
            </View>

            {/* Note : abonnement ne donne pas accès */}
            {!accessible && (
              <View style={s.noteBanner}>
                <Text style={s.noteText}>
                  ℹ️ L'abonnement Oracle Plus ne donne pas accès aux livres. Chaque livre s'achète séparément.
                </Text>
              </View>
            )}

            {/* Bandeau partenaire */}
            {!accessible && (
              <View style={s.partnerBanner}>
                <Text style={{ fontSize: 13 }}>🔒</Text>
                <Text style={[s.partnerText, { flex: 1 }]}>
                  Paiement sécurisé via{' '}
                  <Text style={s.partnerName}>universdeslivres.squares</Text>
                  {' '}(partenaire financier Oracle Plus).
                </Text>
              </View>
            )}

            {accessible ? (
              <TouchableOpacity
                style={[s.actionBtn, s.downloadBtn]}
                onPress={() => { setSelected(null); handleTelecharger(selected); }}
                disabled={downloading}
              >
                {downloading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                      <AppIcon icon={Download} size={18} color="#fff" strokeWidth={2.5} />
                      <Text style={s.actionBtnTxt}>Télécharger le PDF</Text>
                    </>
                }
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[s.actionBtn, s.buyBtn]}
                onPress={() => handleAcheter(selected)}
                disabled={paying}
              >
                {paying
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                      <AppIcon icon={ShoppingCart} size={18} color="#fff" strokeWidth={2.5} />
                      <Text style={s.actionBtnTxt}>Acheter — {selected.priceFcfa} FCFA</Text>
                    </>
                }
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <View style={[s.root, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingHorizontal: spacing.lg }]}>
        <Text style={[s.title, { color: colors.text }]}>Librairie Spirituelle</Text>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>
          {livres.length} livre{livres.length !== 1 ? 's' : ''} · Solde : {credits} FCFA
        </Text>
      </View>

      {/* Recherche */}
      <View style={[s.searchRow, { marginHorizontal: spacing.lg, backgroundColor: colors.surface }]}>
        <AppIcon icon={Search} size={16} color={colors.textSecondary} strokeWidth={2} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un livre…"
          placeholderTextColor={colors.textSecondary}
          style={[s.searchInput, { color: colors.text }]}
        />
      </View>

      {/* Catégories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.catScroll}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 8 }}
      >
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c}
            onPress={() => setCategory(c)}
            style={[s.catChip, category === c && s.catChipActive]}
          >
            <Text style={[s.catTxt, category === c && s.catTxtActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grille */}
      {loading
        ? <ActivityIndicator color="#C9A84C" style={{ marginTop: 40 }} />
        : <FlatList
            data={filtered}
            keyExtractor={b => b.id}
            numColumns={2}
            contentContainerStyle={{ padding: spacing.lg, gap: 16 }}
            columnWrapperStyle={{ gap: 16 }}
            renderItem={({ item }) => <LivreCard livre={item} />}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 60, gap: 12 }}>
                <AppIcon icon={BookOpen} size={52} color={colors.textTertiary} strokeWidth={1.5} />
                <Text style={[s.empty, { color: colors.textSecondary }]}>
                  Aucun livre disponible
                </Text>
                <Text style={{ color: colors.textTertiary, fontSize: 12, textAlign: 'center' }}>
                  Les livres seront ajoutés par l'administrateur.
                </Text>
              </View>
            }
          />
      }

      <LivreModal />
    </View>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1 },
  header:          { paddingVertical: 16 },
  title:           { fontSize: 22, fontWeight: '700' },
  subtitle:        { fontSize: 13, marginTop: 2 },
  searchRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  searchInput:     { flex: 1, fontSize: 14 },
  catScroll:       { maxHeight: 44, marginBottom: 8 },
  catChip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  catChipActive:   { backgroundColor: '#C9A84C', borderColor: '#C9A84C' },
  catTxt:          { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  catTxtActive:    { color: '#fff' },
  // Carte
  card:            { flex: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  coverWrap:       { position: 'relative' },
  cover:           { width: '100%', aspectRatio: 2 / 3 },
  coverFallback:   { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(201,168,76,0.08)' },
  lockBadge:       { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  lockClosed:      { backgroundColor: '#F59E0B' },
  lockOpen:        { backgroundColor: '#10B981' },
  bookTitle:       { fontSize: 13, fontWeight: '700', padding: 8, paddingBottom: 2 },
  bookAuthor:      { fontSize: 11, paddingHorizontal: 8, paddingBottom: 4 },
  freeTag:         { fontSize: 11, fontWeight: '700', color: '#10B981', paddingHorizontal: 8, paddingBottom: 4 },
  priceTag:        { fontSize: 11, fontWeight: '700', color: '#F59E0B', paddingHorizontal: 8, paddingBottom: 4 },
  paidTag:         { color: '#10B981' },
  quickBtn:        { margin: 8, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  quickBtnGold:    { backgroundColor: '#10B981' },
  quickBtnOutline: { backgroundColor: 'rgba(201,168,76,0.12)', borderWidth: 1, borderColor: '#C9A84C' },
  quickBtnTxt:     { fontSize: 12, fontWeight: '700', color: '#fff' },
  empty:           { textAlign: 'center', fontSize: 15 },
  // Modal
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalBox:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '92%' },
  modalClose:      { alignSelf: 'flex-end', marginBottom: 12 },
  modalCover:      { width: 120, height: 180, borderRadius: 12, alignSelf: 'center', marginBottom: 16 },
  modalTitle:      { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  modalAuthor:     { fontSize: 14, textAlign: 'center', marginBottom: 8, opacity: 0.7 },
  modalDesc:       { fontSize: 13, lineHeight: 20, marginBottom: 12, textAlign: 'center' },
  priceRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 10 },
  priceLabel:      { fontSize: 18, fontWeight: '800' },
  noteBanner:      { backgroundColor: 'rgba(99,102,241,0.08)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)', borderRadius: 10, padding: 10, marginBottom: 10 },
  noteText:        { fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 18, textAlign: 'center' },
  partnerBanner:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', borderRadius: 10, padding: 10, marginBottom: 14 },
  partnerText:     { fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 18 },
  partnerName:     { fontWeight: '700', color: '#10B981' },
  actionBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24 },
  buyBtn:          { backgroundColor: '#C9A84C' },
  downloadBtn:     { backgroundColor: '#10B981' },
  actionBtnTxt:    { color: '#fff', fontSize: 16, fontWeight: '700' },
});
