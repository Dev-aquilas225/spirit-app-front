export type PrayerTime = 'morning' | 'evening' | 'night';
export type ContentAccess = 'free' | 'premium';
export type FormationLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Prayer {
  id: string;
  title: string;
  content: string;
  time: PrayerTime;
  date: string;
  access: ContentAccess;
  duration: string;
  audioUrl?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  description: string;
  pages: number;
  access: ContentAccess;
  category: string;
  chapters: BookChapter[];
}

export interface BookChapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface Formation {
  id: string;
  title: string;
  instructor: string;
  thumbnail: string;
  description: string;
  duration: string;
  level: FormationLevel;
  access: ContentAccess;
  lessons: Lesson[];
  category: string;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  duration: string;
  order: number;
  videoUrl?: string;
}

export interface SpiritualMessage {
  id: string;
  content: string;
  verse?: string;
  date: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  userId: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface Consultation {
  id: string;
  userId: string;
  topic: string;
  message: string;
  preferredDate: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface DreamInterpretation {
  id: string;
  userId: string;
  description: string;
  interpretation: string;
  createdAt: string;
}

export interface PrayerProgram {
  id: string;
  userId: string;
  name: string;
  prayers: Prayer[];
  schedule: string[];
  createdAt: string;
}
