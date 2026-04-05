/**
 * AI Service — Oracle Plus API
 * Branché sur /api/v1/ai/*
 */
import { AIConversation, AIMessage } from '../types/content.types';
import { FREE_AI_DAILY_LIMIT, STORAGE_KEYS } from '../utils/constants';
import { generateId, getTodayKey } from '../utils/helpers';
import { StorageService } from './storage.service';
import { http, ApiError } from './http.client';

export interface AIUsageRecord {
  date: string;
  count: number;
}

export const AIService = {
  async getDailyUsage(): Promise<number> {
    const usage = await StorageService.get<AIUsageRecord>(STORAGE_KEYS.AI_USAGE);
    const today = getTodayKey();
    if (!usage || usage.date !== today) return 0;
    return usage.count;
  },

  async incrementUsage(): Promise<void> {
    const today = getTodayKey();
    const current = await AIService.getDailyUsage();
    await StorageService.set(STORAGE_KEYS.AI_USAGE, { date: today, count: current + 1 });
  },

  async canAsk(isPremium: boolean): Promise<boolean> {
    if (isPremium) return true;
    const usage = await AIService.getDailyUsage();
    return usage < FREE_AI_DAILY_LIMIT;
  },

  async getRemainingQuestions(isPremium: boolean): Promise<number> {
    if (isPremium) return Infinity;
    const usage = await AIService.getDailyUsage();
    return Math.max(0, FREE_AI_DAILY_LIMIT - usage);
  },

  async sendMessage(
    conversationId: string | undefined,
    question: string,
    isPremium: boolean,
  ): Promise<{ message: AIMessage; conversationId?: string; error?: string }> {
    const canAsk = await AIService.canAsk(isPremium);

    if (!canAsk) {
      return {
        message: {
          id: generateId(),
          role: 'assistant',
          content: `Vous avez atteint votre limite quotidienne de ${FREE_AI_DAILY_LIMIT} questions. Abonnez-vous pour un accès illimité.`,
          timestamp: new Date().toISOString(),
        },
        error: 'limit_reached',
      };
    }

    try {
      const data = await http.post<any>('/ai/chat', {
        message: question,
        chatType: 'prophet',
        conversationId,
      });

      if (!isPremium) await AIService.incrementUsage();

      return {
        message: {
          id: data.messageId ?? generateId(),
          role: 'assistant',
          content: data.response ?? data.message ?? '',
          timestamp: new Date().toISOString(),
        },
        conversationId: data.conversationId,
      };
    } catch (e) {
      const msg = (e as ApiError).message;
      const isLimit = (e as ApiError).statusCode === 429;
      return {
        message: {
          id: generateId(),
          role: 'assistant',
          content: isLimit
            ? `Vous avez atteint votre limite quotidienne. Abonnez-vous pour un accès illimité.`
            : `Erreur : ${msg}`,
          timestamp: new Date().toISOString(),
        },
        error: isLimit ? 'limit_reached' : 'api_error',
      };
    }
  },

  async interpretDream(dream: string, conversationId?: string): Promise<{ message: AIMessage; conversationId?: string; error?: string }> {
    try {
      const data = await http.post<any>('/ai/dreams/interpret', { dream, conversationId });
      return {
        message: {
          id: data.messageId ?? generateId(),
          role: 'assistant',
          content: data.response ?? data.interpretation ?? '',
          timestamp: new Date().toISOString(),
        },
        conversationId: data.conversationId,
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
      const data = await http.get<any[]>('/ai/conversations');
      return data.map((c) => ({
        id: c.id,
        userId,
        messages: (c.messages ?? []).map((m: any) => ({
          id: m.id ?? generateId(),
          role: m.role,
          content: m.content,
          timestamp: m.createdAt ?? new Date().toISOString(),
        })),
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));
    } catch {
      return [];
    }
  },

  async getConversationHistory(conversationId: string): Promise<AIMessage[]> {
    try {
      const data = await http.get<any[]>(`/ai/conversations/${conversationId}`);
      return (Array.isArray(data) ? data : (data as any).messages ?? []).map((m: any) => ({
        id: m.id ?? generateId(),
        role: m.role,
        content: m.content,
        timestamp: m.createdAt ?? new Date().toISOString(),
      }));
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
