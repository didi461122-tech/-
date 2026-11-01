import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Maximize2, Minimize2, Database, BookOpen, Home, Trophy, Award, Zap } from 'lucide-react';
import { sound } from '../utils/audio';

interface HeaderProps {
  onOpenSheetSettings: () => void;
  onOpenLeaderboard: () => void;
  onOpenOnlineMultiplayer?: () => void;
  onGoHome: () => void;
  inGame: boolean;
  sourceName: string;
  unlockedAchievementsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSheetSettings,
  onOpenLeaderboard,
  onOpenOnlineMultiplayer,
  onGoHome,
  inGame,
  sourceName,
  unlockedAchievementsCount = 0
}) => {
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    const unsubscribe = sound.subscribe((muted) => setIsMuted(muted));

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      unsubscribe();
    };
  }, []);

  const toggleMute = () => {
    const nextState = !isMuted;
    sound.setMuted(nextState);
    setIsMuted(nextState);
    if (!nextState) {
      sound.playClick();
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
    }
  };

  return (
    <header className="h-16 px-4 md:px-8 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
      {/* Zone 1: Brand title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-right group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="text-xl font-black font-heading tracking-tight text-white group-hover:text-amber-400 transition-colors">
              חידוני תנ"ך
            </div>
          </div>
        </button>
      </div>

      {/* Zone 2: Clean Subtitle */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
        <span>משחק ידע אינטראקטיבי</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span className="text-amber-400/90 font-medium">יצר נתנאל וינברג</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span className="text-slate-400">ישיבה תיכונית</span>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2">
        {onOpenOnlineMultiplayer && (
          <button
            onClick={onOpenOnlineMultiplayer}
            title="משחק אונליין עם חבר דרך קוד חדר"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/40 text-xs text-amber-300 hover:text-white transition-all font-bold"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">שחק אונליין</span>
            <span className="sm:hidden">אונליין</span>
          </button>
        )}

        <button
          onClick={onOpenLeaderboard}
          title="לוח המובילים והישגים כיתתיים"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-xs text-amber-300 hover:text-amber-200 transition-all font-semibold"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">לוח מובילים</span>
          {unlockedAchievementsCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
              {unlockedAchievementsCount}
            </span>
          )}
        </button>

        <button
          onClick={onOpenSheetSettings}
          title="הגדרות מקור נתונים (Google Sheets)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
        >
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline max-w-[120px] truncate">{sourceName}</span>
          <span className="sm:hidden">גיליון</span>
        </button>

        <button
          onClick={toggleMute}
          title={isMuted ? 'הפעל צלילים' : 'השתק צלילים'}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
        </button>

        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'צא ממסך מלא' : 'מסך מלא (מומלץ למקרן)'}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-slate-300" />}
        </button>

        {inGame && (
          <button
            onClick={onGoHome}
            title="חזרה למסך הבית"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">יציאה לבית</span>
          </button>
        )}
      </div>
    </header>
  );
};

