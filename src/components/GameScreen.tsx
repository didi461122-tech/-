import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Question, GameSettings, QuestionAnswerRecord, LifelineState } from '../types/quiz';
import { shuffleArray } from '../services/sheetService';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Clock, Pause, Play, Users, Sparkles, AlertTriangle, 
  HelpCircle, CheckCircle2, XCircle, BookOpen, Quote, 
  ChevronRight, ArrowLeftRight, Award, Shield, Coins, Trophy, Music
} from 'lucide-react';

interface GameScreenProps {
  settings: GameSettings;
  questions: Question[];
  onGameOver: (
    stats: {
      winnerName: string;
      player1Correct: number;
      player2Correct: number;
      player1Total: number;
      player2Total: number;
      records: QuestionAnswerRecord[];
      durationSeconds: number;
      millionairePrize?: string;
    }
  ) => void;
}

// 15 Millionaire Prize steps (₪)
const MILLIONAIRE_LADDER = [
  '500 ₪', '1,000 ₪', '2,000 ₪', '3,000 ₪', '5,000 ₪',     // Safe level 1: 5,000 ₪
  '10,000 ₪', '20,000 ₪', '40,000 ₪', '80,000 ₪', '100,000 ₪', // Safe level 2: 100,000 ₪
  '150,000 ₪', '250,000 ₪', '500,000 ₪', '750,000 ₪', '1,000,000 ₪' // Top: 1 Million ₪
];

