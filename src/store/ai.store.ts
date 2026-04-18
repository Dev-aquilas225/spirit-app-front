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
  loadConversation: (id: string) => Promise<void>;
  sendMessage: (content: string, chatType?: 'prophet' | 'consultation' | 'accompagnement' | 'dream') => Promise<void>;
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

  loadConversation: async (id) => {
    const conv = get().conversations.find((c) => c.id === id) ?? null;
    if (!conv) {
      set({ currentConversation: null });
      return;
    }

    set({ currentConversation: conv, isLoading: true });

    const history = await AIService.getConversationHistory(id);
    const hydratedConversation: AIConversation = {
      ...conv,
      messages: history.length > 0 ? history : conv.messages,
      updatedAt: conv.updatedAt ?? new Date().toISOString(),
    };

    set((state) => ({
      currentConversation: hydratedConversation,
      conversations: state.conversations.map((conversation) =>
        conversation.id === id ? hydratedConversation : conversation,
      ),
      isLoading: false,
    }));
  },

  sendMessage: async (content, chatType = 'prophet') => {
    const { currentConversation } = get();
    const user = useAuthStore.getState().user;
    if (!user) return;

    const isPremium = user.role === 'subscriber' || user.role === 'admin';

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
    const {
      message: aiMessage,
      conversationId: resolvedConversationId,
      error,
    } = await AIService.sendMessage(conv.id, content, isPremium, chatType);

    // Ajouter la réponse IA
    const finalConv: AIConversation = {
      ...updatedConv,
      id: resolvedConversationId ?? updatedConv.id,
      messages: [...updatedConv.messages, aiMessage],
      updatedAt: new Date().toISOString(),
    };

    await AIService.addMessageToConversation(conv.id, aiMessage);

    // Mettre à jour l'état des conversations
    set((state) => ({
      currentConversation: finalConv,
      conversations: [
        finalConv,
        ...state.conversations.filter(
          (conversation) =>
            conversation.id !== conv.id && conversation.id !== finalConv.id,
        ),
      ],
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
    const isPremium = user?.role === 'subscriber' || user?.role === 'admin';
    const usage = await AIService.getDailyUsage();
    const remaining = await AIService.getRemainingQuestions(isPremium);
    set({
      dailyUsage: usage,
      remainingQuestions: remaining === Infinity ? 9999 : remaining,
      limitReached: !isPremium && remaining === 0,
    });
  },
}));
