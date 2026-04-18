import { useEffect } from 'react';
import { useAIStore } from '../store/ai.store';
import { useAuthStore } from '../store/auth.store';

export type AIChatType = 'prophet' | 'consultation' | 'accompagnement' | 'dream';

/**
 * Hook pour le chat IA.
 * @param chatType — service utilisé : 'prophet' (conseil), 'consultation', 'accompagnement', 'dream'
 */
export function useAIChat(chatType: AIChatType = 'prophet') {
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.role === 'subscriber' || user?.role === 'admin';

  const conversations = useAIStore((s) => s.conversations);
  const currentConversation = useAIStore((s) => s.currentConversation);
  const dailyUsage = useAIStore((s) => s.dailyUsage);
  const remainingQuestions = useAIStore((s) => s.remainingQuestions);
  const isLoading = useAIStore((s) => s.isLoading);
  const isSending = useAIStore((s) => s.isSending);
  const limitReached = useAIStore((s) => s.limitReached);

  const loadConversations = useAIStore((s) => s.loadConversations);
  const startNewConversation = useAIStore((s) => s.startNewConversation);
  const loadConversation = useAIStore((s) => s.loadConversation);
  const _sendMessage = useAIStore((s) => s.sendMessage);
  // Wrapper qui injecte le chatType du service courant
  const sendMessage = (content: string) => _sendMessage(content, chatType);
  const deleteConversation = useAIStore((s) => s.deleteConversation);
  const refreshUsage = useAIStore((s) => s.refreshUsage);

  useEffect(() => {
    loadConversations();
  }, []);

  return {
    conversations,
    currentConversation,
    messages: currentConversation?.messages ?? [],
    dailyUsage,
    remainingQuestions,
    isPremium,
    isLoading,
    isSending,
    limitReached,
    loadConversations,
    startNewConversation,
    loadConversation,
    sendMessage,
    deleteConversation,
    refreshUsage,
  };
}
