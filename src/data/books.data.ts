import { Book } from '../types/content.types';

export const BOOKS_DATA: Book[] = [
  {
    id: 'b1',
    title: 'Le Pouvoir de la Prière',
    author: 'Frère Samuel Kofi',
    cover: 'https://picsum.photos/seed/book1/200/300',
    description: 'Découvrez comment la prière transforme votre vie spirituelle et ouvre les portes du ciel. Un guide pratique pour une vie de prière efficace.',
    pages: 180,
    access: 'free',
    category: 'Prière',
    chapters: [
      { id: 'c1', title: 'Les fondements de la prière', content: 'La prière est le souffle de l\'âme...', order: 1 },
      { id: 'c2', title: 'Les types de prières', content: 'Il existe plusieurs formes de prières...', order: 2 },
      { id: 'c3', title: 'Comment structurer sa prière', content: 'Une prière efficace commence par...', order: 3 },
    ],
  },
  {
    id: 'b2',
    title: 'Marcher dans la Foi',
    author: 'Pasteur Emmanuel Dossou',
    cover: 'https://picsum.photos/seed/book2/200/300',
    description: 'Un voyage au cœur de la foi biblique pour vous aider à surmonter vos peurs et avancer avec confiance.',
    pages: 220,
    access: 'premium',
    category: 'Foi',
    chapters: [
      { id: 'c4', title: 'Qu\'est-ce que la foi ?', content: 'La foi est la certitude des choses qu\'on espère...', order: 1 },
      { id: 'c5', title: 'La foi en action', content: 'La foi sans les œuvres est morte...', order: 2 },
    ],
  },
  {
    id: 'b3',
    title: 'Songes et Révélations Divines',
    author: 'Prophète Abraham Mensah',
    cover: 'https://picsum.photos/seed/book3/200/300',
    description: 'Comprendre le langage de Dieu à travers les rêves et visions. Un guide d\'interprétation spirituelle.',
    pages: 150,
    access: 'premium',
    category: 'Visions',
    chapters: [
      { id: 'c6', title: 'Introduction aux songes bibliques', content: 'Depuis les temps anciens...', order: 1 },
      { id: 'c7', title: 'Les symboles prophétiques', content: 'Chaque symbole porte une signification...', order: 2 },
    ],
  },
  {
    id: 'b4',
    title: 'Guérison et Délivrance',
    author: 'Apôtre Jean-Baptiste Adou',
    cover: 'https://picsum.photos/seed/book4/200/300',
    description: 'Découvrez les vérités bibliques sur la guérison divine et la délivrance spirituelle.',
    pages: 200,
    access: 'premium',
    category: 'Guérison',
    chapters: [
      { id: 'c8', title: 'La volonté de Dieu pour votre santé', content: 'Dieu veut que vous soyez en bonne santé...', order: 1 },
      { id: 'c9', title: 'Comment recevoir la guérison', content: 'La guérison s\'active par la foi...', order: 2 },
    ],
  },
];
