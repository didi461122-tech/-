import React, { useState, useEffect } from 'react';
import { multiplayerService } from '../services/multiplayerService';
import { OnlineGameMode, OnlineHeadToHeadSubMode } from '../types/multiplayer';
import { Difficulty } from '../types/quiz';
import { sound } from '../utils/audio';
import { 
  X, Users, Swords, Trophy, Sparkles, PlusCircle, 
  LogIn, RefreshCw, AlertCircle, ArrowLeft, ShieldCheck, 
  Radio, Zap, Clock
} from 'lucide-react';

interface OnlineLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTopics: string[];
}

export const OnlineLobbyModal: React.FC<OnlineLobbyModalProps> = ({
  isOpen,
  onClose,
  availableTopics
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join' | 'rooms'>('create');
  
  // Create Room State
  const [hostName, setHostName] = useState<string>('שחקן 1');
  const [mode, setMode] = useState<OnlineGameMode>('head_to_head');
  const [subMode, setSubMode] = useState<OnlineHeadToHeadSubMode>('simultaneous');
  const [targetScore, setTargetScore] = useState<number>(5);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['כל הנושאים']);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>(['קל', 'בינוני', 'קשה']);

  // Join Room State
  const [joinCode, setJoinCode] = useState<string>('');
  const [joinPlayerName, setJoinPlayerName] = useState<string>('חבר אורח');

  // Rooms List State
  const [roomsList, setRoomsList] = useState<{
    id: string;
    name: string;
    hostName: string;
    mode: OnlineGameMode;
    subMode: OnlineHeadToHeadSubMode;
    playerCount: number;
    maxPlayers: number;
    status: string;
  }[]>([]);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(multiplayerService.isConnected());

  useEffect(() => {
    if (isOpen) {
      multiplayerService.connect();
      multiplayerService.requestRoomsList();
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubList = multiplayerService.onRoomsList((rooms) => {
      setRoomsList(rooms);
    });

    const unsubError = multiplayerService.onError((msg) => {
      sound.playWrong();
      setErrorMsg(msg);
    });

    const unsubConn = multiplayerService.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    return () => {
      unsubList();
      unsubError();
      unsubConn();
    };
  }, []);

  if (!isOpen) return null;

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setErrorMsg(null);

    if (!hostName.trim()) {
      setErrorMsg('נא להזין את שמך כמארח המשחק');
      return;
    }

    multiplayerService.createRoom({
      hostName: hostName.trim(),
      mode,
      subMode,
      selectedTopics,
      selectedDifficulties,
      targetScore: mode === 'head_to_head' ? targetScore : 2
    });
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setErrorMsg(null);

    const cleanCode = joinCode.trim();
    if (!cleanCode || cleanCode.length < 4) {
      setErrorMsg('נא להזין קוד חדר תקין בן 4 ספרות');
      return;
    }

    if (!joinPlayerName.trim()) {
      setErrorMsg('נא להזין את שמך להצטרפות');
      return;
    }

    multiplayerService.joinRoom(cleanCode, joinPlayerName.trim());
  };

  const handleDirectJoin = (roomId: string) => {
    sound.playClick();
    setErrorMsg(null);
    const name = joinPlayerName.trim() || 'שחקן אורח';
    multiplayerService.joinRoom(roomId, name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black font-heading text-white">שחק אונליין עם חברים</h2>
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              </div>
              <p className="text-xs text-slate-400">
                קרבות בזמן אמת דרך קוד חדר אישי · 100% שאלות אמריקאיות עם בדיקה אוטומטית
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-2">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('create');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'create'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>פתח חדר חדש</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('join');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'join'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>הצטרף עם קוד</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('rooms');
              setErrorMsg(null);
              multiplayerService.requestRoomsList();
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all relative ${
              activeTab === 'rooms'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>חדרים פתוחים</span>
            {roomsList.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                {roomsList.length}
              </span>
            )}
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: CREATE ROOM */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateRoom} className="space-y-6">
              {/* Host Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  השם שלך (מארח המשחק):
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="למשל: דוד"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              {/* Select Online Mode: Head to Head vs World Cup */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  בחר סוג משחק אונליין:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setMode('kahoot');
                    }}
                    className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      mode === 'kahoot'
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-sm text-white">קהוט כיתתי המוני</div>
                    </div>
                    <p className="text-xs text-slate-400">
                      כל הכיתה עונה יחד מהטלפונים מול המקרן! ניקוד מהירות ופודיום.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setMode('head_to_head');
                    }}
                    className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      mode === 'head_to_head'
                        ? 'bg-rose-950/40 border-rose-500 text-white shadow-lg shadow-rose-500/10 ring-2 ring-rose-500/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                        <Swords className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-sm text-white">קרב ראש בראש (2 שחקנים)</div>
                    </div>
                    <p className="text-xs text-slate-400">
                      קרב מהיר ומותח אחד על אחד. שאלות אמריקאיות עם קוד חדר.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setMode('world_cup');
                    }}
                    className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      mode === 'world_cup'
                        ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-sm text-white">מונדיאל תנ״ך (4-8)</div>
                    </div>
                    <p className="text-xs text-slate-400">
                      עץ טורניר נוק-אאוט מלא ברשת! רבעי גמר, חצאי גמר וגמר הגדול.
                    </p>
                  </button>
                </div>
              </div>

              {/* Head-to-Head Sub-modes */}
              {mode === 'head_to_head' && (
                <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    <span>סגנון משחק ראש בראש אונליין:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setSubMode('simultaneous');
                      }}
                      className={`p-3 rounded-xl border text-right transition-all ${
                        subMode === 'simultaneous'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="font-bold text-xs text-white mb-0.5">קרב מהירות סימולטני</div>
                      <div className="text-[11px] text-slate-400">שניכם רואים את אותה שאלה במקביל. מי שעונה ראשון נכון מקבל נקודה!</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setSubMode('turn_based');
                      }}
                      className={`p-3 rounded-xl border text-right transition-all ${
                        subMode === 'turn_based'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="font-bold text-xs text-white mb-0.5">פינג-פונג תורות</div>
                      <div className="text-[11px] text-slate-400">שאלות בתורות. כשאחד טועה השאלה עוברת לשני ללא חשיפה!</div>
                    </button>
                  </div>

                  {/* Target Score */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-300">יעד נקודות לניצחון בקרב:</span>
                    <div className="flex gap-1.5">
                      {[3, 5, 7, 10].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setTargetScore(s)}
                          className={`w-8 h-7 rounded-lg text-xs font-bold ${
                            targetScore === s ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-base font-heading shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 fill-slate-950" />
                <span>פתח חדר וקבל קוד אישי לחברים!</span>
              </button>
            </form>
          )}

          {/* TAB 2: JOIN WITH CODE */}
          {activeTab === 'join' && (
            <form onSubmit={handleJoinWithCode} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  השם שלך:
                </label>
                <input
                  type="text"
                  value={joinPlayerName}
                  onChange={(e) => setJoinPlayerName(e.target.value)}
                  placeholder="הזן את שמך"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  קוד החדר (4 ספרות שהמארח שיתף):
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="למשל: 4821"
                  className="w-full text-center text-3xl tracking-widest font-mono font-black py-4 rounded-2xl bg-slate-950 border-2 border-amber-500/50 text-amber-300 focus:border-amber-400 focus:outline-none shadow-inner"
                  required
                />
              </div>

              {/* Virtual Keypad for easy projector/tablet touch input */}
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'נקה', '0', '←'].map((btn) => (
                  <button
                    key={btn}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      if (btn === 'נקה') {
                        setJoinCode('');
                      } else if (btn === '←') {
                        setJoinCode(prev => prev.slice(0, -1));
                      } else if (joinCode.length < 4) {
                        setJoinCode(prev => prev + btn);
                      }
                    }}
                    className="py-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500 text-slate-200 font-mono font-bold text-lg active:scale-95 transition-all"
                  >
                    {btn}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={joinCode.length < 4}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-black text-base font-heading shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                <span>הצטרף לחדר המשחק</span>
              </button>
            </form>
          )}

          {/* TAB 3: LIVE ROOMS LIST */}
          {activeTab === 'rooms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  חדרים שממתינים לשחקנים כעת ברשת:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    multiplayerService.requestRoomsList();
                  }}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>רענן רשימה</span>
                </button>
              </div>

              {roomsList.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-3">
                  <Users className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">אין כרגע חדרים ממתינים</p>
                  <p className="text-xs text-slate-500">היה הראשון לפתוח חדר והזמן חבר לשחק!</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
                  >
                    פתח חדר חדש עכשיו
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {roomsList.map(r => (
                    <div
                      key={r.id}
                      className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/40 flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-amber-400 text-base tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            #{r.id}
                          </span>
                          <span className="font-bold text-white text-sm">{r.name}</span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-3">
                          <span>מארח: <strong className="text-slate-300">{r.hostName}</strong></span>
                          <span>סוג: <strong className="text-slate-300">{r.mode === 'head_to_head' ? 'ראש בראש' : 'מונדיאל תנ״ך'}</strong></span>
                          <span>משתתפים: <strong className="text-amber-400">{r.playerCount}/{r.maxPlayers}</strong></span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDirectJoin(r.id)}
                        className="py-2 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>הצטרף</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
