import React, { useState, useEffect } from 'react';
import { SHEET_URL, formatGoogleSheetCsvUrl, parseQuestionsFromCsv } from '../services/sheetService';
import { Question } from '../types/quiz';
import { getApiUrl } from '../utils/serverConfig';
import { 
  Database, Check, AlertCircle, RefreshCw, X, 
  ExternalLink, FileSpreadsheet, Eye, Clipboard, HelpCircle 
} from 'lucide-react';
import { sound } from '../utils/audio';

interface SheetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSource: string;
  onSaveUrl: (url: string) => Promise<void>;
  onResetToDefault: () => Promise<void>;
}

export const SheetSettingsModal: React.FC<SheetSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSource,
  onSaveUrl,
  onResetToDefault
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'paste' | 'help'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [rawCsvInput, setRawCsvInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const stored = localStorage.getItem('tanach_quiz_custom_sheet_url');
      if (stored) {
        setUrlInput(stored);
      } else if (SHEET_URL && !SHEET_URL.includes('YOUR_GOOGLE_SHEETS')) {
        setUrlInput(SHEET_URL);
      }
      setError(null);
      setSuccess(null);
      setPreviewQuestions([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle saving URL
  const handleSave = async () => {
    sound.playClick();
    if (!urlInput.trim()) {
      setError('אנא הזן כתובת תקינה של Google Sheets');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onSaveUrl(urlInput.trim());
      sound.playCorrect();
      setSuccess('הגיליון סונכרן ונטען בהצלחה לחידון!');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1500);
    } catch (err) {
      sound.playWrong();
      setError(err instanceof Error ? err.message : 'שגיאה בחיבור לגיליון');
    } finally {
      setLoading(false);
    }
  };

  // Test and preview questions before applying
  const handleTestConnection = async () => {
    sound.playClick();
    if (!urlInput.trim()) {
      setError('אנא הזן קישור לגיליון');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const exportUrl = formatGoogleSheetCsvUrl(urlInput.trim());
      const proxyUrl = getApiUrl(`/api/sheet-proxy?url=${encodeURIComponent(exportUrl)}`);
      const res = await fetch(proxyUrl);
      
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `שגיאת שרת (${res.status})`);
      }

      const csvText = await res.text();
      const parsed = parseQuestionsFromCsv(csvText);

      setPreviewQuestions(parsed.slice(0, 3));
      sound.playCorrect();
      setSuccess(`בדיקה הצליחה! נמצאו ${parsed.length} שאלות תקינות בגיליון.`);
    } catch (err) {
      sound.playWrong();
      setError(err instanceof Error ? err.message : 'שגיאה בבדיקת הגיליון');
      setPreviewQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle raw CSV paste
  const handleSaveRawCsv = async () => {
    sound.playClick();
    if (!rawCsvInput.trim()) {
      setError('אנא הדבק את שורות הגיליון (CSV)');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const parsed = parseQuestionsFromCsv(rawCsvInput.trim());
      // Save data: use data URL format
      const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(rawCsvInput.trim())}`;
      await onSaveUrl(dataUri);
      sound.playCorrect();
      setSuccess(`מעולה! נטענו ${parsed.length} שאלות ישירות מההדבקה!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      sound.playWrong();
      setError(err instanceof Error ? err.message : 'שגיאה בפענוח הטקסט שהודבק');
    } finally {
      setLoading(false);
    }
  };

  // Reset to default
  const handleReset = async () => {
    sound.playClick();
    setLoading(true);
    setError(null);
    try {
      await onResetToDefault();
      setUrlInput('');
      setRawCsvInput('');
      setPreviewQuestions([]);
      sound.playCorrect();
      setSuccess('החידון שוחזר למאגר השאלות המובנה!');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1200);
    } catch (err) {
      sound.playWrong();
      setError(err instanceof Error ? err.message : 'שגיאה באיפוס');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl shadow-2xl p-6 text-slate-100 relative max-h-[92vh] flex flex-col overflow-hidden"
        dir="rtl"
      >
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          title="סגור"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4 shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-heading">סנכרון שאלות מ-Google Sheets</h2>
            <p className="text-xs text-slate-400">חבר את החידון לגיליון שאלות התנ"ך שלך בלחיצה אחת</p>
          </div>
        </div>

        {/* Current status banner */}
        <div className="mb-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-400">מקור שאלות פעיל:</span>
          <span className="font-bold text-amber-300 font-heading truncate max-w-[320px]">{currentSource}</span>
        </div>

        {/* Tabs: URL vs Paste CSV vs Help */}
        <div className="flex border-b border-slate-800 mb-4 shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('url');
            }}
            className={`py-2.5 px-4 font-bold text-xs font-heading border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'url' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>קישור לגיליון (מומלץ)</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('paste');
            }}
            className={`py-2.5 px-4 font-bold text-xs font-heading border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'paste' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clipboard className="w-4 h-4" />
            <span>הדבקה ידנית (CSV)</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('help');
            }}
            className={`py-2.5 px-4 font-bold text-xs font-heading border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'help' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>מדריך הרשאות שיתוף</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-200">
                  הדבק קישור לגיליון Google Sheets שלך:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    dir="ltr"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1.../edit"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 focus:outline-none text-xs text-slate-100 placeholder-slate-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={loading || !urlInput.trim()}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition-colors shrink-0 disabled:opacity-40"
                    title="בדוק תקינות גיליון והצג תצוגה מקדימה"
                  >
                    בדוק חיבור
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  ניתן להזין קישור רגיל (עם /edit) או קישור ייצוא CSV. השרת של האפליקציה עוקף מגבלות CORS אוטומטית.
                </p>
              </div>

              {/* Preview Loaded Questions */}
              {previewQuestions.length > 0 && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/40 space-y-2">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>תצוגה מקדימה מהגיליון שלך (נמצאו שאלות תקינות!):</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {previewQuestions.map((q, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-right">
                        <div className="font-semibold text-white">{idx + 1}. {q.question}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          תשובה נכונה: <span className="text-emerald-300 font-bold">{q.correctAnswer}</span> · נושא: {q.topic}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Required Columns info */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
                <div className="font-bold text-amber-400">עמודות נתמכות בגיליון:</div>
                <div className="font-mono bg-slate-900 p-2 rounded-lg border border-slate-800 text-[11px] overflow-x-auto text-slate-300">
                  question type | Topic | Difficulty | Question | CorrectAnswer | Option2 | Option3 | Option4 | Source | quote | author
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  * המערכת מזהה גם שמות עמודות בעברית (שאלה, תשובה נכונה, מסיח 1, מסיח 2, מסיח 3, נושא, רמת קושי, מקור, ציטוט).
                </p>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-200">
                העתק את השורות מהגיליון / Excel והדבק כאן ישירות:
              </label>
              <textarea
                rows={6}
                dir="auto"
                value={rawCsvInput}
                onChange={(e) => setRawCsvInput(e.target.value)}
                placeholder="סוג שאלה,נושא,קושי,שאלה,תשובה נכונה,אפשרות 2,אפשרות 3,אפשרות 4,מקור,ציטוט,מחבר&#10;רב ברירה,בראשית,קל,באיזה יום נבראו המאורות?,היום הרביעי,היום השלישי,היום החמישי,היום הראשון,בראשית א,ויאמר אלהים יהי מארת,נתנאל"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder-slate-600 font-mono focus:border-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveRawCsv}
                disabled={loading || !rawCsvInput.trim()}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors shadow-md disabled:opacity-40"
              >
                שמור והפעל שאלות מההדבקה
              </button>
            </div>
          )}

          {activeTab === 'help' && (
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs leading-relaxed">
              <div className="font-bold text-amber-400 text-sm">כיצד להגדיר שיתוף תקין ב-Google Sheets:</div>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>פתחו את הגיליון שלכם ב-Google Sheets בדפדפן.</li>
                <li>לחצו בצד שמאל למעלה (או ימין) על הכפתור הכחול <strong>"שיתוף" (Share)</strong>.</li>
                <li>
                  תחת <strong>"גישה כללית" (General Access)</strong>, שנו מ-"מוגבל" (Restricted) אל:
                  <div className="bg-slate-900 border border-amber-500/40 p-2 rounded-lg my-1 text-amber-300 font-bold">
                    ✓ "כל מי שיש לו את הקישור" (Anyone with the link)
                  </div>
                </li>
                <li>ודאו שרמת ההרשאה מוגדרת כ-<strong>"בעל הרשאת צפייה" (Viewer)</strong>.</li>
                <li>לחצו על <strong>"העתקת הקישור" (Copy link)</strong> והדביקו אותו כאן בתיבה.</li>
              </ol>
            </div>
          )}

          {/* Feedback banners */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">שגיאת סנכרון:</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-950/60 border border-emerald-700 rounded-xl text-emerald-300 text-xs font-semibold">
              <Check className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800 shrink-0">
          <button
            onClick={handleReset}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-slate-200 underline decoration-slate-600 transition-colors"
          >
            איפוס וחזרה למאגר שאלות מובנה
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
            >
              ביטול
            </button>

            {activeTab === 'url' && (
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || !urlInput.trim()}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/10 disabled:opacity-40"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>טען ושמור גיליון</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
