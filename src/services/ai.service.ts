/**
 * AI Service — Oracle Plus API
 * Branché sur /api/v1/ai/*
 */
import { AIConversation, AIMessage } from '../types/content.types';
import { FREE_AI_MESSAGE_LIMIT, STORAGE_KEYS } from '../utils/constants';
import { generateId, getTodayKey } from '../utils/helpers';
import { StorageService } from './storage.service';
import { http, ApiError } from './http.client';

export interface AIUsageRecord {
  date: string; // clé du jour (ex: "2026-04-16") — réinitialisé chaque jour
  count: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractMessageText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    return value.map(extractMessageText).filter(Boolean).join('\n');
  }

  if (!isRecord(value)) return '';

  if ('content' in value) {
    const nestedContent = extractMessageText(value.content);
    if (nestedContent) return nestedContent;
  }

  if ('text' in value) {
    const nestedText = extractMessageText(value.text);
    if (nestedText) return nestedText;
  }

  if ('message' in value) {
    const nestedMessage = extractMessageText(value.message);
    if (nestedMessage) return nestedMessage;
  }

  if ('response' in value) {
    const nestedResponse = extractMessageText(value.response);
    if (nestedResponse) return nestedResponse;
  }

  // Dernier recours : ne pas afficher de JSON brut à l'utilisateur
  return '';
}

function normalizeRole(role: unknown, fallback: AIMessage['role'] = 'assistant'): AIMessage['role'] {
  return role === 'user' ? 'user' : role === 'assistant' ? 'assistant' : fallback;
}

function normalizeMessage(rawMessage: unknown, fallbackRole: AIMessage['role'] = 'assistant'): AIMessage {
  const message = isRecord(rawMessage) ? rawMessage : {};

  return {
    id: typeof message.id === 'string' ? message.id : generateId(),
    role: normalizeRole(message.role, fallbackRole),
    content: extractMessageText(message.content ?? message.message ?? message.response ?? rawMessage),
    timestamp:
      typeof message.timestamp === 'string'
        ? message.timestamp
        : typeof message.createdAt === 'string'
          ? message.createdAt
          : new Date().toISOString(),
  };
}

function normalizeConversation(rawConversation: unknown, userId: string): AIConversation {
  const conversation = isRecord(rawConversation) ? rawConversation : {};
  const messageSource = Array.isArray(conversation.messages)
    ? conversation.messages
    : conversation.lastMessage
      ? [conversation.lastMessage]
      : 'content' in conversation || 'message' in conversation || 'role' in conversation
        ? [conversation]
        : [];

  const createdAt =
    typeof conversation.createdAt === 'string'
      ? conversation.createdAt
      : new Date().toISOString();

  return {
    id:
      typeof conversation.id === 'string'
        ? conversation.id
        : typeof conversation.conversationId === 'string'
          ? conversation.conversationId
          : generateId(),
    userId,
    title: typeof conversation.title === 'string' ? conversation.title : undefined,
    messages: messageSource
      .map((message) => normalizeMessage(message))
      .filter((message) => message.content.length > 0),
    createdAt,
    updatedAt:
      typeof conversation.updatedAt === 'string'
        ? conversation.updatedAt
        : createdAt,
  };
}

export const AIService = {
  /** Retourne le nombre de messages envoyés aujourd'hui (reset chaque jour) */
  async getDailyUsage(): Promise<number> {
    const usage = await StorageService.get<AIUsageRecord>(STORAGE_KEYS.AI_USAGE);
    const today = getTodayKey();
    if (!usage || usage.date !== today) return 0;
    return usage.count;
  },

  /** Incrémente le compteur du jour */
  async incrementUsage(): Promise<void> {
    const today = getTodayKey();
    const current = await AIService.getDailyUsage();
    await StorageService.set(STORAGE_KEYS.AI_USAGE, { date: today, count: current + 1 });
  },

  // Le guide spirituel n'a pas de restriction de messages — tous les utilisateurs peuvent dialoguer librement
  async canAsk(_isPremium: boolean): Promise<boolean> {
    return true;
  },

  async getRemainingQuestions(_isPremium: boolean): Promise<number> {
    return Infinity;
  },

  async sendMessage(
    conversationId: string | undefined,
    question: string,
    isPremium: boolean,
    chatType: 'prophet' | 'consultation' | 'accompagnement' | 'dream' | 'prayer' = 'prophet',
  ): Promise<{ message: AIMessage; conversationId?: string; error?: string }> {

    try {
      const data = await http.post<unknown>('/ai/chat', {
        message: question,
        chatType,
        conversationId,
      });

      const payload = isRecord(data) ? data : {};
      const rawMessage = payload.message ?? payload.response ?? data;

      return {
        message: normalizeMessage(rawMessage, 'assistant'),
        conversationId:
          typeof payload.conversationId === 'string' ? payload.conversationId : conversationId,
      };
    } catch (e) {
      const msg = (e as ApiError).message;
      const isLimit = (e as ApiError).statusCode === 429;
      return {
        message: {
          id: generateId(),
          role: 'assistant',
          content: `Erreur : ${msg}`,
          timestamp: new Date().toISOString(),
        },
        error: 'api_error',
      };
    }
  },

  async interpretDream(dream: string, conversationId?: string): Promise<{ message: AIMessage; conversationId?: string; error?: string }> {
    try {
      const data = await http.post<unknown>('/ai/dreams/interpret', { dream, conversationId });
      const payload = isRecord(data) ? data : {};
      const rawMessage = payload.message ?? payload.interpretation ?? payload.response ?? data;

      return {
        message: normalizeMessage(rawMessage, 'assistant'),
        conversationId:
          typeof payload.conversationId === 'string' ? payload.conversationId : conversationId,
      };
    } catch (e) {
      return {
        message: {
          id: generateId(),
          role: 'assistant',
          content: `Erreur : ${(e as ApiError).message}`,
          timestamp: new Date().toISOString(),
        },
        error: 'api_error',
      };
    }
  },

  async getConversations(userId: string): Promise<AIConversation[]> {
    try {
      const data = await http.get<unknown>('/ai/conversations');
      const conversations = Array.isArray(data) ? data : [];

      return conversations.map((conversation) => normalizeConversation(conversation, userId));
    } catch {
      return [];
    }
  },

  async getConversationHistory(conversationId: string): Promise<AIMessage[]> {
    try {
      const data = await http.get<unknown>(`/ai/conversations/${conversationId}`);
      const messages = Array.isArray(data)
        ? data
        : isRecord(data) && Array.isArray(data.messages)
          ? data.messages
          : [];

      return messages
        .map((message) => normalizeMessage(message))
        .filter((message) => message.content.length > 0);
    } catch {
      return [];
    }
  },

  async createConversation(userId: string): Promise<AIConversation> {
    // Le backend crée la conversation au premier message — on retourne un placeholder
    return {
      id: generateId(),
      userId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async addMessageToConversation(_conversationId: string, _message: AIMessage): Promise<void> {
    // Géré côté serveur
  },

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await http.delete(`/ai/conversations/${conversationId}`);
    } catch {}
  },
};
