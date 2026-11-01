import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Question, GameSettings } from '../types/quiz';
import { 
  Heart, Flame, Trophy, Clock, ArrowRight, RotateCcw, 
  Sparkles, CheckCircle, XCircle, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { sound } from '../utils/audio';
import { 
  getSurvivalHighScores, 
  saveSurvivalRecord, 
  calculateSurvivalMultiplier, 
  calculatePointsForAnswer,
  SurvivalRecord 
} from '../services/survivalService';

interface SurvivalMarathonGameProps {
  questions: Question[];
  settings: GameSettings;
  onExit: () => void;
}

export const SurvivalMarathonGame: React.FC<SurvivalMarathonGameProps> = ({
  questions,
  settings,
  onExit
}) => {
  // Filter questions according to selected topics and difficulties if set
  const pool = useMemo(() => {
    let filtered = questions;
    if (settings.selectedTopics && !settings.selectedTopics.includes('כל הנושאים')) {
      filtered = filtered.filter(q => settings.selectedTopics.includes(q.topic));
    }
    if (settings.selectedDifficulties && settings.selectedDifficulties.length > 0) {
      filtered = filtered.filter(q => settings.selectedDifficulties.includes(q.difficulty));
    }
    // Shuffle the pool
    return [...filtered].sort(() => Math.random() - 0.5);
  }, [questions, settings]);

  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [totalCorrect, setTotalCorrect] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [savedRecord, setSavedRecord] = useState<SurvivalRecord | null>(null);

  // Current question preparation
  const currentQuestion = pool[questionIndex % pool.length];
  const shuffledOptions = useMemo(() => {
    if (!currentQuestion) return [];
    const opts = [
      currentQuestion.correctAnswer,
      currentQuestion.option2,
      currentQuestion.option3,
      currentQuestion.option4
    ].filter(Boolean);
    return [...opts].sort(() => Math.random() - 0.5);
  }, [currentQuestion]);

  // Dynamic timer calculation: starts at 20s, lowers as streak grows
  const roundTimeLimit = useMemo(() => {
    if (streak >= 15) return 12;
    if (streak >= 10) return 15;
    if (streak >= 5) return 18;
    return 20;
  }, [streak]);

  const [timeLeft, setTimeLeft] = useState<number>(roundTimeLimit);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState<boolean>(false);
  const [missedQuestions, setMissedQuestions] = useState<{ question: Question; chosen: string }[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset timer on new question
  useEffect(() => {
    if (isGameOver || isAnswerLocked) return;

    setTimeLeft(roundTimeLimit);
    setSelectedAnswer(null);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [questionIndex, isGameOver, roundTimeLimit, isAnswerLocked]);

  // Handle timeout as a strike
  const handleTimeExpired = () => {
    if (isAnswerLocked || isGameOver) return;
    setIsAnswerLocked(true);
    sound.playWrong();

    setLives(prevLives => {
      const newLives = prevLives - 1;
      setMissedQuestions(prev => [
        ...prev,
        { question: currentQuestion, chosen: 'פג הזמן' }
      ]);
      setStreak(0);

      if (newLives <= 0) {
        endGame(score, maxStreak, totalCorrect);
      } else {
        setTimeout(() => {
          advanceToNextQuestion();
        }, 1800);
      }
      return newLives;
    });
  };

  const handleSelectAnswer = (option: string) => {
    if (isAnswerLocked || isGameOver) return;
    setIsAnswerLocked(true);
    setSelectedAnswer(option);

    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = option === currentQuestion.correctAnswer;

    if (isCorrect) {
      sound.playCorrect();
      const points = calculatePointsForAnswer(timeLeft, roundTimeLimit, streak);
      const newStreak = streak + 1;
      const newTotalCorrect = totalCorrect + 1;
      const newMaxStreak = Math.max(maxStreak, newStreak);

      setScore(prev => prev + points);
      setStreak(newStreak);
      setMaxStreak(newMaxStreak);
      setTotalCorrect(newTotalCorrect);

      setTimeout(() => {
        advanceToNextQuestion();
      }, 1200);
    } else {
      sound.playWrong();
      const newStreak = 0;
      setStreak(newStreak);

      setMissedQuestions(prev => [
        ...prev,
        { question: currentQuestion, chosen: option }
      ]);

      setLives(prevLives => {
        const newLives = prevLives - 1;
        if (newLives <= 0) {
          endGame(score, maxStreak, totalCorrect);
        } else {
          setTimeout(() => {
            advanceToNextQuestion();
          }, 1800);
        }
        return newLives;
      });
    }
  };

  const advanceToNextQuestion = () => {
    setIsAnswerLocked(false);
    setSelectedAnswer(null);
    setQuestionIndex(prev => prev + 1);
  };

  const endGame = (finalScore: number, finalMaxStreak: number, finalCorrect: number) => {
    setIsGameOver(true);
    sound.playTada();
    const record = saveSurvivalRecord({
      playerName: settings.player1Name || 'מתמודד הישרדות',
      score: finalScore,
      maxStreak: finalMaxStreak,
      totalCorrect: finalCorrect
    });
    setSavedRecord(record);
  };

  const handleRestart = () => {
    setQuestionIndex(0);
    setLives(3);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setTotalCorrect(0);
    setIsGameOver(false);
    setSelectedAnswer(null);
    setIsAnswerLocked(false);
    setMissedQuestions([]);
    setSavedRecord(null);
  };

  const highScores = useMemo(() => getSurvivalHighScores(), [isGameOver]);
  const multiplier = calculateSurvivalMultiplier(streak);

  if (isGameOver) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl border border-amber-200 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-8 py-8 text-white text-center">
            <Trophy className="w-16 h-16 mx-auto mb-3 text-amber-200 animate-bounce" />
            <h1 className="text-3xl font-bold mb-1">סיום מרתון הישרדות!</h1>
            <p className="text-amber-100 text-sm">
              הפגנת שליטה מרשימה בפסוקי התנ"ך, שורד תנכ"י אמיתי!
            </p>
          </div>

          {/* Stats Grid */}
          <div className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-center">
                <span className="text-xs text-amber-800 font-medium block mb-1">ניקוד סופי</span>
                <span className="text-3xl font-extrabold text-amber-900 font-mono tabular-nums">
                  {score.toLocaleString()}
                </span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <span className="text-xs text-emerald-800 font-medium block mb-1">תשובות נכונות</span>
                <span className="text-3xl font-extrabold text-emerald-900 font-mono tabular-nums">
                  {totalCorrect}
                </span>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                <span className="text-xs text-orange-800 font-medium block mb-1">רצף שיא</span>
                <span className="text-3xl font-extrabold text-orange-900 font-mono tabular-nums flex items-center justify-center gap-1">
                  <Flame className="w-6 h-6 text-orange-500 fill-orange-400" />
                  {maxStreak}
                </span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <span className="text-xs text-blue-800 font-medium block mb-1">מכפיל מקסימלי</span>
                <span className="text-3xl font-extrabold text-blue-900 font-mono tabular-nums">
                  x{calculateSurvivalMultiplier(maxStreak).toFixed(1)}
                </span>
              </div>
            </div>

            {/* Top Scores Leaderboard */}
            <div className="mb-8 bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                טבלת אלופי ההישרדות
              </h3>
              <div className="space-y-2">
                {highScores.slice(0, 5).map((rec, idx) => (
                  <div 
                    key={rec.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-sm transition-all ${
                      savedRecord?.id === rec.id 
                        ? 'bg-amber-100/90 border border-amber-300 font-semibold' 
                        : 'bg-white border border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-amber-500 text-white' :
                        idx === 1 ? 'bg-slate-300 text-slate-700' :
                        idx === 2 ? 'bg-amber-700 text-white' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-slate-800">{rec.playerName}</span>
                      <span className="text-xs text-slate-400 font-mono">({rec.date})</span>
                    </div>
                    <div className="flex items-center gap-4 font-mono tabular-nums">
                      <span className="text-xs text-orange-600">רצף {rec.maxStreak}</span>
                      <span className="text-sm font-bold text-slate-900">{rec.score} נק'</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning review of missed questions */}
            {missedQuestions.length > 0 && (
              <div className="mb-8">
                <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  למידה וחזרה על שאלות שנפסלו
                </h3>
                <div className="space-y-3">
                  {missedQuestions.map(({ question, chosen }, idx) => (
                    <div key={idx} className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-4 text-sm">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="font-semibold text-slate-900">{question.question}</span>
                        <span className="text-xs text-slate-500 shrink-0 font-medium">({question.source})</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mb-2">
                        <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-100/80 px-2.5 py-1.5 rounded-md">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                          <span>תשובה נכונה: <strong>{question.correctAnswer}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-red-800 bg-red-100/80 px-2.5 py-1.5 rounded-md">
                          <XCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                          <span>התשובה שנענתה: {chosen}</span>
                        </div>
                      </div>
                      {question.quote && (
                        <p className="text-xs text-slate-600 bg-white/70 p-2 rounded border border-amber-100 italic">
                          "{question.quote}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-slate-200">
              <button
                onClick={handleRestart}
                className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                שחק שוב מרתון
              </button>
              <button
                onClick={onExit}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-5 h-5" />
                חזרה לתפריט הראשי
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6" dir="rtl">
      {/* Top Marathon HUD */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 md:p-5 shadow-lg mb-6 border border-slate-800">
        <div className="flex items-center justify-between gap-4">
          {/* Lives Indicator */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((heartIndex) => {
              const isAlive = heartIndex <= lives;
              return (
                <div 
                  key={heartIndex} 
                  className={`transition-transform duration-300 ${isAlive ? 'scale-100' : 'scale-90 opacity-30'}`}
                >
                  <Heart 
                    className={`w-7 h-7 ${
                      isAlive 
                        ? 'text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                        : 'text-slate-500 fill-transparent'
                    }`} 
                  />
                </div>
              );
            })}
            <span className="text-xs text-slate-300 font-medium mr-1 hidden sm:inline">
              פסילות ({lives}/3)
            </span>
          </div>

          {/* Streak & Multiplier */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-bold transition-all ${
              streak >= 5 
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 animate-pulse' 
                : 'bg-slate-800 text-slate-300'
            }`}>
              <Flame className={`w-4 h-4 ${streak > 0 ? 'text-orange-400 fill-orange-400' : 'text-slate-500'}`} />
              <span className="font-mono tabular-nums">רצף {streak}</span>
            </div>
            {multiplier > 1.0 && (
              <span className="bg-amber-400 text-slate-950 text-xs font-black px-2 py-1 rounded shadow-sm">
                x{multiplier.toFixed(1)}
              </span>
            )}
          </div>

          {/* Score */}
          <div className="text-left font-mono tabular-nums">
            <div className="text-xs text-slate-400">ניקוד</div>
            <div className="text-xl md:text-2xl font-black text-amber-400">
              {score.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Dynamic Timer Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              זמן לשאלה: {timeLeft} שניות
            </span>
            <span className="text-xs text-slate-400">
              שאלה #{questionIndex + 1} · {currentQuestion?.topic || 'תנ"ך'}
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${
                timeLeft <= 4 
                  ? 'bg-red-500 animate-pulse' 
                  : timeLeft <= 8 
                  ? 'bg-amber-500' 
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${(timeLeft / roundTimeLimit) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      {currentQuestion ? (
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-slate-500">
              {currentQuestion.difficulty} · {currentQuestion.source}
            </span>
            <button
              onClick={onExit}
              className="text-xs text-slate-400 hover:text-slate-700 underline transition-colors"
            >
              יציאה
            </button>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 leading-relaxed">
            {currentQuestion.question}
          </h2>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3 mb-6">
            {shuffledOptions.map((opt, idx) => {
              const isSelected = selectedAnswer === opt;
              const isCorrectAnswer = opt === currentQuestion.correctAnswer;
              
              let btnStyle = 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300';
              if (isAnswerLocked) {
                if (isCorrectAnswer) {
                  btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-2 ring-emerald-500/30';
                } else if (isSelected) {
                  btnStyle = 'bg-red-50 border-red-500 text-red-900 ring-2 ring-red-500/30';
                } else {
                  btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(opt)}
                  disabled={isAnswerLocked}
                  className={`w-full p-4 rounded-xl border text-right text-base font-medium transition-all flex items-center justify-between ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {isAnswerLocked && isCorrectAnswer && (
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  {isAnswerLocked && isSelected && !isCorrectAnswer && (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Source Quote on feedback */}
          {isAnswerLocked && currentQuestion.quote && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed">
              <span className="font-semibold block mb-0.5">פסוק המקור ({currentQuestion.source}):</span>
              "{currentQuestion.quote}"
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          לא נמצאו שאלות זמינות עבור הסינון הנבחר.
        </div>
      )}
    </div>
  );
};
