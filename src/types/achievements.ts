export type AchievementCategory = 'streak' | 'topic' | 'game_mode' | 'score' | 'mastery';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  iconName: string;
  xpReward: number;
  unlockedAt?: string; // ISO date string if unlocked
  progress: number;
  maxProgress: number;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  bestStreak: number;
  quizzesPlayed: number;
  quizzesWon: number;
  achievementsUnlocked: number;
  favoriteTopic?: string;
  lastPlayedAt: string; // ISO date string
}

export interface AchievementNotification {
  id: string;
  title: string;
  description: string;
  iconName: string;
  xpReward: number;
}
