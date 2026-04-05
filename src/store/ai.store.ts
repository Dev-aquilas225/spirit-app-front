import { create } from 'zustand';
import { AIConversation, AIMessage } from '../types/content.types';
import { AIService } from '../services/ai.service';
import { generateId } from '../utils/helpers';
import { useAuthStore } from './auth.store';

interface AIStore {
  conversations: AIConversation[];
  currentConversation: AIConversation | null;
  dailyUsage: number;
  remainingQuestions: number;
  isLoading: boolean;
  isSending: boolean;
  limitReached: boolean;

  // Actions
  loadConversations: () => Promise<void>;
  startNewConversation: () => Promise<void>;
  loadConversation: (id: string) => void;
  sendMessage: (content: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  refreshUsage: () => Promise<void>;
}

export const useAIStore = create<AIStore>((set, get) => ({
  conversations: [],
  currentConversation: null,
  dailyUsage: 0,
  remainingQuestions: 2,
  isLoading: false,
  isSending: false,
  limitReached: false,

  loadConversations: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ isLoading: true });
    const conversations = await AIService.getConversations(user.id);
    set({ conversations, isLoading: false });
    await get().refreshUsage();
  },

  startNewConversation: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const conv = await AIService.createConversation(user.id);
    set((state) => ({
      currentConversation: conv,
      conversations: [conv, ...state.conversations],
    }));
  },

  loadConversation: (id) => {
    const conv = get().conversations.find((c) => c.id === id) ?? null;
    set({ currentConversation: conv });
  },

  sendMessage: async (content) => {
    const { currentConversation } = get();
    const user = useAuthStore.getState().user;
    if (!user) return;

    const isPremium = user.role === 'subscriber';

    // Créer la conversation si elle n'existe pas
    let conv = currentConversation;
    if (!conv) {
      conv = await AIService.createConversation(user.id);
      set((state) => ({
        currentConversation: conv,
        conversations: [conv!, ...state.conversations],
      }));
    }

    // Ajouter le message utilisateur localement
    const userMessage: AIMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const updatedConv: AIConversation = {
      ...conv,
      messages: [...conv.messages, userMessage],
      updatedAt: new Date().toISOString(),
    };

    set({ currentConversation: updatedConv, isSending: true });

    // Sauvegarder le message utilisateur
    await AIService.addMessageToConversation(conv.id, userMessage);

    // Obtenir la réponse IA
    const { message: aiMessage, error } = await AIService.sendMessage(conv.id, content, isPremium);

    // Ajouter la réponse IA
    const finalConv: AIConversation = {
      ...updatedConv,
      messages: [...updatedConv.messages, aiMessage],
      updatedAt: new Date().toISOString(),
    };

    await AIService.addMessageToConversation(conv.id, aiMessage);

    // Mettre à jour l'état des conversations
    set((state) => ({
      currentConversation: finalConv,
      conversations: state.conversations.map((c) => (c.id === finalConv.id ? finalConv : c)),
      isSending: false,
      limitReached: error === 'limit_reached',
    }));

    // Rafraîchir le compteur d'utilisation
    await get().refreshUsage();
  },

  deleteConversation: async (id) => {
    await AIService.deleteConversation(id);
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      currentConversation: state.currentConversation?.id === id ? null : state.currentConversation,
    }));
  },

  refreshUsage: async () => {
    const user = useAuthStore.getState().user;
    const isPremium = user?.role === 'subscriber';
    const usage = await AIService.getDailyUsage();
    const remaining = await AIService.getRemainingQuestions(isPremium);
    set({
      dailyUsage: usage,
      remainingQuestions: remaining === Infinity ? 9999 : remaining,
      limitReached: !isPremium && remaining === 0,
    });
  },
}));
