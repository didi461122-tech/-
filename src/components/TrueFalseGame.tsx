import React, { useState, useEffect } from 'react';
import { DEFAULT_TRUE_FALSE, TrueFalseQuestion, shuffleArray } from '../services/sheetService';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Check, X, RotateCcw, ArrowRight, ArrowLeft, Trophy, BookOpen, Clock } from 'lucide-react';

interface TrueFalseGameProps {
  onExit: () => void;
  onGameOver?: (score: number, maxStreak: number) => void;
}

export const TrueFalseGame: React.FC<TrueFalseGameProps> = ({ onExit, onGameOver }) => {
  const [statements, setStatements] = useState<TrueFalseQuestion[]>(() => shuffleArray([...DEFAULT_TRUE_FALSE]));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(15);
  const [feedback, setFeedback] = useState<{
    answered: boolean;
    userSaidTrue: boolean;
    isCorrect: boolean;
  } | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);

  const currentQ = statements[currentIndex];

  // Timer
  useEffect(() => {
    if (isGameOver || feedback) return;

    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAnswer(null); // Time out
          return 0;
        }
        if (prev <= 4) sound.playTick();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIndex, isGameOver, feedback]);

  const handleAnswer = (userChoice: boolean | null) => {
    if (feedback || isGameOver) return;

    const isCorrect = userChoice === currentQ.isTrue;

    if (isCorrect) {
      sound.playCorrect();
      setScore(prev => prev + 1);
      setStreak(prev => {
        const next = prev + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
    } else {
      sound.playWrong();
      setStreak(0);
    }

    setFeedback({
      answered: true,
      userSaidTrue: !!userChoice,
      isCorrect
    });
  };

  const handleNext = () => {
    setFeedback(null);
    if (currentIndex + 1 >= statements.length) {
      setIsGameOver(true);
      sound.playFanfare();
      confetti({ particleCount: 100, spread: 80 });
      if (onGameOver) {
        onGameOver(score, maxStreak);
      }
    } else {
      setCurrentIndex(prev => prev + 1);
      setTimerSeconds(15);
    }
  };

  // Keyboard navigation: ArrowRight = True, ArrowLeft = False
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (feedback) {
        if (e.key === ' ' || e.key === 'Enter') {
          handleNext();
        }
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'נ') {
        handleAnswer(true);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ל') {
        handleAnswer(false);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [feedback, currentQ]);

  const handleRestart = () => {
    setStatements(shuffleArray([...DEFAULT_TRUE_FALSE]));
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setTimerSeconds(15);
    setFeedback(null);
    setIsGameOver(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-slate-100 min-h-[calc(100vh-5rem)] flex flex-col justify-between" dir="rtl">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-3xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400">
              נכון או לא נכון (קצב מהיר)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              היגד תנכ"י מופיע על המסך: הכריעו נכון או לא נכון נגד השעון!
            </p>
          </div>

          <button
            onClick={onExit}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            חזרה להגדרות
          </button>
        </div>

        {/* Score & Timer Header Bar */}
        <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-4 rounded-2xl mb-8">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[11px] text-slate-400">היגד:</div>
              <div className="text-lg font-black font-mono text-white">
                {currentIndex + 1} / {statements.length}
              </div>
            </div>
            <div className="border-r border-slate-800 pr-4">
              <div className="text-[11px] text-slate-400">ניקוד:</div>
              <div className="text-lg font-black font-mono text-amber-400">
                {score}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className={`text-xl font-black font-mono ${timerSeconds <= 4 ? 'text-red-400 animate-pulse' : 'text-purple-300'}`}>
              {timerSeconds} שניות
            </span>
          </div>
        </div>

        {!isGameOver ? (
          /* Statement Card */
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-purple-500/40 rounded-3xl p-8 md:p-12 text-center shadow-2xl space-y-8 my-auto relative">
            <div className="text-xs text-purple-400 font-bold tracking-wider">היגד לתלמידים</div>
            
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-relaxed font-heading">
              "{currentQ.statement}"
            </h3>

            {/* Answer Buttons */}
            {!feedback ? (
              <div className="grid grid-cols-2 gap-4 pt-4">
                {/* Right: נכון */}
                <button
                  onClick={() => handleAnswer(true)}
                  className="py-5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xl font-heading shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-6 h-6 stroke-[3]" />
                  <span>נכון (חץ ימין)</span>
                </button>

                {/* Left: לא נכון */}
                <button
                  onClick={() => handleAnswer(false)}
                  className="py-5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xl font-heading shadow-xl shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-6 h-6 stroke-[3]" />
                  <span>לא נכון (חץ שמאל)</span>
                </button>
              </div>
            ) : (
              /* Immediate feedback explanation */
              <div className={`p-6 rounded-2xl border text-right space-y-3 ${
                feedback.isCorrect ? 'bg-emerald-950/60 border-emerald-500' : 'bg-rose-950/60 border-rose-500'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-black font-heading ${feedback.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {feedback.isCorrect ? 'נכון מאוד!' : 'תשובה שגויה!'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">המקור: {currentQ.source}</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-serif">
                  {currentQ.explanation}
                </p>
                <div className="pt-2 text-center">
                  <button
                    autoFocus
                    onClick={handleNext}
                    className="px-6 py-2 rounded-xl bg-white text-slate-950 font-bold font-heading hover:bg-slate-200 transition-colors text-sm"
                  >
                    להיגד הבא (רווח / Enter)
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Game Over Summary */
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-8 text-center space-y-6 my-auto shadow-2xl">
            <Trophy className="w-16 h-16 text-amber-400 mx-auto" />
            <h3 className="text-3xl font-black font-heading text-white">סיכום המשחק!</h3>
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="text-xs text-slate-400">תשובות נכונות:</div>
                <div className="text-2xl font-black text-emerald-400 font-mono">{score} / {statements.length}</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="text-xs text-slate-400">אחוז הצלחה:</div>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {Math.round((score / statements.length) * 100)}%
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={handleRestart}
                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold font-heading transition-colors"
              >
                שחק שוב
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-800">
        ניתן להשתמש בחצי המקלדת (ימין = נכון, שמאל = לא נכון) לשליטה מהירה
      </div>
    </div>
  );
};
