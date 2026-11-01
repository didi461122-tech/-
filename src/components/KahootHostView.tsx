import React, { useState, useEffect } from 'react';
import { MultiplayerRoom } from '../types/multiplayer';
import { multiplayerService } from '../services/multiplayerService';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Users, Trophy, Play, ChevronLeft, Sparkles, CheckCircle2, 
  XCircle, Clock, Volume2, Share2, Copy, Check, Smartphone, 
  Award, BarChart3, Flame, RotateCcw, Home, MapPin, BookOpen
} from 'lucide-react';

interface KahootHostViewProps {
  room: MultiplayerRoom;
  onExit: () => void;
}

const KAHOOT_COLORS = [
  { bg: 'bg-red-600', hover: 'hover:bg-red-500', border: 'border-red-500', shape: '▲', label: 'א' },
  { bg: 'bg-blue-600', hover: 'hover:bg-blue-500', border: 'border-blue-500', shape: '◆', label: 'ב' },
  { bg: 'bg-amber-500', hover: 'hover:bg-amber-400', border: 'border-amber-400', shape: '●', label: 'ג' },
  { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-500', border: 'border-emerald-500', shape: '■', label: 'ד' }
];

export const KahootHostView: React.FC<KahootHostViewProps> = ({
  room,
  onExit
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const kahoot = room.kahootState;
  const currentQ = room.activeQuestion;
  const showResults = kahoot?.showResults ?? false;

  const students = room.players.filter(p => !p.isHost && !p.isRemote);

  // Countdown timer for active question
  useEffect(() => {
    if (room.status !== 'playing' || showResults || !kahoot) return;

    setTimeLeft(kahoot.timeLimitSeconds || 20);
    const interval = setInterval(() => {
      const elapsed = (Date.now() - kahoot.questionStartTime) / 1000;
      const remaining = Math.max(0, Math.ceil(kahoot.timeLimitSeconds - elapsed));
      setTimeLeft(remaining);

      if (remaining <= 5 && remaining > 0) {
        sound.playTick();
      }

      if (remaining <= 0) {
        clearInterval(interval);
        // Automatically trigger answer reveal on host
        multiplayerService.revealKahootResults();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [currentQ?.id, showResults, room.status]);

  // Audio trigger on result reveal
  useEffect(() => {
    if (showResults && room.lastAnswerResult) {
      sound.playCorrect();
      sound.speak(`התשובה הנכונה היא: ${room.lastAnswerResult.correctAnswer}`);
    }
  }, [showResults]);

  // Confetti on game over
  useEffect(() => {
    if (room.status === 'game_over' && room.winnerName) {
      sound.playFanfare();
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
    }
  }, [room.status, room.winnerName]);

  const handleCopyCode = () => {
    sound.playClick();
    navigator.clipboard.writeText(room.id);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    sound.playClick();
    navigator.clipboard.writeText(`${window.location.origin}?room=${room.id}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // --- 1. LOBBY SCREEN (WAITING FOR CLASSROOM TO JOIN) ---
  if (room.status === 'lobby') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn" dir="rtl">
        {/* Top bar with instructions */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-bold shadow-sm">
            <Users className="w-4 h-4 text-amber-400" />
            <span>קהוט תנ"ך כיתתי למקרן ולניידים</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-heading tracking-tight text-white">
            {room.name}
          </h1>
          <p className="text-sm sm:text-base text-slate-300">
            היכנסו מכל טלפון או מחשב, הקישו את קוד החדר והתחרו בחידון התנ"ך!
          </p>
        </div>

        {/* GIANT PIN BOX */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-amber-500/50 shadow-2xl text-center space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500" />
          
          <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">
            קוד החדר להצטרפות התלמידים
          </div>

          <div className="text-6xl sm:text-8xl font-mono font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 py-2">
            {room.id}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleCopyCode}
              className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-all flex items-center gap-1.5"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'הקוד הועתק!' : 'העתק קוד'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold hover:bg-slate-700 transition-all flex items-center gap-1.5"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'הקישור הועתק!' : 'העתק קישור ישיר'}</span>
            </button>

            {room.remotePin && (
              <div className="px-3.5 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                <span>קוד שלט מנחה: <strong className="font-mono text-white">{room.remotePin}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* JOINED STUDENTS LIST */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-base font-bold text-white">
              <Users className="w-5 h-5 text-amber-400" />
              <span>תלמידים שהצטרפו:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black">
                {students.length}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {students.length === 0 ? 'ממתין לתלמידים ראשונים...' : 'הצטרפו בהצלחה'}
            </span>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Users className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
              <p className="text-sm font-semibold">אף תלמיד עוד לא התחבר</p>
              <p className="text-xs text-slate-500">בקש מהתלמידים להיכנס לקישור ולהקליד את הקוד #{room.id}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {students.map((student, idx) => (
                <div
                  key={student.id}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 flex items-center gap-2.5 transition-all animate-fadeIn"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                    {student.name.charAt(0)}
                  </div>
                  <span className="font-bold text-xs text-white truncate">{student.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* START BUTTON */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              multiplayerService.leaveRoom();
              onExit();
            }}
            className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition-all"
          >
            יציאה לתפריט
          </button>

          <button
            type="button"
            disabled={students.length === 0}
            onClick={() => {
              sound.playClick();
              multiplayerService.startGame();
            }}
            className="py-4 px-10 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 text-slate-950 font-black text-lg font-heading shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:cursor-not-allowed"
          >
            <Play className="w-6 h-6 fill-slate-950" />
            <span>התחל את החידון הכיתתי! ({students.length} תלמידים)</span>
          </button>
        </div>
      </div>
    );
  }

  // --- 2. GAME OVER PODIUM VIEW ---
  if (room.status === 'game_over') {
    const top3 = kahoot?.topPlayers?.slice(0, 3) || [];
    const winner = top3[0]?.name || room.winnerName || 'אלוף התנ"ך הכיתתי';

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center space-y-8 animate-fadeIn" dir="rtl">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border-2 border-amber-500/60 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="w-24 h-24 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center shadow-xl shadow-amber-500/20">
            <Trophy className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
              סיום חידון התנ"ך הכיתתי
            </span>
            <h1 className="text-4xl sm:text-6xl font-black font-heading text-white">
              👑 {winner} 👑
            </h1>
            <p className="text-base text-slate-300">
              כל הכבוד לכל תלמידי הכיתה על הידע המרשים וההשתתפות הפעילה!
            </p>
          </div>

          {/* 3D-STYLE PODIUM */}
          <div className="grid grid-cols-3 gap-3 pt-6 max-w-lg mx-auto items-end">
            {/* 2nd Place */}
            {top3[1] && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-700 text-center space-y-1 h-36 flex flex-col justify-end">
                <div className="text-xl font-bold text-slate-300">🥈 מקום 2</div>
                <div className="font-bold text-sm text-white truncate">{top3[1].name}</div>
                <div className="text-xs font-mono text-amber-400">{top3[1].score.toLocaleString()} נק'</div>
              </div>
            )}

            {/* 1st Place */}
            {top3[0] && (
              <div className="p-5 rounded-2xl bg-gradient-to-t from-amber-500/30 to-amber-500/10 border-2 border-amber-400 text-center space-y-1.5 h-48 flex flex-col justify-end shadow-xl">
                <div className="text-2xl font-black text-amber-300">🥇 מקום 1</div>
                <div className="font-black text-base text-white truncate">{top3[0].name}</div>
                <div className="text-sm font-mono font-bold text-amber-300">{top3[0].score.toLocaleString()} נק'</div>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1 h-32 flex flex-col justify-end">
                <div className="text-lg font-bold text-amber-600">🥉 מקום 3</div>
                <div className="font-bold text-xs text-white truncate">{top3[2].name}</div>
                <div className="text-xs font-mono text-amber-400">{top3[2].score.toLocaleString()} נק'</div>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                multiplayerService.rematch();
              }}
              className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4 fill-slate-950" />
              <span>משחק חוזר</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                multiplayerService.leaveRoom();
                onExit();
              }}
              className="py-3.5 px-6 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-bold text-sm transition-all flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>חזור לדף הבית</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 3. ACTIVE QUESTION / RESULTS SCREEN ---
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-fadeIn" dir="rtl">
      {/* Top Banner: Question Progress & Timer */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm text-amber-400">
            שאלה {(room.currentQuestionIndex || 0) + 1} מתוך {Math.min(room.totalQuestionsCount, 15)}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-400">{currentQ?.topic}</span>
          {currentQ?.parasha && (
            <>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-emerald-400 font-semibold">{currentQ.parasha}</span>
            </>
          )}
        </div>

        {/* Live Answered Tracker or Timer */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Users className="w-4 h-4 text-amber-400" />
            <span>{kahoot?.answeredCount || 0} / {kahoot?.totalStudentsCount || students.length} ענו</span>
          </div>

          {!showResults && (
            <div className={`px-4 py-1.5 rounded-xl font-mono font-black text-base flex items-center gap-1.5 ${
              timeLeft <= 5 ? 'bg-red-500 text-white animate-bounce' : 'bg-slate-800 text-amber-400'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{timeLeft}ש</span>
            </div>
          )}

          {showResults && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                multiplayerService.nextQuestion();
              }}
              className="py-2 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <span>לשאלה הבאה</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* QUESTION DISPLAY */}
      {currentQ && (
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-black font-heading text-white leading-snug">
            {currentQ.question}
          </h2>

          {/* BIBLICAL MAP / VISUAL ENRICHMENT BADGE */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>ספר: {currentQ.topic}</span>
            <span className="text-slate-600">·</span>
            <span>רמה: {currentQ.difficulty}</span>
          </div>

          {/* 4 KAHOOT OPTIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {currentQ.shuffledOptions.map((opt, idx) => {
              const color = KAHOOT_COLORS[idx] || KAHOOT_COLORS[0];
              const isCorrectAnswer = room.lastAnswerResult?.correctAnswer === opt;
              const votesCount = kahoot?.distribution?.[opt] || 0;

              let cardStyle = `${color.bg} text-white shadow-lg`;
              if (showResults) {
                if (isCorrectAnswer) {
                  cardStyle = 'bg-emerald-600 text-white ring-4 ring-emerald-400 shadow-xl scale-[1.02]';
                } else {
                  cardStyle = 'bg-slate-950/60 text-slate-500 border border-slate-800 opacity-50';
                }
              }

              return (
                <div
                  key={opt}
                  className={`p-5 rounded-2xl flex items-center justify-between gap-4 transition-all duration-300 ${cardStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-black/25 flex items-center justify-center font-black text-lg shrink-0">
                      {color.shape}
                    </span>
                    <span className="font-bold text-base sm:text-lg text-right">{opt}</span>
                  </div>

                  {showResults && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold bg-black/40 px-2 py-1 rounded-lg">
                        {votesCount} {votesCount === 1 ? 'תשובה' : 'תשובות'}
                      </span>
                      {isCorrectAnswer && <CheckCircle2 className="w-6 h-6 text-white" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* SCRIPTURE REVEAL CALLOUT */}
          {showResults && room.lastAnswerResult && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1.5 animate-fadeIn">
              <div className="text-xs font-bold text-amber-400">
                מקור מהתנ"ך: {room.lastAnswerResult.source}
              </div>
              {room.lastAnswerResult.quote && (
                <p className="text-sm font-serif italic text-amber-100">
                  "{room.lastAnswerResult.quote}"
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* TOP 5 CLASSROOM LEADERBOARD (DISPLAYED AFTER REVEAL) */}
      {showResults && kahoot?.topPlayers && kahoot.topPlayers.length > 0 && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>טבלת 5 המובילים בכיתה</span>
            </h3>
            <span className="text-xs text-slate-400">הניקוד משקלל דיוק ומהירות</span>
          </div>

          <div className="space-y-2">
            {kahoot.topPlayers.map((player, idx) => (
              <div
                key={player.id}
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  idx === 0 
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    idx === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}>
                    #{idx + 1}
                  </span>
                  <span className="font-bold text-sm text-white">{player.name}</span>
                  {player.streak > 1 && (
                    <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> רצף {player.streak}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {player.lastPoints > 0 && (
                    <span className="text-xs text-emerald-400 font-bold font-mono">
                      +{player.lastPoints}
                    </span>
                  )}
                  <span className="font-mono font-black text-sm text-amber-400">
                    {player.score.toLocaleString()} נק'
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER CONTROLS */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-2">
        <span>קוד חדר: <strong className="font-mono text-amber-400">#{room.id}</strong></span>
        {!showResults && (
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              multiplayerService.revealKahootResults();
            }}
            className="text-amber-400 hover:text-amber-300 font-bold underline"
          >
            חשוף תשובות כעת
          </button>
        )}
      </div>
    </div>
  );
};
