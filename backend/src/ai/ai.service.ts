import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiConversation } from './ai-conversation.entity';
import { AiPrompt } from './ai-prompt.entity';
import axios from 'axios';

const DEFAULT_PROMPTS: Record<string, string> = {
  ai_chat: `Tu es Oracle Plus, un assistant spirituel africain bienveillant fondé sur la sagesse biblique et africaine.
Réponds toujours en français, avec chaleur et profondeur spirituelle.
Cite des versets bibliques pertinents quand c'est approprié.
Sois concis (3-5 phrases max) sauf si l'utilisateur demande plus de détails.`,

  dream_interpretation: `Tu es un interprète de rêves spirituel, expert en symbolisme biblique et africain.
Quand un utilisateur décrit un rêve, analyse-le avec sagesse en 3 parties :
1. Signification spirituelle du rêve
2. Message ou avertissement possible
3. Conseil pratique ou verset biblique applicable
Réponds en français, avec bienveillance et profondeur.`,

  prophetic_consultation: `Tu es le Prophète Georges Tchingankong, fondateur de l'Arche d'Alliance Éternelle.
Tu donnes des guidances prophétiques basées sur la Parole de Dieu.
Réponds avec autorité spirituelle, cite des versets bibliques précis, et encourage l'utilisateur dans sa foi.
Sois direct, puissant et bienveillant. Réponds en français.`,

  prayer_generation: `Tu es un intercesseur spirituel puissant.
Quand un utilisateur partage un besoin ou une intention, génère une prière personnalisée qui :
- S'adresse directement à Dieu le Père
- Cite au moins un verset biblique pertinent
- Couvre le besoin spécifique avec précision
- Se termine par une déclaration de foi
Réponds en français, avec onction et profondeur spirituelle.`,

  consultation: `Tu es un conseiller spirituel africain sage et bienveillant.
Tu aides les utilisateurs à naviguer leurs défis de vie (famille, travail, santé, relations) à travers le prisme de la foi.
Donne des conseils pratiques ancrés dans la Parole de Dieu.
Cite des versets bibliques pertinents. Réponds en français avec empathie et sagesse.`,

  accompagnement: `Tu es un accompagnateur spirituel doux et patient.
Tu suis l'utilisateur dans son parcours de croissance spirituelle sur le long terme.
Pose des questions pour mieux comprendre sa situation, encourage ses progrès, et propose des exercices spirituels concrets (prière, méditation, lecture biblique).
Réponds en français avec douceur, patience et profondeur.`,
};

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(AiConversation) private convRepo: Repository<AiConversation>,
    @InjectRepository(AiPrompt) private promptRepo: Repository<AiPrompt>,
  ) {}

  async getPrompt(section: string): Promise<string> {
    const p = await this.promptRepo.findOne({ where: { section } });
    return p?.systemPrompt ?? DEFAULT_PROMPTS[section] ?? DEFAULT_PROMPTS.ai_chat;
  }

  async chat(userId: string, section: string, message: string, conversationId?: string) {
    let conv = conversationId
      ? await this.convRepo.findOne({ where: { id: conversationId, userId } })
      : null;

    if (!conv) {
      conv = this.convRepo.create({ userId, section, messages: [] });
      conv = await this.convRepo.save(conv);
    }

    const systemPrompt = await this.getPrompt(section);
    const messages = conv.messages.slice(-20); // last 20 for context

    const apiKey = process.env.OPENAI_API_KEY;
    let aiText = '';

    if (apiKey) {
      try {
        const res = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-4o-mini',
          temperature: 0.75,
          max_tokens: 500,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m: any) => ({ role: m.role, content: m.content })),
            { role: 'user', content: message },
          ],
        }, { headers: { Authorization: `Bearer ${apiKey}` } });
        aiText = res.data.choices[0].message.content;
      } catch (e) {
        aiText = 'Je suis temporairement indisponible. Veuillez réessayer dans quelques instants.';
      }
    } else {
      aiText = 'Clé OpenAI non configurée. Contactez l\'administrateur.';
    }

    const userMsg = { role: 'user', content: message, timestamp: new Date().toISOString() };
    const aiMsg = { role: 'assistant', content: aiText, timestamp: new Date().toISOString() };
    const updatedMessages = [...conv.messages, userMsg, aiMsg].slice(-100);

    await this.convRepo.update(conv.id, { messages: updatedMessages });

    return { conversationId: conv.id, message: aiMsg, messages: updatedMessages };
  }

  async interpretDream(userId: string, dream: string, conversationId?: string) {
    return this.chat(userId, 'dream_interpretation', dream, conversationId);
  }

  getConversations(userId: string) {
    return this.convRepo.find({ where: { userId }, order: { updatedAt: 'DESC' } });
  }

  getConversation(userId: string, id: string) {
    return this.convRepo.findOne({ where: { id, userId } });
  }

  async deleteConversation(userId: string, id: string) {
    await this.convRepo.delete({ id, userId });
  }

  getDreamHistory(userId: string) {
    return this.convRepo.find({ where: { userId, section: 'dream_interpretation' }, order: { updatedAt: 'DESC' } });
  }

  async getAdminSettings() {
    const prompts = await this.promptRepo.find();
    const result: Record<string, string> = { ...DEFAULT_PROMPTS };
    prompts.forEach(p => result[p.section] = p.systemPrompt);
    return result;
  }

  async updateAdminSettings(section: string, systemPrompt: string) {
    let p = await this.promptRepo.findOne({ where: { section } });
    if (p) {
      await this.promptRepo.update(p.id, { systemPrompt });
    } else {
      await this.promptRepo.save(this.promptRepo.create({ section, systemPrompt }));
    }
    return { section, systemPrompt };
  }
}
