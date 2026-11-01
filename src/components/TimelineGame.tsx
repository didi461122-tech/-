import React, { useState } from 'react';
import { DEFAULT_TIMELINE_EVENTS, TimelineEvent, shuffleArray } from '../services/sheetService';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { ArrowUp, ArrowDown, CheckCircle2, RotateCcw, Clock, Sparkles } from 'lucide-react';

interface TimelineGameProps {
  onExit: () => void;
  onSuccess?: () => void;
}

export const TimelineGame: React.FC<TimelineGameProps> = ({ onExit, onSuccess }) => {
  // Pick 5 random events from the full pool and shuffle their display order
  const [events, setEvents] = useState<TimelineEvent[]>(() => {
    return shuffleArray([...DEFAULT_TIMELINE_EVENTS]).slice(0, 5);
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const moveUp = (index: number) => {
    if (index === 0 || isSubmitted) return;
    const updated = [...events];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setEvents(updated);
  };

  const moveDown = (index: number) => {
    if (index === events.length - 1 || isSubmitted) return;
    const updated = [...events];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setEvents(updated);
  };

  const handleCheckOrder = () => {
    const sorted = [...events].sort((a, b) => a.order - b.order);
    const correct = events.every((item, i) => item.id === sorted[i].id);

    setIsCorrect(correct);
    setIsSubmitted(true);

    if (correct) {
      sound.playFanfare();
      confetti({ particleCount: 120, spread: 80 });
      if (onSuccess) {
        onSuccess();
      }
    } else {
      sound.playWrong();
    }
  };

  const handleRestart = () => {
    setEvents(shuffleArray([...DEFAULT_TIMELINE_EVENTS]).slice(0, 5));
    setIsSubmitted(false);
    setIsCorrect(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-slate-100 min-h-[calc(100vh-5rem)] flex flex-col justify-between" dir="rtl">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-3xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 flex items-center gap-2">
              <Clock className="w-7 h-7 text-amber-400" />
              <span>סידור כרונולוגי בתנ"ך</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              סדרו את האירועים מהמוקדם ביותר (למעלה) למאוחר ביותר (למטה)!
            </p>
          </div>

          <button
            onClick={onExit}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            חזרה להגדרות
          </button>
        </div>

        {/* Timeline Events List */}
        <div className="space-y-3 my-6">
          {events.map((ev, index) => {
            let statusColor = 'border-slate-700/80 bg-slate-900/90';
            if (isSubmitted) {
              const targetOrder = [...events].sort((a, b) => a.order - b.order)[index].order;
              statusColor = ev.order === targetOrder
                ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                : 'border-rose-500 bg-rose-950/40 text-rose-200';
            }

            return (
              <div
                key={ev.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between shadow-lg ${statusColor}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xs font-mono font-bold text-amber-400">
                    {index + 1}
                  </span>
                  <div>
                    <div className="text-lg font-bold font-heading text-white">{ev.title}</div>
                    <div className="text-xs text-slate-400">{ev.period} · {ev.description}</div>
                  </div>
                </div>

                {!isSubmitted && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="הזז למעלה"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === events.length - 1}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="הזז למטה"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Feedback Result */}
        {isSubmitted && (
          <div className={`p-5 rounded-2xl border text-center space-y-2 mb-4 ${
            isCorrect ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200' : 'bg-rose-950/70 border-rose-500 text-rose-200'
          }`}>
            <div className="text-2xl font-black font-heading">
              {isCorrect ? 'כל הכבוד! סדר כרונולוגי מושלם!' : 'הסדר אינו מדויק, נסו שוב!'}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-center gap-4 pt-6 border-t border-slate-800">
        {!isSubmitted ? (
          <button
            onClick={handleCheckOrder}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold font-heading shadow-lg shadow-amber-500/10 text-base transition-all"
          >
            בדוק את הסדר הכרונולוגי
          </button>
        ) : (
          <button
            onClick={handleRestart}
            className="px-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold font-heading text-base transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>סדר מחדש</span>
          </button>
        )}
      </div>
    </div>
  );
};
