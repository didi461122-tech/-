import React, { useEffect } from 'react';
import { AchievementNotification } from '../types/achievements';
import { 
  Trophy, Flame, Zap, Crown, BookMarked, Scroll, Shield, 
  Compass, Gem, Layers, Sparkles, Clock, Target, Award, Star, X 
} from 'lucide-react';
import { sound } from '../utils/audio';

interface AchievementToastProps {
  notifications: AchievementNotification[];
  onDismiss: (id: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Flame: <Flame className="w-6 h-6 text-amber-400 animate-pulse" />,
  Zap: <Zap className="w-6 h-6 text-amber-400" />,
  Crown: <Crown className="w-6 h-6 text-yellow-300" />,
  BookMarked: <BookMarked className="w-6 h-6 text-blue-400" />,
  Scroll: <Scroll className="w-6 h-6 text-amber-300" />,
  Shield: <Shield className="w-6 h-6 text-emerald-400" />,
  Compass: <Compass className="w-6 h-6 text-cyan-400" />,
  Gem: <Gem className="w-6 h-6 text-purple-400" />,
  Trophy: <Trophy className="w-6 h-6 text-amber-400" />,
  Layers: <Layers className="w-6 h-6 text-cyan-400" />,
  Sparkles: <Sparkles className="w-6 h-6 text-pink-400" />,
  Clock: <Clock className="w-6 h-6 text-amber-300" />,
  Target: <Target className="w-6 h-6 text-emerald-400" />,
  Award: <Award className="w-6 h-6 text-amber-400" />,
  Star: <Star className="w-6 h-6 text-yellow-300" />
};

export const AchievementToast: React.FC<AchievementToastProps> = ({
  notifications,
  onDismiss
}) => {
  useEffect(() => {
    if (notifications.length > 0) {
      sound.playLifeline();
    }
  }, [notifications.length]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 max-w-md w-full px-4 pointer-events-none" dir="rtl">
      {notifications.map(notif => (
        <div
          key={notif.id}
          className="pointer-events-auto bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950/90 border-2 border-amber-400/80 rounded-2xl p-4 shadow-2xl shadow-amber-500/30 flex items-center justify-between gap-3 animate-bounce"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              {ICON_MAP[notif.iconName] || <Trophy className="w-6 h-6 text-amber-400" />}
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold text-amber-300 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>הישג חדש נפתח!</span>
              </div>
              <div className="text-base font-black font-heading text-white">
                {notif.title}
              </div>
              <div className="text-xs text-slate-300">
                {notif.description}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <button
              onClick={() => onDismiss(notif.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-bold font-mono text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
              +{notif.xpReward} נק'
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