export const GameScreen: React.FC<GameScreenProps> = ({
  settings,
  questions,
  onGameOver
}) => {
  // Pool of questions filtered by topics and difficulties
  const filteredQuestions = useMemo(() => {
    let pool = questions;
    if (!settings.selectedTopics.includes('כל הנושאים')) {
      pool = pool.filter(q => settings.selectedTopics.includes(q.topic));
    }
    if (settings.mode !== 'millionaire') {
      pool = pool.filter(q => settings.selectedDifficulties.includes(q.difficulty));
    }
    // Fallback if empty
    return pool.length > 0 ? pool : questions;
  }, [questions, settings.selectedTopics, settings.selectedDifficulties, settings.mode]);

  // For millionaire: arrange by difficulty (1-5 easy, 6-10 medium, 11-15 hard) with full randomization
  // For other modes: completely shuffle and randomize questions so order is never predictable
  const gameQuestionsList = useMemo(() => {
    if (settings.mode === 'millionaire') {
      const easy = shuffleArray(questions.filter(q => q.difficulty === 'קל'));
      const med = shuffleArray(questions.filter(q => q.difficulty === 'בינוני'));
      const hard = shuffleArray(questions.filter(q => q.difficulty === 'קשה'));
      
      const res: Question[] = [];
      // Pick 5 random easy questions
      res.push(...easy.slice(0, 5));
      const remainingShuffled = shuffleArray(questions.filter(q => !res.some(r => r.id === q.id)));
      while (res.length < 5 && remainingShuffled.length > 0) {
        res.push(remainingShuffled.pop()!);
      }

      // Pick 5 random medium questions
      res.push(...med.slice(0, 5));
      while (res.length < 10 && remainingShuffled.length > 0) {
        res.push(remainingShuffled.pop()!);
      }

      // Pick 5 random hard questions
      res.push(...hard.slice(0, 5));
      while (res.length < 15 && remainingShuffled.length > 0) {
        res.push(remainingShuffled.pop()!);
      }
      return res;
    }

    // Single Player and Head to Head: thoroughly randomize the pool of filtered questions!
    return shuffleArray(filteredQuestions);
  }, [settings.mode, questions, filteredQuestions]);

  // Game state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const [disabledOptions, setDisabledOptions] = useState<string[]>([]);
  
  // Players state
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [player1Attempts, setPlayer1Attempts] = useState(0);
  const [player2Attempts, setPlayer2Attempts] = useState(0);
  const [records, setRecords] = useState<QuestionAnswerRecord[]>([]);

  // Survivor specific state
  const [survivorPhase, setSurvivorPhase] = useState<'p1_turn' | 'p1_done_transition' | 'p2_turn'>('p1_turn');
  const [p1SurvivorScore, setP1SurvivorScore] = useState(0);

  // Millionaire Lifelines
  const [lifelines, setLifelines] = useState<LifelineState>({
    fiftyFifty: true,
    audience: true,
    changeQuestion: true
  });
  const [audiencePollData, setAudiencePollData] = useState<{ [opt: string]: number } | null>(null);
  const [showLadderModal, setShowLadderModal] = useState(false);
  const [showWalkAwayConfirm, setShowWalkAwayConfirm] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(sound.isMillionaireMusicPlaying());
  const [lockedAnswer, setLockedAnswer] = useState<string | null>(null);
  const [isSuspenseRevealing, setIsSuspenseRevealing] = useState<boolean>(false);
  const [revealedSelection, setRevealedSelection] = useState<string | null>(null);
  const [isAnswerEvaluated, setIsAnswerEvaluated] = useState<boolean>(false);

  // Millionaire Theme Music Lifecycle
  useEffect(() => {
    if (settings.mode === 'millionaire') {
      sound.playMillionaireTheme(true);
      setIsMusicPlaying(sound.isMillionaireMusicPlaying());
    }

    const unsub = sound.subscribeMusic((playing) => {
      setIsMusicPlaying(playing);
    });

    return () => {
      unsub();
      if (settings.mode === 'millionaire') {
        sound.stopMillionaireTheme();
        sound.stopMillionaireSuspense();
      }
    };
  }, [settings.mode]);

  // Walk away with current accumulated prize (פרישה מהמשחק)
  const handleWalkAway = () => {
    if (currentIndex === 0) return;
    sound.stopMillionaireTheme();
    const prizeWon = MILLIONAIRE_LADDER[currentIndex - 1];
    sound.playFanfare();
    confetti({ particleCount: 120, spread: 80 });
    finishGame(activeName, records, prizeWon);
  };

  // Timer
  const [timeLeft, setTimeLeft] = useState<number>(settings.timerSeconds || 20);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStartTime] = useState(Date.now());

  // Intermediate feedback screen
  const [feedback, setFeedback] = useState<{
    show: boolean;
    isCorrect: boolean;
    answeredBy: string;
    isPassToOtherPlayer?: boolean;
    nextPlayerName?: string;
  } | null>(null);

  const currentQuestion = gameQuestionsList[currentIndex] || questions[0];

  // Prepare shuffled answers for the question
  const prepareQuestionAnswers = useCallback((q: Question) => {
    if (!q) return;
    const raw = [q.correctAnswer, q.option2, q.option3, q.option4].filter(Boolean);
    // Shuffle
    const shuffled = [...raw].sort(() => Math.random() - 0.5);
    setShuffledAnswers(shuffled);
    setDisabledOptions([]);
    setAudiencePollData(null);
    setRevealedSelection(null);
    setIsAnswerEvaluated(false);
    setTimeLeft(settings.timerSeconds || 20);
  }, [settings.timerSeconds]);

  // Initial question setup
  useEffect(() => {
    prepareQuestionAnswers(currentQuestion);
  }, [currentIndex, currentQuestion, prepareQuestionAnswers]);

  // Timer countdown hook
  useEffect(() => {
    if (settings.timerSeconds === 0 || isPaused || (feedback && feedback.show)) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Time ran out -> trigger timeout as wrong answer
          handleTimeout();
          return 0;
        }
        if (prev <= 5) {
          sound.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [settings.timerSeconds, isPaused, feedback]);

  const handleTimeout = () => {
    handleAnswerSelect('__TIMEOUT__');
  };

  // Main Answer Handler
  const handleAnswerSelect = (selectedAnswer: string) => {
    if (feedback?.show || isSuspenseRevealing) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const activeName = activePlayer === 1 ? settings.player1Name : settings.player2Name;

    // --- Millionaire Mode: Authentic Dramatic Suspense Sequence ---
    if (settings.mode === 'millionaire' && selectedAnswer !== '__TIMEOUT__') {
      setLockedAnswer(selectedAnswer);
      setIsSuspenseRevealing(true);
      sound.playMillionaireSuspense();

      // 3.0 seconds of heart-pounding TV tension before the reveal!
      setTimeout(() => {
        sound.stopMillionaireSuspense();
        setIsSuspenseRevealing(false);
        setLockedAnswer(null);
        setRevealedSelection(selectedAnswer);
        setIsAnswerEvaluated(true);

        // Record attempt & scores
        setPlayer1Attempts(prev => prev + 1);
        if (isCorrect) setPlayer1Score(prev => prev + 1);

        const record: QuestionAnswerRecord = {
          question: currentQuestion,
          answeredBy: activeName,
          selectedAnswer,
          isCorrect,
          timeSpentSeconds: settings.timerSeconds ? settings.timerSeconds - timeLeft : 0
        };
        const nextRecords = [...records, record];
        setRecords(nextRecords);

        if (isCorrect) {
          sound.playMillionaireCorrect();
          sound.speak("נכון מאד! תשובה נכונה!");
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.7 }
          });
          setFeedback({
            show: true,
            isCorrect: true,
            answeredBy: activeName
          });

          if (currentIndex === 14) {
            // Won 1,000,000 ₪ !
            sound.stopMillionaireTheme();
            sound.playFanfare();
            confetti({ particleCount: 200, spread: 100 });
            setTimeout(() => {
              finishGame(activeName, nextRecords, '1,000,000 ₪');
            }, 3500);
          }
        } else {
          sound.playMillionaireWrong();
          sound.speak(`לא נכון! התשובה הנכונה הייתה ${currentQuestion.correctAnswer}`);
          setFeedback({
            show: true,
            isCorrect: false,
            answeredBy: activeName
          });
          const currentPrize = currentIndex >= 10 ? '100,000 ₪ (רשת ביטחון)' :
                               currentIndex >= 5 ? '5,000 ₪ (רשת ביטחון)' : '0 ₪';
          setTimeout(() => {
            finishGame(activeName, nextRecords, currentPrize);
          }, 3500);
        }
      }, 3000);
      return;
    }

    // --- Regular Instant Handling for Other Game Modes ---
    setRevealedSelection(selectedAnswer);
    setIsAnswerEvaluated(true);

    // Track attempt
    if (activePlayer === 1) {
      setPlayer1Attempts(prev => prev + 1);
      if (isCorrect) setPlayer1Score(prev => prev + 1);
    } else {
      setPlayer2Attempts(prev => prev + 1);
      if (isCorrect) setPlayer2Score(prev => prev + 1);
    }

    const record: QuestionAnswerRecord = {
      question: currentQuestion,
      answeredBy: activeName,
      selectedAnswer,
      isCorrect,
      timeSpentSeconds: settings.timerSeconds ? settings.timerSeconds - timeLeft : 0
    };
    const nextRecords = [...records, record];
    setRecords(nextRecords);

    // Audio & Confetti & Voice announcement
    if (isCorrect) {
      sound.playCorrect();
      sound.speak("נכון מאד! צדקת!");
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
    } else {
      sound.playWrong();
      if (settings.mode === 'head_to_head' && settings.headToHeadSubType === 'ping_pong') {
        const otherPlayerNum = activePlayer === 1 ? 2 : 1;
        const otherPlayerName = otherPlayerNum === 1 ? settings.player1Name : settings.player2Name;
        sound.speak(`טעות! השאלה עוברת אל ${otherPlayerName}`);
      } else {
        sound.speak(`לא נכון! התשובה הנכונה היא ${currentQuestion.correctAnswer}`);
      }
    }

    // Handle game mode specific rules
    if (settings.mode === 'single') {
      if (isCorrect) {
        setFeedback({
          show: true,
          isCorrect: true,
          answeredBy: activeName
        });
      } else {
        // Single player ends on mistake
        setFeedback({
          show: true,
          isCorrect: false,
          answeredBy: activeName
        });
      }
    } 
    else if (settings.mode === 'head_to_head') {
      if (settings.headToHeadSubType === 'ping_pong') {
        if (isCorrect) {
          const updatedScore = activePlayer === 1 ? player1Score + 1 : player2Score + 1;
          setFeedback({
            show: true,
            isCorrect: true,
            answeredBy: activeName
          });
          // Check target score win
          if (updatedScore >= settings.targetScore) {
            // Player reached target!
            setTimeout(() => {
              finishGame(activeName, nextRecords);
            }, 2500);
            return;
          }
        } else {
          // In Ping Pong: Wrong answer passes question to the OTHER player without revealing answer!
          const otherPlayerNum = activePlayer === 1 ? 2 : 1;
          const otherPlayerName = otherPlayerNum === 1 ? settings.player1Name : settings.player2Name;
          setFeedback({
            show: true,
            isCorrect: false,
            answeredBy: activeName,
            isPassToOtherPlayer: true,
            nextPlayerName: otherPlayerName
          });
        }
      } 
      else if (settings.headToHeadSubType === 'survivor') {
        if (isCorrect) {
          setFeedback({
            show: true,
            isCorrect: true,
            answeredBy: activeName
          });
        } else {
          // Survivor error
          if (activePlayer === 1) {
            setP1SurvivorScore(player1Score);
            setSurvivorPhase('p1_done_transition');
            setFeedback({
              show: true,
              isCorrect: false,
              answeredBy: activeName,
              nextPlayerName: settings.player2Name
            });
          } else {
            // Player 2 also finished -> game over!
            setFeedback({
              show: true,
              isCorrect: false,
              answeredBy: activeName
            });
            setTimeout(() => {
              const winner = player1Score > (player2Score) ? settings.player1Name : 
                             player2Score > player1Score ? settings.player2Name : 'תיקו מרשים!';
              finishGame(winner, nextRecords);
            }, 3000);
            return;
          }
        }
      }
    }
  };

  // Continue to next question or switch turn
  const handleProceedAfterFeedback = () => {
    if (!feedback) return;
    sound.playClick();

    const wasPass = feedback.isPassToOtherPlayer;
    const isCorrect = feedback.isCorrect;

    setFeedback(null);
    setRevealedSelection(null);
    setIsAnswerEvaluated(false);

    if (settings.mode === 'single') {
      if (isCorrect) {
        // Next question
        setCurrentIndex(prev => (prev + 1) % gameQuestionsList.length);
      } else {
        // Game Over
        finishGame(settings.player1Name, records);
      }
    } 
    else if (settings.mode === 'head_to_head') {
      if (settings.headToHeadSubType === 'ping_pong') {
        if (wasPass) {
          // Switch to other player on the SAME question
          setActivePlayer(prev => (prev === 1 ? 2 : 1));
          setTimeLeft(settings.timerSeconds || 20);
        } else {
          // Was correct, move to next question and keep turn or alternate
          setActivePlayer(prev => (prev === 1 ? 2 : 1));
          setCurrentIndex(prev => (prev + 1) % gameQuestionsList.length);
        }
      } 
      else if (settings.headToHeadSubType === 'survivor') {
        if (isCorrect) {
          setCurrentIndex(prev => (prev + 1) % gameQuestionsList.length);
        } else {
          if (survivorPhase === 'p1_done_transition') {
            // Start Player 2's turn
            setActivePlayer(2);
            setSurvivorPhase('p2_turn');
            setCurrentIndex(0); // or next questions
            setTimeLeft(settings.timerSeconds || 20);
          }
        }
      }
    } 
    else if (settings.mode === 'millionaire') {
      if (isCorrect) {
        setCurrentIndex(prev => prev + 1);
        if (isMusicPlaying) {
          sound.playMillionaireTheme(true);
        }
      }
    }
  };

  // Auto-advance timer when feedback is shown
  useEffect(() => {
    if (!feedback?.show) return;

    // Millionaire final win or loss handled separately
    if (settings.mode === 'millionaire' && (!feedback.isCorrect || currentIndex === 14)) {
      return;
    }

    // Ping pong win handled separately
    if (settings.mode === 'head_to_head' && settings.headToHeadSubType === 'ping_pong' && feedback.isCorrect) {
      const curPts = activePlayer === 1 ? player1Score : player2Score;
      if (curPts >= settings.targetScore) return;
    }

    const timer = setTimeout(() => {
      handleProceedAfterFeedback();
    }, 2800);

    return () => clearTimeout(timer);
  }, [feedback, currentIndex, settings.mode, settings.headToHeadSubType, settings.targetScore, activePlayer, player1Score, player2Score]);

  const finishGame = (winnerName: string, finalRecords: QuestionAnswerRecord[], prize?: string) => {
    sound.stopMillionaireTheme();
    sound.stopMillionaireSuspense();
    sound.playFanfare();
    const duration = Math.round((Date.now() - gameStartTime) / 1000);
    onGameOver({
      winnerName,
      player1Correct: player1Score,
      player2Correct: player2Score,
      player1Total: player1Attempts,
      player2Total: player2Attempts,
      records: finalRecords,
      durationSeconds: duration,
      millionairePrize: prize
    });
  };

  // --- Lifelines for Millionaire ---
  const useFiftyFifty = () => {
    if (!lifelines.fiftyFifty) return;
    sound.playLifeline();
    setLifelines(prev => ({ ...prev, fiftyFifty: false }));
    const wrong = shuffledAnswers.filter(a => a !== currentQuestion.correctAnswer);
    const toDisable = wrong.slice(0, 2);
    setDisabledOptions(toDisable);
  };

  const useAudience = () => {
    if (!lifelines.audience) return;
    sound.playLifeline();
    setLifelines(prev => ({ ...prev, audience: false }));

    // Generate realistic simulated class poll: correct answer gets highest vote
    const isEasy = currentQuestion.difficulty === 'קל';
    const isHard = currentQuestion.difficulty === 'קשה';

    const correctPct = isEasy ? 72 : isHard ? 44 : 58;
    const remaining = 100 - correctPct;
    const wrongOpts = shuffledAnswers.filter(a => a !== currentQuestion.correctAnswer);

    const poll: { [k: string]: number } = {};
    poll[currentQuestion.correctAnswer] = correctPct;

    let rem = remaining;
    wrongOpts.forEach((opt, idx) => {
      if (idx === wrongOpts.length - 1) {
        poll[opt] = rem;
      } else {
        const val = Math.floor(Math.random() * (rem / 1.5));
        poll[opt] = val;
        rem -= val;
      }
    });

    setAudiencePollData(poll);
  };

  const useChangeQuestion = () => {
    if (!lifelines.changeQuestion) return;
    sound.playLifeline();
    setLifelines(prev => ({ ...prev, changeQuestion: false }));
    // Swap to another question of same difficulty
    const alternates = questions.filter(
      q => q.id !== currentQuestion.id && q.difficulty === currentQuestion.difficulty
    );
    if (alternates.length > 0) {
      const randomAlt = alternates[Math.floor(Math.random() * alternates.length)];
      prepareQuestionAnswers(randomAlt);
    }
  };

  // Keyboard shortcut listener (1, 2, 3, 4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (feedback?.show) {
        if (e.key === ' ' || e.key === 'Enter') {
          handleProceedAfterFeedback();
        }
        return;
      }

      if (e.key === 'p' || e.key === 'P' || e.key === 'פ') {
        setIsPaused(prev => !prev);
        return;
      }

      const keyMap: { [k: string]: number } = {
        '1': 0, '2': 1, '3': 2, '4': 3,
        'א': 0, 'ב': 1, 'ג': 2, 'ד': 3
      };
      if (e.key in keyMap) {
        const idx = keyMap[e.key];
        const opt = shuffledAnswers[idx];
        if (opt && !disabledOptions.includes(opt)) {
          handleAnswerSelect(opt);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feedback, shuffledAnswers, disabledOptions, isPaused]);

  // Color helper for timer circle
  const getTimerColor = () => {
    if (settings.timerSeconds === 0) return 'text-amber-400';
    const ratio = timeLeft / settings.timerSeconds;
    if (ratio > 0.45) return 'text-emerald-400';
    if (ratio > 0.2) return 'text-amber-400';
    return 'text-rose-500 animate-pulse';
  };

  const activeName = activePlayer === 1 ? settings.player1Name : settings.player2Name;

  // Millionaire Ladder Component Renderer (used in side column and mobile modal)
  const renderLadderContent = (isModal: boolean = false) => {
    const currentPlayPrize = MILLIONAIRE_LADDER[currentIndex] || '1,000,000 ₪';
    const accumulatedPrize = currentIndex > 0 ? MILLIONAIRE_LADDER[currentIndex - 1] : '0 ₪';
    const guaranteedPrize = currentIndex >= 10 ? '100,000 ₪' : currentIndex >= 5 ? '5,000 ₪' : '0 ₪';

    return (
      <div className={`flex flex-col ${isModal ? '' : 'bg-slate-900/95 border border-amber-500/30 rounded-3xl p-4 md:p-5 shadow-2xl backdrop-blur-md'}`}>
        {/* Header */}
        <div className="border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="font-heading font-black text-amber-400 text-sm md:text-base">סולם הפרסים</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const playing = sound.toggleMillionaireMusic();
                  setIsMusicPlaying(playing);
                }}
                className={`p-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
                  isMusicPlaying
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title={isMusicPlaying ? 'השתק את מנגינת התוכנית' : 'הפעל את מנגינת התוכנית המקורית'}
              >
                <Music className={`w-3.5 h-3.5 ${isMusicPlaying ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              </button>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                שאלה {currentIndex + 1}/15
              </span>
            </div>
          </div>
        </div>

        {/* Current prize amounts banner */}
        <div className="bg-gradient-to-br from-amber-950/70 via-slate-950 to-slate-950 p-3 rounded-2xl border border-amber-500/40 mb-3 space-y-1.5 shadow-inner">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">משחקים עכשיו על:</span>
            <span className="font-black text-amber-400 text-base font-mono drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
              {currentPlayPrize}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1.5 border-t border-slate-800/80">
            <span className="text-slate-400">סכום שנצבר עד כה:</span>
            <span className="font-bold text-amber-300 font-mono">{accumulatedPrize}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span className="text-slate-400 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>רשת ביטחון מובטחת:</span>
            </span>
            <span className="font-bold text-emerald-400 font-mono">{guaranteedPrize}</span>
          </div>
        </div>

        {/* 15 Ladder steps (15 down to 1) */}
        <div className="space-y-1 overflow-y-auto max-h-[380px] lg:max-h-[460px] pr-1 scrollbar-thin">
          {[...MILLIONAIRE_LADDER].reverse().map((prize, revIndex) => {
            const stepIndex = 14 - revIndex;
            const isCurrent = stepIndex === currentIndex;
            const isSafe = stepIndex === 4 || stepIndex === 9 || stepIndex === 14;
            const isPast = stepIndex < currentIndex;

            return (
              <div
                key={stepIndex}
                className={`px-3 py-1.5 rounded-xl flex items-center justify-between text-xs font-mono transition-all duration-300 ${
                  isCurrent
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-[1.02] ring-2 ring-amber-300'
                    : isPast
                    ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-500/20'
                    : isSafe
                    ? 'text-amber-300 font-black bg-amber-950/40 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-950/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-5 text-center font-bold ${isCurrent ? 'text-slate-950' : isSafe ? 'text-amber-400' : 'text-slate-500'}`}>
                    {stepIndex + 1}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] animate-pulse">◀</span>
                  )}
                  {isPast && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                  {isSafe && !isPast && !isCurrent && (
                    <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tracking-wide">{prize}</span>
                  {stepIndex === 14 && (
                    <span className="text-[11px]" title="הפרס הגדול">👑</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Walk away button */}
        {currentIndex > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => {
                if (isModal) setShowLadderModal(false);
                setShowWalkAwayConfirm(true);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>לפרוש עכשיו עם {MILLIONAIRE_LADDER[currentIndex - 1]}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // Reusable Question Card Component
  const renderQuestionCard = () => (
    <div className="bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-700/80 rounded-3xl p-6 md:p-10 shadow-2xl relative">
      {/* Topic & Difficulty metadata */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-300 font-bold font-heading">{currentQuestion.topic}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-slate-400">{currentQuestion.source}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
            currentQuestion.difficulty === 'קל'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : currentQuestion.difficulty === 'בינוני'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
          }`}>
            {currentQuestion.difficulty}
          </span>
        </div>
      </div>

      {/* Big Question Text */}
      <div className="my-6 md:my-8 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-relaxed md:leading-snug font-heading text-balance">
          {currentQuestion.question}
        </h2>
      </div>

      {/* 4 Large Answer Buttons (2x2 Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {shuffledAnswers.map((opt, index) => {
          const letters = ['א', 'ב', 'ג', 'ד'];
          const isDisabled = disabledOptions.includes(opt) || isSuspenseRevealing || isAnswerEvaluated;
          const isLocked = lockedAnswer === opt;
          const isSelected = revealedSelection === opt;
          const isCorrectOpt = opt === currentQuestion.correctAnswer;
          const isPingPongPass = feedback?.isPassToOtherPlayer;

          let btnClass = 'bg-slate-950/80 border-slate-700/80 hover:border-amber-400 hover:bg-slate-800/90 shadow-md hover:shadow-amber-500/10 text-slate-100';
          let letterClass = 'bg-slate-800 group-hover:bg-amber-400 group-hover:text-slate-950 text-slate-300';
          let badge = null;

          if (isLocked) {
            btnClass = 'bg-amber-500/25 border-amber-400 text-amber-200 ring-4 ring-amber-400/50 shadow-2xl shadow-amber-500/40 scale-[1.02] animate-pulse';
            letterClass = 'bg-amber-400 text-slate-950 shadow-lg ring-2 ring-amber-300';
            badge = (
              <span className="text-[11px] bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                תשובה סופית...
              </span>
            );
          } else if (isAnswerEvaluated) {
            if (isSelected && isCorrectOpt) {
              btnClass = 'bg-emerald-600/30 border-emerald-400 text-emerald-100 ring-4 ring-emerald-400/50 shadow-2xl shadow-emerald-500/40 scale-[1.02]';
              letterClass = 'bg-emerald-400 text-slate-950 font-black';
              badge = (
                <span className="text-xs bg-emerald-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                  ✓ צדקת! תשובה נכונה
                </span>
              );
            } else if (isSelected && !isCorrectOpt) {
              btnClass = 'bg-rose-600/30 border-rose-500 text-rose-200 ring-4 ring-rose-500/50 shadow-xl shadow-rose-500/30';
              letterClass = 'bg-rose-500 text-white font-black';
              badge = (
                <span className="text-xs bg-rose-500 text-white font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                  ✗ שגוי
                </span>
              );
            } else if (!isSelected && isCorrectOpt && !isPingPongPass) {
              btnClass = 'bg-emerald-600/20 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/50 shadow-md shadow-emerald-500/20';
              letterClass = 'bg-emerald-400 text-slate-950 font-black';
              badge = (
                <span className="text-xs bg-emerald-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                  ✓ זו התשובה הנכונה
                </span>
              );
            } else {
              btnClass = 'opacity-30 bg-slate-950 border-slate-800 text-slate-500';
              letterClass = 'bg-slate-900 text-slate-600';
            }
          } else if (isDisabled) {
            btnClass = 'opacity-20 border-slate-800 bg-slate-950 cursor-not-allowed';
          }

          return (
            <button
              key={index}
              disabled={isDisabled && !isLocked}
              onClick={() => handleAnswerSelect(opt)}
              className={`p-4 md:p-5 rounded-2xl border text-right transition-all flex items-center justify-between group active:scale-[0.98] ${btnClass}`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-sm font-heading transition-colors shrink-0 ${letterClass}`}>
                  {letters[index]}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg md:text-xl font-bold transition-colors ${
                    isLocked ? 'text-amber-300 drop-shadow' : 'text-slate-100 group-hover:text-amber-300'
                  }`}>
                    {opt}
                  </span>
                  {badge}
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-500 group-hover:text-slate-400 opacity-60">
                [{index + 1}]
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`${settings.mode === 'millionaire' ? 'max-w-7xl' : 'max-w-5xl'} mx-auto px-4 py-4 md:py-6 flex flex-col min-h-[calc(100vh-5rem)] justify-between`} dir="rtl">
      {/* Top Bar: Player identity, score banner & Timer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl backdrop-blur-md mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Active Player Glow Banner */}
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-10 rounded-full transition-all ${
              activePlayer === 1 ? 'bg-indigo-500 shadow-md shadow-indigo-500/50' : 'bg-rose-500 shadow-md shadow-rose-500/50'
            }`} />
            <div>
              <div className="text-xs text-slate-400 font-medium">תור המתמודד:</div>
              <div className="text-2xl font-black font-heading tracking-tight text-white flex items-center gap-2">
                <span>{activeName}</span>
                {settings.mode === 'head_to_head' && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    activePlayer === 1 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {activePlayer === 1 ? 'שחקן 1' : 'שחקן 2'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Scores / Metrics in Center */}
          <div className="flex items-center gap-4 text-center">
            {settings.mode === 'single' && (
              <div className="bg-slate-950/70 border border-slate-800 px-4 py-2 rounded-xl">
                <div className="text-xs text-slate-400">רצף תשובות נכונות:</div>
                <div className="text-xl font-black text-amber-400 font-heading">
                  {player1Score} נכונות
                </div>
              </div>
            )}

            {settings.mode === 'head_to_head' && (
              <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 p-2 rounded-xl">
                <div className={`px-3 py-1.5 rounded-lg text-right transition-all ${
                  activePlayer === 1 ? 'bg-indigo-950 border border-indigo-500/80 text-white font-bold' : 'text-slate-400'
                }`}>
                  <div className="text-[11px] truncate max-w-[90px]">{settings.player1Name}</div>
                  <div className="text-lg font-black font-mono text-indigo-400">{player1Score}</div>
                </div>

                <div className="text-slate-600 font-bold px-1">:</div>

                <div className={`px-3 py-1.5 rounded-lg text-right transition-all ${
                  activePlayer === 2 ? 'bg-rose-950 border border-rose-500/80 text-white font-bold' : 'text-slate-400'
                }`}>
                  <div className="text-[11px] truncate max-w-[90px]">{settings.player2Name}</div>
                  <div className="text-lg font-black font-mono text-rose-400">{player2Score}</div>
                </div>
              </div>
            )}

            {settings.mode === 'millionaire' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const playing = sound.toggleMillionaireMusic();
                    setIsMusicPlaying(playing);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                    isMusicPlaying
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title={isMusicPlaying ? 'השתק את מנגינת התוכנית' : 'הפעל את מנגינת התוכנית המקורית'}
                >
                  <Music className={`w-4 h-4 ${isMusicPlaying ? 'animate-bounce text-amber-400' : 'text-slate-400'}`} />
                  <span className="hidden sm:inline">{isMusicPlaying ? 'מנגינת התוכנית' : 'מנגינה כבויה'}</span>
                </button>

                <button
                  onClick={() => setShowLadderModal(true)}
                  className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 px-4 py-2 rounded-xl text-right transition-colors"
                >
                  <div className="text-[11px] text-amber-300 font-medium">שאלה {currentIndex + 1} מתוך 15:</div>
                  <div className="text-lg font-black text-amber-400 font-heading">
                    {MILLIONAIRE_LADDER[currentIndex] || '1,000,000 ₪'}
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Circular Countdown Timer + Pause Button */}
          {settings.timerSeconds > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPaused(prev => !prev)}
                title={isPaused ? 'המשך טיימר' : 'השהה טיימר (להסבר בכיתה)'}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                {isPaused ? <Play className="w-5 h-5 text-emerald-400" /> : <Pause className="w-5 h-5 text-amber-400" />}
              </button>

              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-slate-800"
                    fill="transparent"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="currentColor"
                    strokeWidth="4"
                    className={getTimerColor()}
                    fill="transparent"
                    strokeDasharray={150}
                    strokeDashoffset={150 - (150 * timeLeft) / settings.timerSeconds}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <span className={`absolute text-base font-black font-mono ${getTimerColor()}`}>
                  {timeLeft}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Game Screen Content: If Millionaire, show 2-column layout with Side Ladder; otherwise untouched single-column */}
      {settings.mode === 'millionaire' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-auto items-start">
          {/* Question & Lifelines Area (8 cols on lg, 9 on xl) */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col justify-center">
            {/* Mobile Ladder Indicator Bar (visible only on small screens) */}
            <div className="lg:hidden flex items-center justify-between bg-slate-900/80 border border-amber-500/30 px-3.5 py-2 rounded-xl mb-3 shadow-md">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-amber-300 font-bold">שאלה {currentIndex + 1}/15:</span>
                <span className="text-sm font-black text-amber-400 font-mono">{MILLIONAIRE_LADDER[currentIndex] || '1,000,000 ₪'}</span>
              </div>
              <button
                onClick={() => setShowLadderModal(true)}
                className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-semibold hover:bg-amber-500/30 transition-colors"
              >
                סולם הפרסים
              </button>
            </div>

            {/* Lifelines Bar for Millionaire Mode */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 mb-4 flex items-center justify-center gap-3">
              <span className="text-xs text-slate-400 font-semibold ml-2">גלגלי הצלה:</span>
              
              {/* 50:50 */}
              <button
                onClick={useFiftyFifty}
                disabled={!lifelines.fiftyFifty}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  lifelines.fiftyFifty
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-slate-900 border-slate-800 text-slate-600 line-through cursor-not-allowed opacity-50'
                }`}
              >
                <span>50:50</span>
              </button>

              {/* Class / Audience Poll */}
              <button
                onClick={useAudience}
                disabled={!lifelines.audience}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  lifelines.audience
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300 hover:bg-blue-500/30'
                    : 'bg-slate-900 border-slate-800 text-slate-600 line-through cursor-not-allowed opacity-50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>סקר כיתה / קהל</span>
              </button>

              {/* Change Question */}
              <button
                onClick={useChangeQuestion}
                disabled={!lifelines.changeQuestion}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  lifelines.changeQuestion
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300 hover:bg-purple-500/30'
                    : 'bg-slate-900 border-slate-800 text-slate-600 line-through cursor-not-allowed opacity-50'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>שאלה חלופית</span>
              </button>
            </div>

            {/* Audience Poll Modal Visualizer */}
            {audiencePollData && (
              <div className="bg-slate-900 border border-blue-500/40 p-4 rounded-2xl mb-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-blue-400 font-bold mb-2">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>תוצאות סקר התלמידים בכיתה:</span>
                  </span>
                  <button
                    onClick={() => setAudiencePollData(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    סגור סקר
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {shuffledAnswers.map((opt, i) => {
                    const pct = audiencePollData[opt] || 0;
                    const letters = ['א', 'ב', 'ג', 'ד'];
                    return (
                      <div key={i} className="text-center bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <div className="text-base font-black text-amber-400 font-mono">{pct}%</div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-1.5">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-400 truncate font-semibold">
                          {letters[i]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Central Question Card */}
            {renderQuestionCard()}

            {/* Classroom Hint / Teacher Keyboard Control Bar */}
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500 px-2">
              <span>מקשי מקלדת: 1, 2, 3, 4 לבחירת תשובה | P להשהיית הטיימר</span>
              <span>מחבר השאלה: {currentQuestion.author || 'נתנאל וינברג'}</span>
            </div>
          </div>

          {/* Side Ladder on Desktop (4 cols on lg, 3 on xl) */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-4">
            {renderLadderContent(false)}
          </div>
        </div>
      ) : (
        /* Regular Game Modes (Single Player, Head to Head) - Untouched! */
        <div className="flex flex-col my-auto">
          {renderQuestionCard()}

          {/* Classroom Hint / Teacher Keyboard Control Bar */}
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 px-2">
            <span>מקשי מקלדת: 1, 2, 3, 4 לבחירת תשובה | P להשהיית הטיימר</span>
            <span>מחבר השאלה: {currentQuestion.author || 'נתנאל וינברג'}</span>
          </div>
        </div>
      )}

      {/* Intermediate Feedback Screen (2-3 seconds, with Skip button) */}
      {feedback?.show && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div 
            className={`border rounded-3xl w-full max-w-2xl shadow-2xl p-6 md:p-8 text-center text-slate-100 relative transition-all ${
              feedback.isCorrect
                ? 'bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 border-emerald-500'
                : feedback.isPassToOtherPlayer
                ? 'bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 border-blue-500'
                : 'bg-gradient-to-b from-rose-950 via-slate-900 to-slate-950 border-rose-500'
            }`}
            dir="rtl"
          >
            {feedback.isCorrect ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/40 animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black font-heading text-emerald-300">
                  כל הכבוד {feedback.answeredBy}! תשובה נכונה!
                </h3>

                <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 text-right space-y-2">
                  <div className="text-xs text-emerald-400 font-bold">התשובה הנכונה:</div>
                  <div className="text-xl font-bold text-white">{currentQuestion.correctAnswer}</div>

                  {currentQuestion.quote && (
                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                        <Quote className="w-3.5 h-3.5 text-amber-400" />
                        <span>ציטוט מהפסוק ({currentQuestion.source}):</span>
                      </div>
                      <blockquote className="text-base text-amber-200 font-tanach italic leading-relaxed">
                        "{currentQuestion.quote}"
                      </blockquote>
                    </div>
                  )}
                </div>
              </div>
            ) : feedback.isPassToOtherPlayer ? (
              /* Ping Pong pass to other player - CRITICAL: DO NOT REVEAL THE CORRECT ANSWER! */
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-2 border border-blue-500/40">
                  <ArrowLeftRight className="w-10 h-10 animate-spin" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black font-heading text-blue-300">
                  טעות! השאלה עוברת אל {feedback.nextPlayerName}!
                </h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  התשובה לא נחשפת – האם {feedback.nextPlayerName} ידע את התשובה הנכונה?
                </p>
              </div>
            ) : (
              /* Wrong answer ending / switch */
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-2 border border-rose-500/40">
                  <XCircle className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black font-heading text-rose-300">
                  תשובה לא נכונה!
                </h3>

                <div className="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-4 text-right space-y-2">
                  <div className="text-xs text-rose-400 font-bold">התשובה הנכונה הייתה:</div>
                  <div className="text-xl font-bold text-white">{currentQuestion.correctAnswer}</div>

                  {currentQuestion.quote && (
                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                        <Quote className="w-3.5 h-3.5 text-amber-400" />
                        <span>ציטוט מהפסוק ({currentQuestion.source}):</span>
                      </div>
                      <blockquote className="text-base text-amber-200 font-tanach italic leading-relaxed">
                        "{currentQuestion.quote}"
                      </blockquote>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Auto advance countdown & Continue Button */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 animate-pulse">
                <span>מעבר אוטומטי לשאלה הבאה...</span>
              </span>
              <button
                autoFocus
                onClick={handleProceedAfterFeedback}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-white text-slate-950 font-bold font-heading hover:bg-slate-200 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <span>המשך מיד (רווח / Enter)</span>
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Millionaire Ladder Drawer Modal (for mobile screens) */}
      {showLadderModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 max-w-sm w-full text-slate-100 shadow-2xl relative" dir="rtl">
            <button 
              onClick={() => setShowLadderModal(false)} 
              className="absolute top-4 left-4 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg transition-colors z-10 font-bold"
            >
              סגור
            </button>
            {renderLadderContent(true)}
          </div>
        </div>
      )}

      {/* Walk Away Confirmation Modal */}
      {showWalkAwayConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-sm w-full text-slate-100 shadow-2xl text-center space-y-4" dir="rtl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
              <Coins className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-heading text-white">האם לפרוש מהמשחק?</h3>
              <p className="text-sm text-slate-300 mt-2">
                תוכלו לסיים את המשחק כעת ולזכות בפרס שצברתם:
              </p>
              <div className="mt-2 py-2.5 px-3 bg-amber-500/10 border border-amber-500/30 rounded-xl font-mono text-2xl font-black text-amber-400">
                {currentIndex > 0 ? MILLIONAIRE_LADDER[currentIndex - 1] : '0 ₪'}
              </div>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowWalkAwayConfirm(false);
                  handleWalkAway();
                }}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors shadow-lg shadow-amber-500/20"
              >
                כן, לפרוש עם הכסף!
              </button>
              <button
                onClick={() => setShowWalkAwayConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
              >
                להמשיך לשחק
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
