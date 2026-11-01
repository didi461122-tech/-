import React, { useState, useEffect } from 'react';
import { MultiplayerRoom, TournamentMatchState } from '../types/multiplayer';
import { multiplayerService } from '../services/multiplayerService';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Trophy, Swords, Crown, Sparkles, CheckCircle2, 
  XCircle, RotateCcw, Home, Eye, Users, ChevronLeft
} from 'lucide-react';

interface OnlineWorldCupGameProps {
  room: MultiplayerRoom;
  myPlayerId: string;
  onExit: () => void;
}

export const OnlineWorldCupGame: React.FC<OnlineWorldCupGameProps> = ({
  room,
  myPlayerId,
  onExit
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'match' | 'bracket'>('match');

  const currentQ = room.activeQuestion;
  const lastResult = room.lastAnswerResult;
  const isAnswered = !!lastResult;

  // Active match
  const matches = room.matches || [];
  const activeMatch = matches.find(m => m.id === room.activeMatchId) || matches[0];

  const isDueling = activeMatch && (myPlayerId === activeMatch.player1Id || myPlayerId === activeMatch.player2Id);
  const isHost = myPlayerId === room.hostId;

  // Play audio on answer reveal
  useEffect(() => {
    if (lastResult) {
      if (lastResult.isCorrect) {
        sound.playCorrect();
        sound.speak(`נכון מאוד! נקודה ל${lastResult.answeredByName}`);
      } else {
        sound.playWrong();
        sound.speak(`לא נכון! התשובה הנכונה היא: ${lastResult.correctAnswer}`);
      }
    } else {
      setSelectedOption(null);
    }
  }, [lastResult]);

  // Confetti on champion declaration
  useEffect(() => {
    if (room.status === 'game_over' && room.winnerName) {
      sound.playFanfare();
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 }
      });
    }
  }, [room.status, room.winnerName]);

  const handleSelectOption = (opt: string) => {
    if (isAnswered || !isDueling) return;
    sound.playClick();
    setSelectedOption(opt);
    multiplayerService.submitAnswer(opt);
  };

  const handleRematch = () => {
    sound.playClick();
    multiplayerService.rematch();
  };

  // CHAMPIONSHIP VIEW
  if (room.status === 'game_over' && room.winnerName) {
    const isMeChampion = room.players.find(p => p.id === myPlayerId)?.name === room.winnerName;

    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-6 animate-fadeIn" dir="rtl">
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border-2 border-emerald-500/50 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="w-24 h-24 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <Trophy className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
              הוכתר אלוף מונדיאל התנ״ך ברשת!
            </span>
            <h2 className="text-4xl sm:text-5xl font-black font-heading text-white">
              👑 {room.winnerName} 👑
            </h2>
            <p className="text-sm text-slate-300">
              {isMeChampion 
                ? 'זכית בגביע מונדיאל התנ״ך! הפגנת שליטה יוצאת דופן בכל שלבי הטורניר!' 
                : `כל הכבוד ל${room.winnerName} על הזכייה בגביע הטורניר!`}
            </p>
          </div>

          {/* Bracket summary preview */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400">
            טורניר נוק-אאוט בהשתתפות {room.players.length} שחקנים הגיע לסיומו המוצלח!
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            {isHost && (
              <button
                type="button"
                onClick={handleRematch}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span>התחל טורניר חדש</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                multiplayerService.leaveRoom();
                onExit();
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>חזור לתפריט הראשי</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fadeIn" dir="rtl">
      {/* Top Tournament Navigation Bar */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-2 rounded-2xl">
        <div className="flex items-center gap-2 px-3">
          <Trophy className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-sm text-white">מונדיאל תנ״ך אונליין</span>
          <span className="text-xs text-slate-500">|</span>
          <span className="text-xs text-slate-400">{room.name}</span>
        </div>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('match')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'match'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>הקרב הפעיל</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bracket')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'bracket'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>לוח הטורניר</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ACTIVE DUEL MATCH */}
      {activeTab === 'match' && (
        <div className="space-y-6">
          {/* MATCH SPOTLIGHT CARD */}
          {activeMatch && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-rose-950/40 border border-slate-800 flex items-center justify-between gap-4">
              {/* Duelist 1 */}
              <div className="text-right flex-1">
                <div className="text-xs text-slate-400 mb-0.5">
                  {activeMatch.player1Id === myPlayerId ? 'אתה (מתחרה)' : 'מתחרה 1'}
                </div>
                <div className="text-base sm:text-lg font-bold text-white truncate">
                  {activeMatch.player1Name}
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-indigo-400">
                  {activeMatch.score1} / 2
                </div>
              </div>

              {/* Match Badge */}
              <div className="text-center px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0">
                <span className="text-[11px] font-bold text-emerald-400 block">
                  {activeMatch.round === 0 ? 'רבע גמר' : activeMatch.round === 1 ? 'חצי גמר' : 'הגמר הגדול!'}
                </span>
                <span className="text-[10px] text-slate-400">הראשון ל-2 מנצח</span>
              </div>

              {/* Duelist 2 */}
              <div className="text-left flex-1">
                <div className="text-xs text-slate-400 mb-0.5">
                  {activeMatch.player2Id === myPlayerId ? 'אתה (מתחרה)' : 'מתחרה 2'}
                </div>
                <div className="text-base sm:text-lg font-bold text-white truncate">
                  {activeMatch.player2Name}
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-rose-400">
                  {activeMatch.score2} / 2
                </div>
              </div>
            </div>
          )}

          {/* SPECTATOR BANNER (if user is not currently in this duel) */}
          {!isDueling && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                <span>אתה צופה כעת בקרב מהקהל. הקרב הבא שלך יגיע בקרוב!</span>
              </div>
              <span className="text-amber-400 font-semibold">צפייה חיה</span>
            </div>
          )}

          {/* QUESTION BOX */}
          {currentQ && (
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
              <div className="text-center">
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  שאלה אמריקאית · {currentQ.topic} ({currentQ.difficulty})
                </span>
                <div className="text-xl sm:text-2xl font-bold font-heading text-white leading-relaxed mt-3">
                  {currentQ.question}
                </div>
              </div>

              {/* 4 AMERICAN OPTIONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {currentQ.shuffledOptions.map((opt, idx) => {
                  const letter = ['א', 'ב', 'ג', 'ד'][idx] || '';

                  let btnClass = 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 text-slate-200';

                  if (isAnswered && lastResult) {
                    if (opt === lastResult.correctAnswer) {
                      btnClass = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20';
                    } else if (opt === lastResult.selectedOption && !lastResult.isCorrect) {
                      btnClass = 'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500';
                    } else {
                      btnClass = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60';
                    }
                  } else if (selectedOption === opt) {
                    btnClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-400';
                  }

                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isAnswered || !isDueling}
                      onClick={() => handleSelectOption(opt)}
                      className={`p-4 rounded-2xl border text-right transition-all flex items-center gap-3.5 disabled:cursor-not-allowed ${btnClass}`}
                    >
                      <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-xs shrink-0 text-emerald-400">
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

              {/* ANSWER REVEAL FOOTER */}
              {isAnswered && lastResult && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1 animate-fadeIn">
                  <div className="text-xs font-bold text-emerald-300">
                    {lastResult.isCorrect ? `✓ ${lastResult.answeredByName} צדק והרוויח נקודה!` : `✗ ${lastResult.answeredByName} שגה`}
                  </div>
                  {lastResult.quote && (
                    <p className="text-sm font-serif italic text-emerald-100">
                      "{lastResult.quote}"
                    </p>
                  )}
                  {lastResult.source && (
                    <div className="text-[11px] text-emerald-400/80">
                      מקור: {lastResult.source}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 pt-1">
                    עובר לשאלה הבאה...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TOURNAMENT BRACKET TREE */}
      {activeTab === 'bracket' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>טבלת שלבי מונדיאל התנ״ך</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Round 0: Quarters (if 8 players) or Round 1: Semis */}
            {matches.some(m => m.round === 0) && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-400 pb-1 border-b border-slate-800">
                  רבעי גמר
                </div>
                {matches.filter(m => m.round === 0).map(m => (
                  <div key={m.id} className={`p-3 rounded-xl border text-xs ${
                    m.id === room.activeMatchId ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-800 bg-slate-950'
                  }`}>
                    <div className="flex justify-between font-semibold text-slate-200">
                      <span>{m.player1Name}</span>
                      <span className="font-mono">{m.score1}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-slate-200 mt-1">
                      <span>{m.player2Name}</span>
                      <span className="font-mono">{m.score2}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Round 1: Semis */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-400 pb-1 border-b border-slate-800">
                חצי גמר
              </div>
              {matches.filter(m => m.round === 1).map(m => (
                <div key={m.id} className={`p-3 rounded-xl border text-xs ${
                  m.id === room.activeMatchId ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-800 bg-slate-950'
                }`}>
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>{m.player1Name}</span>
                    <span className="font-mono">{m.score1}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-200 mt-1">
                    <span>{m.player2Name}</span>
                    <span className="font-mono">{m.score2}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Round 2: Final */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-amber-400 pb-1 border-b border-slate-800 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                <span>הגמר הגדול</span>
              </div>
              {matches.filter(m => m.round === 2).map(m => (
                <div key={m.id} className={`p-4 rounded-xl border text-xs ${
                  m.id === room.activeMatchId ? 'border-amber-500 bg-amber-950/20' : 'border-slate-800 bg-slate-950'
                }`}>
                  <div className="flex justify-between font-bold text-white text-sm">
                    <span>{m.player1Name}</span>
                    <span className="font-mono text-amber-400">{m.score1}</span>
                  </div>
                  <div className="flex justify-between font-bold text-white text-sm mt-2">
                    <span>{m.player2Name}</span>
                    <span className="font-mono text-amber-400">{m.score2}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
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
