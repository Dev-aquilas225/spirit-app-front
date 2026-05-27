"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ai_conversation_entity_1 = require("./ai-conversation.entity");
const ai_prompt_entity_1 = require("./ai-prompt.entity");
const axios_1 = require("axios");
const DEFAULT_PROMPTS = {
    ai_chat: 'Tu es Oracle Plus, un assistant spirituel africain bienveillant. Réponds en français.',
    dream_interpretation: 'Tu es un interprète de rêves spirituel africain. Analyse le rêve avec sagesse biblique et africaine. Réponds en français.',
    prophetic_consultation: 'Tu es un prophète spirituel africain. Donne des guidances prophétiques avec sagesse. Réponds en français.',
    prayer_generation: 'Tu es le Prophète Georges, guide spirituel. Génère des prières puissantes et personnalisées. Réponds en français.',
    consultation: 'Tu es un conseiller spirituel africain. Donne des conseils sages et bienveillants. Réponds en français.',
    accompagnement: 'Tu es un accompagnateur spirituel africain. Guide avec douceur et sagesse. Réponds en français.',
};
let AiService = class AiService {
    constructor(convRepo, promptRepo) {
        this.convRepo = convRepo;
        this.promptRepo = promptRepo;
    }
    async getPrompt(section) {
        const p = await this.promptRepo.findOne({ where: { section } });
        return p?.systemPrompt ?? DEFAULT_PROMPTS[section] ?? DEFAULT_PROMPTS.ai_chat;
    }
    async chat(userId, section, message, conversationId) {
        let conv = conversationId
            ? await this.convRepo.findOne({ where: { id: conversationId, userId } })
            : null;
        if (!conv) {
            conv = this.convRepo.create({ userId, section, messages: [] });
            conv = await this.convRepo.save(conv);
        }
        const systemPrompt = await this.getPrompt(section);
        const messages = conv.messages.slice(-20);
        const apiKey = process.env.OPENAI_API_KEY;
        let aiText = '';
        if (apiKey) {
            try {
                const res = await axios_1.default.post('https://api.openai.com/v1/chat/completions', {
                    model: 'gpt-4o-mini',
                    temperature: 0.75,
                    max_tokens: 500,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...messages.map((m) => ({ role: m.role, content: m.content })),
                        { role: 'user', content: message },
                    ],
                }, { headers: { Authorization: `Bearer ${apiKey}` } });
                aiText = res.data.choices[0].message.content;
            }
            catch (e) {
                aiText = 'Je suis temporairement indisponible. Veuillez réessayer dans quelques instants.';
            }
        }
        else {
            aiText = 'Clé OpenAI non configurée. Contactez l\'administrateur.';
        }
        const userMsg = { role: 'user', content: message, timestamp: new Date().toISOString() };
        const aiMsg = { role: 'assistant', content: aiText, timestamp: new Date().toISOString() };
        const updatedMessages = [...conv.messages, userMsg, aiMsg].slice(-100);
        await this.convRepo.update(conv.id, { messages: updatedMessages });
        return { conversationId: conv.id, message: aiMsg, messages: updatedMessages };
    }
    async interpretDream(userId, dream, conversationId) {
        return this.chat(userId, 'dream_interpretation', dream, conversationId);
    }
    getConversations(userId) {
        return this.convRepo.find({ where: { userId }, order: { updatedAt: 'DESC' } });
    }
    getConversation(userId, id) {
        return this.convRepo.findOne({ where: { id, userId } });
    }
    async deleteConversation(userId, id) {
        await this.convRepo.delete({ id, userId });
    }
    getDreamHistory(userId) {
        return this.convRepo.find({ where: { userId, section: 'dream_interpretation' }, order: { updatedAt: 'DESC' } });
    }
    async getAdminSettings() {
        const prompts = await this.promptRepo.find();
        const result = { ...DEFAULT_PROMPTS };
        prompts.forEach(p => result[p.section] = p.systemPrompt);
        return result;
    }
    async updateAdminSettings(section, systemPrompt) {
        let p = await this.promptRepo.findOne({ where: { section } });
        if (p) {
            await this.promptRepo.update(p.id, { systemPrompt });
        }
        else {
            await this.promptRepo.save(this.promptRepo.create({ section, systemPrompt }));
        }
        return { section, systemPrompt };
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ai_conversation_entity_1.AiConversation)),
    __param(1, (0, typeorm_1.InjectRepository)(ai_prompt_entity_1.AiPrompt)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AiService);
//# sourceMappingURL=ai.service.js.map