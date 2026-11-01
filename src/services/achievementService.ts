import { Achievement, AchievementNotification } from '../types/achievements';
import { QuestionAnswerRecord, GameSettings } from '../types/quiz';

const ACHIEVEMENTS_STORAGE_KEY = 'tanach_quiz_achievements_v1';
const CUMULATIVE_STATS_KEY = 'tanach_quiz_cumulative_stats_v1';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  // רצפים
  {
    id: 'streak_3',
    title: 'פותח שערים',
    description: 'השג רצף של 3 תשובות נכונות',
    category: 'streak',
    iconName: 'Flame',
    xpReward: 50,
    progress: 0,
    maxProgress: 3
  },
  {
    id: 'streak_7',
    title: 'בקיא ורגיל',
    description: 'השג רצף של 7 תשובות נכונות ברציפות',
    category: 'streak',
    iconName: 'Zap',
    xpReward: 100,
    progress: 0,
    maxProgress: 7
  },
  {
    id: 'streak_15',
    title: 'אלוף הבקיאות',
    description: 'רצף אגדי של 15 תשובות נכונות ברציפות',
    category: 'streak',
    iconName: 'Crown',
    xpReward: 250,
    progress: 0,
    maxProgress: 15
  },

  // נושאים וספרים
  {
    id: 'topic_genesis',
    title: 'ספר תולדות אדם',
    description: 'ענה נכון על 5 שאלות מספר בראשית',
    category: 'topic',
    iconName: 'BookMarked',
    xpReward: 75,
    progress: 0,
    maxProgress: 5
  },
  {
    id: 'topic_exodus',
    title: 'ואלה שמות',
    description: 'ענה נכון על 5 שאלות מספר שמות',
    category: 'topic',
    iconName: 'Scroll',
    xpReward: 75,
    progress: 0,
    maxProgress: 5
  },
  {
    id: 'topic_prophets',
    title: 'חזק ונתחזק',
    description: 'ענה נכון על 10 שאלות מספרי הנביאים (יהושע, שופטים, שמואל, מלכים)',
    category: 'topic',
    iconName: 'Shield',
    xpReward: 120,
    progress: 0,
    maxProgress: 10
  },
  {
    id: 'multi_topic',
    title: 'איש אשכולות',
    description: 'ענה נכון על שאלות מלפחות 4 נושאים שונים במשחק אחד',
    category: 'topic',
    iconName: 'Compass',
    xpReward: 100,
    progress: 0,
    maxProgress: 4
  },

  // מצבי משחק
  {
    id: 'mode_millionaire',
    title: 'מיליונר התנ"ך',
    description: 'הגע לשלב 10 לפחות במרוץ למיליון (100,000 ₪)',
    category: 'game_mode',
    iconName: 'Gem',
    xpReward: 200,
    progress: 0,
    maxProgress: 10
  },
  {
    id: 'mode_world_cup',
    title: 'אלוף המונדיאל',
    description: 'זכה בתואר אלוף הכיתה בטורניר מונדיאל תנ"ך',
    category: 'game_mode',
    iconName: 'Trophy',
    xpReward: 250,
    progress: 0,
    maxProgress: 1
  },
  {
    id: 'mode_connections',
    title: 'אמן החיבורים',
    description: 'פתור את כל 4 הקבוצות במשחק החיבורים',
    category: 'game_mode',
    iconName: 'Layers',
    xpReward: 100,
    progress: 0,
    maxProgress: 4
  },
  {
    id: 'mode_true_false',
    title: 'עין הבזק',
    description: 'ענה נכון על לפחות 5 היגדים במשחק נכון/לא נכון',
    category: 'game_mode',
    iconName: 'Sparkles',
    xpReward: 80,
    progress: 0,
    maxProgress: 5
  },
  {
    id: 'mode_timeline',
    title: 'סדר הדורות',
    description: 'סדר בהצלחה את ציר הזמן המקראי',
    category: 'game_mode',
    iconName: 'Clock',
    xpReward: 100,
    progress: 0,
    maxProgress: 1
  },

  // צבירה ואיכות
  {
    id: 'perfect_accuracy',
    title: 'דיוק מושלם',
    description: 'סיים משחק עם 100% דיוק (מינימום 5 שאלות)',
    category: 'mastery',
    iconName: 'Target',
    xpReward: 150,
    progress: 0,
    maxProgress: 1
  },
  {
    id: 'scholar_25',
    title: 'תלמיד חכם',
    description: 'ענה נכון על 25 שאלות במצטבר',
    category: 'score',
    iconName: 'Award',
    xpReward: 150,
    progress: 0,
    maxProgress: 25
  },
  {
    id: 'master_1000',
    title: 'שר האלף',
    description: 'צבור 1,000 נקודות במערכת הניקוד הכיתתית',
    category: 'score',
    iconName: 'Star',
    xpReward: 300,
    progress: 0,
    maxProgress: 1000
  }
];

