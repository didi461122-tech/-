import React, { useState, useEffect } from 'react';
import { MultiplayerRoom } from '../types/multiplayer';
import { multiplayerService } from '../services/multiplayerService';
import { sound } from '../utils/audio';
import { 
  CheckCircle2, XCircle, Flame, Trophy, Award, 
  Clock, Sparkles, LogOut, Check
} from 'lucide-react';

interface KahootPlayerViewProps {
  room: MultiplayerRoom;
  myPlayerId: string;
  onExit: () => void;
}

const BUTTONS = [
  { shape: '▲', label: 'א', bg: 'bg-red-600 active:bg-red-700', border: 'border-red-500' },
  { shape: '◆', label: 'ב', bg: 'bg-blue-600 active:bg-blue-700', border: 'border-blue-500' },
  { shape: '●', label: 'ג', bg: 'bg-amber-500 active:bg-amber-600', border: 'border-amber-400' },
  { shape: '■', label: 'ד', bg: 'bg-emerald-600 active:bg-emerald-700', border: 'border-emerald-500' }
];

export const KahootPlayerView: React.FC<KahootPlayerViewProps> = ({
  room,
  myPlayerId,
  onExit
}) => {
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);

  const me = room.players.find(p => p.id === myPlayerId) || {
    id: myPlayerId,
    name: 'תלמיד',
    score: 0,
    streak: 0,
    rank: 1,
    lastPointsEarned: 0
  };

  const currentQ = room.activeQuestion;
  const showResults = room.kahootState?.showResults ?? false;
  const hasAnswered = room.answeredPlayerIds.includes(myPlayerId);

  // Reset selected on new question
  useEffect(() => {
    if (!showResults) {
      setSelectedOpt(null);
    }
  }, [currentQ?.id, showResults]);

  const handleChoose = (opt: string) => {
    if (hasAnswered || showResults) return;

    sound.playClick();
    setSelectedOpt(opt);
    multiplayerService.submitAnswer(opt);
  };

  // --- LOBBY WAITING STATE ---
  if (room.status === 'lobby') {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-6" dir="rtl">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center font-bold text-2xl shadow-lg">
            ✓
          </div>
          <h2 className="text-2xl font-black font-heading text-white">
            אתה מחובר לחידון!
          </h2>
          <p className="text-sm text-slate-300">
            שלום <strong>{me.name}</strong>, הבט אל המקרן בכיתה והמתן שהמורה יתחיל את המשחק.
          </p>
          <div className="text-xs text-slate-500 pt-2">
            קוד חדר: #{room.id}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            multiplayerService.leaveRoom();
            onExit();
          }}
          className="text-xs text-slate-400 hover:text-white underline"
        >
          עזוב חדר
        </button>
      </div>
    );
  }

  // --- GAME OVER STATE ---
  if (room.status === 'game_over') {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-6" dir="rtl">
        <div className="p-8 rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl space-y-5">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <Trophy className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black font-heading text-white">
            סיום החידון!
          </h2>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-xs text-slate-400">המיקום הסופי שלך:</div>
            <div className="text-2xl font-black text-amber-400">מקום {me.rank || 1} בכיתה</div>
            <div className="text-sm font-mono text-slate-300">{me.score.toLocaleString()} נקודות</div>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              multiplayerService.leaveRoom();
              onExit();
            }}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all"
          >
            חזור לתפריט
          </button>
        </div>
      </div>
    );
  }

  // --- REVEALED RESULTS STATE ---
  if (showResults) {
    const isCorrect = selectedOpt === room.lastAnswerResult?.correctAnswer;

    return (
      <div className="max-w-md mx-auto px-4 py-8 text-center space-y-6 animate-fadeIn" dir="rtl">
        <div className={`p-8 rounded-3xl border shadow-2xl space-y-4 ${
          isCorrect 
            ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200' 
            : 'bg-rose-950/70 border-rose-500 text-rose-200'
        }`}>
          <div className="w-16 h-16 rounded-full bg-black/30 mx-auto flex items-center justify-center">
            {isCorrect ? <CheckCircle2 className="w-10 h-10 text-emerald-400" /> : <XCircle className="w-10 h-10 text-rose-400" />}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black font-heading text-white">
            {isCorrect ? 'נכון מאוד!' : 'תשובה לא נכונה'}
          </h2>

          {isCorrect && me.lastPointsEarned && me.lastPointsEarned > 0 && (
            <div className="text-lg font-mono font-black text-emerald-300">
              +{me.lastPointsEarned} נקודות!
            </div>
          )}

          <div className="p-4 rounded-2xl bg-black/40 space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between items-center">
              <span>הניקוד הכולל שלך:</span>
              <span className="font-mono font-bold text-amber-400 text-sm">{me.score.toLocaleString()} נק'</span>
            </div>
            <div className="flex justify-between items-center">
              <span>המיקום שלך בכיתה:</span>
              <span className="font-bold text-white text-sm">מקום {me.rank || 1}</span>
            </div>
            {(me.streak || 0) > 1 && (
              <div className="flex justify-between items-center text-rose-400">
                <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> רצף תשובות:</span>
                <span className="font-bold">{me.streak} ברצף!</span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 pt-2">
            הבט אל המקרן כדי לראות את הפסוק וההסבר...
          </p>
        </div>
      </div>
    );
  }

  // --- WAITING FOR RESULTS (ANSWER SUBMITTED) ---
  if (hasAnswered) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-6 animate-fadeIn" dir="rtl">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center animate-pulse">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">תשובתך נקלטה בהצלחה!</h2>
          <p className="text-xs text-slate-300">
            הבט אל המקרן, התוצאות ייחשפו כאשר כל התלמידים יענו או כשיסתיים הזמן.
          </p>
        </div>
      </div>
    );
  }

  // --- ACTIVE QUESTION INPUT (4 BIG COLORFUL BUTTONS) ---
  return (
    <div className="max-w-md mx-auto px-3 py-4 flex flex-col h-[85vh] justify-between" dir="rtl">
      {/* Mini status header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl">
        <div className="font-bold text-xs text-white truncate max-w-[140px]">
          {me.name}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-amber-400">{me.score.toLocaleString()} נק'</span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-400">שאלה {(room.currentQuestionIndex || 0) + 1}</span>
        </div>
      </div>

      {/* 4 GIANT TOUCH BUTTONS */}
      <div className="grid grid-cols-2 gap-3.5 my-auto h-[70vh]">
        {currentQ?.shuffledOptions.map((opt, idx) => {
          const btn = BUTTONS[idx] || BUTTONS[0];

          return (
            <button
              key={opt}
              type="button"
              onClick={() => handleChoose(opt)}
              className={`${btn.bg} rounded-3xl text-white font-black flex flex-col items-center justify-center gap-3 p-4 shadow-xl active:scale-95 transition-all select-none`}
            >
              <span className="text-4xl drop-shadow-md">{btn.shape}</span>
              <span className="text-sm font-bold text-center line-clamp-3 px-1">{opt}</span>
            </button>
          );
        })}
      </div>

      <div className="text-center text-[11px] text-slate-500">
        בחר את התשובה הנכונה מהר כדי לצבור יותר נקודות!
      </div>
    </div>
  );
};
