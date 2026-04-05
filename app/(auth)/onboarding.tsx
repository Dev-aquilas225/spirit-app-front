import { router } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  BookOpen,
  Briefcase,
  Compass,
  Crown,
  GraduationCap,
  Hash,
  Heart,
  Lightbulb,
  MessageCircle,
  Moon,
  Plane,
  Shield,
  ShoppingBag,
  Star,
  Target,
  Users,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppIcon } from "../../src/components/common/AppIcon";
import { Button } from "../../src/components/common/Button";
import { StorageService } from "../../src/services/storage.service";
import { STORAGE_KEYS } from "../../src/utils/constants";

const { width } = Dimensions.get("window");
const AUTO_MS = 3000;

// ─── Types ─────────────────────────────────────────────────────────────────────
type ServiceItem = { number: number; label: string; icon: LucideIcon };

type HeroSlide = {
  kind: "hero";
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  bg: string;
};
type ServicesSlide = {
  kind: "services";
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  bg: string;
  items: ServiceItem[];
};
type Slide = HeroSlide | ServicesSlide;

// ─── Contenu ───────────────────────────────────────────────────────────────────
const SLIDES: Slide[] = [
  {
    kind: "hero",
    id: "1",
    icon: MessageCircle,
    bg: "#1A1A3E",
    title: "Votre Compagnon Spirituel",
    subtitle:
      "Guidance, prières, accompagnements et bien plus — tout en un seul endroit, 24h/24.",
  },
  {
    kind: "services",
    id: "2",
    icon: MessageCircle,
    bg: "#0D1A3E",
    title: "Guidance & Consultation",
    subtitle: "Des réponses claires pour votre vie spirituelle",
    items: [
      {
        number: 1,
        label: "Consultation spirituelle générale",
        icon: MessageCircle,
      },
      { number: 2, label: "Interprétation de rêve", icon: Moon },
      {
        number: 3,
        label: "Éclaircissement sur un sujet précis",
        icon: Lightbulb,
      },
      { number: 4, label: "Conseils personnalisés", icon: BookOpen },
      { number: 5, label: "Orientation spirituelle", icon: Compass },
      { number: 6, label: "Prières personnalisées", icon: Heart },
    ],
  },
  {
    kind: "services",
    id: "3",
    icon: Users,
    bg: "#1A0D2E",
    title: "Accompagnements de Vie",
    subtitle: "Un soutien spirituel pour chaque étape",
    items: [
      { number: 7, label: "Trouver un mari / une femme", icon: Heart },
      { number: 8, label: "Trouver un travail", icon: Briefcase },
      { number: 9, label: "Projet de voyage", icon: Plane },
      { number: 10, label: "Suivi des enfants", icon: Users },
      { number: 11, label: "Combat spirituel (addiction…)", icon: Shield },
    ],
  },
  {
    kind: "services",
    id: "4",
    icon: Star,
    bg: "#1A1400",
    title: "Réussite & Identité",
    subtitle: "Se connaître et avancer avec force",
    items: [
      { number: 12, label: "Concours / Examens", icon: GraduationCap },
      { number: 13, label: "Accompagnement professionnel", icon: Target },
      { number: 14, label: "Connaître mon chiffre spirituel", icon: Hash },
      { number: 15, label: "Boutique spirituelle", icon: ShoppingBag },
    ],
  },
  {
    kind: "hero",
    id: "5",
    icon: Crown,
    bg: "#1A1400",
    title: "Tout ça pour 5 000 FCFA/mois",
    subtitle:
      "Accès illimité à tous les services, livres, formations et consultations. Sans engagement.",
  },
];

const LAST = SLIDES.length - 1;

// ─── Étoiles ───────────────────────────────────────────────────────────────────
function Stars() {
  return (
    <>
      {[...Array(14)].map((_, i) => (
        <View
          key={i}
          style={[
            s.star,
            {
              top: (i * 47) % 700,
              left: (i * 73) % (width - 4),
              opacity: 0.12 + (i % 5) * 0.07,
            },
          ]}
        />
      ))}
    </>
  );
}

// ─── Ligne de service ──────────────────────────────────────────────────────────
function ServiceRow({ item }: { item: ServiceItem }) {
  return (
    <View style={sr.row}>
      <Text style={sr.num}>{item.number}.</Text>
      <AppIcon icon={item.icon} size={15} color="#C9A84C" strokeWidth={2.2} />
      <Text style={sr.label} numberOfLines={1}>
        {item.label}
      </Text>
    </View>
  );
}
const sr = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
  },
  num: {
    width: 22,
    textAlign: "right",
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(201,168,76,0.6)",
  },
  label: {
    flex: 1,
    fontSize: 13.5,
    color: "rgba(255,255,255,0.88)",
    fontWeight: "500",
  },
});

