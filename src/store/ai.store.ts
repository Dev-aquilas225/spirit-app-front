import { create } from 'zustand';
import { AIConversation, AIMessage } from '../types/content.types';
import { useCreditsStore } from './credits.store';
import { AIService } from '../services/ai.service';
import { generateId } from '../utils/helpers';
import { useAuthStore } from './auth.store';

/** Fenêtre glissante FIFO : garde les N derniers messages */
const MAX_CONTEXT_MESSAGES = 100;
function applyFIFO(messages: AIMessage[]): AIMessage[] {
  if (messages.length <= MAX_CONTEXT_MESSAGES) return messages;
  return messages.slice(messages.length - MAX_CONTEXT_MESSAGES);
}

export type AIChatType = 'prophet' | 'consultation' | 'accompagnement' | 'dream' | 'prayer';

interface AIStore {
  conversations: AIConversation[];
  // Une conversation courante PAR chatType — évite le mélange entre onglets
  currentConversations: Record<AIChatType, AIConversation | null>;
  dailyUsage: number;
  remainingQuestions: number;
  isLoading: boolean;
  isSending: boolean;
  limitReached: boolean;

  loadConversations: () => Promise<void>;
  startNewConversation: (chatType?: AIChatType) => Promise<void>;
  loadConversation: (id: string, chatType?: AIChatType) => Promise<void>;
  sendMessage: (content: string, chatType?: AIChatType) => Promise<void>;
  addSystemMessage: (text: string, chatType?: AIChatType) => void;
  deleteConversation: (id: string) => Promise<void>;
  refreshUsage: () => Promise<void>;
  getCurrentConversation: (chatType?: AIChatType) => AIConversation | null;
}

const EMPTY_CONVS: Record<AIChatType, AIConversation | null> = {
  prophet: null, consultation: null, accompagnement: null, dream: null, prayer: null,
};

export const useAIStore = create<AIStore>((set, get) => ({
  conversations: [],
  currentConversations: { ...EMPTY_CONVS },
  dailyUsage: 0,
  remainingQuestions: 2,
  isLoading: false,
  isSending: false,
  limitReached: false,

  getCurrentConversation: (chatType: AIChatType = 'consultation') =>
    get().currentConversations[chatType] ?? null,

  loadConversations: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ isLoading: true });
    const conversations = await AIService.getConversations(user.id);
    set({ conversations, isLoading: false });
    await get().refreshUsage();
  },

  startNewConversation: async (chatType: AIChatType = 'consultation') => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    const conv = await AIService.createConversation(user.id);
    set((state) => ({
      currentConversations: { ...state.currentConversations, [chatType]: conv },
      conversations: [conv, ...state.conversations],
    }));
  },

  loadConversation: async (id, chatType: AIChatType = 'consultation') => {
    const conv = get().conversations.find((c) => c.id === id) ?? null;
    if (!conv) {
      set((state) => ({
        currentConversations: { ...state.currentConversations, [chatType]: null },
      }));
      return;
    }
    set((state) => ({
      currentConversations: { ...state.currentConversations, [chatType]: conv },
      isLoading: true,
    }));
    const history = await AIService.getConversationHistory(id);
    const hydrated: AIConversation = {
      ...conv,
      messages: history.length > 0 ? history : conv.messages,
      updatedAt: conv.updatedAt ?? new Date().toISOString(),
    };
    set((state) => ({
      currentConversations: { ...state.currentConversations, [chatType]: hydrated },
      conversations: state.conversations.map((c) => (c.id === id ? hydrated : c)),
      isLoading: false,
    }));
  },

  sendMessage: async (content, chatType: AIChatType = 'consultation') => {
    const currentConversation = get().currentConversations[chatType];
    const user = useAuthStore.getState().user;
    if (!user) return;
    const isPremium = user.role === 'subscriber' || user.role === 'admin';
    set({ isSending: true });

    try {
      let conv = currentConversation;
      if (!conv) {
        conv = await AIService.createConversation(user.id);
        set((state) => ({
          currentConversations: { ...state.currentConversations, [chatType]: conv },
          conversations: [conv!, ...state.conversations],
        }));
      }

      const userMessage: AIMessage = {
        id: generateId(), role: 'user', content,
        timestamp: new Date().toISOString(),
      };
      const updatedConv: AIConversation = {
        ...conv,
        messages: applyFIFO([...conv.messages, userMessage]),
        updatedAt: new Date().toISOString(),
      };
      set((state) => ({
        currentConversations: { ...state.currentConversations, [chatType]: updatedConv },
      }));
      AIService.addMessageToConversation(conv.id, userMessage).catch(() => {});

      const { message: aiMessage, conversationId: resolvedId, error } =
        await AIService.sendMessage(conv.id, content, isPremium, chatType);

      const finalConv: AIConversation = {
        ...updatedConv,
        id: resolvedId ?? updatedConv.id,
        messages: applyFIFO([...updatedConv.messages, aiMessage]),
        updatedAt: new Date().toISOString(),
      };
      AIService.addMessageToConversation(conv.id, aiMessage).catch(() => {});

      set((state) => ({
        currentConversations: { ...state.currentConversations, [chatType]: finalConv },
        conversations: [
          finalConv,
          ...state.conversations.filter((c) => c.id !== conv!.id && c.id !== finalConv.id),
        ],
        isSending: false,
        limitReached: error === 'limit_reached',
      }));

      if (!isPremium && aiMessage.content) {
        const wordCount = aiMessage.content.trim().split(/\s+/).filter(Boolean).length;
        if (wordCount > 0) useCreditsStore.getState().spendWords(wordCount).catch(() => {});
      }
      get().refreshUsage().catch(() => {});

    } catch {
      const errorMsg: AIMessage = {
        id: generateId(), role: 'assistant',
        content: 'Une erreur est survenue. Vérifiez votre connexion et réessayez.',
        timestamp: new Date().toISOString(),
      };
      set((state) => {
        const cur = state.currentConversations[chatType];
        return {
          isSending: false,
          currentConversations: {
            ...state.currentConversations,
            [chatType]: cur ? { ...cur, messages: [...cur.messages, errorMsg] } : cur,
          },
        };
      });
    }
  },

  deleteConversation: async (id) => {
    await AIService.deleteConversation(id);
    set((state) => {
      const updated = { ...state.currentConversations };
      (Object.keys(updated) as AIChatType[]).forEach((k) => {
        if (updated[k]?.id === id) updated[k] = null;
      });
      return {
        conversations: state.conversations.filter((c) => c.id !== id),
        currentConversations: updated,
      };
    });
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

  addSystemMessage: (text: string, chatType: AIChatType = 'consultation') => {
    const systemMsg: AIMessage = {
      id: `sys-${Date.now()}`, role: 'assistant',
      content: `⚠️ ${text}`, timestamp: new Date().toISOString(),
    };
    set((state) => {
      const cur = state.currentConversations[chatType];
      if (!cur) return {};
      return {
        currentConversations: {
          ...state.currentConversations,
          [chatType]: { ...cur, messages: [...cur.messages, systemMsg] },
        },
      };
    });
  },
}));
