import React, { useState, useMemo } from 'react';
import { DEFAULT_CONNECTIONS, ConnectionGroup } from '../services/sheetService';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Sparkles, CheckCircle2, RotateCcw, AlertCircle, ArrowRight } from 'lucide-react';

interface ConnectionsGameProps {
  onExit: () => void;
  onCompleted?: (solvedCount: number) => void;
}

interface CardItem {
  id: string;
  text: string;
  groupId: string;
}

const CATEGORY_COLORS = [
  'bg-amber-500 text-slate-950 border-amber-400',
  'bg-emerald-500 text-slate-950 border-emerald-400',
  'bg-blue-500 text-white border-blue-400',
  'bg-purple-500 text-white border-purple-400'
];

export const ConnectionsGame: React.FC<ConnectionsGameProps> = ({ onExit, onCompleted }) => {
  const groups: ConnectionGroup[] = DEFAULT_CONNECTIONS;

  // Flatten and shuffle 16 cards
  const initialCards = useMemo(() => {
    const list: CardItem[] = [];
    groups.forEach(g => {
      g.items.forEach((item, idx) => {
        list.push({
          id: `${g.id}-${idx}`,
          text: item,
          groupId: g.id
        });
      });
    });
    return list.sort(() => Math.random() - 0.5);
  }, [groups]);

  const [cards, setCards] = useState<CardItem[]>(initialCards);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [solvedGroups, setSolvedGroups] = useState<ConnectionGroup[]>([]);
  const [mistakesLeft, setMistakesLeft] = useState(4);
  const [message, setMessage] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);

  const toggleSelectCard = (id: string) => {
    setMessage(null);
    if (selectedCardIds.includes(id)) {
      setSelectedCardIds(selectedCardIds.filter(cid => cid !== id));
    } else {
      if (selectedCardIds.length >= 4) return;
      setSelectedCardIds([...selectedCardIds, id]);
    }
  };

  const handleCheckConnection = () => {
    if (selectedCardIds.length !== 4) {
      setMessage({ text: 'יש לבחור בדיוק 4 כרטיסיות', type: 'info' });
      return;
    }

    const selectedCards = cards.filter(c => selectedCardIds.includes(c.id));
    const firstGroup = selectedCards[0].groupId;
    const allSame = selectedCards.every(c => c.groupId === firstGroup);

    if (allSame) {
      // Solved group!
      const groupObj = groups.find(g => g.id === firstGroup)!;
      sound.playCorrect();
      confetti({ particleCount: 60, spread: 60 });

      const nextSolved = [...solvedGroups, groupObj];
      setSolvedGroups(nextSolved);
      setCards(cards.filter(c => !selectedCardIds.includes(c.id)));
      setSelectedCardIds([]);
      setMessage({ text: `מצוין! מצאתם את הקשר: ${groupObj.category}`, type: 'success' });

      if (onCompleted) {
        onCompleted(nextSolved.length);
      }

      if (nextSolved.length === 4) {
        sound.playFanfare();
        confetti({ particleCount: 150, spread: 100 });
      }
    } else {
      // Check if 3 out of 4 match for helpful hint
      const groupCounts: { [k: string]: number } = {};
      selectedCards.forEach(c => {
        groupCounts[c.groupId] = (groupCounts[c.groupId] || 0) + 1;
      });
      const hasThree = Object.values(groupCounts).includes(3);

      sound.playWrong();
      setMistakesLeft(prev => Math.max(0, prev - 1));

      if (hasThree) {
        setMessage({ text: 'קרוב מאוד! 3 מתוך 4 נכונים...', type: 'info' });
      } else {
        setMessage({ text: 'אין קשר משותף בין ארבעת הכרטיסיות', type: 'error' });
      }
    }
  };

  const handleReset = () => {
    setCards(initialCards.sort(() => Math.random() - 0.5));
    setSelectedCardIds([]);
    setSolvedGroups([]);
    setMistakesLeft(4);
    setMessage(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-slate-100 min-h-[calc(100vh-5rem)] flex flex-col justify-between" dir="rtl">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-3xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-amber-300 to-amber-500 flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-cyan-400" />
              <span>חיבורי תנ"ך (16 כרטיסיות)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              מצא 4 קבוצות של 4 מושגים מהתנ"ך בעלי מכנה משותף!
            </p>
          </div>

          <button
            onClick={onExit}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            חזרה להגדרות
          </button>
        </div>

        {/* Mistakes remaining & status */}
        <div className="flex items-center justify-between mb-4 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">פסילות שנותרו:</span>
            <div className="flex gap-1.5">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    i < mistakesLeft ? 'bg-amber-400' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-400">
            נפתרו: <span className="text-emerald-400 font-bold">{solvedGroups.length}</span> מתוך 4
          </div>
        </div>

        {/* Solved Groups Banners */}
        <div className="space-y-2 mb-4">
          {solvedGroups.map((g, idx) => (
            <div
              key={g.id}
              className={`p-4 rounded-2xl border ${CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} text-center shadow-lg transition-all animate-fadeIn`}
            >
              <div className="font-extrabold text-base md:text-lg font-heading">{g.category}</div>
              <div className="text-xs opacity-90 mt-1 font-medium">{g.items.join(' · ')}</div>
              <div className="text-[11px] opacity-75 mt-1 font-serif">{g.sourceExplanation}</div>
            </div>
          ))}
        </div>

        {/* Grid of Remaining Cards */}
        {cards.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
            {cards.map(c => {
              const isSelected = selectedCardIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleSelectCard(c.id)}
                  className={`min-h-[75px] md:min-h-[85px] p-3 rounded-2xl border text-center font-bold text-sm md:text-base font-heading transition-all flex items-center justify-center shadow-md active:scale-95 ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 border-amber-300 scale-102 shadow-amber-500/20'
                      : 'bg-slate-900/90 text-slate-100 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <span>{c.text}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-emerald-950/40 border border-emerald-500/50 text-center space-y-3 my-6 animate-pulse">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
            <h3 className="text-3xl font-black font-heading text-white">ניצחון! פתרתם את כל החיבורים!</h3>
            <p className="text-sm text-emerald-200">כל הכבוד לכיתה על בקיאות מעולה בנושאי התנ"ך.</p>
          </div>
        )}

        {/* Message Banner */}
        {message && (
          <div
            className={`p-3 rounded-xl border text-xs text-center font-medium my-3 ${
              message.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                : message.type === 'error'
                ? 'bg-red-950/60 border-red-500 text-red-300'
                : 'bg-amber-950/60 border-amber-500 text-amber-300'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* Control Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-6 border-t border-slate-800">
        <button
          onClick={handleCheckConnection}
          disabled={selectedCardIds.length !== 4 || cards.length === 0}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold font-heading shadow-lg shadow-amber-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          בדוק חיבור ({selectedCardIds.length}/4 נבחרו)
        </button>

        <button
          onClick={() => setSelectedCardIds([])}
          disabled={selectedCardIds.length === 0}
          className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors disabled:opacity-40"
        >
          נקה בחירה
        </button>

        <button
          onClick={handleReset}
          className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>משחק חדש</span>
        </button>
      </div>
    </div>
  );
};
