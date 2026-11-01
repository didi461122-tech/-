export interface SurvivalRecord {
  id: string;
  playerName: string;
  score: number;
  maxStreak: number;
  totalCorrect: number;
  date: string;
}

const STORAGE_KEY = 'tanach_survival_high_scores';

export function getSurvivalHighScores(): SurvivalRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Initial default records
      return [
        {
          id: 'rec_1',
          playerName: 'דוד בן ישי',
          score: 1450,
          maxStreak: 14,
          totalCorrect: 18,
          date: 'השבוע'
        },
        {
          id: 'rec_2',
          playerName: 'אלישיב הכהן',
          score: 980,
          maxStreak: 10,
          totalCorrect: 12,
          date: 'החודש'
        },
        {
          id: 'rec_3',
          playerName: 'יונתן',
          score: 650,
          maxStreak: 7,
          totalCorrect: 8,
          date: 'אתמול'
        }
      ];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSurvivalRecord(record: Omit<SurvivalRecord, 'id' | 'date'>): SurvivalRecord {
  const existing = getSurvivalHighScores();
  const newRec: SurvivalRecord = {
    ...record,
    id: `surv_${Date.now()}`,
    date: new Date().toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })
  };
  const updated = [...existing, newRec]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Keep top 10

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save survival score:', e);
  }

  return newRec;
}

export function calculateSurvivalMultiplier(streak: number): number {
  if (streak >= 15) return 3.0;
  if (streak >= 10) return 2.5;
  if (streak >= 5) return 2.0;
  if (streak >= 3) return 1.5;
  return 1.0;
}

export function calculatePointsForAnswer(timeLeft: number, totalTime: number, streak: number): number {
  const basePoints = 100;
  // Speed bonus up to 50 points
  const speedBonus = totalTime > 0 ? Math.round((timeLeft / totalTime) * 50) : 25;
  const multiplier = calculateSurvivalMultiplier(streak);
  return Math.round((basePoints + speedBonus) * multiplier);
}
