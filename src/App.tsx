import React, { useState, useEffect } from 'react';
import { Question, GameSettings, QuestionAnswerRecord } from './types/quiz';
import { LeaderboardEntry, Achievement, AchievementNotification } from './types/achievements';
import { loadQuizQuestions, DEFAULT_QUESTIONS } from './services/sheetService';
import { sortTopicsByTanach } from './utils/tanachOrder';
import { 
  getStoredAchievements, 
  evaluateGameAchievements, 
  resetAchievements 
} from './services/achievementService';
import { 
  getStoredLeaderboard, 
  recordPlayerResult, 
  resetLeaderboardToDefault 
} from './services/leaderboardService';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { GameScreen } from './components/GameScreen';
import { WorldCupBracket } from './components/WorldCupBracket';
import { ConnectionsGame } from './components/ConnectionsGame';
import { TrueFalseGame } from './components/TrueFalseGame';
import { TimelineGame } from './components/TimelineGame';
import { EndGameScreen } from './components/EndGameScreen';
import { SheetSettingsModal } from './components/SheetSettingsModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { AchievementToast } from './components/AchievementToast';
import { OnlineLobbyModal } from './components/OnlineLobbyModal';
import { OnlineWaitingRoom } from './components/OnlineWaitingRoom';
import { OnlineHeadToHeadGame } from './components/OnlineHeadToHeadGame';
import { OnlineWorldCupGame } from './components/OnlineWorldCupGame';
import { KahootHostView } from './components/KahootHostView';
import { KahootPlayerView } from './components/KahootPlayerView';
import { PresenterRemoteModal } from './components/PresenterRemoteModal';
import { QuestionEditorModal } from './components/QuestionEditorModal';
import { SurvivalMarathonGame } from './components/SurvivalMarathonGame';
import { BiblicalMapAtlas } from './components/BiblicalMapAtlas';
import { multiplayerService } from './services/multiplayerService';
import { MultiplayerRoom } from './types/multiplayer';
import { sound } from './utils/audio';
import { RefreshCw, AlertCircle } from 'lucide-react';

type AppState = 
  | 'home' 
  | 'game' 
  | 'world_cup' 
  | 'connections' 
  | 'true_false' 
  | 'timeline' 
  | 'end_game' 
  | 'online_room' 
  | 'online_game'
  | 'survival'
  | 'bible_map';

