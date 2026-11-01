import React, { useState, useEffect, useMemo } from 'react';
import { GameMode, HeadToHeadSubType, Difficulty, GameSettings } from '../types/quiz';
import { isTanachBook } from '../utils/tanachOrder';
import { sound } from '../utils/audio';
import { 
  Target, Swords, Gem, Trophy, Layers, CheckCircle2, 
  Clock, Sparkles, Users, BookOpen, AlertCircle, Play,
  Volume2, VolumeX, Zap, Radio, Award, Smartphone, Edit3,
  Compass, Flame, Heart
} from 'lucide-react';

interface HomeScreenProps {
  availableTopics: string[];
  onStartGame: (settings: GameSettings) => void;
  questionsCount: number;
  onOpenLeaderboard?: () => void;
  onOpenOnlineMultiplayer?: () => void;
  onOpenQuestionEditor?: () => void;
  onOpenRemoteModal?: () => void;
  onOpenBibleMap?: () => void;
}

const DEFAULT_STUDENTS = [
  'דוד בן ישי', 'אלישיב', 'יונתן', 'איתמר', 'יאיר', 
  'נועם', 'אורי', 'אריאל'
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  availableTopics,
  onStartGame,
  questionsCount,
  onOpenLeaderboard,
  onOpenOnlineMultiplayer,
  onOpenQuestionEditor,
  onOpenRemoteModal,
  onOpenBibleMap
}) => {
  const [mode, setMode] = useState<GameMode>('single');
  const [headToHeadSubType, setHeadToHeadSubType] = useState<HeadToHeadSubType>('ping_pong');
  const [targetScore, setTargetScore] = useState<number>(5);
  
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['כל הנושאים']);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>(['קל', 'בינוני', 'קשה']);
  const [timerSeconds, setTimerSeconds] = useState<number>(20);

  // Group topics into Tanakh Books (ordered canonically) and General Topics
  const { tanachBooks, generalTopics } = useMemo(() => {
    const books: string[] = [];
    const general: string[] = [];
    availableTopics.forEach(topic => {
      if (isTanachBook(topic)) {
        books.push(topic);
      } else {
        general.push(topic);
      }
    });
    return { tanachBooks: books, generalTopics: general };
  }, [availableTopics]);
  
  const [player1Name, setPlayer1Name] = useState<string>('מתמודד 1');
  const [player2Name, setPlayer2Name] = useState<string>('מתמודד 2');
  const [studentsText, setStudentsText] = useState<string>(DEFAULT_STUDENTS.join('\n'));
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted());

  useEffect(() => {
    const unsub = sound.subscribe((muted) => setIsMuted(muted));
    return () => unsub();
  }, []);

  const handleToggleMute = (newMuted: boolean) => {
    sound.setMuted(newMuted);
    setIsMuted(newMuted);
    if (!newMuted) {
      sound.playClick();
    }
  };

  const handleModeChange = (newMode: GameMode) => {
    sound.playClick();
    setMode(newMode);
  };

  // Toggle topics
  const handleToggleTopic = (topic: string) => {
    sound.playClick();
    if (topic === 'כל הנושאים') {
      setSelectedTopics(['כל הנושאים']);
      return;
    }
    
    let updated = selectedTopics.filter(t => t !== 'כל הנושאים');
    if (updated.includes(topic)) {
      updated = updated.filter(t => t !== topic);
      if (updated.length === 0) {
        updated = ['כל הנושאים'];
      }
    } else {
      updated.push(topic);
    }
    setSelectedTopics(updated);
  };

  // Toggle difficulties
  const handleToggleDifficulty = (diff: Difficulty) => {
    sound.playClick();
    if (selectedDifficulties.includes(diff)) {
      if (selectedDifficulties.length > 1) {
        setSelectedDifficulties(selectedDifficulties.filter(d => d !== diff));
      }
    } else {
      setSelectedDifficulties([...selectedDifficulties, diff]);
    }
  };

  // Validation & start
  const handleStart = () => {
    sound.playClick();
    setErrorMsg(null);

    if (mode === 'single' || mode === 'millionaire' || mode === 'survival') {
      if (!player1Name.trim()) {
        setErrorMsg('נא להזין שם מתמודד');
        return;
      }
    } else if (mode === 'head_to_head') {
      if (!player1Name.trim() || !player2Name.trim()) {
        setErrorMsg('נא להזין שמות לשני המתמודדים בראש בראש');
        return;
      }
    } else if (mode === 'world_cup') {
      const parsedStudents = studentsText
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      if (parsedStudents.length < 4) {
        setErrorMsg('במונדיאל תנ"ך יש להזין לפחות 4 תלמידים (מומלץ 8)');
        return;
      }
    }

    const studentsList = studentsText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    onStartGame({
      mode,
      headToHeadSubType,
      selectedTopics,
      selectedDifficulties,
      timerSeconds,
      player1Name: player1Name.trim() || 'מתמודד 1',
      player2Name: player2Name.trim() || 'מתמודד 2',
      studentsList: studentsList.length > 0 ? studentsList : DEFAULT_STUDENTS,
      targetScore
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-10" dir="rtl">
      {/* Hero Title Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
            <BookOpen className="w-3.5 h-3.5" />
            <span>מאגר של {questionsCount} שאלות מוכן להקרנה</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% שאלות אמריקאיות (4 תשובות) עם בדיקה והכרזה קולית אוטומטית</span>
          </div>

          {onOpenLeaderboard && (
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-semibold transition-all shadow-sm group"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>לוח המובילים והישגים כיתתיים</span>
            </button>
          )}

          {onOpenOnlineMultiplayer && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenOnlineMultiplayer();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-400/60 text-amber-300 hover:text-white text-xs font-bold transition-all shadow-md group animate-pulse"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:scale-125 transition-transform" />
              <span>שחק אונליין עם חבר דרך קוד</span>
            </button>
          )}
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-heading tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">
          חידוני תנ"ך
        </h1>
        <p className="text-lg md:text-xl text-slate-300 font-medium">
          משחק ידע אינטראקטיבי – <span className="text-amber-400 font-semibold">יצר נתנאל וינברג</span>
        </p>
        <p className="text-xs text-slate-400">
          שאלות אמריקאיות עם 4 אפשרויות ורק אחת נכונה · בדיקה אוטומטית מיידית, חיווי צבעים והכרזה קולית!
        </p>

        {/* Online Multiplayer Spotlight Banner */}
        {onOpenOnlineMultiplayer && (
          <div className="pt-2 max-w-xl mx-auto">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenOnlineMultiplayer();
              }}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-emerald-500/15 hover:from-amber-500/25 hover:via-rose-500/25 hover:to-emerald-500/25 border-2 border-amber-500/50 flex items-center justify-between gap-3 transition-all shadow-xl group text-right"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5 fill-slate-950" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span>משחק אונליין עם חבר או טורניר מונדיאל כיתתי</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black">
                      חדש!
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    אחד יוצר חדר ומקבל קוד 4 ספרות, החברים מתחברים מהמכשירים שלהם לקרב חי!
                  </div>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 shadow-md">
                כנס ללובי אונליין ←
              </div>
            </button>
          </div>
        )}

        {/* Teacher & Classroom Tools Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
          {onOpenQuestionEditor && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenQuestionEditor();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 group"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>מחולל שאלות AI ועורך למורה</span>
            </button>
          )}

          {onOpenRemoteModal && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenRemoteModal();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-indigo-500/40 text-indigo-300 hover:text-indigo-200 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 group"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>שלט רחוק למקרן</span>
            </button>
          )}

          {onOpenBibleMap && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenBibleMap();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-teal-500/20 to-sky-500/20 hover:from-amber-500/30 hover:to-sky-500/30 border border-teal-500/50 text-teal-300 hover:text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 group"
            >
              <Compass className="w-3.5 h-3.5 text-teal-400 group-hover:rotate-45 transition-transform" />
              <span>מפת מסעות ואתרי התנ"ך (חדש!)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Game Modes: 4 Big Colorful Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-xl font-bold font-heading text-slate-100 flex items-center gap-2">
            <span>בחר מצב משחק</span>
          </h2>
          <span className="text-xs text-slate-400">כל המצבים פועלים עם שאלות אמריקאיות בלבד</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Mode 1: מתמודד יחיד */}
          <button
            type="button"
            onClick={() => handleModeChange('single')}
            className={`p-5 rounded-2xl text-right transition-all flex flex-col justify-between border relative overflow-hidden group ${
              mode === 'single'
                ? 'bg-gradient-to-br from-indigo-900/60 to-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/20 ring-2 ring-indigo-400'
                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2 font-heading">
                <span>מתמודד יחיד</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                שאלות אמריקאיות ברצף. כל בחירה נבדקת ומוכרזת אוטומטית עד לטעות הראשונה!
              </p>
            </div>
            {mode === 'single' && (
              <div className="mt-4 flex items-center gap-1.5 text-xs text-indigo-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>נבחר כעת</span>
              </div>
            )}
          </button>

          {/* Mode 2: ראש בראש */}
          <button
            type="button"
            onClick={() => handleModeChange('head_to_head')}
            className={`p-5 rounded-2xl text-right transition-all flex flex-col justify-between border relative overflow-hidden group ${
              mode === 'head_to_head'
                ? 'bg-gradient-to-br from-rose-900/60 to-slate-900 border-rose-500 shadow-xl shadow-rose-500/20 ring-2 ring-rose-400'
                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Swords className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2 font-heading">
                <span>ראש בראש</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                קרב מותח בין 2 שחקנים בשאלות אמריקאיות! מצב פינג-פונג או מצב שורד.
              </p>
            </div>
            {mode === 'head_to_head' && (
              <div className="mt-4 flex items-center gap-1.5 text-xs text-rose-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>נבחר כעת</span>
              </div>
            )}
          </button>

          {/* Mode 3: מי רוצה להיות מיליונר */}
          <button
            type="button"
            onClick={() => handleModeChange('millionaire')}
            className={`p-5 rounded-2xl text-right transition-all flex flex-col justify-between border relative overflow-hidden group ${
              mode === 'millionaire'
                ? 'bg-gradient-to-br from-amber-900/60 to-slate-900 border-amber-500 shadow-xl shadow-amber-500/20 ring-2 ring-amber-400'
                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Gem className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2 font-heading">
                <span>מיליונר התנ"ך</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                15 שאלות אמריקאיות בקושי עולה, מדרגות פרסים עד למיליון ו-3 גלגלי הצלה.
              </p>
            </div>
            {mode === 'millionaire' && (
              <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>נבחר כעת</span>
              </div>
            )}
          </button>

          {/* Mode 4: מונדיאל תנ"ך */}
          <button
            type="button"
            onClick={() => handleModeChange('world_cup')}
            className={`p-5 rounded-2xl text-right transition-all flex flex-col justify-between border relative overflow-hidden group ${
              mode === 'world_cup'
                ? 'bg-gradient-to-br from-emerald-900/60 to-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-400'
                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2 font-heading">
                <span>מונדיאל תנ"ך</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                טורניר כיתתי מלא! קרבות נוק-אאוט 1 על 1 בשאלות אמריקאיות עם בדיקה אוטומטית.
              </p>
            </div>
            {mode === 'world_cup' && (
              <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>נבחר כעת</span>
              </div>
            )}
          </button>

          {/* Mode 5: מרתון הישרדות */}
          <button
            type="button"
            onClick={() => handleModeChange('survival')}
            className={`p-5 rounded-2xl text-right transition-all flex flex-col justify-between border relative overflow-hidden group ${
              mode === 'survival'
                ? 'bg-gradient-to-br from-red-950/70 to-slate-900 border-red-500 shadow-xl shadow-red-500/20 ring-2 ring-red-400'
                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6 text-red-400 fill-red-400/30" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-1.5 font-heading">
                <span>מרתון הישרדות</span>
                <span className="px-1.5 py-0.5 rounded bg-red-500/30 text-red-300 text-[10px] font-bold">חדש</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                3 פסילות (לבבות), רצפי הצלחה (Streaks), מכפילי ניקוד וטיימר מואץ!
              </p>
            </div>
            {mode === 'survival' && (
              <div className="mt-4 flex items-center gap-1.5 text-xs text-red-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>נבחר כעת</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Head to Head Sub-mode details */}
      {mode === 'head_to_head' && (
        <div className="bg-slate-900/90 border border-rose-500/30 p-5 rounded-2xl space-y-4">
          <div className="text-sm font-bold text-rose-400 flex items-center gap-2">
            <Swords className="w-4 h-4" />
            <span>סגנון קרב ראש בראש:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setHeadToHeadSubType('ping_pong')}
              className={`p-4 rounded-xl border text-right transition-colors ${
                headToHeadSubType === 'ping_pong'
                  ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              <div className="font-bold text-white text-base mb-1">פינג פונג</div>
              <div className="text-xs text-slate-300 leading-relaxed">
                כשאחד טועה השאלה עוברת לשני ללא גילוי התשובה. הראשון שמגיע ל-{targetScore} תשובות נכונות מנצח!
              </div>
            </button>

            <button
              type="button"
              onClick={() => setHeadToHeadSubType('survivor')}
              className={`p-4 rounded-xl border text-right transition-colors ${
                headToHeadSubType === 'survivor'
                  ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              <div className="font-bold text-white text-base mb-1">שורד</div>
              <div className="text-xs text-slate-300 leading-relaxed">
                רצף תשובות עד טעות! שחקן 1 צובר תשובות עד שטועה, ואז שחקן 2 מנסה לעקוף אותו במסך השוואה דרמטי.
              </div>
            </button>
          </div>

          {headToHeadSubType === 'ping_pong' && (
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs text-slate-300">יעד תשובות נכונות לניצחון:</span>
              {[3, 5, 7, 10].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setTargetScore(num)}
                  className={`w-9 h-8 rounded-lg text-xs font-bold transition-colors ${
                    targetScore === num
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          )}

          {onOpenOnlineMultiplayer && (
            <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between">
              <span className="text-xs text-rose-300">רוצה לשחק עם חבר שנמצא במחשב או בטלפון אחר?</span>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onOpenOnlineMultiplayer();
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>שחק ראש בראש אונליין</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* World Cup Roster input */}
      {mode === 'world_cup' && (
        <div className="bg-slate-900/90 border border-emerald-500/30 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>רשימת תלמידי הכיתה לטורניר (שם אחד בכל שורה):</span>
            </div>
            <button
              type="button"
              onClick={() => setStudentsText(DEFAULT_STUDENTS.join('\n'))}
              className="text-xs text-slate-400 hover:text-emerald-300 underline"
            >
              טען רשימת ברירת מחדל (8 תלמידים)
            </button>
          </div>
          <textarea
            rows={5}
            value={studentsText}
            onChange={(e) => setStudentsText(e.target.value)}
            placeholder="דוד&#10;אלישיב&#10;יונתן&#10;איתמר"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none font-sans"
          />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <p className="text-xs text-slate-400">
              העץ ייבנה אוטומטית לפי מספר התלמידים. מומלץ 8 או 16 מתמודדים.
            </p>
            {onOpenOnlineMultiplayer && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onOpenOnlineMultiplayer();
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>או פתח מונדיאל תנ״ך אונליין עם קוד</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Player Names (Single / Head-to-Head / Millionaire / Survival) */}
      {(mode === 'single' || mode === 'head_to_head' || mode === 'millionaire' || mode === 'survival') && (
        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-3">
          <h3 className="text-sm font-bold text-slate-200">הזנת שמות שחקנים</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {mode === 'head_to_head' ? 'שם שחקן 1 (כחול):' : 'שם המתמודד / הקבוצה:'}
              </label>
              <input
                type="text"
                value={player1Name}
                onChange={(e) => setPlayer1Name(e.target.value)}
                placeholder="למשל: יאיר / כיתה יא"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {mode === 'head_to_head' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  שם שחקן 2 (אדום):
                </label>
                <input
                  type="text"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  placeholder="למשל: איתמר"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:border-rose-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter Settings: Topics & Difficulties & Timer */}
      {(mode === 'single' || mode === 'head_to_head' || mode === 'world_cup' || mode === 'survival') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Topics selection */}
          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-4 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-slate-200">בחירת נושאים וספרים:</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedTopics(['כל הנושאים'])}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    selectedTopics.includes('כל הנושאים')
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  כל הנושאים ({availableTopics.length})
                </button>
                {tanachBooks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedTopics(tanachBooks);
                    }}
                    className={`text-xs px-2 py-1 rounded-md transition-colors ${
                      !selectedTopics.includes('כל הנושאים') && tanachBooks.length > 0 && tanachBooks.every(b => selectedTopics.includes(b)) && !generalTopics.some(g => selectedTopics.includes(g))
                        ? 'bg-amber-500/30 border border-amber-400 text-amber-300 font-semibold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    רק ספרי תנ״ך ({tanachBooks.length})
                  </button>
                )}
                {generalTopics.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedTopics(generalTopics);
                    }}
                    className={`text-xs px-2 py-1 rounded-md transition-colors ${
                      !selectedTopics.includes('כל הנושאים') && generalTopics.length > 0 && generalTopics.every(g => selectedTopics.includes(g)) && !tanachBooks.some(b => selectedTopics.includes(b))
                        ? 'bg-sky-500/30 border border-sky-400 text-sky-300 font-semibold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    רק נושאים כלליים ({generalTopics.length})
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
              {/* Tanakh Books Section (in biblical order) */}
              {tanachBooks.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-amber-400/90 mb-1.5 flex items-center gap-1.5">
                    <span>📖 ספרי התנ״ך (לפי סדר התנ״ך)</span>
                    <span className="text-[10px] text-slate-500">({tanachBooks.length} ספרים)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tanachBooks.map(topic => {
                      const isSelected = selectedTopics.includes('כל הנושאים') || selectedTopics.includes(topic);
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => handleToggleTopic(topic)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/10'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* General Topics Section */}
              {generalTopics.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-sky-400/90 mb-1.5 flex items-center gap-1.5">
                    <span>🏷️ נושאים כלליים ומורחבים</span>
                    <span className="text-[10px] text-slate-500">({generalTopics.length} נושאים)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {generalTopics.map(topic => {
                      const isSelected = selectedTopics.includes('כל הנושאים') || selectedTopics.includes(topic);
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => handleToggleTopic(topic)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                            isSelected
                              ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-sm shadow-sky-500/10'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Difficulty & Timer */}
          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-5">
            {/* Difficulty */}
            <div>
              <span className="block text-sm font-bold text-slate-200 mb-2">רמת קושי:</span>
              <div className="flex items-center gap-2">
                {(['קל', 'בינוני', 'קשה'] as Difficulty[]).map(diff => {
                  const active = selectedDifficulties.includes(diff);
                  const colors = {
                    'קל': active ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-emerald-400',
                    'בינוני': active ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-amber-400',
                    'קשה': active ? 'bg-rose-500 text-white font-bold' : 'bg-slate-800 text-rose-400'
                  };
                  return (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => handleToggleDifficulty(diff)}
                      className={`flex-1 py-1.5 rounded-lg text-xs transition-colors shadow-sm ${colors[diff]}`}
                    >
                      {diff}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Timer */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>טיימר לשאלה:</span>
                </span>
                <span className="text-xs text-amber-400 font-semibold">
                  {timerSeconds === 0 ? 'ללא הגבלה' : `${timerSeconds} שנ'`}
                </span>
              </div>
              <div className="flex gap-1.5">
                {[10, 15, 20, 30, 0].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setTimerSeconds(s);
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      timerSeconds === s
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {s === 0 ? 'ללא' : `${s}ש`}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound & Audio Settings */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                  <span>צלילי משחק:</span>
                </span>
                <span className={`text-xs font-semibold ${isMuted ? 'text-red-400' : 'text-emerald-400'}`}>
                  {isMuted ? 'מושתק' : 'פעיל'}
                </span>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleToggleMute(false)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    !isMuted
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>הפעל צלילים</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleMute(true)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    isMuted
                      ? 'bg-rose-500 text-white font-bold shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>השתק צלילים</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error notification */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3.5 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Giant Start Button */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={handleStart}
          className="w-full sm:w-auto min-w-[320px] py-4 px-10 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xl font-heading shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto"
        >
          <Play className="w-6 h-6 fill-slate-950" />
          <span>התחל את החידון בכיתה!</span>
        </button>
      </div>
    </div>
  );
};
