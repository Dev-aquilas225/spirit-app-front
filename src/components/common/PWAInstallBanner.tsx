import {
  ArrowUp,
  Download,
  MessageCircle,
  Share,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useI18n } from "../../i18n";
import { usePWAInstall } from "../../hooks/usePWAInstall";

/**
 * PWAInstallBanner — Bandeau d'installation de la PWA.
 *
 * • Chrome / Edge Desktop + Android  → bouton natif "Installer"
 * • iOS Safari                        → modal avec instructions manuelles
 *                                       "Partager → Sur l'écran d'accueil"
 * • Invisible sur iOS Chrome/Firefox et sur native
 */
export function PWAInstallBanner() {
  const { canShowNative, canShowIOS, install, dismiss } = usePWAInstall();
  const { width } = useWindowDimensions();
  const { t } = useI18n();
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (Platform.OS !== "web") return null;

  const isNarrow = width < 480;

  // ── iOS Safari banner ────────────────────────────────────────────────────────
  if (canShowIOS) {
    return (
      <>
        {/* Bandeau compact */}
        <View style={styles.wrapper}>
          <View style={styles.topAccent} />
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <MessageCircle size={20} color="#C9A84C" strokeWidth={2} />
            </View>

            <View style={styles.texts}>
              <Text style={styles.title} numberOfLines={1}>
                {t.pwa.installTitle}
              </Text>
              {!isNarrow && (
                <Text style={styles.sub} numberOfLines={1}>
                  {t.pwa.iosSubtitle}
                </Text>
              )}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => setShowIOSModal(true)}
                activeOpacity={0.8}
                style={styles.installBtn}
              >
                <Share size={14} color="#1A1A3E" strokeWidth={2.5} />
                <Text style={styles.installLabel}>{t.pwa.howTo}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={dismiss}
                activeOpacity={0.7}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color="rgba(255,255,255,0.45)" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Modal instructions iOS */}
        <Modal
          visible={showIOSModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowIOSModal(false)}
        >
          <Pressable
            style={styles.overlay}
            onPress={() => setShowIOSModal(false)}
          >
            <Pressable style={styles.modal} onPress={() => {}}>
              {/* Flèche vers le bas pointant vers la barre Safari */}
              <View style={styles.modalHeader}>
                <MessageCircle size={22} color="#C9A84C" strokeWidth={2} />
                <Text style={styles.modalTitle}>{t.pwa.installTitle}</Text>
              </View>

              <Text style={styles.modalSub}>
                {t.pwa.safariNoAuto}
              </Text>

              {/* Étape 1 */}
              <View style={styles.step}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <View style={styles.stepIconRow}>
                    <Share size={18} color="#C9A84C" strokeWidth={2} />
                    <Text style={styles.stepText}>
                      {t.pwa.step1}
                    </Text>
                  </View>
                  <Text style={styles.stepHint}>
                    {t.pwa.step1Hint}
                  </Text>
                </View>
              </View>

              {/* Étape 2 */}
              <View style={styles.step}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>{t.pwa.step2}</Text>
                </View>
              </View>

              {/* Étape 3 */}
              <View style={styles.step}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>{t.pwa.step3}</Text>
                </View>
              </View>

              {/* Indicateur flèche bas (barre Safari est en bas sur iOS) */}
              <View style={styles.arrowHint}>
                <ArrowUp
                  size={18}
                  color="rgba(255,255,255,0.35)"
                  strokeWidth={2}
                  style={{ transform: [{ rotate: "180deg" }] }}
                />
                <Text style={styles.arrowHintText}>{t.pwa.safariBarHint}</Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setShowIOSModal(false);
                  dismiss();
                }}
                style={styles.modalCloseBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCloseBtnText}>{t.common.understood}</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </>
    );
  }

  // ── Chrome / Edge Native banner ───────────────────────────────────────────
  if (!canShowNative) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.topAccent} />
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <MessageCircle size={20} color="#C9A84C" strokeWidth={2} />
        </View>

        <View style={styles.texts}>
          <Text style={styles.title} numberOfLines={1}>
            {t.pwa.installTitle}
          </Text>
          {!isNarrow && (
            <Text style={styles.sub} numberOfLines={1}>
              {t.pwa.nativeSubtitle}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={install}
            activeOpacity={0.8}
            style={styles.installBtn}
          >
            <Download size={14} color="#1A1A3E" strokeWidth={2.5} />
            <Text style={styles.installLabel}>{t.pwa.installButton}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={dismiss}
            activeOpacity={0.7}
            style={styles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={16} color="rgba(255,255,255,0.45)" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#1A1A3E",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(201,168,76,0.3)",
    ...Platform.select({
      web: { boxShadow: "0 2px 8px rgba(0,0,0,0.25)" } as object,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
    zIndex: 999,
  },
  topAccent: {
    height: 2,
    backgroundColor: "#C9A84C",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(201,168,76,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.3)",
  },
  texts: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.1,
  },
  sub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  installBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#C9A84C",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  installLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A1A3E",
  },
  closeBtn: {
    padding: 2,
  },

  // ── iOS Modal ──────────────────────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  modal: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#1A1A3E",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.25)",
    ...Platform.select({
      web: { boxShadow: "0 -4px 24px rgba(0,0,0,0.5)" } as object,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
        elevation: 20,
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.2,
  },
  modalSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 20,
    marginBottom: 20,
  },
  step: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(201,168,76,0.2)",
    borderWidth: 1,
    borderColor: "#C9A84C",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#C9A84C",
  },
  stepContent: {
    flex: 1,
    gap: 3,
  },
  stepIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  stepText: {
    fontSize: 14,
    color: "#fff",
    lineHeight: 20,
  },
  stepHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    fontStyle: "italic",
  },
  bold: {
    fontWeight: "700",
    color: "#C9A84C",
  },
  arrowHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
    marginBottom: 20,
    opacity: 0.6,
  },
  arrowHintText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    fontStyle: "italic",
  },
  modalCloseBtn: {
    backgroundColor: "#C9A84C",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  modalCloseBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1A3E",
    letterSpacing: 0.3,
  },
});
