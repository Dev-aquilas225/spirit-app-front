import type { Language } from '../types/auth.types';
import { SpiritualMessage } from '../types/content.types';
import { getCurrentLanguage } from '../utils/helpers';

// Sélection par index du jour de l'année — change chaque jour automatiquement
function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

const MESSAGES_FR: { content: string; verse: string }[] = [
  { content: "Dieu t'a placé là où tu es pour une raison. Ne laisse pas les circonstances te définir — laisse Sa présence te transformer.", verse: 'Jérémie 29:11' },
  { content: 'La paix que tu cherches ne se trouve pas dans les circonstances, mais dans la présence de Celui qui tient toutes choses.', verse: 'Philippiens 4:7' },
  { content: "Chaque matin est une nouvelle opportunité de te rapprocher de Dieu. N'attends pas que les choses soient parfaites pour prier.", verse: 'Lamentations 3:22-23' },
  { content: "L'Éternel est mon berger : je ne manquerai de rien. Il me fait reposer dans de verts pâturages.", verse: 'Psaume 23:1-2' },
  { content: "Ne crains rien, car je suis avec toi ; ne te laisse pas abattre, car je suis ton Dieu.", verse: 'Ésaïe 41:10' },
  { content: "Remets ton sort à l'Éternel, mets en lui ta confiance, et il agira.", verse: 'Psaume 37:5' },
  { content: "Je puis tout par celui qui me fortifie.", verse: 'Philippiens 4:13' },
  { content: "L'Éternel est proche de ceux qui ont le cœur brisé, et il sauve ceux qui ont l'esprit dans l'abattement.", verse: 'Psaume 34:19' },
  { content: "Cherchez premièrement le royaume et la justice de Dieu ; toutes ces choses vous seront données par-dessus.", verse: 'Matthieu 6:33' },
  { content: "Dieu est notre refuge et notre force, un secours qui ne manque jamais dans la détresse.", verse: 'Psaume 46:2' },
  { content: "Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ta sagesse.", verse: 'Proverbes 3:5' },
  { content: "Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.", verse: 'Matthieu 11:28' },
  { content: "Dieu n'a pas donné un esprit de crainte, mais un esprit de force, d'amour et de sagesse.", verse: '2 Timothée 1:7' },
  { content: "Ta parole est une lampe à mes pieds, et une lumière sur mon sentier.", verse: 'Psaume 119:105' },
  { content: "Toutes choses concourent au bien de ceux qui aiment Dieu.", verse: 'Romains 8:28' },
  { content: "Soyez dans la joie, priez sans cesse, rendez grâces en toutes choses.", verse: '1 Thessaloniciens 5:16-18' },
  { content: "L'Éternel est ma lumière et mon salut : de qui aurais-je crainte ?", verse: 'Psaume 27:1' },
  { content: "Approchez-vous de Dieu, et il s'approchera de vous.", verse: 'Jacques 4:8' },
  { content: "Soyez forts et courageux. Ne craignez point, car l'Éternel, ton Dieu, est avec toi.", verse: 'Josué 1:9' },
  { content: "Que la paix de Dieu, qui surpasse toute intelligence, garde vos cœurs et vos pensées.", verse: 'Philippiens 4:7' },
  { content: "Celui qui a commencé en vous cette bonne œuvre la rendra parfaite jusqu'au jour de Jésus-Christ.", verse: 'Philippiens 1:6' },
  { content: "L'Éternel bénira ton entrée et ta sortie, dès maintenant et à jamais.", verse: 'Psaume 121:8' },
  { content: "Fortifiez-vous dans le Seigneur et par sa force toute-puissante.", verse: 'Éphésiens 6:10' },
  { content: "Heureux ceux qui ont faim et soif de la justice, car ils seront rassasiés.", verse: 'Matthieu 5:6' },
  { content: "L'Éternel est bon, il est un refuge au jour de la détresse.", verse: 'Nahum 1:7' },
  { content: "Dieu est fidèle, et il ne permettra pas que vous soyez tentés au-delà de vos forces.", verse: '1 Corinthiens 10:13' },
  { content: "L'amour de Dieu a été répandu dans nos cœurs par le Saint-Esprit qui nous a été donné.", verse: 'Romains 5:5' },
  { content: "Ceux qui espèrent en l'Éternel renouvellent leur force. Ils prennent le vol comme les aigles.", verse: 'Ésaïe 40:31' },
  { content: "Heureux ceux qui ont le cœur pur, car ils verront Dieu.", verse: 'Matthieu 5:8' },
  { content: "Celui qui demeure sous l'abri du Très-Haut repose à l'ombre du Tout-Puissant.", verse: 'Psaume 91:1' },
];

