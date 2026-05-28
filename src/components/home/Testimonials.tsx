/**
 * Testimonials — Section preuve sociale sur la home
 * Témoignages d'utilisateurs africains d'Oracle Plus.
 */
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { AppIcon } from '../common/AppIcon';
import { useTheme } from '../../theme';

const { width: W } = Dimensions.get('window');
const CARD_W = Math.min(W - 48, 320);

const TESTIMONIALS = [
  {
    id: '1',
    name: 'Aminata K.',
    country: '🇨🇮 Côte d\'Ivoire',
    avatar: 'A',
    rating: 5,
    text: 'L\'interprétation de mon rêve était tellement précise ! J\'ai compris un message que Dieu m\'envoyait depuis des semaines.',
  },
  {
    id: '2',
    name: 'Jean-Baptiste M.',
    country: '🇨🇲 Cameroun',
    avatar: 'J',
    rating: 5,
    text: 'La voyance m\'a aidé à prendre une décision importante pour mon business. Les conseils spirituels sont vraiment profonds.',
  },
  {
    id: '3',
    name: 'Fatou D.',
    country: '🇸🇳 Sénégal',
    avatar: 'F',
    rating: 5,
    text: 'Les prières générées sont personnalisées et puissantes. Je les utilise chaque matin. Merci Oracle Plus !',
  },
  {
    id: '4',
    name: 'Emmanuel O.',
    country: '🇳🇬 Nigeria',
    avatar: 'E',
    rating: 5,
    text: 'Amazing spiritual guidance! The dream interpretation helped me understand my calling. Highly recommended.',
  },
  {
    id: '5',
    name: 'Marie-Claire B.',
    country: '🇨🇩 RD Congo',
    avatar: 'M',
    rating: 5,
    text: 'J\'utilise Oracle Plus tous les jours. Les réponses sont toujours en accord avec ma foi. Béni !',
  },
];

function Stars({ count }: { count: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: count }).map((_, i) => (
        <AppIcon key={i} icon={Star} size={12} color="#F59E0B" strokeWidth={0} />
      ))}
    </View>
  );
}

export function Testimonials() {
  const { colors } = useTheme();
  const [active, setActive] = useState(0);
  const listRef = useRef<FlatList>(null);

  return (
    <View style={st.wrap}>
      {/* Header */}
      <View style={st.header}>
        <View style={[st.accent, { backgroundColor: colors.primary }]} />
        <Text style={[st.title, { color: colors.text }]}>Ce que disent nos utilisateurs</Text>
      </View>

      {/* Carousel */}
      <FlatList
        ref={listRef}
        data={TESTIMONIALS}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + 12}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        onScroll={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + 12));
          setActive(Math.min(idx, TESTIMONIALS.length - 1));
        }}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[st.card, { width: CARD_W, backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Quote */}
            <Text style={[st.quote, { color: colors.primary }]}>"</Text>
            <Text style={[st.text, { color: colors.text }]}>{item.text}</Text>

            {/* Footer */}
            <View style={st.footer}>
              <View style={[st.avatar, { backgroundColor: colors.primaryPale, borderColor: colors.primary + '40' }]}>
                <Text style={[st.avatarTxt, { color: colors.primary }]}>{item.avatar}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[st.name, { color: colors.text }]}>{item.name}</Text>
                <Text style={[st.country, { color: colors.textSecondary }]}>{item.country}</Text>
              </View>
              <Stars count={item.rating} />
            </View>
          </View>
        )}
      />

      {/* Dots */}
      <View style={st.dots}>
        {TESTIMONIALS.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              listRef.current?.scrollToIndex({ index: i, animated: true, viewOffset: 20 });
              setActive(i);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <View style={[
              st.dot,
              { backgroundColor: i === active ? colors.primary : colors.border },
              i === active && { width: 16 },
            ]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap:      { gap: 12 },
  header:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20 },
  accent:    { width: 3, height: 18, borderRadius: 2 },
  title:     { fontSize: 16, fontWeight: '800' },
  card:      { borderRadius: 18, borderWidth: 1, padding: 18, gap: 10,
               ...Platform.select({ web: { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 } }) },
  quote:     { fontSize: 40, fontWeight: '900', lineHeight: 36, marginBottom: -8 },
  text:      { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  footer:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  avatar:    { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  avatarTxt: { fontSize: 14, fontWeight: '800' },
  name:      { fontSize: 13, fontWeight: '700' },
  country:   { fontSize: 11, marginTop: 1 },
  dots:      { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: 4 },
  dot:       { height: 6, width: 6, borderRadius: 3 },
});
