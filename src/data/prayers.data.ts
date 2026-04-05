import { Prayer } from '../types/content.types';

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

export const PRAYERS_DATA: Prayer[] = [
  {
    id: 'p1',
    title: 'Prière du matin — Gratitude',
    content: `Seigneur, en ce nouveau matin, je te rends grâce pour le souffle de vie que Tu m'accordes. Que Ta lumière guide chacun de mes pas aujourd'hui. Protège-moi de tout mal et accorde-moi la sagesse pour accomplir Ta volonté. Amen.`,
    time: 'morning',
    date: today,
    access: 'free',
    duration: '3 min',
  },
  {
    id: 'p2',
    title: 'Prière du soir — Paix intérieure',
    content: `Père céleste, en cette fin de journée, je dépose entre Tes mains tous mes fardeaux. Que Ta paix qui surpasse tout entendement garde mon cœur et mon esprit. Merci pour chaque bénédiction reçue aujourd'hui. Amen.`,
    time: 'evening',
    date: today,
    access: 'free',
    duration: '3 min',
  },
  {
    id: 'p3',
    title: 'Prière de la nuit — Protection',
    content: `Seigneur tout-puissant, alors que je m'apprête à dormir, je confie ma vie à Ta garde. Que Tes anges m'entourent et me protègent cette nuit. Renouvelle mes forces pour demain. Amen.`,
    time: 'night',
    date: today,
    access: 'premium',
    duration: '4 min',
  },
  {
    id: 'p4',
    title: 'Prière de délivrance',
    content: `Dieu puissant, Tu es ma forteresse et mon refuge. Je me tiens devant Toi pour réclamer Ta délivrance. Brise toutes les chaînes et libère-moi de toute oppression. Ta force est plus grande que tout. Amen.`,
    time: 'morning',
    date: today,
    access: 'premium',
    duration: '5 min',
  },
  {
    id: 'p5',
    title: 'Prière du matin — Hier',
    content: `Père, merci pour cette nouvelle journée. Que Ta grâce soit suffisante pour moi. Guide mes pensées, mes paroles et mes actes. Amen.`,
    time: 'morning',
    date: yesterday,
    access: 'free',
    duration: '2 min',
  },
  {
    id: 'p6',
    title: 'Prière de prospérité',
    content: `Seigneur Dieu, Tu connais tous mes besoins avant même que je les exprime. Ouvre les écluses du ciel et déverse Tes bénédictions sur ma vie, ma famille et mon travail. Que tout ce que je fais soit prospéré. Amen.`,
    time: 'morning',
    date: today,
    access: 'premium',
    duration: '5 min',
  },
];

export function getTodayPrayers(): Prayer[] {
  const today = new Date().toISOString().split('T')[0];
  return PRAYERS_DATA.filter((p) => p.date === today);
}

export function getArchivedPrayers(): Prayer[] {
  const today = new Date().toISOString().split('T')[0];
  return PRAYERS_DATA.filter((p) => p.date !== today);
}

export function getFreePrayers(): Prayer[] {
  return PRAYERS_DATA.filter((p) => p.access === 'free');
}
