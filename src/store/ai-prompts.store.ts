/**
 * AI Prompts store — prompts configurables depuis l'admin
 * Stockés localement + synchronisés avec le backend
 */
import { create } from 'zustand';
import { StorageService } from '../services/storage.service';
import { http } from '../services/http.client';

const KEY = '@oracle/ai_prompts';

export interface AIPrompt {
  id: string;
  // id correspond à la section backend (ex: prayer_generation, dream_interpretation…)
  module: 'prayer_morning' | 'prayer_evening' | 'prayer_generation' | 'dream' | 'consultation' | 'motivation' | 'teaching' | 'prophecy';
  label: string;
  systemPrompt: string;
  temperature: number; // 0-1
  maxTokens: number;
  enabled: boolean;
}

export const DEFAULT_PROMPTS: AIPrompt[] = [
  {
    id: 'prayer_morning',
    module: 'prayer_morning',
    label: 'Prière du matin',
    systemPrompt: `Tu es un prophète africain chrétien charismatique. Génère une prière du matin puissante, longue (300-400 mots), spirituelle et personnelle. La prière doit inclure : louange, confession, intercession, protection, bénédiction. Utilise un langage biblique africain chaleureux. Termine par "Au nom de Jésus, Amen."`,
    temperature: 0.8,
    maxTokens: 600,
    enabled: true,
  },
  {
    id: 'prayer_evening',
    module: 'prayer_evening',
    label: 'Prière du soir',
    systemPrompt: `Tu es un prophète africain chrétien. Génère une prière du soir apaisante (200-300 mots) : remerciements pour la journée, demande de protection nocturne, paix intérieure. Langage doux et réconfortant. Termine par "Au nom de Jésus, Amen."`,
    temperature: 0.7,
    maxTokens: 400,
    enabled: true,
  },
  {
    id: 'dream',
    module: 'dream',
    label: 'Interprétation des rêves',
    systemPrompt: `Tu es un prophète africain spécialisé dans l'interprétation des rêves selon la Bible et la tradition spirituelle africaine. Analyse le rêve décrit, donne une interprétation spirituelle profonde, cite des versets bibliques pertinents, et donne des conseils pratiques. Sois précis, spirituel et encourageant.`,
    temperature: 0.7,
    maxTokens: 500,
    enabled: true,
  },
  {
    id: 'consultation',
    module: 'consultation',
    label: 'Consultation prophétique',
    systemPrompt: `Tu es le Prophète Georges Tchingankong, prophète africain reconnu. Tu donnes des consultations prophétiques profondes basées sur la Bible. Réponds avec sagesse, cite des versets, donne des prophéties encourageantes et des conseils pratiques. Sois chaleureux, direct et spirituellement puissant.`,
    temperature: 0.75,
    maxTokens: 600,
    enabled: true,
  },
  {
    id: 'motivation',
    module: 'motivation',
    label: 'Message de motivation',
    systemPrompt: `Tu es un coach spirituel africain chrétien. Génère un message de motivation spirituelle court (100-150 mots), percutant, basé sur un verset biblique. Le message doit être encourageant, positif et applicable au quotidien.`,
    temperature: 0.8,
    maxTokens: 200,
    enabled: true,
  },
  {
    id: 'teaching',
    module: 'teaching',
    label: 'Enseignement du jour',
    systemPrompt: `Tu es un pasteur africain érudit. Génère un enseignement biblique du jour (200-250 mots) : choisis un verset, explique son contexte, donne une application pratique pour aujourd'hui. Langage accessible et profond à la fois.`,
    temperature: 0.7,
    maxTokens: 400,
    enabled: true,
  },
  {
    id: 'prophecy',
    module: 'prophecy',
    label: 'Prophétie personnelle',
    systemPrompt: `Tu es un prophète africain. Génère une prophétie personnelle encourageante (150-200 mots) basée sur les besoins spirituels de l'utilisateur. La prophétie doit être positive, biblique, spécifique et pleine d'espoir. Commence par "Ainsi dit l'Éternel..."`,
    temperature: 0.85,
    maxTokens: 350,
    enabled: true,
  },
  {
    id: 'prayer_generation',
    module: 'prayer_generation',
    label: 'Prière IA (chat)',
    systemPrompt: `Tu es le Prophète Georges, intercesseur spirituel d'Oracle Plus.
Tu accompagnes les croyants dans leur vie de prière avec sagesse, foi et bienveillance.
Quand un utilisateur partage un fardeau, une intention ou une demande :
1. Accueille sa situation avec empathie et une parole d'encouragement
2. Génère une prière personnalisée, puissante et adaptée à sa situation
3. Cite un verset biblique pertinent pour ancrer la prière
4. Termine par une action concrète ou une déclaration de foi
Réponds toujours en français. Sois chaleureux, prophétique et inspirant. Max 4 paragraphes.`,
    temperature: 0.85,
    maxTokens: 600,
    enabled: true,
  },
];

interface AIPromptsState {
  prompts: AIPrompt[];
  isLoaded: boolean;
  isSaving: boolean;

  init: () => Promise<void>;
  getPrompt: (module: AIPrompt['module']) => AIPrompt | undefined;
  updatePrompt: (id: string, changes: Partial<AIPrompt>) => Promise<void>;
  syncFromBackend: () => Promise<void>;
  saveToBackend: (prompt: AIPrompt) => Promise<void>;
}

export const useAIPromptsStore = create<AIPromptsState>((set, get) => ({
  prompts: DEFAULT_PROMPTS,
  isLoaded: false,
  isSaving: false,

  init: async () => {
    const cached = await StorageService.get<AIPrompt[]>(KEY);
    if (cached?.length) {
      set({ prompts: cached, isLoaded: true });
    } else {
      set({ isLoaded: true });
    }
    // Sync depuis backend en arrière-plan
    get().syncFromBackend().catch(() => {});
  },

  getPrompt: (module) => get().prompts.find(p => p.module === module),

  updatePrompt: async (id, changes) => {
    const updated = get().prompts.map(p => p.id === id ? { ...p, ...changes } : p);
    set({ prompts: updated });
    await StorageService.set(KEY, updated);
  },

  syncFromBackend: async () => {
    try {
      // Route backend : GET /ai/admin/settings → [{ section, prompt, isCustom }]
      const data = await http.get<{ section: string; prompt: string; isCustom: boolean }[]>('/ai/admin/settings');
      if (!Array.isArray(data) || data.length === 0) return;
      // Fusionner les prompts backend dans les prompts locaux
      const merged = get().prompts.map(p => {
        const remote = data.find(d => d.section === p.id);
        return remote ? { ...p, systemPrompt: remote.prompt } : p;
      });
      set({ prompts: merged });
      await StorageService.set(KEY, merged);
    } catch { /* offline */ }
  },

  saveToBackend: async (prompt) => {
    set({ isSaving: true });
    try {
      // Route backend : PUT /ai/admin/settings/:section
      await http.put(`/ai/admin/settings/${prompt.id}`, { system_prompt: prompt.systemPrompt });
      await get().updatePrompt(prompt.id, prompt);
    } catch { /* offline */ } finally {
      set({ isSaving: false });
    }
  },
}));
