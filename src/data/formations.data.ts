import type { Language } from '../types/auth.types';
import { Formation } from '../types/content.types';
import { getCurrentLanguage } from '../utils/helpers';

const FORMATIONS_BY_LANGUAGE: Record<'fr' | 'en', Formation[]> = {
  fr: [
    {
      id: 'f1',
      title: 'École de la Prière',
      instructor: 'Pasteur Emmanuel Dossou',
      thumbnail: 'https://picsum.photos/seed/form1/400/250',
      description:
        'Formation complète sur les fondements et pratiques de la prière efficace. 8 semaines pour transformer votre vie de prière.',
      duration: '8 semaines',
      level: 'beginner',
      access: 'premium',
      category: 'Prière',
      lessons: [
        {
          id: 'l1',
          title: 'Introduction à la prière',
          content: 'Pourquoi et comment prier...',
          duration: '25 min',
          order: 1,
        },
        {
          id: 'l2',
          title: 'Les différents types de prières',
          content: 'Intercession, supplication, louange...',
          duration: '30 min',
          order: 2,
        },
        {
          id: 'l3',
          title: 'Prier avec la Bible',
          content: 'La prière basée sur la Parole...',
          duration: '35 min',
          order: 3,
        },
        {
          id: 'l4',
          title: 'Jeûne et prière',
          content: 'Le jeûne comme outil spirituel...',
          duration: '40 min',
          order: 4,
        },
      ],
    },
    {
      id: 'f2',
      title: 'Comprendre les Rêves Prophétiques',
      instructor: 'Prophète Abraham Mensah',
      thumbnail: 'https://picsum.photos/seed/form2/400/250',
      description:
        'Apprenez à décoder les messages divins que Dieu vous envoie à travers vos rêves et visions.',
      duration: '4 semaines',
      level: 'intermediate',
      access: 'premium',
      category: 'Prophétie',
      lessons: [
        {
          id: 'l5',
          title: 'La nature des songes divins',
          content: 'Différencier les types de rêves...',
          duration: '20 min',
          order: 1,
        },
        {
          id: 'l6',
          title: 'Symboles courants dans les rêves',
          content: 'Eau, feu, animaux, couleurs...',
          duration: '45 min',
          order: 2,
        },
        {
          id: 'l7',
          title: 'Tenir un journal de rêves',
          content: 'Méthodologie pratique...',
          duration: '15 min',
          order: 3,
        },
      ],
    },
    {
      id: 'f3',
      title: "Marcher dans l'Onction",
      instructor: 'Apôtre Jean-Baptiste Adou',
      thumbnail: 'https://picsum.photos/seed/form3/400/250',
      description:
        "Formation avancée sur les dons spirituels, l'onction et le ministère de la guérison.",
      duration: '6 semaines',
      level: 'advanced',
      access: 'premium',
      category: 'Ministère',
      lessons: [
        {
          id: 'l8',
          title: "Qu'est-ce que l'onction ?",
          content: "L'onction du Saint-Esprit...",
          duration: '30 min',
          order: 1,
        },
        {
          id: 'l9',
          title: 'Les dons spirituels',
          content: 'Inventaire et activation des dons...',
          duration: '50 min',
          order: 2,
        },
        {
          id: 'l10',
          title: 'Ministère de guérison pratique',
          content: 'Prier pour les malades...',
          duration: '40 min',
          order: 3,
        },
      ],
    },
  ],
  en: [
    {
      id: 'f1',
      title: 'School of Prayer',
      instructor: 'Pastor Emmanuel Dossou',
      thumbnail: 'https://picsum.photos/seed/form1/400/250',
      description:
        'A complete course on the foundations and practices of effective prayer. 8 weeks to transform your prayer life.',
      duration: '8 weeks',
      level: 'beginner',
      access: 'premium',
      category: 'Prayer',
      lessons: [
        {
          id: 'l1',
          title: 'Introduction to prayer',
          content: 'Why and how to pray...',
          duration: '25 min',
          order: 1,
        },
        {
          id: 'l2',
          title: 'The different kinds of prayer',
          content: 'Intercession, supplication, praise...',
          duration: '30 min',
          order: 2,
        },
        {
          id: 'l3',
          title: 'Praying with the Bible',
          content: 'Prayer grounded in the Word...',
          duration: '35 min',
          order: 3,
        },
        {
          id: 'l4',
          title: 'Fasting and prayer',
          content: 'Fasting as a spiritual tool...',
          duration: '40 min',
          order: 4,
        },
      ],
    },
    {
      id: 'f2',
      title: 'Understanding Prophetic Dreams',
      instructor: 'Prophet Abraham Mensah',
      thumbnail: 'https://picsum.photos/seed/form2/400/250',
      description:
        'Learn to decode the divine messages God sends through your dreams and visions.',
      duration: '4 weeks',
      level: 'intermediate',
      access: 'premium',
      category: 'Prophecy',
      lessons: [
        {
          id: 'l5',
          title: 'The nature of divine dreams',
          content: 'Distinguishing the types of dreams...',
          duration: '20 min',
          order: 1,
        },
        {
          id: 'l6',
          title: 'Common symbols in dreams',
          content: 'Water, fire, animals, colours...',
          duration: '45 min',
          order: 2,
        },
        {
          id: 'l7',
          title: 'Keeping a dream journal',
          content: 'A practical method...',
          duration: '15 min',
          order: 3,
        },
      ],
    },
    {
      id: 'f3',
      title: 'Walking in the Anointing',
      instructor: 'Apostle Jean-Baptiste Adou',
      thumbnail: 'https://picsum.photos/seed/form3/400/250',
      description:
        'An advanced course on spiritual gifts, the anointing and the healing ministry.',
      duration: '6 weeks',
      level: 'advanced',
      access: 'premium',
      category: 'Ministry',
      lessons: [
        {
          id: 'l8',
          title: 'What is the anointing?',
          content: 'The anointing of the Holy Spirit...',
          duration: '30 min',
          order: 1,
        },
        {
          id: 'l9',
          title: 'Spiritual gifts',
          content: 'Inventory and activation of gifts...',
          duration: '50 min',
          order: 2,
        },
        {
          id: 'l10',
          title: 'Practical healing ministry',
          content: 'Praying for the sick...',
          duration: '40 min',
          order: 3,
        },
      ],
    },
  ],
};

export const FORMATIONS_DATA: Formation[] = FORMATIONS_BY_LANGUAGE.fr;

export function getFormationsData(language: Language = getCurrentLanguage()): Formation[] {
  return FORMATIONS_BY_LANGUAGE[language === 'en' ? 'en' : 'fr'];
}
