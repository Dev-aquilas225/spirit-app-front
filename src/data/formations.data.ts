import { Formation } from '../types/content.types';

export const FORMATIONS_DATA: Formation[] = [
  {
    id: 'f1',
    title: 'École de la Prière',
    instructor: 'Pasteur Emmanuel Dossou',
    thumbnail: 'https://picsum.photos/seed/form1/400/250',
    description: 'Formation complète sur les fondements et pratiques de la prière efficace. 8 semaines pour transformer votre vie de prière.',
    duration: '8 semaines',
    level: 'beginner',
    access: 'premium',
    category: 'Prière',
    lessons: [
      { id: 'l1', title: 'Introduction à la prière', content: 'Pourquoi et comment prier...', duration: '25 min', order: 1 },
      { id: 'l2', title: 'Les différents types de prières', content: 'Intercession, supplication, louange...', duration: '30 min', order: 2 },
      { id: 'l3', title: 'Prier avec la Bible', content: 'La prière basée sur la Parole...', duration: '35 min', order: 3 },
      { id: 'l4', title: 'Jeûne et prière', content: 'Le jeûne comme outil spirituel...', duration: '40 min', order: 4 },
    ],
  },
  {
    id: 'f2',
    title: 'Comprendre les Rêves Prophétiques',
    instructor: 'Prophète Abraham Mensah',
    thumbnail: 'https://picsum.photos/seed/form2/400/250',
    description: 'Apprenez à décoder les messages divins que Dieu vous envoie à travers vos rêves et visions.',
    duration: '4 semaines',
    level: 'intermediate',
    access: 'premium',
    category: 'Prophétie',
    lessons: [
      { id: 'l5', title: 'La nature des songes divins', content: 'Différencier les types de rêves...', duration: '20 min', order: 1 },
      { id: 'l6', title: 'Symboles courants dans les rêves', content: 'Eau, feu, animaux, couleurs...', duration: '45 min', order: 2 },
      { id: 'l7', title: 'Tenir un journal de rêves', content: 'Méthodologie pratique...', duration: '15 min', order: 3 },
    ],
  },
  {
    id: 'f3',
    title: 'Marcher dans l\'Onction',
    instructor: 'Apôtre Jean-Baptiste Adou',
    thumbnail: 'https://picsum.photos/seed/form3/400/250',
    description: 'Formation avancée sur les dons spirituels, l\'onction et le ministère de la guérison.',
    duration: '6 semaines',
    level: 'advanced',
    access: 'premium',
    category: 'Ministère',
    lessons: [
      { id: 'l8', title: 'Qu\'est-ce que l\'onction ?', content: 'L\'onction du Saint-Esprit...', duration: '30 min', order: 1 },
      { id: 'l9', title: 'Les dons spirituels', content: 'Inventaire et activation des dons...', duration: '50 min', order: 2 },
      { id: 'l10', title: 'Ministère de guérison pratique', content: 'Prier pour les malades...', duration: '40 min', order: 3 },
    ],
  },
];
