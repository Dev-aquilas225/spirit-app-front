/**
 * ShareButton — Partage un contenu avec un lien tracké par userId.
 *
 * Génère une URL de la forme : {APP_URL}?ref={userId}&type={type}
 * Le backend peut ainsi attribuer les partages à l'utilisateur source.
 */
import React, { useState } from 'react';
import { Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Share2, Check } from 'lucide-react-native';
import { useAuthStore } from '../../store/auth.store';
import { AppIcon } from './AppIcon';

export type ShareContentType = 'dream' | 'prophecy' | 'prayer' | 'daily';

interface ShareButtonProps {
  type: ShareContentType;
  content: string;       // Texte à partager (résumé ou extrait)
  compact?: boolean;     // Affichage icône seule (sans label)
  color?: string;
}

const TYPE_LABELS: Record<ShareContentType, string> = {
  dream:    '🌙 Interprétation de rêve',
  prophecy: '🔮 Guidance prophétique',
  prayer:   '🙏 Prière spirituelle',
  daily:    '✨ Message du jour',
};

function getAppUrl(): string {
  return (typeof window !== 'undefined' && (window as any).__ENV__?.EXPO_PUBLIC_APP_URL)
    || process.env.EXPO_PUBLIC_APP_URL
    || 'https://oracle-plus.online';
}

export function ShareButton({ type, content, compact = false, color = '#C9A84C' }: ShareButtonProps) {
  const userId = useAuthStore((s) => s.user?.id);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const appUrl = getAppUrl();
    const ref    = userId ? `?ref=${userId}&type=${type}` : `?type=${type}`;
    const link   = `${appUrl}${ref}`;

    const label   = TYPE_LABELS[type];
    const preview = content.length > 120 ? content.slice(0, 120) + '…' : content;
    const message = `${label} — Oracle Plus\n\n"${preview}"\n\n👉 ${link}\n\nInscrivez-vous et recevez 2000 crédits gratuits !`;

    if (Platform.OS === 'web') {
      if (navigator.share) {
        try {
          await navigator.share({ title: label, text: message, url: link });
          flashCopied();
          return;
        } catch { /* annulé par l'utilisateur */ }
      }
      // Fallback : copier dans le presse-papier
      try {
        await navigator.clipboard.writeText(message);
        flashCopied();
      } catch {}
    } else {
      try {
        await Share.share({ message, url: link });
        flashCopied();
      } catch {}
    }
  }

  function flashCopied() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (compact) {
    return (
      <TouchableOpacity onPress={handleShare} style={st.iconBtn} activeOpacity={0.75} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <AppIcon icon={copied ? Check : Share2} size={16} color={copied ? '#10B981' : color} strokeWidth={2.2} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handleShare} style={[st.btn, { borderColor: color + '40' }]} activeOpacity={0.8}>
      <AppIcon icon={copied ? Check : Share2} size={15} color={copied ? '#10B981' : color} strokeWidth={2.2} />
      <Text style={[st.label, { color: copied ? '#10B981' : color }]}>
        {copied ? 'Lien copié !' : 'Partager'}
      </Text>
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(201,168,76,0.06)',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(201,168,76,0.08)',
  },
});
