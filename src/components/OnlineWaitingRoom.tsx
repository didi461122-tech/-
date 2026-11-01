import React, { useState } from 'react';
import { MultiplayerRoom } from '../types/multiplayer';
import { multiplayerService } from '../services/multiplayerService';
import { sound } from '../utils/audio';
import { 
  Users, Crown, Copy, Check, Play, LogOut, 
  Sparkles, Swords, Trophy, Shield, Share2
} from 'lucide-react';

interface OnlineWaitingRoomProps {
  room: MultiplayerRoom;
  myPlayerId: string;
  onLeave: () => void;
}

export const OnlineWaitingRoom: React.FC<OnlineWaitingRoomProps> = ({
  room,
  myPlayerId,
  onLeave
}) => {
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const isHost = room.hostId === myPlayerId;
  const canStart = room.mode === 'kahoot'
    ? room.players.length >= 1
    : (room.mode === 'head_to_head' ? room.players.length >= 2 : room.players.length >= 4);

  const handleCopyCode = () => {
    sound.playClick();
    navigator.clipboard.writeText(room.id);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    sound.playClick();
    const joinUrl = `${window.location.origin}?room=${room.id}`;
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleStartGame = () => {
    sound.playClick();
    multiplayerService.startGame();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-fadeIn" dir="rtl">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
          {room.mode === 'kahoot' ? <Users className="w-3.5 h-3.5" /> : (room.mode === 'head_to_head' ? <Swords className="w-3.5 h-3.5" /> : <Trophy className="w-3.5 h-3.5" />)}
          <span>
            {room.mode === 'kahoot' ? 'חדר מקרן קהוט כיתתי' : (room.mode === 'head_to_head' ? 'חדר המתנה לקרב ראש בראש' : 'חדר המתנה למונדיאל תנ״ך')}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-heading text-white">
          {room.name}
        </h1>
        <p className="text-sm text-slate-400">
          שתף את קוד החדר עם החברים כדי שיצטרפו למשחק בזמן אמת!
        </p>
      </div>

      {/* GIANT ROOM CODE CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-amber-500/40 shadow-2xl shadow-amber-500/10 text-center space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
        
        <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block">
          קוד החדר האישי
        </span>

        <div className="text-5xl sm:text-7xl font-mono font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 py-1">
          {room.id}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleCopyCode}
            className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-all flex items-center gap-2 shadow-sm"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'הקוד הועתק!' : 'העתק קוד חדר'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? 'הקישור הועתק!' : 'העתק קישור ישיר להצטרפות'}</span>
          </button>
        </div>
      </div>

      {/* PLAYERS ROSTER */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Users className="w-4 h-4 text-amber-400" />
            <span>שחקנים בחדר:</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 text-xs font-mono">
              {room.players.length} / {room.maxPlayers}
            </span>
          </div>

          <span className="text-xs text-slate-400">
            {room.mode === 'head_to_head' ? 'נדרשים 2 שחקנים' : 'נדרשים לפחות 4 שחקנים'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {room.players.map((p, idx) => {
            const isMe = p.id === myPlayerId;
            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                  isMe
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-slate-950 shadow-sm ${
                    idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-rose-400' : idx === 2 ? 'bg-emerald-400' : 'bg-sky-400'
                  }`}>
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span>{p.name}</span>
                      {isMe && <span className="text-[10px] text-amber-400 font-semibold">(אתה)</span>}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      {p.isHost && (
                        <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                          <Crown className="w-3 h-3 text-amber-400" /> מארח
                        </span>
                      )}
                      {!p.isHost && <span>מתמודד מוכן</span>}
                    </div>
                  </div>
                </div>

                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
              </div>
            );
          })}
        </div>

        {/* Missing players hint */}
        {!canStart && (
          <div className="text-center py-4 text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            {room.mode === 'kahoot' ? (
              <span>ממתין לתלמידים שיזינו את הקוד <strong>{room.id}</strong> בנייד...</span>
            ) : room.mode === 'head_to_head' ? (
              <span>ממתין לשחקן נוסף שיזין את הקוד <strong>{room.id}</strong>...</span>
            ) : (
              <span>ממתין לעוד {4 - room.players.length} שחקנים לפחות כדי שנוכל לפתוח את מונדיאל התנ״ך...</span>
            )}
          </div>
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            multiplayerService.leaveRoom();
            onLeave();
          }}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>עזוב חדר</span>
        </button>

        {isHost ? (
          <button
            type="button"
            disabled={!canStart}
            onClick={handleStartGame}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 text-slate-950 font-black text-sm font-heading shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>התחל את המשחק עכשיו!</span>
          </button>
        ) : (
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>ממתין למארח ({room.hostName}) שיתחיל את המשחק...</span>
          </div>
        )}
      </div>
    </div>
  );
};
