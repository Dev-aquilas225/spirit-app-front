import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Send, Sparkles, RotateCcw } from 'lucide-react-native';
import { AppIcon } from '../../../../src/components/common/AppIcon';
import { useTheme } from '../../../../src/theme';
import { useAccess } from '../../../../src/hooks/useAccess';
import { useCreditsStore, INITIAL_CREDITS } from '../../../../src/store/credits.store';
import { useGamificationStore } from '../../../../src/store/gamification.store';
import { askOpenAI } from '../../../../src/services/openai.service';
import { useAIPromptsStore } from '../../../../src/store/ai-prompts.store';

interface Msg { id: string; role: 'user'|'ai'; text: string; ts: number; }

export default function AIScreen() {
  const { colors } = useTheme();
  const { hasSubscription, credits } = useAccess();
  const { spend, spendWords } = useCreditsStore();
  const { completeMission } = useGamificationStore();
  const { init } = useAIPromptsStore();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => { init(); }, []);

  const send = async () => {
    const txt = input.trim();
    if (!txt || loading) return;
    if (!hasSubscription && credits < 50) return;
    setInput('');
    const userMsg: Msg = { id: Date.now().toString(), role: 'user', text: txt, ts: Date.now() };
    setMsgs(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const r = await askOpenAI('consultation', txt);
      // 1 credit = 1 word — deduct based on actual response length
      if (!hasSubscription) {
        const wordCount = r.text.trim().split(/\s+/).length;
        const ok = await spendWords(wordCount);
        if (!ok) {
          setMsgs(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', text: "Crédits insuffisants. Rechargez votre solde pour continuer.", ts: Date.now() }]);
          setLoading(false);
          return;
        }
      }
      const aiMsg: Msg = { id: (Date.now()+1).toString(), role: 'ai', text: r.text, ts: Date.now() };
      setMsgs(prev => [...prev, aiMsg]);
      await completeMission('ai_question');
    } catch {
      setMsgs(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', text: "Désolé, une erreur s'est produite. Réessayez.", ts: Date.now() }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor: '#0D0D2B' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[s.header, { borderBottomColor: 'rgba(255,255,255,0.08)' }]}>
        <View style={s.headerIcon}><AppIcon icon={Sparkles} size={22} color="#34D399" strokeWidth={2} /></View>
        <View>
          <Text style={[s.headerTitle, { color: '#fff' }]}>Assistant Prophétique</Text>
          <Text style={[s.headerSub, { color: 'rgba(255,255,255,0.55)' }]}>{hasSubscription ? 'Illimité' : `${credits} crédits · 1 crédit = 1 mot`}</Text>
        </View>
        <TouchableOpacity onPress={() => setMsgs([])} style={s.clearBtn}><AppIcon icon={RotateCcw} size={18} color="rgba(255,255,255,0.4)" strokeWidth={2} /></TouchableOpacity>
      </View>

      {msgs.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🔮</Text>
          <Text style={[s.emptyTitle, { color: '#fff' }]}>Posez votre question</Text>
          <Text style={[s.emptySub, { color: 'rgba(255,255,255,0.55)' }]}>Le prophète vous guidera spirituellement</Text>
          {[
            'Interprète mon rêve de cette nuit',
            'Donne-moi une prophétie pour aujourd\'hui',
            'Comment surmonter cette épreuve ?',
          ].map(q => (
            <TouchableOpacity key={q} style={[s.suggestion, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }]} onPress={() => setInput(q)}>
              <Text style={[s.suggestionTxt, { color: 'rgba(255,255,255,0.8)' }]}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList ref={listRef} data={msgs} keyExtractor={m => m.id} contentContainerStyle={{ padding:16, gap:12 }}
        renderItem={({ item: m }) => (
          <View style={[s.bubble, m.role === 'user' ? s.userBubble : s.aiBubble]}>
            {m.role === 'ai' && <View style={s.aiAvatar}><Text style={{ fontSize:14 }}>🔮</Text></View>}
            <View style={[s.bubbleInner, m.role === 'user' ? s.userInner : s.aiInner]}>
              <Text style={[s.bubbleTxt, { color: m.role === 'user' ? '#fff' : 'rgba(255,255,255,0.9)' }]}>{m.text}</Text>
            </View>
          </View>
        )}
      />

      {loading && (
        <View style={[s.typingWrap, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
          <ActivityIndicator size="small" color="#34D399" />
          <Text style={[s.typingTxt, { color: 'rgba(255,255,255,0.55)' }]}>Oracle consulte les astres...</Text>
        </View>
      )}

      <View style={[s.inputBar, { backgroundColor: 'rgba(255,255,255,0.05)', borderTopColor: 'rgba(255,255,255,0.08)' }]}>
        <TextInput value={input} onChangeText={setInput} placeholder="Posez votre question spirituelle..." placeholderTextColor="rgba(255,255,255,0.3)" style={[s.input, { color: '#fff' }]} multiline onSubmitEditing={send} />
        <TouchableOpacity style={[s.sendBtn, (!input.trim() || loading) && s.sendDisabled]} onPress={send} disabled={!input.trim() || loading}>
          <AppIcon icon={Send} size={18} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header:{ flexDirection:'row', alignItems:'center', gap:12, padding:16, borderBottomWidth:1 },
  headerIcon:{ width:44, height:44, borderRadius:22, backgroundColor:'rgba(52,211,153,0.12)', alignItems:'center', justifyContent:'center' },
  headerTitle:{ fontSize:16, fontWeight:'800' },
  headerSub:{ fontSize:12, marginTop:1 },
  clearBtn:{ marginLeft:'auto', padding:8 },
  empty:{ flex:1, alignItems:'center', justifyContent:'center', padding:24, gap:12 },
  emptyIcon:{ fontSize:48 },
  emptyTitle:{ fontSize:20, fontWeight:'800' },
  emptySub:{ fontSize:14, textAlign:'center' },
  suggestion:{ width:'100%', borderRadius:12, borderWidth:1, padding:12 },
  suggestionTxt:{ fontSize:14 },
  bubble:{ flexDirection:'row', gap:8 },
  userBubble:{ justifyContent:'flex-end' },
  aiBubble:{ justifyContent:'flex-start' },
  aiAvatar:{ width:32, height:32, borderRadius:16, backgroundColor:'rgba(52,211,153,0.12)', alignItems:'center', justifyContent:'center', marginTop:4 },
  bubbleInner:{ maxWidth:'80%', borderRadius:16, padding:12 },
  userInner:{ backgroundColor:'#C9A84C', borderBottomRightRadius:4 },
  aiInner:{ borderWidth:1, borderBottomLeftRadius:4, backgroundColor:'rgba(255,255,255,0.07)', borderColor:'rgba(255,255,255,0.12)' },
  bubbleTxt:{ fontSize:14, lineHeight:22 },
  typingWrap:{ flexDirection:'row', alignItems:'center', gap:10, margin:16, padding:12, borderRadius:12 },
  typingTxt:{ fontSize:13 },
  inputBar:{ flexDirection:'row', alignItems:'flex-end', gap:10, padding:12, borderTopWidth:1 },
  input:{ flex:1, fontSize:14, maxHeight:100, paddingVertical:8 },
  sendBtn:{ width:44, height:44, borderRadius:22, backgroundColor:'#C9A84C', alignItems:'center', justifyContent:'center' },
  sendDisabled:{ opacity:0.4 },
});
