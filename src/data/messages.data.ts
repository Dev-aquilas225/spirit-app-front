import type { Language } from '../types/auth.types';
import { SpiritualMessage } from '../types/content.types';
import { getCurrentLanguage } from '../utils/helpers';

const today = new Date().toISOString().split('T')[0];

const SPIRITUAL_MESSAGES_BY_LANGUAGE: Record<'fr' | 'en', SpiritualMessage[]> = {
  fr: [
    {
      id: 'm1',
      content:
        "Dieu t'a placé là où tu es pour une raison. Ne laisse pas les circonstances te définir — laisse Sa présence te transformer.",
      verse: 'Jérémie 29:11',
      date: today,
    },
    {
      id: 'm2',
      content:
        'La paix que tu cherches ne se trouve pas dans les circonstances, mais dans la présence de Celui qui tient toutes choses.',
      verse: 'Philippiens 4:7',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    },
    {
      id: 'm3',
      content:
        "Chaque matin est une nouvelle opportunité de te rapprocher de Dieu. N'attends pas que les choses soient parfaites pour prier.",
      verse: 'Lamentations 3:22-23',
      date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    },
  ],
  en: [
    {
      id: 'm1',
      content:
        'God placed you where you are for a reason. Do not let circumstances define you — let His presence transform you.',
      verse: 'Jeremiah 29:11',
      date: today,
    },
    {
      id: 'm2',
      content:
        'The peace you seek is not found in circumstances, but in the presence of the One who holds all things together.',
      verse: 'Philippians 4:7',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    },
    {
      id: 'm3',
      content:
        'Every morning is a new opportunity to draw closer to God. Do not wait for everything to be perfect before you pray.',
      verse: 'Lamentations 3:22-23',
      date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    },
  ],
};

const MOCK_RESPONSES_BY_LANGUAGE: Record<'fr' | 'en', Record<string, string>> = {
  fr: {
    default:
      'Que la paix de Dieu soit avec vous. Votre question reflète une recherche sincère. Je vous encourage à méditer sur Psaume 23 et à confier cette préoccupation dans la prière.',
    prayer:
      "La prière est notre ligne directe avec le Père. Pour fortifier votre vie de prière, commencez par la louange, poursuivez avec la confession, puis l'intercession et enfin vos requêtes personnelles.",
    fear:
      "L'Écriture nous dit que Dieu ne nous a pas donné un esprit de crainte, mais de puissance, d'amour et de sagesse (2 Timothée 1:7). Remplacez chaque peur par une promesse de Sa Parole.",
    healing:
      'Jésus est le même hier, aujourd’hui et éternellement. Sa volonté est que vous soyez relevé — faites appel à Sa puissance par la foi et la prière.',
    dream:
      'Les rêves portent souvent des indications spirituelles. Notez-les dès le réveil, priez pour recevoir la bonne compréhension et confrontez-les toujours à la Parole.',
    family:
      'La famille est une institution divine. Priez ensemble, pratiquez le pardon et rebâtissez des fondations spirituelles solides, un jour après l’autre.',
  },
  en: {
    default:
      'May the peace of God be with you. Your question reflects a sincere search. I encourage you to meditate on Psalm 23 and bring this concern before God in prayer.',
    prayer:
      'Prayer is our direct line to the Father. To strengthen your prayer life, begin with praise, continue with confession, then intercession, and finally your personal requests.',
    fear:
      'Scripture tells us that God has not given us a spirit of fear, but of power, love and wisdom (2 Timothy 1:7). Replace each fear with a promise from His Word.',
    healing:
      'Jesus is the same yesterday, today and forever. His desire is to restore you — lean on His power through faith and prayer.',
    dream:
      'Dreams often carry spiritual direction. Write them down as soon as you wake up, pray for understanding, and always weigh them against Scripture.',
    family:
      'Family is a divine institution. Pray together, practise forgiveness, and rebuild strong spiritual foundations one day at a time.',
  },
};

function resolveLanguage(language: Language = getCurrentLanguage()): 'fr' | 'en' {
  return language === 'en' ? 'en' : 'fr';
}

export function getTodayMessage(language: Language = getCurrentLanguage()): SpiritualMessage | null {
  const selectedLanguage = resolveLanguage(language);
  const messages = SPIRITUAL_MESSAGES_BY_LANGUAGE[selectedLanguage];
  const currentDate = new Date().toISOString().split('T')[0];
  return messages.find((message) => message.date === currentDate) ?? messages[0];
}

export function getMockAIResponse(
  question: string,
  language: Language = getCurrentLanguage(),
): string {
  const selectedLanguage = resolveLanguage(language);
  const responses = MOCK_RESPONSES_BY_LANGUAGE[selectedLanguage];
  const lowerQuestion = question.toLowerCase();

  if (
    lowerQuestion.includes('prière') ||
    lowerQuestion.includes('prier') ||
    lowerQuestion.includes('prayer') ||
    lowerQuestion.includes('pray')
  ) {
    return responses.prayer;
  }

  if (
    lowerQuestion.includes('peur') ||
    lowerQuestion.includes('angoisse') ||
    lowerQuestion.includes('anxiété') ||
    lowerQuestion.includes('fear') ||
    lowerQuestion.includes('anxiety')
  ) {
    return responses.fear;
  }

  if (
    lowerQuestion.includes('guérison') ||
    lowerQuestion.includes('maladie') ||
    lowerQuestion.includes('santé') ||
    lowerQuestion.includes('healing') ||
    lowerQuestion.includes('health')
  ) {
    return responses.healing;
  }

  if (
    lowerQuestion.includes('rêve') ||
    lowerQuestion.includes('songe') ||
    lowerQuestion.includes('vision') ||
    lowerQuestion.includes('dream')
  ) {
    return responses.dream;
  }

  if (
    lowerQuestion.includes('famille') ||
    lowerQuestion.includes('mariage') ||
    lowerQuestion.includes('enfant') ||
    lowerQuestion.includes('family') ||
    lowerQuestion.includes('marriage') ||
    lowerQuestion.includes('child')
  ) {
    return responses.family;
  }

  return responses.default;
}
