export interface BiblicalVerse {
  book: string;
  chapter: string;
  verse: string;
  text: string;
}

export interface MapQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface BiblicalLocation {
  id: string;
  name: string;
  title: string;
  modernName: string;
  region: 'יהודה' | 'שומרון' | 'גליל' | 'חוף' | 'עבר הירדן' | 'סיני ומצרים' | 'צפון והר';
  // Normalized x, y coordinates in percentage [0..100] for responsive map positioning
  x: number;
  y: number;
  description: string;
  keyEvents: string[];
  verses: BiblicalVerse[];
  period: 'אבות' | 'יציאת מצרים' | 'כיבוש ונחלות' | 'שופטים ומלוכה' | 'נביאים';
  quizQuestion?: MapQuizQuestion;
}

export interface BiblicalJourneyStep {
  locationId: string;
  order: number;
  label: string;
  storyNote: string;
}

export interface BiblicalJourney {
  id: string;
  title: string;
  figure: string;
  period: string;
  description: string;
  color: string;
  steps: BiblicalJourneyStep[];
}
