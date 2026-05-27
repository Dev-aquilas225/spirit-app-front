import { Repository } from 'typeorm';
import { AiConversation } from './ai-conversation.entity';
import { AiPrompt } from './ai-prompt.entity';
export declare class AiService {
    private convRepo;
    private promptRepo;
    constructor(convRepo: Repository<AiConversation>, promptRepo: Repository<AiPrompt>);
    getPrompt(section: string): Promise<string>;
    chat(userId: string, section: string, message: string, conversationId?: string): Promise<{
        conversationId: string;
        message: {
            role: string;
            content: string;
            timestamp: string;
        };
        messages: any[];
    }>;
    interpretDream(userId: string, dream: string, conversationId?: string): Promise<{
        conversationId: string;
        message: {
            role: string;
            content: string;
            timestamp: string;
        };
        messages: any[];
    }>;
    getConversations(userId: string): Promise<AiConversation[]>;
    getConversation(userId: string, id: string): Promise<AiConversation>;
    deleteConversation(userId: string, id: string): Promise<void>;
    getDreamHistory(userId: string): Promise<AiConversation[]>;
    getAdminSettings(): Promise<Record<string, string>>;
    updateAdminSettings(section: string, systemPrompt: string): Promise<{
        section: string;
        systemPrompt: string;
    }>;
}
