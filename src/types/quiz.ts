export type QuestionType = 
  | 'רב ברירה' 
  | 'נכון/לא נכון' 
  | 'חיבורים' 
  | 'מי אמר למי' 
  | 'סידור כרונולוגי'
  | string;

export type Difficulty = 'קל' | 'בינוני' | 'קשה';

export interface Question {
  id: string;
  questionType: QuestionType;
  topic: string;
  difficulty: Difficulty;
  question: string;
  correctAnswer: string;
  option2: string;
  option3: string;
  option4: string;
  source: string;
  quote: string;
  author: string;
  imageUrl?: string;
  imageCaption?: string;
  parasha?: string;
  // Shuffled options prepared for current question
  shuffledOptions?: string[];
}

export type GameMode = 
  | 'single'          // מתמודד יחיד
  | 'head_to_head'    // ראש בראש
  | 'millionaire'     // מי רוצה להיות מיליונר
  | 'world_cup'       // מונדיאל כיתתי
  | 'connections'     // חיבורים
  | 'true_false'      // נכון או לא נכון
  | 'timeline'        // סידור כרונולוגי
  | 'survival'        // מרתון הישרדות
  | 'bible_map';      // מפת מסעות ואירועים תנ"כיים

export type HeadToHeadSubType = 
  | 'ping_pong'  // פינג פונג - מי שמגיע ל-X תשובות ראשון, טעות מעבירה שאלה
  | 'survivor';  // שורד - רצף תשובות עד טעות לכל שחקן

export interface PlayerStats {
  name: string;
  correct: number;
  totalAnswered: number;
  streak: number;
  maxStreak: number;
}

export interface GameSettings {
  mode: GameMode;
  headToHeadSubType: HeadToHeadSubType;
  selectedTopics: string[];
  selectedDifficulties: Difficulty[];
  timerSeconds: number; // 0 for unlimited, or 10, 15, 20, 30
  player1Name: string;
  player2Name: string;
  studentsList: string[]; // For world cup tournament
  targetScore: number;    // For ping pong (e.g. 5)
}

export interface QuestionAnswerRecord {
  question: Question;
  answeredBy: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export interface TournamentMatch {
  id: string;
  round: number; // 1 = quarters, 2 = semis, 3 = final
  matchIndex: number;
  player1: string;
  player2: string;
  winner?: string;
  score1: number;
  score2: number;
  status: 'pending' | 'in_progress' | 'completed';
}

// Lifelines for Millionaire mode
export interface LifelineState {
  fiftyFifty: boolean;     // 50:50
  audience: boolean;       // עזרה מהקהל / חבר טלפוני
  changeQuestion: boolean; // שאלה חלופית
}
