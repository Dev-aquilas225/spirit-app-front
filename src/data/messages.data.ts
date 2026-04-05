import { SpiritualMessage } from '../types/content.types';

const today = new Date().toISOString().split('T')[0];

export const SPIRITUAL_MESSAGES: SpiritualMessage[] = [
  {
    id: 'm1',
    content: 'Dieu t\'a placé là où tu es pour une raison. Ne laisse pas les circonstances te définir — laisse Sa présence te transformer.',
    verse: 'Jérémie 29:11',
    date: today,
  },
  {
    id: 'm2',
    content: 'La paix que tu cherches ne se trouve pas dans les circonstances, mais dans la présence de Celui qui tient toutes choses.',
    verse: 'Philippiens 4:7',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
  },
  {
    id: 'm3',
    content: 'Chaque matin est une nouvelle opportunité de te rapprocher de Dieu. N\'attends pas que les choses soient parfaites pour prier.',
    verse: 'Lamentations 3:22-23',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
  },
];

export function getTodayMessage(): SpiritualMessage | null {
  const today = new Date().toISOString().split('T')[0];
  return SPIRITUAL_MESSAGES.find((m) => m.date === today) ?? SPIRITUAL_MESSAGES[0];
}

export const AI_MOCK_RESPONSES: Record<string, string> = {
  default: 'Que la paix de Dieu soit avec vous. Votre question reflète une recherche sincère. Je vous encourage à méditer sur Psaume 23 et à confier cette préoccupation dans la prière.',
  prayer: 'La prière est notre ligne directe avec le Père. Pour renforcer votre vie de prière, commencez par la louange, puis la confession, ensuite l\'intercession, et enfin vos requêtes personnelles.',
  fear: 'L\'Écriture nous dit que Dieu ne nous a pas donné un esprit de crainte, mais de puissance, d\'amour et de sagesse (2 Timothée 1:7). Remplacez chaque peur par une promesse de Sa Parole.',
  healing: 'Jésus est le même hier, aujourd\'hui et éternellement. Sa volonté est que vous soyez guéri — faites appel à Sa puissance par la foi et les prières des anciens.',
  dream: 'Les rêves sont souvent des messages divins. Notez-les dès le réveil, priez pour leur interprétation, et discernez-les avec la Parole. Consultez notre section Interprétation des Rêves.',
  family: 'La famille est une institution divine. Priez ensemble, pratiquez le pardon, et bâtissez des fondations spirituelles solides. Notre programme personnalisé peut vous aider.',
};

export function getMockAIResponse(question: string): string {
  const lowerQ = question.toLowerCase();
  if (lowerQ.includes('prière') || lowerQ.includes('prier')) return AI_MOCK_RESPONSES.prayer;
  if (lowerQ.includes('peur') || lowerQ.includes('angoisse') || lowerQ.includes('anxiété')) return AI_MOCK_RESPONSES.fear;
  if (lowerQ.includes('guérison') || lowerQ.includes('maladie') || lowerQ.includes('santé')) return AI_MOCK_RESPONSES.healing;
  if (lowerQ.includes('rêve') || lowerQ.includes('songe') || lowerQ.includes('vision')) return AI_MOCK_RESPONSES.dream;
  if (lowerQ.includes('famille') || lowerQ.includes('mariage') || lowerQ.includes('enfant')) return AI_MOCK_RESPONSES.family;
  return AI_MOCK_RESPONSES.default;
}