export default function App() {
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [sourceName, setSourceName] = useState<string>('מאגר מובנה');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [appState, setAppState] = useState<AppState>('home');
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  
  // Modals state
  const [isSheetModalOpen, setIsSheetModalOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState<boolean>(false);
  const [isRemoteModalOpen, setIsRemoteModalOpen] = useState<boolean>(false);
  const [isQuestionEditorOpen, setIsQuestionEditorOpen] = useState<boolean>(false);

  // Custom questions state (stored on server & localStorage)
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);

  // Multiplayer state
  const [onlineRoom, setOnlineRoom] = useState<MultiplayerRoom | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);

  // Achievements & Leaderboard state
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [achievementNotifications, setAchievementNotifications] = useState<AchievementNotification[]>([]);

  // Stats from completed game
  const [lastGameStats, setLastGameStats] = useState<{
    winnerName: string;
    player1Correct: number;
    player2Correct: number;
    player1Total: number;
    player2Total: number;
    records: QuestionAnswerRecord[];
    durationSeconds: number;
    millionairePrize?: string;
  } | null>(null);

  // Load custom questions created by teachers
  const loadCustomQuestions = async () => {
    try {
      const res = await fetch('/api/custom-questions');
      if (res.ok) {
        const data = await res.json();
        if (data.questions && Array.isArray(data.questions)) {
          setCustomQuestions(data.questions);
        }
      }
    } catch (e) {
      console.warn('Could not load custom questions:', e);
    }
  };

  const handleAddCustomQuestions = async (newQs: Question[]) => {
    const updated = [...customQuestions, ...newQs];
    setCustomQuestions(updated);
    try {
      await fetch('/api/custom-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: updated })
      });
    } catch (e) {
      console.warn('Could not save custom questions:', e);
    }
  };

  const handleDeleteCustomQuestion = async (id: string) => {
    const updated = customQuestions.filter(q => q.id !== id);
    setCustomQuestions(updated);
    try {
      await fetch('/api/custom-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: updated })
      });
    } catch (e) {
      console.warn('Could not delete custom question:', e);
    }
  };

  // Load questions, achievements and leaderboard on initial mount
  const loadData = async (customUrl?: string) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await loadQuizQuestions(customUrl);
      setQuestions(result.questions);
      setSourceName(result.sourceName);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'שגיאה בטעינת נתונים';
      setLoadError(errMsg);
      setQuestions(DEFAULT_QUESTIONS);
      setSourceName('מאגר תנ"ך מובנה (גיבוי)');
      if (customUrl) {
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadCustomQuestions();
    setAchievements(getStoredAchievements());
    setLeaderboard(getStoredLeaderboard());

    // Check if invited via URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomCode = params.get('room');
      if (roomCode) {
        setIsOnlineModalOpen(true);
      }
    }

    const unsubJoined = multiplayerService.onRoomJoined((room, playerId) => {
      setOnlineRoom(room);
      setMyPlayerId(playerId);
      setIsOnlineModalOpen(false);
      setAppState('online_room');
    });

    const unsubUpdate = multiplayerService.onRoomUpdate((room) => {
      setOnlineRoom(room);
      if (room.status === 'playing' || room.status === 'game_over') {
        setAppState('online_game');
      } else if (room.status === 'lobby') {
        setAppState('online_room');
      }
    });

    const unsubGameOver = multiplayerService.onGameOver((winnerName, room) => {
      setOnlineRoom(room);
      setAppState('online_game');
      const points = room.mode === 'world_cup' ? 250 : (room.mode === 'kahoot' ? 300 : 100);
      const updatedLead = recordPlayerResult({
        playerName: winnerName,
        pointsEarned: points,
        streak: 5,
        isWinner: true,
        achievementsCount: getStoredAchievements().filter(a => !!a.unlockedAt).length
      });
      setLeaderboard(updatedLead);
    });

    const unsubSound = multiplayerService.onSoundTrigger((soundType) => {
      if (soundType === 'correct') sound.playCorrect();
      else if (soundType === 'wrong') sound.playWrong();
      else if (soundType === 'theme') sound.playTheme();
      else if (soundType === 'suspense') sound.playSuspense();
      else sound.playClick();
    });

    return () => {
      unsubJoined();
      unsubUpdate();
      unsubGameOver();
      unsubSound();
    };
  }, []);

  // Combined questions list (Sheet/Default + Teacher custom questions)
  const combinedQuestions = React.useMemo(() => {
    return [...questions, ...customQuestions];
  }, [questions, customQuestions]);

  // Compute unique topics from questions, sorted canonically by Tanakh order then general topics
  const availableTopics = React.useMemo(() => {
    const set = new Set<string>();
    combinedQuestions.forEach(q => {
      if (q.topic) set.add(q.topic);
    });
    return sortTopicsByTanach(Array.from(set));
  }, [combinedQuestions]);

  // Push achievement notifications and auto-dismiss after 4.5 seconds
  const triggerNotifications = (newUnlocks: AchievementNotification[]) => {
    if (newUnlocks.length === 0) return;
    setAchievementNotifications(prev => [...prev, ...newUnlocks]);

    newUnlocks.forEach(unlock => {
      setTimeout(() => {
        setAchievementNotifications(prev => prev.filter(n => n.id !== unlock.id));
      }, 5000);
    });
  };

  // Start game handler
  const handleStartGame = (settings: GameSettings) => {
    setGameSettings(settings);

    if (settings.mode === 'world_cup') {
      setAppState('world_cup');
    } else if (settings.mode === 'connections') {
      setAppState('connections');
    } else if (settings.mode === 'true_false') {
      setAppState('true_false');
    } else if (settings.mode === 'timeline') {
      setAppState('timeline');
    } else if (settings.mode === 'survival') {
      setAppState('survival');
    } else if (settings.mode === 'bible_map') {
      setAppState('bible_map');
    } else {
      setAppState('game');
    }
  };

  // Game over handler for Main Game (Single, Head-to-Head, Millionaire)
  const handleGameOver = (stats: {
    winnerName: string;
    player1Correct: number;
    player2Correct: number;
    player1Total: number;
    player2Total: number;
    records: QuestionAnswerRecord[];
    durationSeconds: number;
    millionairePrize?: string;
  }) => {
    setLastGameStats(stats);
    setAppState('end_game');

    if (!gameSettings) return;

    // Calculate best streak from records
    let currentStreak = 0;
    let maxStreak = 0;
    stats.records.forEach(r => {
      if (r.isCorrect) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    });

    // Check Millionaire step
    let millionaireStep: number | undefined = undefined;
    if (gameSettings.mode === 'millionaire') {
      millionaireStep = stats.records.length;
    }

    // Evaluate achievements
    const { newUnlocks, updatedAchievements } = evaluateGameAchievements({
      playerName: stats.winnerName,
      gameMode: gameSettings.mode,
      correctAnswers: stats.player1Correct + stats.player2Correct,
      totalQuestions: stats.player1Total + stats.player2Total,
      streak: maxStreak,
      records: stats.records,
      millionaireStep
    });

    setAchievements(updatedAchievements);
    triggerNotifications(newUnlocks);

    // Record into Leaderboard
    const pointsEarned = ((stats.player1Correct + stats.player2Correct) * 15) + (maxStreak * 10);
    const updatedLead = recordPlayerResult({
      playerName: stats.winnerName,
      pointsEarned,
      streak: maxStreak,
      isWinner: true,
      achievementsCount: updatedAchievements.filter(a => !!a.unlockedAt).length,
      topicPlayed: gameSettings.selectedTopics[0] !== 'כל הנושאים' ? gameSettings.selectedTopics[0] : undefined
    });
    setLeaderboard(updatedLead);
  };

  // World Cup Champion callback
  const handleWorldCupChampion = (championName: string) => {
    const { newUnlocks, updatedAchievements } = evaluateGameAchievements({
      playerName: championName,
      gameMode: 'world_cup',
      correctAnswers: 10,
      totalQuestions: 10,
      streak: 5,
      records: [],
      isWorldCupWinner: true
    });

    setAchievements(updatedAchievements);
    triggerNotifications(newUnlocks);

    const updatedLead = recordPlayerResult({
      playerName: championName,
      pointsEarned: 250,
      streak: 5,
      isWinner: true,
      achievementsCount: updatedAchievements.filter(a => !!a.unlockedAt).length
    });
    setLeaderboard(updatedLead);
  };

  // Connections Solved callback
  const handleConnectionsCompleted = (solvedCount: number) => {
    const { newUnlocks, updatedAchievements } = evaluateGameAchievements({
      playerName: gameSettings?.player1Name || 'הכיתה',
      gameMode: 'connections',
      correctAnswers: solvedCount * 4,
      totalQuestions: 16,
      streak: solvedCount,
      records: [],
      connectionsSolvedCount: solvedCount
    });

    setAchievements(updatedAchievements);
    triggerNotifications(newUnlocks);

    if (solvedCount === 4) {
      const updatedLead = recordPlayerResult({
        playerName: gameSettings?.player1Name || 'אלופי החיבורים',
        pointsEarned: 150,
        streak: 4,
        isWinner: true,
        achievementsCount: updatedAchievements.filter(a => !!a.unlockedAt).length
      });
      setLeaderboard(updatedLead);
    }
  };

  // True/False Game Over callback
  const handleTrueFalseGameOver = (score: number, maxStreak: number) => {
    const { newUnlocks, updatedAchievements } = evaluateGameAchievements({
      playerName: gameSettings?.player1Name || 'מתמודד',
      gameMode: 'true_false',
      correctAnswers: score,
      totalQuestions: 6,
      streak: maxStreak,
      records: []
    });

    setAchievements(updatedAchievements);
    triggerNotifications(newUnlocks);

    const updatedLead = recordPlayerResult({
      playerName: gameSettings?.player1Name || 'מתמודד',
      pointsEarned: score * 12,
      streak: maxStreak,
      isWinner: score >= 4,
      achievementsCount: updatedAchievements.filter(a => !!a.unlockedAt).length
    });
    setLeaderboard(updatedLead);
  };

  // Timeline Success callback
  const handleTimelineSuccess = () => {
    const { newUnlocks, updatedAchievements } = evaluateGameAchievements({
      playerName: gameSettings?.player1Name || 'הכיתה',
      gameMode: 'timeline',
      correctAnswers: 5,
      totalQuestions: 5,
      streak: 5,
      records: [],
      isTimelineSuccess: true
    });

    setAchievements(updatedAchievements);
    triggerNotifications(newUnlocks);

    const updatedLead = recordPlayerResult({
      playerName: gameSettings?.player1Name || 'מומחי הכרונולוגיה',
      pointsEarned: 120,
      streak: 5,
      isWinner: true,
      achievementsCount: updatedAchievements.filter(a => !!a.unlockedAt).length
    });
    setLeaderboard(updatedLead);
  };

  // Play again with current settings
  const handlePlayAgain = () => {
    if (gameSettings) {
      if (gameSettings.mode === 'world_cup') {
        setAppState('world_cup');
      } else {
        setAppState('game');
      }
    } else {
      setAppState('home');
    }
  };

  // Reset Leaderboard
  const handleResetLeaderboard = () => {
    const defaultLead = resetLeaderboardToDefault();
    setLeaderboard(defaultLead);
    resetAchievements();
    setAchievements(getStoredAchievements());
  };

  const unlockedCount = achievements.filter(a => !!a.unlockedAt).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Floating Achievement Unlock Toasts */}
      <AchievementToast
        notifications={achievementNotifications}
        onDismiss={(id) => setAchievementNotifications(prev => prev.filter(n => n.id !== id))}
      />

      {/* Top Bar Header */}
      <Header
        onOpenSheetSettings={() => setIsSheetModalOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenOnlineMultiplayer={() => setIsOnlineModalOpen(true)}
        onGoHome={() => {
          if (onlineRoom) {
            multiplayerService.leaveRoom();
            setOnlineRoom(null);
          }
          setAppState('home');
        }}
        inGame={appState !== 'home'}
        sourceName={sourceName}
        unlockedAchievementsCount={unlockedCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-amber-400 animate-spin" />
            <div className="text-xl font-bold font-heading text-white">טוען שאלות תנ"ך...</div>
            <p className="text-xs text-slate-400">מתחבר למאגר הנתונים ומעדכן את החידון</p>
          </div>
        ) : (
          <>
            {loadError && (
              <div className="max-w-2xl mx-auto my-3 p-3 bg-amber-950/60 border border-amber-500/60 rounded-xl text-xs text-amber-300 flex flex-wrap items-center justify-between gap-2 shadow-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{loadError} (מוצג כעת מאגר הגיבוי המובנה)</span>
                </div>
                <button
                  onClick={() => setIsSheetModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 text-[11px] transition-colors"
                >
                  בדוק והגדר גיליון
                </button>
              </div>
            )}

            {appState === 'home' && (
              <HomeScreen
                availableTopics={availableTopics}
                onStartGame={handleStartGame}
                questionsCount={combinedQuestions.length}
                onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
                onOpenOnlineMultiplayer={() => setIsOnlineModalOpen(true)}
                onOpenQuestionEditor={() => setIsQuestionEditorOpen(true)}
                onOpenRemoteModal={() => setIsRemoteModalOpen(true)}
                onOpenBibleMap={() => setAppState('bible_map')}
              />
            )}

            {appState === 'online_room' && onlineRoom && myPlayerId && (
              <OnlineWaitingRoom
                room={onlineRoom}
                myPlayerId={myPlayerId}
                onLeave={() => {
                  setOnlineRoom(null);
                  setAppState('home');
                }}
              />
            )}

            {appState === 'online_game' && onlineRoom && myPlayerId && (
              onlineRoom.mode === 'kahoot' ? (
                myPlayerId === onlineRoom.hostId ? (
                  <KahootHostView
                    room={onlineRoom}
                    onExit={() => {
                      multiplayerService.leaveRoom();
                      setOnlineRoom(null);
                      setAppState('home');
                    }}
                  />
                ) : (
                  <KahootPlayerView
                    room={onlineRoom}
                    myPlayerId={myPlayerId}
                    onExit={() => {
                      multiplayerService.leaveRoom();
                      setOnlineRoom(null);
                      setAppState('home');
                    }}
                  />
                )
              ) : onlineRoom.mode === 'head_to_head' ? (
                <OnlineHeadToHeadGame
                  room={onlineRoom}
                  myPlayerId={myPlayerId}
                  onExit={() => {
                    multiplayerService.leaveRoom();
                    setOnlineRoom(null);
                    setAppState('home');
                  }}
                />
              ) : (
                <OnlineWorldCupGame
                  room={onlineRoom}
                  myPlayerId={myPlayerId}
                  onExit={() => {
                    multiplayerService.leaveRoom();
                    setOnlineRoom(null);
                    setAppState('home');
                  }}
                />
              )
            )}

            {appState === 'game' && gameSettings && (
              <GameScreen
                settings={gameSettings}
                questions={combinedQuestions}
                onGameOver={handleGameOver}
              />
            )}

            {appState === 'world_cup' && gameSettings && (
              <WorldCupBracket
                students={gameSettings.studentsList}
                questions={combinedQuestions}
                onExit={() => setAppState('home')}
                onChampionDeclared={handleWorldCupChampion}
              />
            )}

            {appState === 'connections' && (
              <ConnectionsGame 
                onExit={() => setAppState('home')} 
                onCompleted={handleConnectionsCompleted}
              />
            )}

            {appState === 'true_false' && (
              <TrueFalseGame 
                onExit={() => setAppState('home')} 
                onGameOver={handleTrueFalseGameOver}
              />
            )}

            {appState === 'timeline' && (
              <TimelineGame 
                onExit={() => setAppState('home')} 
                onSuccess={handleTimelineSuccess}
              />
            )}

            {appState === 'survival' && gameSettings && (
              <SurvivalMarathonGame
                questions={combinedQuestions}
                settings={gameSettings}
                onExit={() => setAppState('home')}
              />
            )}

            {appState === 'bible_map' && (
              <BiblicalMapAtlas
                onBack={() => setAppState('home')}
              />
            )}

            {appState === 'end_game' && lastGameStats && gameSettings && (
              <EndGameScreen
                stats={lastGameStats}
                settings={gameSettings}
                onPlayAgain={handlePlayAgain}
                onChangeSettings={() => setAppState('home')}
                onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Online Multiplayer Lobby Modal */}
      <OnlineLobbyModal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
        availableTopics={availableTopics}
      />

      {/* Google Sheets Settings Modal */}
      <SheetSettingsModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        currentSource={sourceName}
        onSaveUrl={async (url) => {
          await loadData(url);
          // Persist globally on server so it becomes the default across all devices and sessions
          try {
            await fetch('/api/default-sheet', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url })
            });
          } catch (e) {
            console.warn('Failed to save to /api/default-sheet:', e);
          }
        }}
        onResetToDefault={async () => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('tanach_quiz_custom_sheet_url');
          }
          try {
            await fetch('/api/default-sheet', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: '' })
            });
          } catch (e) {
            console.warn('Failed to reset /api/default-sheet:', e);
          }
          await loadData('');
        }}
      />

      {/* Leaderboard & Achievements Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        leaderboard={leaderboard}
        achievements={achievements}
        onResetLeaderboard={handleResetLeaderboard}
      />

      {/* Question Editor & AI Generator Modal */}
      <QuestionEditorModal
        isOpen={isQuestionEditorOpen}
        onClose={() => setIsQuestionEditorOpen(false)}
        onAddQuestions={handleAddCustomQuestions}
        existingCustomQuestions={customQuestions}
        onDeleteCustomQuestion={handleDeleteCustomQuestion}
      />

      {/* Presenter Remote Control Modal */}
      <PresenterRemoteModal
        isOpen={isRemoteModalOpen}
        onClose={() => setIsRemoteModalOpen(false)}
      />
    </div>
  );
}