const MESSAGES_EN: { content: string; verse: string }[] = [
  { content: 'God placed you where you are for a reason. Do not let circumstances define you — let His presence transform you.', verse: 'Jeremiah 29:11' },
  { content: 'The peace you seek is not found in circumstances, but in the presence of the One who holds all things together.', verse: 'Philippians 4:7' },
  { content: 'Every morning is a new opportunity to draw closer to God. Do not wait for everything to be perfect before you pray.', verse: 'Lamentations 3:22-23' },
  { content: 'The Lord is my shepherd; I shall not want. He makes me lie down in green pastures.', verse: 'Psalm 23:1-2' },
  { content: 'Fear not, for I am with you; be not dismayed, for I am your God.', verse: 'Isaiah 41:10' },
  { content: 'Commit your way to the Lord; trust in him, and he will act.', verse: 'Psalm 37:5' },
  { content: 'I can do all things through him who strengthens me.', verse: 'Philippians 4:13' },
  { content: 'The Lord is near to the brokenhearted and saves the crushed in spirit.', verse: 'Psalm 34:18' },
  { content: 'Seek first the kingdom of God and his righteousness, and all these things will be added to you.', verse: 'Matthew 6:33' },
  { content: 'God is our refuge and strength, a very present help in trouble.', verse: 'Psalm 46:1' },
  { content: 'Trust in the Lord with all your heart, and do not lean on your own understanding.', verse: 'Proverbs 3:5' },
  { content: 'Come to me, all who labor and are heavy laden, and I will give you rest.', verse: 'Matthew 11:28' },
  { content: 'God gave us a spirit not of fear but of power and love and self-control.', verse: '2 Timothy 1:7' },
  { content: 'Your word is a lamp to my feet and a light to my path.', verse: 'Psalm 119:105' },
  { content: 'All things work together for good for those who love God.', verse: 'Romans 8:28' },
];

// Prières du jour — varient chaque jour
export const DAILY_PRAYERS_FR: { prayer: string; verse: string; verseRef: string }[] = [
  { prayer: "Seigneur, je te confie cette journée. Que ta volonté soit faite dans chacun de mes pas. Protège-moi, guide-moi et remplis-moi de ta paix.", verse: "L'Éternel bénira ton entrée et ta sortie.", verseRef: 'Psaume 121:8' },
  { prayer: "Père céleste, merci pour ce nouveau jour. Ouvre mes yeux pour voir ta gloire et mes oreilles pour entendre ta voix. Que ta lumière brille à travers moi.", verse: "Ta parole est une lampe à mes pieds.", verseRef: 'Psaume 119:105' },
  { prayer: "Seigneur Jésus, fortifie-moi là où je suis faible. Là où j'ai peur, donne-moi ta paix. Là où je doute, donne-moi la foi.", verse: "Je puis tout par celui qui me fortifie.", verseRef: 'Philippiens 4:13' },
  { prayer: "Dieu tout-puissant, que ta grâce me précède aujourd'hui. Ouvre des portes que nul ne peut fermer et ferme celles qui ne me sont pas destinées.", verse: "Confie-toi en l'Éternel de tout ton cœur.", verseRef: 'Proverbes 3:5' },
  { prayer: "Père, je te remercie pour ta fidélité. Tu n'as jamais failli à tes promesses. Aide-moi à marcher dans la confiance et non dans la peur.", verse: "Dieu est fidèle.", verseRef: '1 Corinthiens 10:13' },
  { prayer: "Seigneur, renouvelle mes forces comme l'aigle. Que cette journée soit marquée par ta présence et ta faveur sur tout ce que j'entreprends.", verse: "Ceux qui espèrent en l'Éternel renouvellent leur force.", verseRef: 'Ésaïe 40:31' },
  { prayer: "Père céleste, pardonne mes fautes et purifie mon cœur. Que je sois un instrument de ta paix et de ton amour autour de moi aujourd'hui.", verse: "Heureux ceux qui ont le cœur pur, car ils verront Dieu.", verseRef: 'Matthieu 5:8' },
];

const SPIRITUAL_MESSAGES_BY_LANGUAGE: Record<'fr' | 'en', SpiritualMessage[]> = {
  fr: MESSAGES_FR.map((m, i) => ({ id: `m${i}`, content: m.content, verse: m.verse, date: '' })),
  en: MESSAGES_EN.map((m, i) => ({ id: `m${i}`, content: m.content, verse: m.verse, date: '' })),
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
  const idx = getDayOfYear() % messages.length;
  const m = messages[idx];
  return { ...m, date: new Date().toISOString().split('T')[0] };
}

export function getTodayPrayer(): { prayer: string; verse: string; verseRef: string } {
  const idx = getDayOfYear() % DAILY_PRAYERS_FR.length;
  return DAILY_PRAYERS_FR[idx];
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
