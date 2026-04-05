import { useEffect } from 'react';
import { useAIStore } from '../store/ai.store';
import { useAuthStore } from '../store/auth.store';

/**
 * Hook pour le chat IA.
 * Gère les conversations et la limite d'usage.
 */
export function useAIChat() {
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.role === 'subscriber';

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
  const sendMessage = useAIStore((s) => s.sendMessage);
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
