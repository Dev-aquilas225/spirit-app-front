import { useEffect, useRef, useState } from 'react';
import { useAIStore } from '../store/ai.store';
import { useAuthStore } from '../store/auth.store';
import { useCreditsStore, CreditAction, CREDIT_COSTS } from '../store/credits.store';
import { useAccess } from './useAccess';

export type AIChatType = 'prophet' | 'consultation' | 'accompagnement' | 'dream' | 'prayer';

const CHAT_TYPE_TO_ACTION: Record<AIChatType, CreditAction> = {
  prophet:        'prophetic_consultation',
  consultation:   'prophetic_consultation',
  accompagnement: 'ai_chat',
  dream:          'dream_interpretation',
  prayer:         'prayer_generation',
};

export function useAIChat(chatType: AIChatType = 'prophet') {
  const { hasSubscription, canPerform, displayCost } = useAccess();
  const isPremium = hasSubscription;

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
  const deleteConversation = useAIStore((s) => s.deleteConversation);
  const refreshUsage = useAIStore((s) => s.refreshUsage);

  const { spend, credits } = useCreditsStore();
  const [creditGateVisible, setCreditGateVisible] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const creditAction = CHAT_TYPE_TO_ACTION[chatType];
  const prevCreditsRef = useRef(credits);
  const addSystemMessage = useAIStore((s) => s.addSystemMessage);

  useEffect(() => {
    loadConversations();
  }, []);

  // Détecter quand les crédits tombent à zéro pendant une conversation
  useEffect(() => {
    if (!hasSubscription && prevCreditsRef.current > 0 && credits === 0) {
      // Injecter un message système dans le chat
      addSystemMessage?.(
        'Vos crédits sont épuisés. Rechargez votre compte ou passez à un abonnement pour continuer à recevoir des guidances spirituelles.'
      );
    }
    prevCreditsRef.current = credits;
  }, [credits, hasSubscription]);

  const sendMessage = async (content: string) => {
    if (!hasSubscription) {
      // Vérifier que l'utilisateur a au moins 1 crédit disponible avant d'envoyer
      if (!canPerform(creditAction)) {
        setPendingMessage(content);
        setCreditGateVisible(true);
        return;
      }
      // Les crédits sont déduits mot par mot après réception de la réponse (ai.store.ts)
    }
    await _sendMessage(content, chatType);
  };

  const onCreditSuccess = async () => {
    setCreditGateVisible(false);
    if (pendingMessage) {
      const msg = pendingMessage;
      setPendingMessage(null);
      await _sendMessage(msg, chatType);
    }
  };

  const closeCreditGate = () => {
    setCreditGateVisible(false);
    setPendingMessage(null);
  };

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
    creditGateVisible,
    creditAction,
    onCreditSuccess,
    closeCreditGate,
    creditCost: displayCost(creditAction),
  };
}