// ─── Écran ─────────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const [slideH, setSlideH] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragging = useRef(false);
  const isLast = index === LAST;

  // ─── Timer helpers ─────────────────────────────────────────────────────────
  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function startTimer(fromIdx: number) {
    clearTimer();
    if (fromIdx >= LAST) return;
    timerRef.current = setInterval(() => {
      if (dragging.current) return;
      setIndex((prev) => {
        if (prev >= LAST) {
          clearTimer();
          return prev;
        }
        const next = prev + 1;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_MS);
  }

  // ─── Démarrage du timer au montage ────────────────────────────────────────
  useEffect(() => {
    startTimer(0);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Aller à un slide (dots) ───────────────────────────────────────────────
  const goTo = useCallback((i: number) => {
    flatListRef.current?.scrollToIndex({ index: i, animated: true });
    setIndex(i);
    startTimer(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Quitter l'onboarding ──────────────────────────────────────────────────
  async function handleFinish() {
    await StorageService.set(STORAGE_KEYS.ONBOARDING_DONE, true);
    router.replace("/(auth)/login");
  }

  // ─── Rendu d'un slide ──────────────────────────────────────────────────────
  function renderSlide(slide: Slide) {
    const h = slideH || 500;

    if (slide.kind === "hero") {
      return (
        <View
          style={[s.slide, { width, height: h, backgroundColor: slide.bg }]}
        >
          <Stars />
          <AppIcon
            icon={slide.icon}
            size={72}
            color="#C9A84C"
            strokeWidth={1.5}
          />
          <Text style={s.title}>{slide.title}</Text>
          <Text style={s.subtitle}>{slide.subtitle}</Text>
        </View>
      );
    }

    return (
      <View style={[s.slide, { width, height: h, backgroundColor: slide.bg }]}>
        <Stars />
        <AppIcon
          icon={slide.icon}
          size={36}
          color="#C9A84C"
          strokeWidth={1.8}
        />
        <Text style={s.title}>{slide.title}</Text>
        <Text style={[s.subtitle, { marginBottom: 16 }]}>{slide.subtitle}</Text>
        <View style={s.listBox}>
          {slide.items.map((item, idx) => (
            <React.Fragment key={item.number}>
              <ServiceRow item={item} />
              {idx < slide.items.length - 1 && <View style={s.divider} />}
            </React.Fragment>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Zone mesurée — occupe tout l'espace entre le header et le footer */}
      <View
        style={s.listArea}
        onLayout={(e) => setSlideH(e.nativeEvent.layout.height)}
      >
        {slideH > 0 && (
          <FlatList
            ref={flatListRef}
            data={SLIDES}
            horizontal
            pagingEnabled
            scrollEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScrollBeginDrag={() => {
              dragging.current = true;
              clearTimer();
            }}
            onScroll={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / width);
              if (i !== index) setIndex(i);
            }}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / width);
              dragging.current = false;
              setIndex(i);
              startTimer(i);
            }}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderSlide(item)}
            getItemLayout={(_, i) => ({
              length: width,
              offset: width * i,
              index: i,
            })}
          />
        )}
      </View>

      {/* Dots cliquables */}
      <View style={s.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => goTo(i)}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <View
              style={[
                s.dot,
                i === index
                  ? { width: 20, backgroundColor: "#C9A84C" }
                  : { backgroundColor: "rgba(255,255,255,0.25)" },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer — bouton visible seulement sur le dernier slide */}
      <View style={s.footer}>
        {isLast ? (
          <Button
            label="Commencer"
            variant="gold"
            fullWidth
            size="lg"
            onPress={handleFinish}
          />
        ) : (
          <TouchableOpacity onPress={handleFinish} style={s.skipBtn}>
            <Text style={s.skip}>Passer l'introduction</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D2B" },

  listArea: { flex: 1 }, // mesure la hauteur disponible pour les slides

  slide: {
    alignItems: "center",
    justifyContent: "center", // centrage vertical
    paddingHorizontal: 28,
  },
  star: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#C9A84C",
    textAlign: "center",
    marginTop: 18,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 22,
  },

  listBox: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "rgba(201,168,76,0.18)",
    paddingTop: 4,
  },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.07)" },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 18,
  },
  dot: { height: 6, width: 6, borderRadius: 3 },

  footer: { paddingHorizontal: 28, paddingBottom: 44 },
  skipBtn: { alignItems: "center", paddingVertical: 10 },
  skip: { color: "rgba(255,255,255,0.38)", fontSize: 13 },
});