export interface CumulativeStats {
  totalCorrect: number;
  totalAnswered: number;
  totalXp: number;
  bestStreakEver: number;
  genesisCorrect: number;
  exodusCorrect: number;
  prophetsCorrect: number;
}

const DEFAULT_CUMULATIVE: CumulativeStats = {
  totalCorrect: 0,
  totalAnswered: 0,
  totalXp: 0,
  bestStreakEver: 0,
  genesisCorrect: 0,
  exodusCorrect: 0,
  prophetsCorrect: 0
};

export function getStoredCumulativeStats(): CumulativeStats {
  if (typeof window === 'undefined') return DEFAULT_CUMULATIVE;
  try {
    const raw = localStorage.getItem(CUMULATIVE_STATS_KEY);
    return raw ? { ...DEFAULT_CUMULATIVE, ...JSON.parse(raw) } : DEFAULT_CUMULATIVE;
  } catch {
    return DEFAULT_CUMULATIVE;
  }
}

export function saveCumulativeStats(stats: CumulativeStats) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUMULATIVE_STATS_KEY, JSON.stringify(stats));
  } catch (err) {
    console.warn('Failed to save cumulative stats:', err);
  }
}

export function getStoredAchievements(): Achievement[] {
  if (typeof window === 'undefined') return INITIAL_ACHIEVEMENTS;
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) return INITIAL_ACHIEVEMENTS;
    const stored: Achievement[] = JSON.parse(raw);
    // Merge with INITIAL_ACHIEVEMENTS to ensure all IDs exist
    return INITIAL_ACHIEVEMENTS.map(initial => {
      const found = stored.find(s => s.id === initial.id);
      return found ? { ...initial, ...found } : initial;
    });
  } catch {
    return INITIAL_ACHIEVEMENTS;
  }
}

export function saveAchievements(achievements: Achievement[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achievements));
  } catch (err) {
    console.warn('Failed to save achievements:', err);
  }
}

/**
 * Checks and updates achievements based on game context.
 * Returns newly unlocked achievement notifications.
 */
