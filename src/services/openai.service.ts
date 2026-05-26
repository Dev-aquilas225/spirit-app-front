import { useAIPromptsStore, AIPrompt } from '../store/ai-prompts.store';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

function getKey(): string {
  return (typeof window !== 'undefined' && (window as any).__ENV__?.EXPO_PUBLIC_OPENAI_KEY)
    || process.env.EXPO_PUBLIC_OPENAI_KEY || '';
}

export interface AIResponse { text: string; tokens: number; }

export async function askOpenAI(module: AIPrompt['module'], userMessage: string): Promise<AIResponse> {
  const prompt = useAIPromptsStore.getState().prompts.find(p => p.module === module);
  const key = getKey();
  if (!key) throw new Error('Clé OpenAI manquante');
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: prompt?.temperature ?? 0.75,
      max_tokens: prompt?.maxTokens ?? 500,
      messages: [
        { role: 'system', content: prompt?.systemPrompt ?? 'Tu es un assistant spirituel africain.' },
        { role: 'user', content: userMessage },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  return { text: data.choices?.[0]?.message?.content ?? '', tokens: data.usage?.total_tokens ?? 0 };
}

export async function generatePrayer(type: 'morning' | 'evening'): Promise<string> {
  const module = type === 'morning' ? 'prayer_morning' : 'prayer_evening';
  const r = await askOpenAI(module, `Génère la prière du ${type === 'morning' ? 'matin' : 'soir'} pour aujourd'hui.`);
  return r.text;
}

export async function interpretDream(dream: string): Promise<string> {
  const r = await askOpenAI('dream', dream);
  return r.text;
}

export async function getProphecy(request: string): Promise<string> {
  const r = await askOpenAI('prophecy', request);
  return r.text;
}

export async function getTeaching(): Promise<string> {
  const r = await askOpenAI('teaching', "Génère l'enseignement du jour.");
  return r.text;
}

export async function getMotivation(): Promise<string> {
  const r = await askOpenAI('motivation', "Génère le message de motivation du jour.");
  return r.text;
}
