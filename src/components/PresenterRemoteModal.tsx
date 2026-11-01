import React, { useState } from 'react';
import { multiplayerService } from '../services/multiplayerService';
import { sound } from '../utils/audio';
import { 
  Smartphone, Play, ChevronLeft, Eye, Volume2, 
  RotateCcw, Check, Sparkles, X, AlertCircle
} from 'lucide-react';

interface PresenterRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PresenterRemoteModal: React.FC<PresenterRemoteModalProps> = ({
  isOpen,
  onClose
}) => {
  const [roomId, setRoomId] = useState('');
  const [remotePin, setRemotePin] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    sound.playClick();

    if (!roomId.trim()) {
      setErrorMsg('נא להזין קוד חדר');
      return;
    }

    multiplayerService.joinRoom(roomId.trim(), 'שלט מנחה', {
      asRemote: true,
      remotePin: remotePin.trim()
    });

    setIsConnected(true);
  };

  const handleAction = (action: 'start' | 'next' | 'reveal' | 'sound', soundName?: string) => {
    sound.playClick();
    multiplayerService.sendRemoteAction(action, soundName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" dir="rtl">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">שלט רחוק למנחה / מורה</h3>
              <p className="text-xs text-slate-400">שליטה במקרן הכיתה מהטלפון הנייד</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {!isConnected ? (
            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  קוד החדר שמוקרן על הלוח:
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="למשל: 4295"
                  className="w-full text-center text-2xl font-mono font-bold py-3 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  קוד שלט מנחה (מופיע במקרן):
                </label>
                <input
                  type="text"
                  value={remotePin}
                  onChange={(e) => setRemotePin(e.target.value)}
                  placeholder="למשל: 812"
                  className="w-full text-center text-lg font-mono py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {errorMsg && (
                <div className="text-xs text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>התחבר ופתח שלט רחוק</span>
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-emerald-400 font-semibold text-center flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>מחובר בהצלחה לחדר #{roomId}</span>
              </div>

              {/* Main Controls */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleAction('reveal')}
                  className="p-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-md transition-all flex flex-col items-center justify-center gap-2"
                >
                  <Eye className="w-6 h-6" />
                  <span>חשוף תשובה במקרן</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction('next')}
                  className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md transition-all flex flex-col items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-6 h-6" />
                  <span>שאלה הבאה</span>
                </button>
              </div>

              {/* Sound Effects Board */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-2">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>אפקטים קוליים להשמעה במקרן:</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAction('sound', 'correct')}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-emerald-300 font-bold border border-slate-800"
                  >
                    🔔 צליל נכון
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction('sound', 'wrong')}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-rose-300 font-bold border border-slate-800"
                  >
                    ❌ צליל טעות
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction('sound', 'fanfare')}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-amber-300 font-bold border border-slate-800"
                  >
                    🎺 תרועת ניצחון
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction('sound', 'tick')}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-blue-300 font-bold border border-slate-800"
                  >
                    ⏱️ תקתוק זמן
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsConnected(false)}
                className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-bold hover:text-white"
              >
                התנתק משלט זה
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
