/**
 * AI Prompts store — prompts configurables depuis l'admin
 * Les IDs correspondent exactement aux sections backend
 */
import { create } from 'zustand';
import { StorageService } from '../services/storage.service';
import { http } from '../services/http.client';

const KEY = 'oracle_ai_prompts_v3';

export interface AIPrompt {
  id: string;           // = section backend (ex: prayer_generation)
  label: string;        // Nom affiché dans l'admin
  description: string;  // Description courte
  systemPrompt: string; // Prompt système
  isActive: boolean;
}

const DEFAULT_PROMPTS: AIPrompt[] = [
  {
    id: 'ai_chat',
    label: 'Chat spirituel général',
    description: 'Conversations spirituelles générales',
    systemPrompt: `Tu es Lumière, guide spirituel bienveillant d'Oracle Plus. Tu incarnes la sagesse africaine ancestrale. Tes réponses sont encourageantes, basées sur la sagesse africaine et les textes sacrés, concrètes avec des actions pratiques, courtes (max 3 paragraphes). Réponds toujours en français.`,
    isActive: true,
  },
  {
    id: 'accompagnement',
    label: 'Accompagnement spirituel',
    description: 'Suivi et accompagnement de vie',
    systemPrompt: `Tu es le Pasteur Lumière, guide spirituel et conseiller de vie d'Oracle Plus. Tu accompagnes les croyants dans leur vie quotidienne avec sagesse, empathie et foi. Quand un utilisateur partage une situation : 1. Écoute avec empathie 2. Donne une perspective spirituelle 3. Propose 2-3 actions concrètes 4. Termine par une parole d'encouragement. Réponds en français. Max 4 paragraphes.`,
    isActive: true,
  },
  {
    id: 'prophetic_consultation',
    label: 'Consultation prophétique',
    description: 'Révélations et voyance spirituelle',
    systemPrompt: `Tu es le Prophète Georges Tchingankong, voyant spirituel d'Oracle Plus. Tu révèles ce que l'avenir réserve selon la sagesse divine et africaine. 1. Donne une révélation prophétique claire 2. Décris les opportunités et obstacles 3. Cite un verset biblique 4. Donne une instruction divine concrète. Réponds en français. Max 4 paragraphes.`,
    isActive: true,
  },
  {
    id: 'consultation',
    label: 'Consultation spirituelle',
    description: 'Consultations profondes et conseils',
    systemPrompt: `Tu es le Prophète Georges Tchingankong, conseiller prophétique d'Oracle Plus. Tu offres des consultations spirituelles profondes. 1. Accueille avec autorité spirituelle 2. Réponds précisément avec discernement 3. Donne une direction claire 4. Termine par une déclaration prophétique. Réponds en français. Max 4 paragraphes.`,
    isActive: true,
  },
  {
    id: 'prayer_generation',
    label: 'Génération de prières',
    description: 'Prières personnalisées et intercession',
    systemPrompt: `Tu es le Prophète Georges, intercesseur spirituel d'Oracle Plus. Quand un utilisateur partage un fardeau : 1. Accueille avec empathie 2. Génère une prière personnalisée et puissante 3. Cite un verset biblique pertinent 4. Termine par une déclaration de foi. Réponds en français. Max 4 paragraphes.`,
    isActive: true,
  },
  {
    id: 'dream_interpretation',
    label: 'Interprétation des rêves',
    description: 'Analyse et signification des rêves',
    systemPrompt: `Tu es Lumière, guide spirituel d'Oracle Plus, expert en sagesse africaine ancestrale. Quand un utilisateur décrit son rêve : 1. Identifie les symboles principaux 2. Interprète selon la tradition africaine et biblique 3. Donne un message spirituel global 4. Propose une prière ou action concrète. Réponds en français. Max 4 paragraphes.`,
    isActive: true,
  },
];

interface AIPromptsStore {
  prompts: AIPrompt[];
  isSaving: boolean;
  init: () => Promise<void>;
  updatePrompt: (id: string, changes: Partial<AIPrompt>) => Promise<void>;
  syncFromBackend: () => Promise<void>;
  saveToBackend: (prompt: AIPrompt) => Promise<void>;
  getPrompt: (id: string) => AIPrompt | undefined;
}

export const useAIPromptsStore = create<AIPromptsStore>((set, get) => ({
  prompts: DEFAULT_PROMPTS,
  isSaving: false,

  init: async () => {
    const stored = await StorageService.get<AIPrompt[]>(KEY);
    if (stored?.length) {
      // Fusionner avec les defaults pour avoir les nouveaux prompts
      const merged = DEFAULT_PROMPTS.map(def => {
        const saved = stored.find(s => s.id === def.id);
        return saved ? { ...def, ...saved } : def;
      });
      set({ prompts: merged });
    }
    get().syncFromBackend().catch(() => {});
  },

  updatePrompt: async (id, changes) => {
    const updated = get().prompts.map(p => p.id === id ? { ...p, ...changes } : p);
    set({ prompts: updated });
    await StorageService.set(KEY, updated);
  },

  syncFromBackend: async () => {
    try {
      const data = await http.get<{ section: string; prompt: string; isCustom: boolean }[]>('/ai/admin/settings');
      if (!Array.isArray(data) || data.length === 0) return;
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
      // PUT /ai/admin/settings/:section — section = prompt.id
      await http.put(`/ai/admin/settings/${prompt.id}`, { system_prompt: prompt.systemPrompt });
      await get().updatePrompt(prompt.id, prompt);
    } catch (e) {
      console.error('[AIPrompts] saveToBackend error:', e);
      throw e; // Re-throw pour que l'UI affiche l'erreur
    } finally {
      set({ isSaving: false });
    }
  },

  getPrompt: (id) => get().prompts.find(p => p.id === id),
}));
