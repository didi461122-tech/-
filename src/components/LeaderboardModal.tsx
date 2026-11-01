import React, { useState, useMemo } from 'react';
import { LeaderboardEntry, Achievement, AchievementCategory } from '../types/achievements';
import { 
  Trophy, Medal, Flame, Zap, Crown, BookMarked, Scroll, Shield, 
  Compass, Gem, Layers, Sparkles, Clock, Target, Award, Star, 
  Search, RotateCcw, X, CheckCircle2, Lock, ArrowUpDown, Users 
} from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderboard: LeaderboardEntry[];
  achievements: Achievement[];
  onResetLeaderboard: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Flame: <Flame className="w-5 h-5 text-amber-400" />,
  Zap: <Zap className="w-5 h-5 text-amber-400" />,
  Crown: <Crown className="w-5 h-5 text-yellow-300" />,
  BookMarked: <BookMarked className="w-5 h-5 text-blue-400" />,
  Scroll: <Scroll className="w-5 h-5 text-amber-300" />,
  Shield: <Shield className="w-5 h-5 text-emerald-400" />,
  Compass: <Compass className="w-5 h-5 text-cyan-400" />,
  Gem: <Gem className="w-5 h-5 text-purple-400" />,
  Trophy: <Trophy className="w-5 h-5 text-amber-400" />,
  Layers: <Layers className="w-5 h-5 text-cyan-400" />,
  Sparkles: <Sparkles className="w-5 h-5 text-pink-400" />,
  Clock: <Clock className="w-5 h-5 text-amber-300" />,
  Target: <Target className="w-5 h-5 text-emerald-400" />,
  Award: <Award className="w-5 h-5 text-amber-400" />,
  Star: <Star className="w-5 h-5 text-yellow-300" />
};

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  leaderboard,
  achievements,
  onResetLeaderboard
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'achievements'>('leaderboard');
  const [sortBy, setSortBy] = useState<'score' | 'streak' | 'achievements'>('score');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Filtered and sorted leaderboard
  const processedLeaderboard = useMemo(() => {
    let list = [...leaderboard];
    if (searchQuery.trim()) {
      list = list.filter(e => e.playerName.toLowerCase().includes(searchQuery.trim().toLowerCase()));
    }

    list.sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'streak') return b.bestStreak - a.bestStreak;
      if (sortBy === 'achievements') return b.achievementsUnlocked - a.achievementsUnlocked;
      return 0;
    });

    return list;
  }, [leaderboard, searchQuery, sortBy]);

  // Filtered achievements
  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'all') return achievements;
    return achievements.filter(a => a.category === selectedCategory);
  }, [achievements, selectedCategory]);

  const unlockedCount = achievements.filter(a => !!a.unlockedAt).length;
  const totalXp = achievements.filter(a => !!a.unlockedAt).reduce((sum, a) => sum + a.xpReward, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] text-slate-100 overflow-hidden relative"
        dir="rtl"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white flex items-center gap-2">
                <span>לוח המובילים והיכל ההישגים</span>
              </h2>
              <p className="text-xs text-slate-400">
                מעקב הישגים ודירוג כיתתי לתלמידי הישיבה
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="סגור"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 sm:px-6 shrink-0">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`py-3.5 px-4 font-bold text-sm font-heading transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'leaderboard'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>דירוג אלופי הכיתה</span>
            <span className="text-[11px] font-mono bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">
              {leaderboard.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('achievements')}
            className={`py-3.5 px-4 font-bold text-sm font-heading transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'achievements'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>היכל ההישגים והתגים</span>
            <span className="text-[11px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
              {unlockedCount}/{achievements.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'leaderboard' ? (
            /* TAB 1: LEADERBOARD */
            <div className="space-y-6">
              {/* Podium: Top 3 Players */}
              {processedLeaderboard.length >= 3 && !searchQuery && (
                <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 pb-2 items-end max-w-2xl mx-auto text-center">
                  {/* 2nd Place: Silver */}
                  <div className="bg-slate-950/80 border border-slate-700/80 rounded-2xl p-3 sm:p-4 flex flex-col items-center order-1 h-36 justify-between">
                    <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-950 font-black text-sm flex items-center justify-center shadow-md">
                      2
                    </div>
                    <div className="font-bold text-slate-200 text-xs sm:text-sm truncate w-full">
                      {processedLeaderboard[1].playerName}
                    </div>
                    <div className="text-base sm:text-lg font-black font-mono text-slate-300">
                      {processedLeaderboard[1].score} נק'
                    </div>
                    <div className="text-[10px] text-slate-400">
                      רצף: {processedLeaderboard[1].bestStreak} 🔥
                    </div>
                  </div>

                  {/* 1st Place: Gold */}
                  <div className="bg-gradient-to-b from-amber-950/80 to-slate-950 border-2 border-amber-400 rounded-2xl p-3 sm:p-5 flex flex-col items-center order-2 h-44 justify-between shadow-xl shadow-amber-500/20 relative">
                    <div className="absolute -top-3.5 bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                      <Crown className="w-3 h-3" />
                      <span>אלוף הכיתה</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 text-slate-950 font-black text-base flex items-center justify-center shadow-lg">
                      1
                    </div>
                    <div className="font-black text-white text-sm sm:text-base truncate w-full">
                      {processedLeaderboard[0].playerName}
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                      {processedLeaderboard[0].score} נק'
                    </div>
                    <div className="text-[11px] text-amber-200 font-medium">
                      רצף שיא: {processedLeaderboard[0].bestStreak} 🔥
                    </div>
                  </div>

                  {/* 3rd Place: Bronze */}
                  <div className="bg-slate-950/80 border border-amber-900/60 rounded-2xl p-3 sm:p-4 flex flex-col items-center order-3 h-32 justify-between">
                    <div className="w-8 h-8 rounded-full bg-amber-700 text-amber-100 font-black text-sm flex items-center justify-center shadow-md">
                      3
                    </div>
                    <div className="font-bold text-slate-300 text-xs sm:text-sm truncate w-full">
                      {processedLeaderboard[2].playerName}
                    </div>
                    <div className="text-sm sm:text-base font-black font-mono text-amber-600">
                      {processedLeaderboard[2].score} נק'
                    </div>
                    <div className="text-[10px] text-slate-400">
                      רצף: {processedLeaderboard[2].bestStreak} 🔥
                    </div>
                  </div>
                </div>
              )}

              {/* Controls bar: Search & Sorting */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="חיפוש שם תלמיד..."
                    className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Sort buttons */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 ml-1">מיין לפי:</span>
                  <button
                    onClick={() => setSortBy('score')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      sortBy === 'score'
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    ניקוד
                  </button>
                  <button
                    onClick={() => setSortBy('streak')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      sortBy === 'streak'
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    רצף שיא
                  </button>
                  <button
                    onClick={() => setSortBy('achievements')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      sortBy === 'achievements'
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    תגים
                  </button>
                </div>
              </div>

              {/* Full Leaderboard Table */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                        <th className="py-3 px-4 font-semibold text-center w-14">מקום</th>
                        <th className="py-3 px-4 font-semibold">שם התלמיד</th>
                        <th className="py-3 px-4 font-semibold text-center">ניקוד מצטבר</th>
                        <th className="py-3 px-4 font-semibold text-center">רצף שיא</th>
                        <th className="py-3 px-4 font-semibold text-center">משחקים/ניצחונות</th>
                        <th className="py-3 px-4 font-semibold text-center">הישגים</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {processedLeaderboard.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            לא נמצאו תלמידים התואמים את החיפוש
                          </td>
                        </tr>
                      ) : (
                        processedLeaderboard.map((entry, idx) => (
                          <tr
                            key={entry.id}
                            className={`hover:bg-slate-900/50 transition-colors ${
                              idx === 0
                                ? 'bg-amber-500/5 font-semibold'
                                : idx % 2 === 0
                                ? 'bg-slate-950'
                                : 'bg-slate-900/20'
                            }`}
                          >
                            <td className="py-3.5 px-4 text-center">
                              {idx === 0 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs">
                                  1
                                </span>
                              ) : idx === 1 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black text-xs">
                                  2
                                </span>
                              ) : idx === 2 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-amber-100 font-black text-xs">
                                  3
                                </span>
                              ) : (
                                <span className="font-mono text-slate-400">{idx + 1}</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 font-bold text-slate-200 text-sm">
                              {entry.playerName}
                              {entry.favoriteTopic && (
                                <span className="text-[10px] text-slate-500 font-normal mr-2">
                                  (מוביל ב{entry.favoriteTopic})
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-center font-black font-mono text-amber-400 tabular-nums text-sm">
                              {entry.score}
                            </td>

                            <td className="py-3.5 px-4 text-center font-mono text-slate-300 tabular-nums">
                              {entry.bestStreak} 🔥
                            </td>

                            <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                              {entry.quizzesWon} / {entry.quizzesPlayed}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-mono">
                                <Award className="w-3 h-3" />
                                <span>{entry.achievementsUnlocked}</span>
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reset Leaderboard Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                <span>נתוני הדירוג נשמרים מקומית במחשב המורה לאורך כל שנת הלימודים.</span>
                
                {!showConfirmReset ? (
                  <button
                    onClick={() => setShowConfirmReset(true)}
                    className="text-slate-400 hover:text-red-400 underline decoration-slate-700 transition-colors"
                  >
                    איפוס לוח הניקוד הכיתתי
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">לאפס את כל הנתונים?</span>
                    <button
                      onClick={() => {
                        onResetLeaderboard();
                        setShowConfirmReset(false);
                      }}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-bold"
                    >
                      כן, אפס
                    </button>
                    <button
                      onClick={() => setShowConfirmReset(false)}
                      className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded"
                    >
                      ביטול
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: ACHIEVEMENTS SHOWCASE */
            <div className="space-y-6">
              {/* Summary Stats Header Card */}
              <div className="bg-gradient-to-r from-amber-950/60 via-slate-950 to-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>התקדמות כללית בהיכל ההישגים</span>
                  </div>
                  <div className="text-2xl font-black font-heading text-white">
                    {unlockedCount} מתוך {achievements.length} תגים נפתחו ({Math.round((unlockedCount / achievements.length) * 100)}%)
                  </div>
                  <div className="w-64 bg-slate-800 h-2.5 rounded-full overflow-hidden mt-2">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full rounded-full transition-all duration-700"
                      style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-center min-w-[100px]">
                    <div className="text-[11px] text-slate-400">נקודות הישגים</div>
                    <div className="text-xl font-black font-mono text-amber-400">+{totalXp}</div>
                  </div>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'כל התגים' },
                  { id: 'streak', label: 'רצפי תשובות' },
                  { id: 'topic', label: 'שליטה בספרים' },
                  { id: 'game_mode', label: 'מצבי משחק' },
                  { id: 'mastery', label: 'מומחיות ודיוק' },
                  { id: 'score', label: 'צבירת ניקוד' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Achievements Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAchievements.map(ach => {
                  const isUnlocked = !!ach.unlockedAt;

                  return (
                    <div
                      key={ach.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isUnlocked
                          ? 'bg-gradient-to-b from-amber-950/30 to-slate-900 border-amber-400/60 shadow-lg shadow-amber-500/5'
                          : 'bg-slate-950/70 border-slate-800/80 opacity-75'
                      }`}
                    >
                      <div>
                        {/* Top card row */}
                        <div className="flex items-center justify-between mb-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isUnlocked
                              ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                              : 'bg-slate-800/60 text-slate-500'
                          }`}>
                            {ICON_MAP[ach.iconName] || <Award className="w-5 h-5" />}
                          </div>

                          <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            isUnlocked
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            +{ach.xpReward} נק'
                          </span>
                        </div>

                        {/* Title & Description */}
                        <h4 className={`text-base font-bold font-heading mb-1 ${
                          isUnlocked ? 'text-white' : 'text-slate-300'
                        }`}>
                          {ach.title}
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed mb-3">
                          {ach.description}
                        </p>
                      </div>

                      {/* Progress / Status */}
                      <div className="pt-2 border-t border-slate-800/60">
                        {isUnlocked ? (
                          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>נפתח בהצלחה!</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {ach.unlockedAt ? new Date(ach.unlockedAt).toLocaleDateString('he-IL') : ''}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                <span>נעול</span>
                              </span>
                              <span className="font-mono">
                                {ach.progress} / {ach.maxProgress}
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-500 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, (ach.progress / ach.maxProgress) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
