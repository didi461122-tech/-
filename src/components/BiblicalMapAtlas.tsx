import React, { useState, useMemo, useRef } from 'react';
import { 
  BIBLICAL_LOCATIONS, 
  BIBLICAL_JOURNEYS 
} from '../data/biblicalMapData';
import { BiblicalLocation, BiblicalJourney } from '../types/bibleMap';
import { 
  MapPin, Compass, Navigation, BookOpen, CheckCircle, 
  XCircle, ArrowRight, HelpCircle, Layers, Sparkles, 
  Search, Award, RotateCcw, Target, Crosshair, ChevronLeft
} from 'lucide-react';
import { sound } from '../utils/audio';

interface BiblicalMapAtlasProps {
  onBack: () => void;
}

interface UserGuessResult {
  userX: number;
  userY: number;
  targetX: number;
  targetY: number;
  distanceKm: number;
  points: number;
  accuracyLabel: string;
}

export const BiblicalMapAtlas: React.FC<BiblicalMapAtlasProps> = ({ onBack }) => {
  const [selectedLocation, setSelectedLocation] = useState<BiblicalLocation>(BIBLICAL_LOCATIONS[0]);
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>('abraham');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mapMode, setMapMode] = useState<'explore' | 'quiz_challenge'>('explore');

  // Explore Mode Quiz state for selected location
  const [exploreQuizState, setExploreQuizState] = useState<{
    chosenIndex: number | null;
    isCorrect: boolean | null;
  }>({ chosenIndex: null, isCorrect: null });

  // Quiz Challenge Mode state (Blank map location placement)
  const challengeLocations = useMemo(() => {
    // 8 diverse and iconic locations across the Land
    const selectedIds = [
      'hebron', 'jerusalem', 'mount_carmel', 'jericho', 
      'shechem', 'beersheba', 'en_gedi', 'mount_gilboa'
    ];
    return selectedIds
      .map(id => BIBLICAL_LOCATIONS.find(l => l.id === id)!)
      .filter(Boolean);
  }, []);

  const [challengeIndex, setChallengeIndex] = useState<number>(0);
  const [challengeScore, setChallengeScore] = useState<number>(0);
  const [challengeFinished, setChallengeFinished] = useState<boolean>(false);
  const [currentGuessResult, setCurrentGuessResult] = useState<UserGuessResult | null>(null);
  const [guessHistory, setGuessHistory] = useState<{
    location: BiblicalLocation;
    result: UserGuessResult;
  }[]>([]);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const activeJourney = useMemo(() => {
    return BIBLICAL_JOURNEYS.find(j => j.id === selectedJourneyId) || null;
  }, [selectedJourneyId]);

  const filteredLocations = useMemo(() => {
    let locs = BIBLICAL_LOCATIONS;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      locs = locs.filter(l => 
        l.name.toLowerCase().includes(q) || 
        l.description.toLowerCase().includes(q) ||
        l.modernName.toLowerCase().includes(q) ||
        l.region.includes(q)
      );
    }
    return locs;
  }, [searchQuery]);

  const currentChallengeTarget = challengeLocations[challengeIndex % challengeLocations.length];

  // Handle clicking on map in Explore Mode
  const handleSelectLocationExplore = (loc: BiblicalLocation) => {
    sound.playClick();
    setSelectedLocation(loc);
    setExploreQuizState({ chosenIndex: null, isCorrect: null });
  };

  // Handle placing a pin on the blank map in Challenge Mode
  const handleMapCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mapMode !== 'quiz_challenge' || currentGuessResult || challengeFinished) return;
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert client coordinates to 0..800 viewBox coordinates
    const svgX = (clickX / rect.width) * 800;
    const svgY = (clickY / rect.height) * 800;

    // Percentage on 0..100 scale
    const userX = svgX / 8;
    const userY = svgY / 8;

    const targetX = currentChallengeTarget.x;
    const targetY = currentChallengeTarget.y;

    // Calculate approximate distance
    // 1% of map is roughly 5.2 kilometers in this region view
    const dx = userX - targetX;
    const dy = userY - targetY;
    const distancePercent = Math.sqrt(dx * dx + dy * dy);
    const distanceKm = Math.round(distancePercent * 5.2);

    let points = 20;
    let accuracyLabel = 'רחוק...';

    if (distanceKm <= 20) {
      points = 250;
      accuracyLabel = 'בול במקום! דיוק מושלם!';
      sound.playCorrect();
    } else if (distanceKm <= 45) {
      points = 180;
      accuracyLabel = 'קרוב מאוד!';
      sound.playCorrect();
    } else if (distanceKm <= 90) {
      points = 100;
      accuracyLabel = 'בכיוון הנכון!';
      sound.playClick();
    } else {
      points = 30;
      accuracyLabel = 'רחוק...';
      sound.playWrong();
    }

    const result: UserGuessResult = {
      userX,
      userY,
      targetX,
      targetY,
      distanceKm,
      points,
      accuracyLabel
    };

    setCurrentGuessResult(result);
    setChallengeScore(prev => prev + points);
    setGuessHistory(prev => [...prev, { location: currentChallengeTarget, result }]);
  };

  const handleNextChallenge = () => {
    sound.playClick();
    if (challengeIndex + 1 >= challengeLocations.length) {
      setChallengeFinished(true);
      sound.playTada();
    } else {
      setChallengeIndex(prev => prev + 1);
      setCurrentGuessResult(null);
    }
  };

  const handleRestartChallenge = () => {
    sound.playClick();
    setChallengeIndex(0);
    setChallengeScore(0);
    setChallengeFinished(false);
    setCurrentGuessResult(null);
    setGuessHistory([]);
  };

  const handleExploreQuizAnswer = (optIndex: number) => {
    if (exploreQuizState.chosenIndex !== null || !selectedLocation.quizQuestion) return;
    const isCorrect = optIndex === selectedLocation.quizQuestion.correctIndex;
    setExploreQuizState({ chosenIndex: optIndex, isCorrect });
    if (isCorrect) sound.playCorrect();
    else sound.playWrong();
  };

  // Convert journey steps into SVG polyline coordinates
  const journeyPolylinePoints = useMemo(() => {
    if (!activeJourney || mapMode !== 'explore') return '';
    return activeJourney.steps
      .map(step => {
        const loc = BIBLICAL_LOCATIONS.find(l => l.id === step.locationId);
        if (!loc) return null;
        return `${loc.x * 8},${loc.y * 8}`; // Map viewBox is 800x800
      })
      .filter(Boolean)
      .join(' ');
  }, [activeJourney, mapMode]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col" dir="rtl">
      {/* Top Header */}
      <header className="bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium"
            title="חזרה לתפריט"
          >
            <ArrowRight className="w-4 h-4" />
            <span>חזרה</span>
          </button>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <h1 className="text-lg font-bold text-white">מפת מסעות ואתרי התנ"ך</h1>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => {
              sound.playClick();
              setMapMode('explore');
              setCurrentGuessResult(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mapMode === 'explore'
                ? 'bg-amber-500 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            חקר מסעות חופשי
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setMapMode('quiz_challenge');
              handleRestartChallenge();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              mapMode === 'quiz_challenge'
                ? 'bg-amber-500 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            אתגר איתור מקומות על מפה ריקה
          </button>
        </div>
      </header>

      {/* Main Container: Two-Zone Split */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Right / Top Zone: Interactive Vector Map Canvas */}
        <div className="flex-1 relative bg-slate-950 flex flex-col overflow-hidden min-h-[440px] lg:min-h-0">
          {/* Explore Mode: Journey Selector Toolbar on top of map */}
          {mapMode === 'explore' && (
            <div className="absolute top-4 right-4 left-4 z-10 flex items-center justify-between gap-2 overflow-x-auto pb-2 pointer-events-auto">
              <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
                <button
                  onClick={() => setSelectedJourneyId(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedJourneyId === null
                      ? 'bg-white text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  כל האתרים
                </button>
                {BIBLICAL_JOURNEYS.map(journey => (
                  <button
                    key={journey.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedJourneyId(journey.id);
                      const firstLoc = BIBLICAL_LOCATIONS.find(l => l.id === journey.steps[0]?.locationId);
                      if (firstLoc) setSelectedLocation(firstLoc);
                    }}
                    style={{
                      borderBottom: selectedJourneyId === journey.id ? `3px solid ${journey.color}` : 'none'
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      selectedJourneyId === journey.id
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: journey.color }} 
                    />
                    {journey.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quiz Challenge Floating Instruction Banner */}
          {mapMode === 'quiz_challenge' && !challengeFinished && (
            <div className="absolute top-4 right-4 left-4 z-10 bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-amber-500/50 shadow-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-amber-400" />
                  משימה {challengeIndex + 1} מתוך {challengeLocations.length} · מפה ריקה
                </span>
                <span className="text-xs text-slate-300 font-mono font-bold">
                  ניקוד מצטבר: <span className="text-amber-400 text-sm">{challengeScore}</span> נק'
                </span>
              </div>

              {!currentGuessResult ? (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-300">סמן על המפה היכן נמצאת:</span>
                    <span className="text-base font-black text-amber-300 underline underline-offset-4">
                      {currentChallengeTarget.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Crosshair className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    המפה ריקה ללא שמות ערים. לחץ על המיקום המשוער כדי לבחון את הדיוק שלך!
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <span className={currentGuessResult.distanceKm <= 45 ? 'text-emerald-400' : 'text-amber-400'}>
                        {currentGuessResult.accuracyLabel}
                      </span>
                      <span className="text-slate-300 text-xs font-normal">
                        (מרחק: כ-{currentGuessResult.distanceKm} ק"מ מהיעד · +{currentGuessResult.points} נק')
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      הנקודה שמיקמת סומנה בכחול, והמיקום האמיתי סומן בזהב!
                    </div>
                  </div>
                  <button
                    onClick={handleNextChallenge}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <span>{challengeIndex + 1 >= challengeLocations.length ? 'לסיום האתגר' : 'לשאלה הבאה'}</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quiz Challenge Finished Modal Overlay */}
          {mapMode === 'quiz_challenge' && challengeFinished && (
            <div className="absolute inset-4 z-30 bg-slate-900/95 backdrop-blur-md p-8 rounded-2xl border border-amber-500 flex flex-col items-center justify-center text-center">
              <Award className="w-16 h-16 text-amber-400 mb-3 animate-bounce" />
              <h2 className="text-2xl font-bold text-white mb-2">סיימת את אתגר המפה הריקה!</h2>
              <p className="text-sm text-slate-300 mb-2">
                צברת <span className="text-amber-400 font-bold font-mono text-xl">{challengeScore}</span> נקודות באיתור ערי ואתרי התנ"ך!
              </p>
              <p className="text-xs text-slate-400 max-w-md mb-6">
                כל הכבוד על הבקיאות הגאוגרפית במרחבי ארץ ישראל והתנ"ך.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRestartChallenge}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all flex items-center gap-2 text-sm shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  שחק שוב
                </button>
                <button
                  onClick={() => setMapMode('explore')}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition-all text-sm"
                >
                  חזור לחקר מסלולים
                </button>
              </div>
            </div>
          )}

          {/* Interactive SVG Biblical Map */}
          <div className="flex-1 w-full h-full flex items-center justify-center p-2 relative overflow-auto">
            <svg 
              ref={svgRef}
              viewBox="0 0 800 800" 
              onClick={handleMapCanvasClick}
              className={`w-full h-full max-h-[85vh] select-none ${
                mapMode === 'quiz_challenge' && !currentGuessResult && !challengeFinished 
                  ? 'cursor-crosshair' 
                  : 'cursor-default'
              }`}
              style={{ filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.5))' }}
            >
              <defs>
                <radialGradient id="landGrad" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#0F172A" />
                </radialGradient>
                <linearGradient id="seaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0369A1" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0C4A6E" stopOpacity="0.5" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Background Canvas */}
              <rect width="800" height="800" fill="url(#landGrad)" />

              {/* Mediterranean Sea (הים הגדול / הים התיכון) */}
              <path
                d="M 0,0 L 320,0 Q 300,180 340,300 Q 320,400 310,500 Q 280,620 200,680 Q 120,720 0,750 Z"
                fill="url(#seaGrad)"
                stroke="#0284C7"
                strokeWidth="1.5"
                opacity="0.7"
              />
              <text x="120" y="320" fill="#38BDF8" opacity="0.4" fontSize="16" fontWeight="bold" transform="rotate(-65, 120, 320)">
                הַיָּם הַגָּדוֹל (הַיָּם הַתִּיכוֹן)
              </text>

              {/* Sea of Galilee (ים כנרת) */}
              <ellipse 
                cx="460" 
                cy="225" 
                rx="20" 
                ry="28" 
                fill="#0284C7" 
                stroke="#38BDF8" 
                strokeWidth="1.5"
                opacity="0.8" 
              />
              <text x="490" y="230" fill="#38BDF8" fontSize="11" fontWeight="bold">
                יָם כִּנֶּרֶת
              </text>

              {/* Jordan River (נהר הירדן) */}
              <path
                d="M 460,250 Q 470,320 465,380 T 470,440"
                fill="none"
                stroke="#0284C7"
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity="0.8"
              />
              <text x="480" y="350" fill="#38BDF8" fontSize="10" opacity="0.7">
                נְהַר הַיַּרְדֵּן
              </text>

              {/* Dead Sea (ים המלח / ים הערבה) */}
              <ellipse 
                cx="470" 
                cy="510" 
                rx="18" 
                ry="65" 
                fill="#0284C7" 
                stroke="#38BDF8" 
                strokeWidth="1.5"
                opacity="0.8" 
              />
              <text x="500" y="520" fill="#38BDF8" fontSize="11" fontWeight="bold">
                יָם הַמֶּלַח (יָם הָעֲרָבָה)
              </text>

              {/* Red Sea / Gulf of Eilat (ים סוף) */}
              <path
                d="M 330,730 L 360,800 L 400,800 L 370,740 Z"
                fill="url(#seaGrad)"
                stroke="#0284C7"
                strokeWidth="1.5"
                opacity="0.7"
              />
              <text x="360" y="780" fill="#38BDF8" fontSize="11" fontWeight="bold">
                יַם סוּף
              </text>

              {/* Northern River (פרת וחדקל אזכור) */}
              <path
                d="M 500,50 Q 620,60 750,110"
                fill="none"
                stroke="#0284C7"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                opacity="0.4"
              />
              <text x="630" y="60" fill="#38BDF8" fontSize="11" opacity="0.5">
                אֲרַם נַהֲרַיִם / חָרָן
              </text>

              {/* Nile Delta & Egypt indicator */}
              <text x="100" y="720" fill="#94A3B8" fontSize="12" fontWeight="bold" opacity="0.5">
                מִצְרַיִם / אֶרֶץ גֹּשֶׁן
              </text>
              <text x="210" y="660" fill="#94A3B8" fontSize="11" opacity="0.5">
                מִדְבַּר סִינַי
              </text>

              {/* EXPLORE MODE ONLY: Journey Polylines */}
              {mapMode === 'explore' && journeyPolylinePoints && (
                <polyline
                  points={journeyPolylinePoints}
                  fill="none"
                  stroke={activeJourney?.color || '#D97706'}
                  strokeWidth="3.5"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />
              )}

              {/* EXPLORE MODE ONLY: Location Pins with Names */}
              {mapMode === 'explore' && filteredLocations.map(loc => {
                const isSelected = selectedLocation.id === loc.id;
                const isPartOfActiveJourney = activeJourney?.steps.some(s => s.locationId === loc.id);
                const cx = loc.x * 8;
                const cy = loc.y * 8;

                return (
                  <g 
                    key={loc.id} 
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectLocationExplore(loc);
                    }}
                  >
                    {/* Pulsing ring on selected */}
                    {isSelected && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r="18"
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="2"
                        className="animate-ping origin-center"
                        opacity="0.75"
                      />
                    )}

                    {/* Pin Outer Circle */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 10 : isPartOfActiveJourney ? 8 : 6}
                      fill={
                        isSelected 
                          ? '#F59E0B' 
                          : isPartOfActiveJourney 
                          ? (activeJourney?.color || '#38BDF8') 
                          : '#475569'
                      }
                      stroke="#FFFFFF"
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      className="transition-all duration-200 group-hover:scale-125"
                    />

                    {/* Location Name Label */}
                    <text
                      x={cx}
                      y={cy - 12}
                      textAnchor="middle"
                      fill={isSelected ? '#FDE68A' : '#E2E8F0'}
                      fontSize={isSelected ? 12 : 10}
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      className="pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                    >
                      {loc.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}

              {/* CHALLENGE MODE: When user placed a guess, show user's pin, true pin, and connecting line! */}
              {mapMode === 'quiz_challenge' && currentGuessResult && (
                <g className="animate-in fade-in duration-300">
                  {/* Connecting dashed distance line */}
                  <line
                    x1={currentGuessResult.userX * 8}
                    y1={currentGuessResult.userY * 8}
                    x2={currentGuessResult.targetX * 8}
                    y2={currentGuessResult.targetY * 8}
                    stroke="#F59E0B"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                  />

                  {/* Distance label on center of line */}
                  <text
                    x={(currentGuessResult.userX * 8 + currentGuessResult.targetX * 8) / 2}
                    y={(currentGuessResult.userY * 8 + currentGuessResult.targetY * 8) / 2 - 10}
                    textAnchor="middle"
                    fill="#FDE68A"
                    fontSize="13"
                    fontWeight="bold"
                    className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                  >
                    כ-{currentGuessResult.distanceKm} ק"מ
                  </text>

                  {/* User's clicked point (Blue Pin) */}
                  <g>
                    <circle
                      cx={currentGuessResult.userX * 8}
                      cy={currentGuessResult.userY * 8}
                      r="10"
                      fill="#38BDF8"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                    />
                    <text
                      x={currentGuessResult.userX * 8}
                      y={currentGuessResult.userY * 8 - 14}
                      textAnchor="middle"
                      fill="#7DD3FC"
                      fontSize="11"
                      fontWeight="bold"
                      className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                    >
                      המיקום שסימנת
                    </text>
                  </g>

                  {/* Actual Correct Location (Gold / Green Pin) */}
                  <g>
                    <circle
                      cx={currentGuessResult.targetX * 8}
                      cy={currentGuessResult.targetY * 8}
                      r="18"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2"
                      className="animate-ping"
                      opacity="0.8"
                    />
                    <circle
                      cx={currentGuessResult.targetX * 8}
                      cy={currentGuessResult.targetY * 8}
                      r="12"
                      fill="#10B981"
                      stroke="#FFFFFF"
                      strokeWidth="3"
                    />
                    <text
                      x={currentGuessResult.targetX * 8}
                      y={currentGuessResult.targetY * 8 - 16}
                      textAnchor="middle"
                      fill="#A7F3D0"
                      fontSize="13"
                      fontWeight="bold"
                      className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                    >
                      {currentChallengeTarget.name} (מיקום מדויק)
                    </text>
                  </g>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Left / Bottom Zone: Location Details & Story Deck OR Challenge Panel */}
        <div className="w-full lg:w-[420px] bg-slate-900 border-t lg:border-t-0 lg:border-r border-slate-800 p-6 flex flex-col overflow-y-auto max-h-[50vh] lg:max-h-none">
          {mapMode === 'explore' ? (
            /* EXPLORE MODE SIDEBAR */
            <>
              {/* Search Box */}
              <div className="relative mb-5">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חפש עיר, מקום או חבל ארץ..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 pr-10"
                />
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>

              {selectedLocation ? (
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
                      <span>{selectedLocation.region}</span>
                      <span aria-hidden="true">·</span>
                      <span>{selectedLocation.period}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-0.5">
                      {selectedLocation.name}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {selectedLocation.title} · זיהוי כיום: {selectedLocation.modernName}
                    </p>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    {selectedLocation.description}
                  </p>

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-amber-500" />
                      אירועים מרכזיים במקום
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {selectedLocation.keyEvents.map((evt, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold">·</span>
                          <span>{evt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selectedLocation.verses.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                        פסוקי המקור
                      </h3>
                      <div className="space-y-2">
                        {selectedLocation.verses.map((v, idx) => (
                          <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 text-xs">
                            <span className="text-amber-400 font-semibold block mb-1">
                              {v.book} פרק {v.chapter} פסוק {v.verse}
                            </span>
                            <p className="text-slate-200 italic leading-relaxed">
                              "{v.text}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedLocation.quizQuestion && (
                    <div className="bg-gradient-to-br from-amber-500/10 to-transparent p-4 rounded-xl border border-amber-500/30 mt-4">
                      <h3 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        בחן את עצמך על {selectedLocation.name}
                      </h3>
                      <p className="text-sm font-semibold text-white mb-3">
                        {selectedLocation.quizQuestion.question}
                      </p>

                      <div className="space-y-2">
                        {selectedLocation.quizQuestion.options.map((opt, optIdx) => {
                          const isChosen = exploreQuizState.chosenIndex === optIdx;
                          const isCorrect = optIdx === selectedLocation.quizQuestion!.correctIndex;
                          const hasAnswered = exploreQuizState.chosenIndex !== null;

                          let btnColor = 'bg-slate-950/80 border-slate-800 text-slate-200 hover:bg-slate-800';
                          if (hasAnswered) {
                            if (isCorrect) {
                              btnColor = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                            } else if (isChosen) {
                              btnColor = 'bg-red-950/80 border-red-500 text-red-200';
                            } else {
                              btnColor = 'bg-slate-950/40 border-slate-900 text-slate-600';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleExploreQuizAnswer(optIdx)}
                              disabled={hasAnswered}
                              className={`w-full p-2.5 rounded-lg border text-right text-xs font-medium transition-all flex items-center justify-between ${btnColor}`}
                            >
                              <span>{opt}</span>
                              {hasAnswered && isCorrect && (
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                              )}
                              {hasAnswered && isChosen && !isCorrect && (
                                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {exploreQuizState.chosenIndex !== null && (
                        <p className="text-xs text-slate-300 mt-2.5 pt-2 border-t border-slate-800/80 leading-relaxed">
                          {selectedLocation.quizQuestion.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  בחר אתר על גבי המפה כדי לצפות בפסוקים ובאירועים המקראיים.
                </div>
              )}
            </>
          ) : (
            /* CHALLENGE MODE SIDEBAR (Active Question & Score Tracking) */
            <div className="space-y-5">
              {/* Challenge Header & Progress */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-400">
                    אתגר מפה ריקה
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    שאלה {challengeIndex + 1} / {challengeLocations.length}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${((challengeIndex + 1) / challengeLocations.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Target Location Card */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-amber-500/30 space-y-3">
                <span className="text-xs text-amber-400/90 font-bold block">
                  היעד לאיתור:
                </span>
                <h2 className="text-2xl font-black text-white">
                  {currentChallengeTarget.name}
                </h2>
                <p className="text-xs text-slate-400">
                  {currentChallengeTarget.title} · חבל ארץ: {currentChallengeTarget.region}
                </p>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <span className="text-amber-400 font-bold block mb-0.5">רמז מקראי:</span>
                  {currentChallengeTarget.description}
                </div>
              </div>

              {/* Result & Verse details after guess */}
              {currentGuessResult ? (
                <div className="bg-emerald-950/30 p-4 rounded-2xl border border-emerald-500/40 space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      תוצאת הסימון שלך
                    </span>
                    <span className="text-sm font-black text-emerald-300 font-mono">
                      +{currentGuessResult.points} נק'
                    </span>
                  </div>

                  <div className="text-xs text-slate-200">
                    מרחק מהמקום המקורי: <strong>כ-{currentGuessResult.distanceKm} ק"מ</strong>
                  </div>

                  {currentChallengeTarget.verses.length > 0 && (
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-xs">
                      <span className="text-amber-400 font-bold block mb-1">
                        פסוק על המקום ({currentChallengeTarget.verses[0].book} {currentChallengeTarget.verses[0].chapter}):
                      </span>
                      <p className="text-slate-200 italic leading-relaxed">
                        "{currentChallengeTarget.verses[0].text}"
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleNextChallenge}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 mt-2"
                  >
                    <span>{challengeIndex + 1 >= challengeLocations.length ? 'לסיום האתגר' : 'המשך לשאלה הבאה'}</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Waiting for click hint */
                <div className="bg-slate-950/40 p-4 rounded-2xl border border-dashed border-slate-800 text-center py-6">
                  <Crosshair className="w-8 h-8 text-amber-400/60 mx-auto mb-2 animate-pulse" />
                  <p className="text-xs font-semibold text-slate-300 mb-1">
                    לחץ על גבי המפה הריקה
                  </p>
                  <p className="text-[11px] text-slate-500">
                    הצבע היכן שלדעתך נמצאת {currentChallengeTarget.name}. מיד לאחר הלחיצה תוצג הנקודה הנכונה והמרחק המדויק!
                  </p>
                </div>
              )}

              {/* History of completed guesses in this run */}
              {guessHistory.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 mb-2">
                    היסטוריית שאלות בסיבוב זה ({guessHistory.length})
                  </h3>
                  <div className="space-y-1.5">
                    {guessHistory.map((item, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-xs"
                      >
                        <span className="text-slate-200 font-medium">
                          {item.location.name}
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-400 text-[11px]">
                            {item.result.distanceKm} ק"מ
                          </span>
                          <span className="font-bold text-amber-400">
                            +{item.result.points}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