export function evaluateGameAchievements(context: {
  playerName: string;
  gameMode: string;
  correctAnswers: number;
  totalQuestions: number;
  streak: number;
  records: QuestionAnswerRecord[];
  millionaireStep?: number;
  isWorldCupWinner?: boolean;
  isTimelineSuccess?: boolean;
  connectionsSolvedCount?: number;
}): { newUnlocks: AchievementNotification[]; updatedAchievements: Achievement[] } {
  const currentAchievements = getStoredAchievements();
  const cumulative = getStoredCumulativeStats();
  const newlyUnlocked: AchievementNotification[] = [];

  // Update cumulative stats
  cumulative.totalCorrect += context.correctAnswers;
  cumulative.totalAnswered += context.totalQuestions;
  if (context.streak > cumulative.bestStreakEver) {
    cumulative.bestStreakEver = context.streak;
  }

  // Count topic-specific correct answers in this game
  let gameGenesis = 0;
  let gameExodus = 0;
  let gameProphets = 0;
  const distinctTopics = new Set<string>();

  context.records.forEach(r => {
    if (r.isCorrect) {
      const topic = (r.question.topic || '').trim();
      distinctTopics.add(topic);

      if (topic.includes('בראשית')) {
        gameGenesis++;
        cumulative.genesisCorrect++;
      } else if (topic.includes('שמות')) {
        gameExodus++;
        cumulative.exodusCorrect++;
      } else if (['יהושע', 'שופטים', 'שמואל', 'מלכים'].some(p => topic.includes(p))) {
        gameProphets++;
        cumulative.prophetsCorrect++;
      }
    }
  });

  // Calculate score gained (10 pts per correct, + bonus for streak)
  const scoreGained = (context.correctAnswers * 10) + (context.streak * 5);
  cumulative.totalXp += scoreGained;

  saveCumulativeStats(cumulative);

  // Now evaluate each achievement
  const now = new Date().toISOString();

  const updated = currentAchievements.map(ach => {
    // If already unlocked, keep as is
    if (ach.unlockedAt) return ach;

    let newProgress = ach.progress;
    let shouldUnlock = false;

    switch (ach.id) {
      case 'streak_3':
        newProgress = Math.max(newProgress, context.streak);
        shouldUnlock = context.streak >= 3;
        break;

      case 'streak_7':
        newProgress = Math.max(newProgress, context.streak);
        shouldUnlock = context.streak >= 7;
        break;

      case 'streak_15':
        newProgress = Math.max(newProgress, context.streak);
        shouldUnlock = context.streak >= 15;
        break;

      case 'topic_genesis':
        newProgress = Math.min(ach.maxProgress, cumulative.genesisCorrect);
        shouldUnlock = cumulative.genesisCorrect >= 5;
        break;

      case 'topic_exodus':
        newProgress = Math.min(ach.maxProgress, cumulative.exodusCorrect);
        shouldUnlock = cumulative.exodusCorrect >= 5;
        break;

      case 'topic_prophets':
        newProgress = Math.min(ach.maxProgress, cumulative.prophetsCorrect);
        shouldUnlock = cumulative.prophetsCorrect >= 10;
        break;

      case 'multi_topic':
        newProgress = Math.max(newProgress, distinctTopics.size);
        shouldUnlock = distinctTopics.size >= 4;
        break;

      case 'mode_millionaire':
        if (context.millionaireStep !== undefined) {
          newProgress = Math.max(newProgress, context.millionaireStep);
          shouldUnlock = context.millionaireStep >= 10;
        }
        break;

      case 'mode_world_cup':
        if (context.isWorldCupWinner) {
          newProgress = 1;
          shouldUnlock = true;
        }
        break;

      case 'mode_connections':
        if (context.connectionsSolvedCount !== undefined) {
          newProgress = Math.max(newProgress, context.connectionsSolvedCount);
          shouldUnlock = context.connectionsSolvedCount >= 4;
        }
        break;

      case 'mode_true_false':
        if (context.gameMode === 'true_false') {
          newProgress = Math.max(newProgress, context.correctAnswers);
          shouldUnlock = context.correctAnswers >= 5;
        }
        break;

      case 'mode_timeline':
        if (context.isTimelineSuccess) {
          newProgress = 1;
          shouldUnlock = true;
        }
        break;

      case 'perfect_accuracy':
        if (context.totalQuestions >= 5 && context.correctAnswers === context.totalQuestions) {
          newProgress = 1;
          shouldUnlock = true;
        }
        break;

      case 'scholar_25':
        newProgress = Math.min(ach.maxProgress, cumulative.totalCorrect);
        shouldUnlock = cumulative.totalCorrect >= 25;
        break;

      case 'master_1000':
        newProgress = Math.min(ach.maxProgress, cumulative.totalXp);
        shouldUnlock = cumulative.totalXp >= 1000;
        break;

      default:
        break;
    }

    if (shouldUnlock) {
      newlyUnlocked.push({
        id: ach.id,
        title: ach.title,
        description: ach.description,
        iconName: ach.iconName,
        xpReward: ach.xpReward
      });
      return {
        ...ach,
        progress: ach.maxProgress,
        unlockedAt: now
      };
    }

    return {
      ...ach,
      progress: Math.min(newProgress, ach.maxProgress)
    };
  });

  saveAchievements(updated);

  return {
    newUnlocks: newlyUnlocked,
    updatedAchievements: updated
  };
}

export function resetAchievements() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
  localStorage.removeItem(CUMULATIVE_STATS_KEY);
}
