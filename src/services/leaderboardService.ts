import { LeaderboardEntry } from '../types/achievements';

const LEADERBOARD_STORAGE_KEY = 'tanach_quiz_leaderboard_v1';

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'lead-1',
    playerName: 'דוד בן ישי',
    score: 420,
    bestStreak: 12,
    quizzesPlayed: 8,
    quizzesWon: 7,
    achievementsUnlocked: 7,
    favoriteTopic: 'שמואל',
    lastPlayedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'lead-2',
    playerName: 'אלישיב',
    score: 350,
    bestStreak: 9,
    quizzesPlayed: 6,
    quizzesWon: 4,
    achievementsUnlocked: 5,
    favoriteTopic: 'מלכים',
    lastPlayedAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'lead-3',
    playerName: 'יונתן',
    score: 310,
    bestStreak: 8,
    quizzesPlayed: 5,
    quizzesWon: 3,
    achievementsUnlocked: 4,
    favoriteTopic: 'שופטים',
    lastPlayedAt: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'lead-4',
    playerName: 'איתמר',
    score: 260,
    bestStreak: 7,
    quizzesPlayed: 4,
    quizzesWon: 2,
    achievementsUnlocked: 3,
    favoriteTopic: 'שמות',
    lastPlayedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'lead-5',
    playerName: 'יאיר',
    score: 190,
    bestStreak: 5,
    quizzesPlayed: 3,
    quizzesWon: 2,
    achievementsUnlocked: 2,
    favoriteTopic: 'בראשית',
    lastPlayedAt: new Date(Date.now() - 3600000 * 30).toISOString()
  },
  {
    id: 'lead-6',
    playerName: 'נועם',
    score: 150,
    bestStreak: 4,
    quizzesPlayed: 2,
    quizzesWon: 1,
    achievementsUnlocked: 2,
    favoriteTopic: 'יהושע',
    lastPlayedAt: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'lead-7',
    playerName: 'אורי',
    score: 120,
    bestStreak: 3,
    quizzesPlayed: 2,
    quizzesWon: 1,
    achievementsUnlocked: 1,
    favoriteTopic: 'תהילים',
    lastPlayedAt: new Date(Date.now() - 3600000 * 72).toISOString()
  }
];

export function getStoredLeaderboard(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return INITIAL_LEADERBOARD;
  try {
    const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (!raw) return INITIAL_LEADERBOARD;
    const entries: LeaderboardEntry[] = JSON.parse(raw);
    return entries.length > 0 ? entries : INITIAL_LEADERBOARD;
  } catch {
    return INITIAL_LEADERBOARD;
  }
}

export function saveLeaderboard(entries: LeaderboardEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('Failed to save leaderboard:', err);
  }
}

/**
 * Updates or registers a player's performance in the leaderboard
 */
export function recordPlayerResult(params: {
  playerName: string;
  pointsEarned: number;
  streak: number;
  isWinner: boolean;
  achievementsCount?: number;
  topicPlayed?: string;
}): LeaderboardEntry[] {
  const cleanName = params.playerName.trim();
  if (!cleanName) return getStoredLeaderboard();

  const entries = getStoredLeaderboard();
  const existingIndex = entries.findIndex(e => e.playerName.trim().toLowerCase() === cleanName.toLowerCase());
  const now = new Date().toISOString();

  if (existingIndex !== -1) {
    const current = entries[existingIndex];
    const updated: LeaderboardEntry = {
      ...current,
      playerName: cleanName, // preserve casing
      score: current.score + params.pointsEarned,
      bestStreak: Math.max(current.bestStreak, params.streak),
      quizzesPlayed: current.quizzesPlayed + 1,
      quizzesWon: current.quizzesWon + (params.isWinner ? 1 : 0),
      achievementsUnlocked: params.achievementsCount !== undefined ? Math.max(current.achievementsUnlocked, params.achievementsCount) : current.achievementsUnlocked,
      favoriteTopic: params.topicPlayed || current.favoriteTopic,
      lastPlayedAt: now
    };
    entries[existingIndex] = updated;
  } else {
    const newEntry: LeaderboardEntry = {
      id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      playerName: cleanName,
      score: params.pointsEarned,
      bestStreak: params.streak,
      quizzesPlayed: 1,
      quizzesWon: params.isWinner ? 1 : 0,
      achievementsUnlocked: params.achievementsCount || 0,
      favoriteTopic: params.topicPlayed,
      lastPlayedAt: now
    };
    entries.push(newEntry);
  }

  // Sort descending by score, tie-break by streak then won
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.bestStreak !== a.bestStreak) return b.bestStreak - a.bestStreak;
    return b.quizzesWon - a.quizzesWon;
  });

  saveLeaderboard(entries);
  return entries;
}

export function resetLeaderboardToDefault(): LeaderboardEntry[] {
  saveLeaderboard(INITIAL_LEADERBOARD);
  return INITIAL_LEADERBOARD;
}
