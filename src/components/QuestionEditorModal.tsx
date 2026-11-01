import React, { useState } from 'react';
import { Question, Difficulty } from '../types/quiz';
import { sound } from '../utils/audio';
import { 
  Sparkles, PlusCircle, BookOpen, Trash2, Download, 
  Upload, Check, AlertCircle, RefreshCw, X, Layers
} from 'lucide-react';

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestions: (newQuestions: Question[]) => void;
  existingCustomQuestions?: Question[];
  onDeleteCustomQuestion?: (id: string) => void;
}

const TANACH_BOOKS = [
  'בראשית', 'שמות', 'ויקרא', 'במדבר', 'דברים',
  'יהושע', 'שופטים', 'שמואל', 'מלכים', 'ישעיהו', 'ירמיהו', 'יחזקאל', 'תרי עשר',
  'תהלים', 'משלי', 'איוב', 'שיר השירים', 'רות', 'איכה', 'קהלת', 'אסתר', 'דניאל', 'עזרא ונחמיה', 'דברי הימים'
];

const PARASHOT = [
  'בראשית', 'נח', 'לך לך', 'וירא', 'חיי שרה', 'תולדות', 'ויצא', 'וישלח', 'וישב', 'מקץ', 'ויגש', 'ויחי',
  'שמות', 'וארא', 'בא', 'בשלח', 'יתרו', 'משפטים', 'תרומה', 'תצוה', 'כי תשא', 'ויקהל', 'פקודי',
  'ויקרא', 'צו', 'שמיני', 'תזריע', 'מצורע', 'אחרי מות', 'קדושים', 'אמור', 'בהר', 'בחקתי',
  'במדבר', 'נשא', 'בהעלתך', 'שלח לך', 'קרח', 'חקת', 'בלק', 'פינחס', 'מטות', 'מסעי',
  'דברים', 'ואתחנן', 'עקב', 'ראה', 'שפטים', 'כי תצא', 'כי תבוא', 'נצבים', 'וילך', 'האזינו', 'וזאת הברכה'
];

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  onClose,
  onAddQuestions,
  existingCustomQuestions = [],
  onDeleteCustomQuestion
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual' | 'manage'>('ai');

  // AI Generator state
  const [selectedBook, setSelectedBook] = useState<string>('בראשית');
  const [selectedParasha, setSelectedParasha] = useState<string>('');
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('בינוני');
  const [aiCount, setAiCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  // Manual Form state
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualCorrect, setManualCorrect] = useState('');
  const [manualOpt2, setManualOpt2] = useState('');
  const [manualOpt3, setManualOpt3] = useState('');
  const [manualOpt4, setManualOpt4] = useState('');
  const [manualTopic, setManualTopic] = useState('בראשית');
  const [manualDiff, setManualDiff] = useState<Difficulty>('בינוני');
  const [manualSource, setManualSource] = useState('');
  const [manualQuote, setManualQuote] = useState('');
  const [manualSuccess, setManualSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setAiError(null);
    sound.playClick();

    try {
      const res = await fetch('/api/gemini/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedBook,
          parasha: selectedParasha || undefined,
          difficulty: aiDifficulty,
          count: aiCount
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'שגיאה ביצירת שאלות');
      }

      setGeneratedQuestions(data.questions || []);
      sound.playCorrect();
    } catch (err) {
      console.error(err);
      setAiError(err instanceof Error ? err.message : 'שגיאה בתקשורת עם השרת');
      sound.playWrong();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGenerated = () => {
    if (generatedQuestions.length === 0) return;
    sound.playClick();
    onAddQuestions(generatedQuestions);
    setGeneratedQuestions([]);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    if (!manualQuestion.trim() || !manualCorrect.trim() || !manualOpt2.trim() || !manualOpt3.trim() || !manualOpt4.trim()) {
      return;
    }

    const newQ: Question = {
      id: `custom_${Date.now()}`,
      questionType: 'רב ברירה',
      topic: manualTopic,
      difficulty: manualDiff,
      question: manualQuestion.trim(),
      correctAnswer: manualCorrect.trim(),
      option2: manualOpt2.trim(),
      option3: manualOpt3.trim(),
      option4: manualOpt4.trim(),
      source: manualSource.trim() || manualTopic,
      quote: manualQuote.trim(),
      author: 'מורה / רב הכיתה'
    };

    onAddQuestions([newQ]);
    setManualSuccess(true);
    setManualQuestion('');
    setManualCorrect('');
    setManualOpt2('');
    setManualOpt3('');
    setManualOpt4('');
    setManualSource('');
    setManualQuote('');
    setTimeout(() => setManualSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" dir="rtl">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black font-heading text-white">מחולל ועורך שאלות תנ"ך</h2>
              <p className="text-xs text-slate-400">יצירת שאלות AI לפי ספר/פרשה והוספת שאלות אישיות למאגר</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'ai'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>מחולל בינה מלאכותית (AI)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'manual'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>הוספת שאלה ידנית</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'manage'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>ניהול שאלות מותאמות ({existingCustomQuestions.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: AI GENERATOR */}
          {activeTab === 'ai' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                המודל מנתח את פשט הפסוקים ומפרשי התנ"ך ומייצר שאלות אמריקאיות מדויקות עם 4 אפשרויות ומקור תנ"כי.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    בחר ספר מהתנ"ך:
                  </label>
                  <select
                    value={selectedBook}
                    onChange={(e) => {
                      setSelectedBook(e.target.value);
                      setSelectedParasha('');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {TANACH_BOOKS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    או בחר פרשת שבוע ספציפית:
                  </label>
                  <select
                    value={selectedParasha}
                    onChange={(e) => setSelectedParasha(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">(כללי לספר שנבחר)</option>
                    {PARASHOT.map(p => (
                      <option key={p} value={p}>פרשת {p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    רמת קושי מבוקשת:
                  </label>
                  <div className="flex gap-2">
                    {(['קל', 'בינוני', 'קשה'] as Difficulty[]).map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setAiDifficulty(d)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                          aiDifficulty === d
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-slate-950 border border-slate-800 text-slate-400'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    כמות שאלות לחולל:
                  </label>
                  <div className="flex gap-2">
                    {[3, 5, 8].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setAiCount(cnt)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                          aiCount === cnt
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-slate-950 border border-slate-800 text-slate-400'
                        }`}
                      >
                        {cnt} שאלות
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {aiError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerateAI}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>הבינה המלאכותית מחברת שאלות...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>חולל {aiCount} שאלות על {selectedParasha ? `פרשת ${selectedParasha}` : selectedBook}</span>
                  </>
                )}
              </button>

              {/* Generated preview list */}
              {generatedQuestions.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white">
                      שאלות שחוללו בהצלחה ({generatedQuestions.length}):
                    </h3>
                    <button
                      type="button"
                      onClick={handleSaveGenerated}
                      className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>הוסף הכל למאגר המשחק</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {generatedQuestions.map((q, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="font-bold text-sm text-white">
                          {idx + 1}. {q.question}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500 text-emerald-300 font-semibold">
                            ✓ {q.correctAnswer}
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900 text-slate-400">{q.option2}</div>
                          <div className="p-2 rounded-lg bg-slate-900 text-slate-400">{q.option3}</div>
                          <div className="p-2 rounded-lg bg-slate-900 text-slate-400">{q.option4}</div>
                        </div>
                        <div className="text-[11px] text-amber-400/90 pt-1">
                          מקור: {q.source} {q.quote ? `| "${q.quote}"` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANUAL QUESTION FORM */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              {manualSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500 text-xs text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>השאלה נשמרה בהצלחה במאגר!</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  נוסח השאלה:
                </label>
                <textarea
                  rows={2}
                  value={manualQuestion}
                  onChange={(e) => setManualQuestion(e.target.value)}
                  placeholder="למשל: מי היה המלך הראשון שמלך על ישראל?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-emerald-400 mb-1">
                    התשובה הנכונה:
                  </label>
                  <input
                    type="text"
                    value={manualCorrect}
                    onChange={(e) => setManualCorrect(e.target.value)}
                    placeholder="שאול בן קיש"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/70 text-sm text-emerald-200 focus:outline-none focus:border-emerald-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    תשובה שגויה 1:
                  </label>
                  <input
                    type="text"
                    value={manualOpt2}
                    onChange={(e) => setManualOpt2(e.target.value)}
                    placeholder="דוד בן ישי"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    תשובה שגויה 2:
                  </label>
                  <input
                    type="text"
                    value={manualOpt3}
                    onChange={(e) => setManualOpt3(e.target.value)}
                    placeholder="שלמה המלך"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    תשובה שגויה 3:
                  </label>
                  <input
                    type="text"
                    value={manualOpt4}
                    onChange={(e) => setManualOpt4(e.target.value)}
                    placeholder="ירבעם בן נבט"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">ספר/נושא:</label>
                  <select
                    value={manualTopic}
                    onChange={(e) => setManualTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none"
                  >
                    {TANACH_BOOKS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">רמת קושי:</label>
                  <select
                    value={manualDiff}
                    onChange={(e) => setManualDiff(e.target.value as Difficulty)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none"
                  >
                    <option value="קל">קל</option>
                    <option value="בינוני">בינוני</option>
                    <option value="קשה">קשה</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">מקור (פרק ופסוק):</label>
                  <input
                    type="text"
                    value={manualSource}
                    onChange={(e) => setManualSource(e.target.value)}
                    placeholder="שמואל א י, כד"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ציטוט הפסוק (מוצג בסיום התשובה):
                </label>
                <input
                  type="text"
                  value={manualQuote}
                  onChange={(e) => setManualQuote(e.target.value)}
                  placeholder="הֲרְאִיתֶם אֲשֶׁר בָּחַר בּוֹ ה' כִּי אֵין כָּמֹהוּ בְּכָל הָעָם"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>שמור שאלה זו במאגר</span>
              </button>
            </form>
          )}

          {/* TAB 3: MANAGE CUSTOM QUESTIONS */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  סה"כ {existingCustomQuestions.length} שאלות מותאמות אישית
                </span>
                {existingCustomQuestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(existingCustomQuestions, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute('href', dataStr);
                      downloadAnchor.setAttribute('download', 'tanach_custom_questions.json');
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ייצוא לקובץ JSON</span>
                  </button>
                )}
              </div>

              {existingCustomQuestions.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-xs space-y-1">
                  <Layers className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="font-semibold text-slate-300">עדיין לא הוספת שאלות מותאמות אישית</p>
                  <p>השתמש במחולל ה-AI או הוסף שאלות משלך בלשוניות למעלה</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {existingCustomQuestions.map((q, idx) => (
                    <div key={q.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                      <div className="space-y-0.5 truncate flex-1">
                        <div className="font-bold text-xs text-white truncate">{idx + 1}. {q.question}</div>
                        <div className="text-[11px] text-slate-400">
                          תשובה: <strong className="text-emerald-400">{q.correctAnswer}</strong> · {q.topic} ({q.difficulty})
                        </div>
                      </div>
                      {onDeleteCustomQuestion && (
                        <button
                          type="button"
                          onClick={() => onDeleteCustomQuestion(q.id)}
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
