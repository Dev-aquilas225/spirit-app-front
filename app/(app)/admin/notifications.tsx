/**
 * Admin — Notifications Push
 * - Envoi manuel avec titre/corps/cible
 * - Génération automatique via OpenAI toutes les 5h (cron côté backend)
 * - Bouton "Tester le cron" pour déclencher manuellement
 */
import React, { useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, ActivityIndicator, Switch,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Send, Bell, Sparkles, Clock, RefreshCw } from 'lucide-react-native';
import { AppIcon } from '../../../src/components/common/AppIcon';
import { useTheme } from '../../../src/theme';
import { http } from '../../../src/services/http.client';

type Target = 'all' | 'premium' | 'free';

export default function AdminNotifications() {
  const { colors } = useTheme();

  // Manuel
  const [title, setTitle]   = useState('');
  const [body, setBody]     = useState('');
  const [target, setTarget] = useState<Target>('all');
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  // Cron notifications
  const [cronEnabled, setCronEnabled] = useState(true);
  const [cronStatus, setCronStatus]   = useState<'idle'|'loading'|'ok'|'err'>('idle');
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  const sendManual = async () => {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    try {
      await http.post('/admin/notifications/push', { title, body, target });
      setSent(true);
      setTitle(''); setBody('');
      setTimeout(() => setSent(false), 3000);
    } catch {}
    setSending(false);
  };

  const triggerCron = async () => {
    setCronStatus('loading');
    try {
      const res = await http.post<{ message: string; sentAt: string }>(
        '/admin/notifications/cron/trigger', {}
      );
      setLastGenerated((res as any)?.sentAt ?? new Date().toISOString());
      setCronStatus('ok');
    } catch {
      setCronStatus('err');
    }
    setTimeout(() => setCronStatus('idle'), 4000);
  };

  const toggleCron = async (val: boolean) => {
    setCronEnabled(val);
    await http.post('/admin/notifications/cron/toggle', { enabled: val }).catch(() => {});
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0D0D2B' }}
      contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={s.hdr}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <AppIcon icon={ChevronLeft} size={22} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.title}>Notifications Push</Text>
      </View>

      {/* Cron notifications card */}
      <View style={s.card}>
        <View style={s.cardHdr}>
          <View style={[s.iconWrap, { backgroundColor: 'rgba(52,211,153,0.12)' }]}>
            <AppIcon icon={Sparkles} size={24} color="#34D399" strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Message automatique — toutes les 5h</Text>
            <Text style={s.cardSub}>Oracle génère un message mystique et l'envoie à tous les utilisateurs</Text>
          </View>
          <Switch
            value={cronEnabled}
            onValueChange={toggleCron}
            trackColor={{ false: '#333', true: 'rgba(52,211,153,0.4)' }}
            thumbColor={cronEnabled ? '#34D399' : '#666'}
          />
        </View>

        <View style={s.cronInfo}>
          <AppIcon icon={Clock} size={14} color="rgba(255,255,255,0.4)" strokeWidth={2} />
          <Text style={s.cronInfoTxt}>Planifié : 0 */5 * * * (6h, 11h, 16h, 21h, 2h)</Text>
        </View>

        {lastGenerated && (
          <Text style={s.lastSent}>
            Dernier envoi : {new Date(lastGenerated).toLocaleString('fr-FR')}
          </Text>
        )}

        <TouchableOpacity
          style={[s.cronBtn, cronStatus === 'ok' && s.cronBtnOk, cronStatus === 'err' && s.cronBtnErr]}
          onPress={triggerCron}
          disabled={cronStatus === 'loading'}
        >
          {cronStatus === 'loading'
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <AppIcon icon={RefreshCw} size={16} color="#fff" strokeWidth={2.5} />
                <Text style={s.cronBtnTxt}>
                  {cronStatus === 'ok' ? 'Envoyé ✓' : cronStatus === 'err' ? 'Erreur ✗' : 'Déclencher maintenant'}
                </Text>
              </>
          }
        </TouchableOpacity>
      </View>

      {/* Envoi manuel */}
      <View style={s.card}>
        <View style={[s.iconWrap, { backgroundColor: 'rgba(244,114,182,0.12)', alignSelf: 'center' }]}>
          <AppIcon icon={Bell} size={24} color="#F472B6" strokeWidth={2} />
        </View>
        <Text style={[s.cardTitle, { textAlign: 'center' }]}>Envoi manuel</Text>

        <Text style={s.lbl}>Titre</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Titre de la notification"
          placeholderTextColor="rgba(255,255,255,0.25)"
          style={s.input}
        />

        <Text style={s.lbl}>Message</Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Corps du message..."
          placeholderTextColor="rgba(255,255,255,0.25)"
          multiline
          style={[s.input, { minHeight: 100, textAlignVertical: 'top' }]}
        />

        <Text style={s.lbl}>Destinataires</Text>
        <View style={s.targets}>
          {(['all', 'premium', 'free'] as Target[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[s.targetBtn, target === t && s.targetActive]}
              onPress={() => setTarget(t)}
            >
              <Text style={[s.targetTxt, { color: target === t ? '#fff' : 'rgba(255,255,255,0.5)' }]}>
                {t === 'all' ? 'Tous' : t === 'premium' ? 'Premium' : 'Gratuit'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[s.sendBtn, sent && s.sentBtn]}
          onPress={sendManual}
          disabled={sending || sent}
        >
          {sending
            ? <ActivityIndicator color="#fff" />
            : <>
                <AppIcon icon={Send} size={18} color="#fff" strokeWidth={2.5} />
                <Text style={s.sendTxt}>{sent ? 'Envoyé ✓' : 'Envoyer'}</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  hdr:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', marginBottom: 4 },
  back:       { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  title:      { flex: 1, fontSize: 18, fontWeight: '800', color: '#fff' },
  card:       { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 20, gap: 14 },
  cardHdr:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap:   { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cardTitle:  { fontSize: 16, fontWeight: '800', color: '#fff' },
  cardSub:    { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3, lineHeight: 18 },
  cronInfo:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 10 },
  cronInfoTxt:{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' },
  lastSent:   { fontSize: 12, color: '#34D399', textAlign: 'center' },
  cronBtn:    { backgroundColor: 'rgba(52,211,153,0.15)', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)' },
  cronBtnOk:  { backgroundColor: 'rgba(52,211,153,0.25)', borderColor: '#34D399' },
  cronBtnErr: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#EF4444' },
  cronBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  lbl:        { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  input:      { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, color: '#fff', backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.12)' },
  targets:    { flexDirection: 'row', gap: 10 },
  targetBtn:  { flex: 1, padding: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  targetActive:{ backgroundColor: '#C9A84C', borderColor: '#C9A84C' },
  targetTxt:  { fontSize: 13, fontWeight: '700' },
  sendBtn:    { backgroundColor: '#C9A84C', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  sentBtn:    { backgroundColor: '#34D399' },
  sendTxt:    { color: '#fff', fontWeight: '800', fontSize: 15 },
});
