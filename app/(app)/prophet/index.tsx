import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Globe, BookOpen, Mic, Building2, Heart, Church, User } from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { BackButton } from '../../../src/components/common/BackButton';
import { useTheme } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';

const HIGHLIGHT_ICONS = [Church, Globe, Mic, BookOpen, Building2, Heart];

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PROPHET_IMG = (() => { try { return require('../../../assets/images/prophet.jpg'); } catch { return null; } })();

/* ─── Composant ──────────────────────────────────────────────────────────────── */

export default function ProphetScreen() {
  const { colors, spacing } = useTheme();
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const bioParagraphs: string[] = t.prophetPage.bio;
  const visibleParagraphs = expanded ? bioParagraphs : bioParagraphs.slice(0, 2);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero image ── */}
      <View style={styles.heroContainer}>
        {PROPHET_IMG && !imgError ? (
          <Image
            source={PROPHET_IMG}
            style={styles.heroImage}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={[styles.heroImage, { backgroundColor: '#1A1A3E', alignItems: 'center', justifyContent: 'center' }]}>
            <AppIcon icon={User} size={100} color="rgba(201,168,76,0.5)" strokeWidth={1} />
          </View>
        )}
        {/* Dégradé en bas de la photo */}
        <View style={styles.heroGradient} />

        {/* Bouton retour */}
        <View style={styles.backBtnWrap}>
          <BackButton variant="dark" fallback="/(app)/(tabs)/profile" />
        </View>

        {/* Nom sur la photo */}
        <View style={styles.heroNameWrap}>
          <Text style={styles.heroTitle}>Prophète Georges</Text>
          <Text style={styles.heroSubtitle}>Tchingankong</Text>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{t.prophetPage.badge}</Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.base, paddingTop: 24, gap: 24 }}>

        {/* ── Highlights ── */}
        <View style={styles.highlightsGrid}>
          {t.prophetPage.highlights.map((h, i) => (
            <View
              key={h.label}
              style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <AppIcon icon={HIGHLIGHT_ICONS[i]} size={20} color="#C9A84C" strokeWidth={2} />
              <Text style={[styles.highlightValue, { color: colors.text }]}>{h.value}</Text>
              <Text style={[styles.highlightLabel, { color: colors.textSecondary }]}>{h.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Nations ── */}
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.prophetPage.sectionPresence}</Text>
          <View style={styles.nationsRow}>
            {t.prophetPage.nations.map((n) => (
              <View
                key={n}
                style={[styles.nationChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={{ color: colors.text, fontSize: 13 }}>{n}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Biographie ── */}
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.prophetPage.sectionBio}</Text>
          <View style={{ gap: 14 }}>
            {visibleParagraphs.map((para, i) => (
              <Text key={i} style={[styles.bioText, { color: colors.textSecondary }]}>
                {para}
              </Text>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => setExpanded(!expanded)}
            style={[styles.readMoreBtn, { borderColor: '#C9A84C' }]}
          >
            <Text style={{ color: '#C9A84C', fontWeight: '700', fontSize: 14 }}>
              {expanded ? t.prophetPage.readLess : t.prophetPage.readMore}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Citation ── */}
        <View style={[styles.quoteCard, { backgroundColor: '#1A1A3E' }]}>
          <Text style={styles.quoteIcon}>"</Text>
          <Text style={styles.quoteText}>{t.prophetPage.quote}</Text>
          <Text style={styles.quoteAuthor}>— Prophète Georges Tchingankong</Text>
        </View>

      </View>
    </ScrollView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  /* Hero */
  heroContainer: { position: 'relative', height: 440 },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 220,
    backgroundColor: 'transparent',
  },
  backBtnWrap: { position: 'absolute', top: 56, left: 16 },
  heroNameWrap: {
    position: 'absolute', bottom: 24, left: 20, right: 20,
  },
  heroTitle: { fontSize: 32, fontWeight: '900', color: '#fff', lineHeight: 36 },
  heroSubtitle: { fontSize: 28, fontWeight: '900', color: '#C9A84C', lineHeight: 34 },
  heroBadge: {
    marginTop: 8, alignSelf: 'flex-start',
    backgroundColor: 'rgba(201,168,76,0.25)', borderWidth: 1, borderColor: '#C9A84C',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  heroBadgeText: { color: '#C9A84C', fontSize: 12, fontWeight: '700' },

  /* Highlights */
  highlightsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  highlightCard: {
    width: '30.5%', borderRadius: 14, borderWidth: 1,
    paddingVertical: 14, paddingHorizontal: 10,
    alignItems: 'center', gap: 6,
  },
  highlightValue: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  highlightLabel: { fontSize: 10, textAlign: 'center' },

  /* Nations */
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  nationsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nationChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },

  /* Bio */
  bioText: { fontSize: 15, lineHeight: 26 },
  readMoreBtn: {
    marginTop: 16, borderWidth: 1.5, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },

  /* Quote */
  quoteCard: { borderRadius: 20, padding: 24 },
  quoteIcon: { fontSize: 48, color: '#C9A84C', lineHeight: 48, marginBottom: 4 },
  quoteText: { fontSize: 16, color: 'rgba(255,255,255,0.9)', lineHeight: 26, fontStyle: 'italic' },
  quoteAuthor: { marginTop: 16, color: '#C9A84C', fontWeight: '700', fontSize: 13 },
});
