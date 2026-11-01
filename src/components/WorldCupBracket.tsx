import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Swords, Sparkles, CheckCircle2, XCircle, RotateCcw, ArrowRight } from 'lucide-react';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Question } from '../types/quiz';
import { shuffleArray } from '../services/sheetService';

interface WorldCupBracketProps {
  students: string[];
  questions: Question[];
  onExit: () => void;
  onChampionDeclared?: (championName: string) => void;
}

interface MatchNode {
  id: string;
  round: number; // 0 = Quarters/R1, 1 = Semis, 2 = Final
  player1: string;
  player2: string;
  winner?: string;
  nextMatchId?: string;
  nextMatchSlot?: 1 | 2;
}

export const WorldCupBracket: React.FC<WorldCupBracketProps> = ({
  students,
  questions,
  onExit,
  onChampionDeclared
}) => {
  // Pad or trim students to 8 for a clean tournament tree (Quarterfinals -> Semis -> Final)
  const initialStudents = React.useMemo(() => {
    let list = [...students];
    while (list.length < 8) {
      list.push(`תלמיד ${list.length + 1}`);
    }
    return list.slice(0, 8);
  }, [students]);

  // Initial matches: 4 quarterfinals, 2 semifinals, 1 final
  const [matches, setMatches] = useState<MatchNode[]>(() => {
    return [
      // Round 0: רבע גמר (4 matches)
      { id: 'q1', round: 0, player1: initialStudents[0], player2: initialStudents[1], nextMatchId: 's1', nextMatchSlot: 1 },
      { id: 'q2', round: 0, player1: initialStudents[2], player2: initialStudents[3], nextMatchId: 's1', nextMatchSlot: 2 },
      { id: 'q3', round: 0, player1: initialStudents[4], player2: initialStudents[5], nextMatchId: 's2', nextMatchSlot: 1 },
      { id: 'q4', round: 0, player1: initialStudents[6], player2: initialStudents[7], nextMatchId: 's2', nextMatchSlot: 2 },

      // Round 1: חצי גמר (2 matches)
      { id: 's1', round: 1, player1: '?', player2: '?', nextMatchId: 'final', nextMatchSlot: 1 },
      { id: 's2', round: 1, player1: '?', player2: '?', nextMatchId: 'final', nextMatchSlot: 2 },

      // Round 2: גמר גדול (1 match)
      { id: 'final', round: 2, player1: '?', player2: '?' }
    ];
  });

  const [activeMatch, setActiveMatch] = useState<MatchNode | null>(null);
  const [champion, setChampion] = useState<string | null>(null);

  // Randomly shuffle all tournament questions on mount
  const shuffledTournamentQuestions = useMemo(() => shuffleArray(questions), [questions]);

  // Mini match state for the 2 students currently competing on the projector
  const [miniQuizState, setMiniQuizState] = useState<{
    qIndex: number;
    score1: number;
    score2: number;
    activePlayer: 1 | 2;
  } | null>(null);

  // Start a match from bracket
  const handleLaunchMatch = (match: MatchNode) => {
    if (match.winner || match.player1 === '?' || match.player2 === '?') return;
    setActiveMatch(match);
    setMiniQuizState({
      qIndex: Math.floor(Math.random() * Math.max(1, shuffledTournamentQuestions.length)),
      score1: 0,
      score2: 0,
      activePlayer: 1
    });
  };

  // Declare winner of active match
  const handleSetWinner = (winner: string) => {
    if (!activeMatch) return;

    sound.playFanfare();
    confetti({ particleCount: 80, spread: 70 });

    const updated = matches.map(m => {
      if (m.id === activeMatch.id) {
        return { ...m, winner };
      }
      if (activeMatch.nextMatchId && m.id === activeMatch.nextMatchId) {
        if (activeMatch.nextMatchSlot === 1) {
          return { ...m, player1: winner };
        } else {
          return { ...m, player2: winner };
        }
      }
      return m;
    });

    setMatches(updated);

    if (activeMatch.id === 'final') {
      setChampion(winner);
      sound.playFanfare();
      confetti({ particleCount: 200, spread: 120 });
      if (onChampionDeclared) {
        onChampionDeclared(winner);
      }
    }

    setActiveMatch(null);
    setMiniQuizState(null);
  };

  // Options shuffled for the current active question
  const [activeOptions, setActiveOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<number | null>(null);

  // Prepare shuffled 4 options whenever question changes
  useEffect(() => {
    if (activeMatch && miniQuizState) {
      const q = shuffledTournamentQuestions[miniQuizState.qIndex] || questions[0];
      const raw = [q.correctAnswer, q.option2, q.option3, q.option4].filter(Boolean);
      // Ensure 4 items
      const unique = Array.from(new Set(raw));
      const shuffled = [...unique].sort(() => Math.random() - 0.5);
      setActiveOptions(shuffled);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
    }
  }, [activeMatch, miniQuizState?.qIndex, shuffledTournamentQuestions, questions]);

  // Handle student selecting one of the 4 answers
  const handleSelectOption = (opt: string) => {
    if (isAnswerRevealed || !activeMatch || !miniQuizState) return;

    const q = shuffledTournamentQuestions[miniQuizState.qIndex] || questions[0];
    const isCorrect = opt === q.correctAnswer;
    const activeStudentName = miniQuizState.activePlayer === 1 ? activeMatch.player1 : activeMatch.player2;

    setSelectedOption(opt);
    setIsAnswerRevealed(true);

    if (isCorrect) {
      sound.playCorrect();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      sound.speak(`נכון מאד! נקודה ל${activeStudentName}`);
    } else {
      sound.playWrong();
      sound.speak(`לא נכון! התשובה הנכונה היא ${q.correctAnswer}`);
    }

    // Auto-advance after 2.8 seconds
    const timer = window.setTimeout(() => {
      proceedToNextStep(isCorrect);
    }, 2800);
    setAutoAdvanceTimer(timer);
  };

  const proceedToNextStep = (isCorrect: boolean) => {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }
    if (!activeMatch || !miniQuizState) return;

    const nextScore1 = miniQuizState.activePlayer === 1 && isCorrect ? miniQuizState.score1 + 1 : miniQuizState.score1;
    const nextScore2 = miniQuizState.activePlayer === 2 && isCorrect ? miniQuizState.score2 + 1 : miniQuizState.score2;

    if (nextScore1 >= 2) {
      handleSetWinner(activeMatch.player1);
      return;
    }
    if (nextScore2 >= 2) {
      handleSetWinner(activeMatch.player2);
      return;
    }

    setMiniQuizState({
      score1: nextScore1,
      score2: nextScore2,
      activePlayer: miniQuizState.activePlayer === 1 ? 2 : 1,
      qIndex: (miniQuizState.qIndex + 1) % shuffledTournamentQuestions.length
    });
  };

  // Keyboard shortcut listener for active match (1, 2, 3, 4, Space, Enter)
  useEffect(() => {
    if (!activeMatch || !miniQuizState) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswerRevealed) {
        if (e.key === ' ' || e.key === 'Enter') {
          const q = shuffledTournamentQuestions[miniQuizState.qIndex] || questions[0];
          const isCorrect = selectedOption === q.correctAnswer;
          proceedToNextStep(isCorrect);
        }
        return;
      }

      const keyMap: { [k: string]: number } = {
        '1': 0, '2': 1, '3': 2, '4': 3,
        'א': 0, 'ב': 1, 'ג': 2, 'ד': 3
      };
      if (e.key in keyMap) {
        const idx = keyMap[e.key];
        const opt = activeOptions[idx];
        if (opt) {
          handleSelectOption(opt);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMatch, miniQuizState, isAnswerRevealed, selectedOption, activeOptions, shuffledTournamentQuestions, questions]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 text-slate-100 min-h-[calc(100vh-5rem)] flex flex-col justify-between" dir="rtl">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <h2 className="text-3xl font-black font-heading tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-400 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            <span>מונדיאל תנ"ך הכיתתי</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            טורניר נוק-אאוט חי על הלוח: שאלות אמריקאיות (4 אפשרויות) עם בדיקה והכרזה קולית אוטומטית!
          </p>
        </div>

        <button
          onClick={onExit}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors"
        >
          חזרה להגדרות
        </button>
      </div>

      {/* Champion Celebration Banner if concluded */}
      {champion && (
        <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-amber-400 text-center space-y-3 animate-pulse">
          <Trophy className="w-16 h-16 text-amber-300 mx-auto" />
          <h3 className="text-4xl font-black font-heading text-white">
            האלוף של הכיתה: {champion}!
          </h3>
          <p className="text-sm text-amber-200">
            כל הכבוד על בקיאות מרשימה בתנ"ך וניצחון בכל שלבי הטורניר!
          </p>
        </div>
      )}

      {/* The Visual Tournament Bracket Tree */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-md overflow-x-auto my-auto shadow-2xl">
        <div className="grid grid-cols-3 gap-6 md:gap-12 min-w-[700px] text-center">
          
          {/* Column 1: רבע גמר */}
          <div className="space-y-4">
            <div className="text-sm font-bold text-slate-400 border-b border-slate-800 pb-2">
              רבע גמר (8 מתמודדים)
            </div>
            {matches.filter(m => m.round === 0).map((m, idx) => (
              <div 
                key={m.id}
                className={`p-3 rounded-2xl border transition-all text-right ${
                  m.winner 
                    ? 'bg-slate-950/80 border-slate-800' 
                    : 'bg-slate-900 border-slate-700 hover:border-amber-400 shadow-md'
                }`}
              >
                <div className="text-[11px] text-slate-500 mb-1">קרב {idx + 1}</div>
                <div className="space-y-1">
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center justify-between ${
                    m.winner === m.player1 ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-200'
                  }`}>
                    <span>{m.player1}</span>
                    {m.winner === m.player1 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center justify-between ${
                    m.winner === m.player2 ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-200'
                  }`}>
                    <span>{m.player2}</span>
                    {m.winner === m.player2 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                </div>

                {!m.winner && (
                  <button
                    onClick={() => handleLaunchMatch(m)}
                    className="mt-2 w-full py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>שחק קרב</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Column 2: חצי גמר */}
          <div className="space-y-10 my-auto">
            <div className="text-sm font-bold text-slate-400 border-b border-slate-800 pb-2">
              חצי גמר (4 מתמודדים)
            </div>
            {matches.filter(m => m.round === 1).map((m, idx) => (
              <div 
                key={m.id}
                className={`p-4 rounded-2xl border transition-all text-right ${
                  m.winner 
                    ? 'bg-slate-950/80 border-slate-800' 
                    : m.player1 !== '?' && m.player2 !== '?'
                    ? 'bg-slate-900 border-amber-500/50 shadow-md'
                    : 'bg-slate-950/40 border-slate-800/40 opacity-70'
                }`}
              >
                <div className="text-[11px] text-slate-500 mb-1">חצי גמר {idx + 1}</div>
                <div className="space-y-1">
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center justify-between ${
                    m.winner === m.player1 ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-200'
                  }`}>
                    <span>{m.player1}</span>
                    {m.winner === m.player1 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center justify-between ${
                    m.winner === m.player2 ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-200'
                  }`}>
                    <span>{m.player2}</span>
                    {m.winner === m.player2 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                </div>

                {!m.winner && m.player1 !== '?' && m.player2 !== '?' && (
                  <button
                    onClick={() => handleLaunchMatch(m)}
                    className="mt-2 w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>שחק חצי גמר</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Column 3: גמר גדול */}
          <div className="space-y-6 my-auto">
            <div className="text-sm font-bold text-amber-400 border-b border-slate-800 pb-2 flex items-center justify-center gap-1.5">
              <Trophy className="w-4 h-4" />
              <span>הגמר הגדול</span>
            </div>
            {matches.filter(m => m.round === 2).map(m => (
              <div 
                key={m.id}
                className={`p-5 rounded-2xl border-2 transition-all text-right ${
                  m.winner 
                    ? 'bg-amber-950/40 border-amber-400 shadow-xl shadow-amber-500/10' 
                    : m.player1 !== '?' && m.player2 !== '?'
                    ? 'bg-slate-900 border-amber-500 shadow-xl'
                    : 'bg-slate-950/40 border-slate-800/40 opacity-70'
                }`}
              >
                <div className="text-xs font-bold text-amber-400 mb-2">קרב על התואר</div>
                <div className="space-y-2">
                  <div className={`p-2 rounded-xl text-sm font-bold flex items-center justify-between ${
                    m.winner === m.player1 ? 'bg-amber-400 text-slate-950' : 'bg-slate-950 text-slate-200'
                  }`}>
                    <span>{m.player1}</span>
                    {m.winner === m.player1 && <Trophy className="w-4 h-4 text-slate-950" />}
                  </div>
                  <div className={`p-2 rounded-xl text-sm font-bold flex items-center justify-between ${
                    m.winner === m.player2 ? 'bg-amber-400 text-slate-950' : 'bg-slate-950 text-slate-200'
                  }`}>
                    <span>{m.player2}</span>
                    {m.winner === m.player2 && <Trophy className="w-4 h-4 text-slate-950" />}
                  </div>
                </div>

                {!m.winner && m.player1 !== '?' && m.player2 !== '?' && (
                  <button
                    onClick={() => handleLaunchMatch(m)}
                    className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
                  >
                    <Trophy className="w-4 h-4 fill-slate-950" />
                    <span>שחק את הגמר!</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Head-to-Head 4-Choice American Quiz Arena Modal */}
      {activeMatch && miniQuizState && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 max-w-3xl w-full text-slate-100 shadow-2xl relative" dir="rtl">
            {/* Top Bar with Match Title and Override */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-lg text-white font-heading">
                  קרב: {activeMatch.player1} נגד {activeMatch.player2}
                </span>
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                  הראשון שמגיע ל-2 נקודות מנצח!
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => handleSetWinner(activeMatch.player1)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 font-semibold border border-indigo-500/40"
                  title="הכרזה ידנית של המורה"
                >
                  ניצחון ל{activeMatch.player1}
                </button>
                <button
                  onClick={() => handleSetWinner(activeMatch.player2)}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 font-semibold border border-rose-500/40"
                  title="הכרזה ידנית של המורה"
                >
                  ניצחון ל{activeMatch.player2}
                </button>
              </div>
            </div>

            {/* Score & Active Player Banner */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-around mb-5 text-center shadow-inner">
              <div className={`p-2 rounded-xl transition-all ${miniQuizState.activePlayer === 1 ? 'bg-indigo-950/80 border border-indigo-500/60 ring-2 ring-indigo-500/30' : 'opacity-70'}`}>
                <div className="text-xs text-indigo-300 font-medium">{activeMatch.player1}</div>
                <div className="text-3xl font-black text-indigo-400 font-mono">{miniQuizState.score1} / 2</div>
              </div>

              <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 text-amber-300 font-black text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span>תור: {miniQuizState.activePlayer === 1 ? activeMatch.player1 : activeMatch.player2}</span>
              </div>

              <div className={`p-2 rounded-xl transition-all ${miniQuizState.activePlayer === 2 ? 'bg-rose-950/80 border border-rose-500/60 ring-2 ring-rose-500/30' : 'opacity-70'}`}>
                <div className="text-xs text-rose-300 font-medium">{activeMatch.player2}</div>
                <div className="text-3xl font-black text-rose-400 font-mono">{miniQuizState.score2} / 2</div>
              </div>
            </div>

            {/* Question card */}
            {(() => {
              const q = shuffledTournamentQuestions[miniQuizState.qIndex] || questions[0];
              const letters = ['א', 'ב', 'ג', 'ד'];

              return (
                <div className="space-y-4">
                  <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 text-center relative">
                    <div className="text-xs text-slate-400 mb-1 font-heading">
                      {q.topic} · {q.source}
                    </div>
                    <h3 className="text-xl md:text-2xl font-extrabold text-white leading-relaxed font-heading">
                      {q.question}
                    </h3>
                  </div>

                  {/* 4 Large American Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeOptions.map((opt, i) => {
                      const isSelected = selectedOption === opt;
                      const isCorrect = opt === q.correctAnswer;

                      let btnStyle = 'bg-slate-950 border-slate-700/80 hover:border-amber-400 hover:bg-slate-800/80 text-slate-100';
                      let badge = null;

                      if (isAnswerRevealed) {
                        if (isSelected && isCorrect) {
                          btnStyle = 'bg-emerald-600/30 border-emerald-400 text-emerald-100 ring-4 ring-emerald-400/50 shadow-xl shadow-emerald-500/30 scale-[1.01]';
                          badge = <span className="text-[11px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full">✓ צדקת!</span>;
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'bg-rose-600/30 border-rose-500 text-rose-200 ring-4 ring-rose-500/50 shadow-xl shadow-rose-500/30';
                          badge = <span className="text-[11px] bg-rose-500 text-white font-black px-2 py-0.5 rounded-full">✗ טעות</span>;
                        } else if (!isSelected && isCorrect) {
                          btnStyle = 'bg-emerald-600/25 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/50';
                          badge = <span className="text-[11px] bg-emerald-400 text-slate-950 font-black px-2 py-0.5 rounded-full">✓ התשובה הנכונה</span>;
                        } else {
                          btnStyle = 'opacity-35 bg-slate-950 border-slate-800 text-slate-500';
                        }
                      }

                      return (
                        <button
                          key={i}
                          disabled={isAnswerRevealed}
                          onClick={() => handleSelectOption(opt)}
                          className={`p-4 rounded-xl border text-right transition-all flex items-center justify-between group active:scale-[0.98] ${btnStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 group-hover:bg-amber-400 group-hover:text-slate-950 font-bold flex items-center justify-center text-xs font-heading transition-colors shrink-0">
                              {letters[i]}
                            </div>
                            <span className="text-base md:text-lg font-bold">{opt}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {badge}
                            <span className="text-[10px] font-mono text-slate-500">[{i + 1}]</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Immediate automatic feedback & countdown bar */}
                  {isAnswerRevealed && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                      <div className="text-sm font-bold flex items-center justify-center gap-2">
                        {selectedOption === q.correctAnswer ? (
                          <span className="text-emerald-400 flex items-center gap-1.5 text-base">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <span>צדקת! תשובה נכונה (+1 נקודה ל{miniQuizState.activePlayer === 1 ? activeMatch.player1 : activeMatch.player2})</span>
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1.5 text-base">
                            <XCircle className="w-5 h-5 text-rose-400" />
                            <span>לא נכון! התשובה הנכונה היא: {q.correctAnswer}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-center gap-3 pt-2">
                        <span className="text-xs text-slate-400">מעבר אוטומטי לשאלה הבאה...</span>
                        <button
                          onClick={() => proceedToNextStep(selectedOption === q.correctAnswer)}
                          className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-heading transition-colors shadow-sm"
                        >
                          המשך מיד (רווח / Enter)
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="text-center text-[11px] text-slate-500 pt-1">
                    מקשי מקלדת לבחירה מהירה: 1, 2, 3, 4
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
