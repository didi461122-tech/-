export type OnlineGameMode = 'head_to_head' | 'world_cup' | 'kahoot';
export type OnlineHeadToHeadSubMode = 'simultaneous' | 'turn_based';

export interface MultiplayerPlayer {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  ready: boolean;
  connected: boolean;
  avatarSeed?: number;
  streak?: number;
  lastPointsEarned?: number;
  rank?: number;
  isRemote?: boolean;
}

export type RoomStatus = 'lobby' | 'playing' | 'round_end' | 'game_over';

export interface TournamentMatchState {
  id: string;
  round: number; // 0: רבע גמר, 1: חצי גמר, 2: גמר
  matchIndex: number;
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  winnerId?: string;
  winnerName?: string;
  score1: number;
  score2: number;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface SanitizedQuestion {
  id: string;
  question: string;
  shuffledOptions: string[];
  topic: string;
  difficulty: string;
  source: string;
  quote?: string;
  author?: string;
  imageUrl?: string;
  imageCaption?: string;
  parasha?: string;
}

export interface KahootRoundState {
  questionStartTime: number;
  timeLimitSeconds: number;
  answeredCount: number;
  totalStudentsCount: number;
  distribution: { [option: string]: number };
  showResults: boolean;
  topPlayers: { id: string; name: string; score: number; streak: number; lastPoints: number }[];
}

export interface MultiplayerRoom {
  id: string; // קוד חדר (לדוגמה: 4295)
  name: string;
  mode: OnlineGameMode;
  subMode: OnlineHeadToHeadSubMode;
  hostId: string;
  hostName: string;
  players: MultiplayerPlayer[];
  status: RoomStatus;
  selectedTopics: string[];
  selectedDifficulties: string[];
  maxPlayers: number;
  targetScore: number; // e.g. 5 for head to head, 2 for world cup matches
  currentQuestionIndex: number;
  totalQuestionsCount: number;
  activeQuestion?: SanitizedQuestion;
  // Current active players in battle (for World Cup: the 2 dueling students; for Head to Head: both players)
  activePlayer1Id?: string;
  activePlayer2Id?: string;
  activePlayerTurnId?: string; // for turn_based
  activeMatchId?: string;
  matches?: TournamentMatchState[];
  answeredPlayerIds: string[]; // Players who already submitted an answer for current question
  winnerName?: string;
  lastAnswerResult?: {
    answeredByPlayerId: string;
    answeredByName: string;
    selectedOption: string;
    isCorrect: boolean;
    correctAnswer: string;
    quote?: string;
    source?: string;
  };
  // Kahoot whole-class state
  kahootState?: KahootRoundState;
  remotePin?: string; // Secret pin for host remote control
}

// Client to Server Message Types
export type ClientMessage =
  | { type: 'room:create'; payload: { hostName: string; mode: OnlineGameMode; subMode: OnlineHeadToHeadSubMode; selectedTopics: string[]; selectedDifficulties: string[]; targetScore: number; timeLimitSeconds?: number } }
  | { type: 'room:join'; payload: { roomId: string; playerName: string; asRemote?: boolean; remotePin?: string } }
  | { type: 'room:leave' }
  | { type: 'room:list' }
  | { type: 'game:start' }
  | { type: 'question:answer'; payload: { selectedOption: string; timeTakenMs?: number } }
  | { type: 'question:next' }
  | { type: 'kahoot:reveal' }
  | { type: 'remote:action'; payload: { action: 'start' | 'next' | 'reveal' | 'sound'; soundName?: string } }
  | { type: 'game:rematch' };

// Server to Client Message Types
export type ServerMessage =
  | { type: 'room:list'; payload: { rooms: { id: string; name: string; hostName: string; mode: OnlineGameMode; subMode: OnlineHeadToHeadSubMode; playerCount: number; maxPlayers: number; status: RoomStatus }[] } }
  | { type: 'room:joined'; payload: { room: MultiplayerRoom; myPlayerId: string; isRemote?: boolean } }
  | { type: 'room:update'; payload: { room: MultiplayerRoom } }
  | { type: 'game:answer_result'; payload: { result: NonNullable<MultiplayerRoom['lastAnswerResult']>; room: MultiplayerRoom } }
  | { type: 'game:over'; payload: { winnerName: string; room: MultiplayerRoom } }
  | { type: 'remote:sound_trigger'; payload: { soundName: string } }
  | { type: 'error'; payload: { message: string } };
