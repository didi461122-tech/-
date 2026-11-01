import React, { useState } from 'react';
import { GameSettings, QuestionAnswerRecord } from '../types/quiz';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Trophy, RotateCcw, Sliders, Eye, CheckCircle2, 
  XCircle, Clock, BookOpen, Quote, X, Award, Sparkles 
} from 'lucide-react';

interface EndGameScreenProps {
  stats: {
    winnerName: string;
    player1Correct: number;
    player2Correct: number;
    player1Total: number;
    player2Total: number;
    records: QuestionAnswerRecord[];
    durationSeconds: number;
    millionairePrize?: string;
  };
  settings: GameSettings;
  onPlayAgain: () => void;
  onChangeSettings: () => void;
  onOpenLeaderboard: () => void;
}

export const EndGameScreen: React.FC<EndGameScreenProps> = ({
  stats,
  settings,
  onPlayAgain,
  onChangeSettings,
  onOpenLeaderboard
}) => {
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Play fanfare on mount
  React.useEffect(() => {
    sound.playFanfare();
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 }
    });
  }, []);

  const totalAnswered = stats.player1Total + stats.player2Total;
  const totalCorrect = stats.player1Correct + stats.player2Correct;
  const accuracyPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 100;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isSurvivor = settings.mode === 'head_to_head' && settings.headToHeadSubType === 'survivor';
  const isHeadToHead = settings.mode === 'head_to_head';
  const maxScore = Math.max(stats.player1Correct, stats.player2Correct, 1);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 text-slate-100 space-y-8" dir="rtl">
      {/* Grand Victory Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/30 animate-bounce">
          <Trophy className="w-12 h-12" />
        </div>

        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-amber-400">
            סיום המשחק
          </span>
          <h1 className="text-4xl md:text-5xl font-black font-heading text-white tracking-tight mt-1">
            {stats.millionairePrize ? (
              <span>זכיתם ב-{stats.millionairePrize}!</span>
            ) : isHeadToHead ? (
              <span>המנצח: {stats.winnerName}!</span>
            ) : (
              <span>כל הכבוד, {stats.winnerName}!</span>
            )}
          </h1>
          <p className="text-slate-300 text-base md:text-lg mt-2">
            הפגנתם ידע מעמיק ובקיאות בספרי התנ"ך!
          </p>
        </div>
      </div>

      {/* Survivor Mode Comparison Animated Bars */}
      {isHeadToHead && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          <h3 className="text-lg font-bold font-heading text-slate-200 text-center">
            {isSurvivor ? 'השוואת רצף התשובות (מצב שורד)' : 'תוצאות הקרב ראש בראש'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Player 1 Bar */}
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-indigo-500/30 text-right space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-400 text-base">{settings.player1Name}</span>
                <span className="text-2xl font-black font-mono text-white">{stats.player1Correct} תשובות</span>
              </div>
              <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(stats.player1Correct / maxScore) * 100}%` }}
                />
              </div>
              <div className="text-xs text-slate-500">
                מתוך {stats.player1Total} שאלות ({stats.player1Total > 0 ? Math.round((stats.player1Correct / stats.player1Total) * 100) : 0}% דיוק)
              </div>
            </div>

            {/* Player 2 Bar */}
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-rose-500/30 text-right space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-400 text-base">{settings.player2Name}</span>
                <span className="text-2xl font-black font-mono text-white">{stats.player2Correct} תשובות</span>
              </div>
              <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(stats.player2Correct / maxScore) * 100}%` }}
                />
              </div>
              <div className="text-xs text-slate-500">
                מתוך {stats.player2Total} שאלות ({stats.player2Total > 0 ? Math.round((stats.player2Correct / stats.player2Total) * 100) : 0}% דיוק)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* General Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-center shadow-lg">
          <div className="text-xs text-slate-400 mb-1">תשובות נכונות</div>
          <div className="text-2xl md:text-3xl font-black font-mono text-emerald-400">
            {totalCorrect}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-center shadow-lg">
          <div className="text-xs text-slate-400 mb-1">סה"כ נשאלו</div>
          <div className="text-2xl md:text-3xl font-black font-mono text-slate-100">
            {totalAnswered}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-center shadow-lg">
          <div className="text-xs text-slate-400 mb-1">אחוז דיוק</div>
          <div className="text-2xl md:text-3xl font-black font-mono text-amber-400">
            {accuracyPct}%
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-center shadow-lg">
          <div className="text-xs text-slate-400 mb-1">זמן משחק כולל</div>
          <div className="text-2xl md:text-3xl font-black font-mono text-cyan-400 flex items-center justify-center gap-1">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span>{formatDuration(stats.durationSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <button
          onClick={() => {
            sound.playClick();
            onPlayAgain();
          }}
          className="py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-lg font-heading shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>משחק חדש (באותן הגדרות)</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onOpenLeaderboard();
          }}
          className="py-4 px-6 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-base font-heading transition-colors flex items-center gap-2"
        >
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>לוח מובילים והישגים</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onChangeSettings();
          }}
          className="py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-base font-heading transition-colors flex items-center gap-2"
        >
          <Sliders className="w-5 h-5" />
          <span>שנה הגדרות</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setShowReviewModal(true);
          }}
          className="py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-base font-heading transition-colors flex items-center gap-2"
        >
          <Eye className="w-5 h-5" />
          <span>צפה בתשובות ובפסוקים ({stats.records.length})</span>
        </button>
      </div>

      {/* Review Modal with all questions and quotes */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl p-6 text-slate-100" dir="rtl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-xl font-bold font-heading text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span>סיכום השאלות והפסוקים מהמשחק</span>
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 py-4 pr-1">
              {stats.records.length === 0 ? (
                <div className="text-center text-slate-400 py-8 text-sm">
                  לא נרשמו תשובות במשחק זה
                </div>
              ) : (
                stats.records.map((r, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-2xl border text-right space-y-2 ${
                      r.isCorrect
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-rose-950/20 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {r.isCorrect ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>תשובה נכונה</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-400 font-bold">
                            <XCircle className="w-4 h-4" />
                            <span>שגיאה</span>
                          </span>
                        )}
                        <span className="text-slate-400 font-medium">ענה: {r.answeredBy}</span>
                      </div>
                      <span className="text-slate-400">{r.question.topic} · {r.question.source}</span>
                    </div>

                    <div className="font-bold text-base text-white font-heading">
                      {i + 1}. {r.question.question}
                    </div>

                    <div className="text-xs text-slate-300">
                      תשובה נכונה: <span className="font-semibold text-emerald-300">{r.question.correctAnswer}</span>
                    </div>

                    {r.question.quote && (
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs">
                        <div className="text-slate-400 mb-1 flex items-center gap-1 text-[11px]">
                          <Quote className="w-3 h-3 text-amber-400" />
                          <span>ציטוט מהפסוק ({r.question.source}):</span>
                        </div>
                        <div className="text-amber-200 font-tanach italic text-sm">
                          "{r.question.quote}"
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 text-center">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
