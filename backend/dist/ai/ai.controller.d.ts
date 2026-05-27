import { AiService } from './ai.service';
export declare class AiController {
    private svc;
    constructor(svc: AiService);
    chat(req: any, body: {
        message: string;
        section?: string;
        conversationId?: string;
    }): Promise<{
        conversationId: string;
        message: {
            role: string;
            content: string;
            timestamp: string;
        };
        messages: any[];
    }>;
    interpretDream(req: any, body: {
        dream: string;
        conversationId?: string;
    }): Promise<{
        conversationId: string;
        message: {
            role: string;
            content: string;
            timestamp: string;
        };
        messages: any[];
    }>;
    getConversations(req: any): Promise<import("./ai-conversation.entity").AiConversation[]>;
    getConversation(req: any, id: string): Promise<import("./ai-conversation.entity").AiConversation>;
    deleteConversation(req: any, id: string): Promise<void>;
    getDreamHistory(req: any): Promise<import("./ai-conversation.entity").AiConversation[]>;
    getAdminSettings(): Promise<Record<string, string>>;
    updateAdminSettings(section: string, body: {
        system_prompt: string;
    }): Promise<{
        section: string;
        systemPrompt: string;
    }>;
}
