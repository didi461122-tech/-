import React, { useState, useEffect } from 'react';
import { MultiplayerRoom } from '../types/multiplayer';
import { multiplayerService } from '../services/multiplayerService';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Swords, Trophy, RotateCcw, Home, Sparkles, 
  CheckCircle2, XCircle, BookOpen, Clock, Zap
} from 'lucide-react';

interface OnlineHeadToHeadGameProps {
  room: MultiplayerRoom;
  myPlayerId: string;
  onExit: () => void;
}

export const OnlineHeadToHeadGame: React.FC<OnlineHeadToHeadGameProps> = ({
  room,
  myPlayerId,
  onExit
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const player1 = room.players[0] || { id: 'p1', name: 'שחקן 1', score: 0 };
  const player2 = room.players[1] || { id: 'p2', name: 'שחקן 2', score: 0 };

  const isMeP1 = myPlayerId === player1.id;
  const isMeP2 = myPlayerId === player2.id;
  const isHost = myPlayerId === room.hostId;

  const currentQ = room.activeQuestion;
  const lastResult = room.lastAnswerResult;
  const isAnswered = !!lastResult;

  // Turn check for turn_based mode
  const isMyTurn = room.subMode === 'simultaneous' || room.activePlayerTurnId === myPlayerId;
  const hasIAnswered = room.answeredPlayerIds.includes(myPlayerId);

  // Play audio when answer result changes
  useEffect(() => {
    if (lastResult) {
      if (lastResult.isCorrect) {
        sound.playCorrect();
        sound.speak(`נכון מאוד! ${lastResult.answeredByName} צדק`);
        if (room.winnerName) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } else {
        sound.playWrong();
        sound.speak(`לא נכון! התשובה הנכונה היא: ${lastResult.correctAnswer}`);
      }
    } else {
      setSelectedOption(null);
    }
  }, [lastResult, room.winnerName]);

  const handleSelectOption = (opt: string) => {
    if (isAnswered || hasIAnswered || !isMyTurn) return;

    sound.playClick();
    setSelectedOption(opt);
    multiplayerService.submitAnswer(opt);
  };

  const handleRematch = () => {
    sound.playClick();
    multiplayerService.rematch();
  };

  // GAME OVER VIEW
  if (room.status === 'game_over' && room.winnerName) {
    const isMeWinner = (isMeP1 && room.winnerName === player1.name) || (isMeP2 && room.winnerName === player2.name);

    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-6 animate-fadeIn" dir="rtl">
        <div className="p-8 rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
              סיום הקרב
            </span>
            <h2 className="text-3xl sm:text-4xl font-black font-heading text-white">
              {room.winnerName} ניצח בקרב!
            </h2>
            <p className="text-sm text-slate-300">
              {isMeWinner ? 'כל הכבוד! הפגנת ידע מרשים בתנ״ך 👑' : 'משחק צמוד ומותח, נסה שוב בסיבוב הבא!'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-around">
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-1">{player1.name}</div>
              <div className="text-2xl font-black font-mono text-indigo-400">{player1.score}</div>
            </div>
            <div className="text-xs font-bold text-slate-600">VS</div>
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-1">{player2.name}</div>
              <div className="text-2xl font-black font-mono text-rose-400">{player2.score}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {isHost && (
              <button
                type="button"
                onClick={handleRematch}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span>קרב חוזר</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                multiplayerService.leaveRoom();
                onExit();
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>חזור לתפריט הראשי</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE GAMEPLAY VIEW
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fadeIn" dir="rtl">
      {/* SCOREBOARD HEADER */}
      <div className="grid grid-cols-2 gap-4">
        {/* Player 1 Card */}
        <div className={`p-4 rounded-2xl border transition-all ${
          room.activePlayerTurnId === player1.id && room.subMode === 'turn_based'
            ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-400 shadow-lg shadow-indigo-500/10'
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>{player1.name}</span>
              {isMeP1 && <span className="text-[10px] text-indigo-400 font-semibold">(אתה)</span>}
            </span>
            <span className="font-mono font-black text-xl text-indigo-400">
              {player1.score} / {room.targetScore}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-500" 
              style={{ width: `${Math.min(100, (player1.score / room.targetScore) * 100)}%` }}
            />
          </div>
        </div>

        {/* Player 2 Card */}
        <div className={`p-4 rounded-2xl border transition-all ${
          room.activePlayerTurnId === player2.id && room.subMode === 'turn_based'
            ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-400 shadow-lg shadow-rose-500/10'
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>{player2.name}</span>
              {isMeP2 && <span className="text-[10px] text-rose-400 font-semibold">(אתה)</span>}
            </span>
            <span className="font-mono font-black text-xl text-rose-400">
              {player2.score} / {room.targetScore}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden">
            <div 
              className="h-full bg-rose-500 transition-all duration-500" 
              style={{ width: `${Math.min(100, (player2.score / room.targetScore) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* TURN / STATUS BANNER */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>נושא: {currentQ?.topic}</span>
          <span className="text-slate-600">·</span>
          <span>רמה: {currentQ?.difficulty}</span>
        </div>

        <div className="flex items-center gap-2">
          {room.subMode === 'simultaneous' ? (
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> קרב מהירות: מי שעונה ראשון!
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              תור: {room.activePlayerTurnId === player1.id ? player1.name : player2.name}
            </span>
          )}
        </div>
      </div>

      {/* QUESTION CARD */}
      {currentQ && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div className="text-xl sm:text-2xl font-bold font-heading text-white leading-relaxed text-center">
            {currentQ.question}
          </div>

          {/* 4 AMERICAN OPTIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentQ.shuffledOptions.map((opt, idx) => {
              const letter = ['א', 'ב', 'ג', 'ד'][idx] || '';

              // Styling when answer is revealed
              let btnClass = 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/50 text-slate-200';
              
              if (isAnswered && lastResult) {
                if (opt === lastResult.correctAnswer) {
                  btnClass = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20';
                } else if (opt === lastResult.selectedOption && !lastResult.isCorrect) {
                  btnClass = 'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500';
                } else {
                  btnClass = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60';
                }
              } else if (selectedOption === opt) {
                btnClass = 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-400';
              }

              return (
                <button
                  key={opt}
                  type="button"
                  disabled={isAnswered || hasIAnswered || !isMyTurn}
                  onClick={() => handleSelectOption(opt)}
                  className={`p-4 rounded-2xl border text-right transition-all flex items-center gap-3.5 disabled:cursor-not-allowed ${btnClass}`}
                >
                  <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-xs shrink-0 text-amber-400">
                    {letter}
                  </span>
                  <span className="font-semibold text-sm sm:text-base flex-1">{opt}</span>
                  {isAnswered && lastResult && opt === lastResult.correctAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  {isAnswered && lastResult && opt === lastResult.selectedOption && !lastResult.isCorrect && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* SCRIPTURE CITATION (AFTER ANSWER) */}
          {isAnswered && lastResult && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1 animate-fadeIn">
              <div className="text-xs font-bold text-amber-300">
                {lastResult.isCorrect ? `✓ ${lastResult.answeredByName} צדק!` : `✗ ${lastResult.answeredByName} טעה`}
              </div>
              {lastResult.quote && (
                <p className="text-sm font-serif italic text-amber-100">
                  "{lastResult.quote}"
                </p>
              )}
              {lastResult.source && (
                <div className="text-[11px] text-amber-400/80">
                  מקור: {lastResult.source}
                </div>
              )}
              <div className="text-[10px] text-slate-400 pt-1">
                עובר לשאלה הבאה בעוד רגע...
              </div>
            </div>
          )}
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-2">
        <span>קוד חדר: <strong className="font-mono text-amber-400">#{room.id}</strong></span>
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            multiplayerService.leaveRoom();
            onExit();
          }}
          className="hover:text-white transition-colors underline"
        >
          עזוב חדר
        </button>
      </div>
    </div>
  );
};
