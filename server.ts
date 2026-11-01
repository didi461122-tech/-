import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { BUILTIN_TANACH_QUESTIONS } from './src/services/questionBank';
import { 
  OnlineGameMode, 
  OnlineHeadToHeadSubMode, 
  MultiplayerRoom, 
  MultiplayerPlayer, 
  TournamentMatchState,
  SanitizedQuestion,
  ClientMessage,
  ServerMessage,
  KahootRoundState
} from './src/types/multiplayer';
import { Question } from './src/types/quiz';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.resolve(__dirname, 'sheet_config.json');
const CUSTOM_QUESTIONS_FILE = path.resolve(__dirname, 'custom_questions.json');

// Initialize Gemini SDK with User-Agent header as required
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

interface PlayerInternal extends MultiplayerPlayer {
  ws: WebSocket;
}

interface RoomInternal {
  id: string;
  name: string;
  mode: OnlineGameMode;
  subMode: OnlineHeadToHeadSubMode;
  hostId: string;
  hostName: string;
  players: Map<string, PlayerInternal>;
  status: MultiplayerRoom['status'];
  selectedTopics: string[];
  selectedDifficulties: string[];
  maxPlayers: number;
  targetScore: number;
  currentQuestionIndex: number;
  questions: Question[];
  activeQuestion?: SanitizedQuestion;
  activePlayer1Id?: string;
  activePlayer2Id?: string;
  activePlayerTurnId?: string;
  activeMatchId?: string;
  matches?: TournamentMatchState[];
  answeredPlayerIds: Set<string>;
  winnerName?: string;
  lastAnswerResult?: MultiplayerRoom['lastAnswerResult'];
  advanceTimeout?: NodeJS.Timeout;
  kahootState?: KahootRoundState;
  remotePin?: string;
}

// In-memory active rooms registry
const rooms = new Map<string, RoomInternal>();
// Map client WebSocket to player ID & room ID
const socketToPlayer = new Map<WebSocket, { playerId: string; roomId: string; isRemote?: boolean }>();

function generateRoomCode(): string {
  let code = '';
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms.has(code));
  return code;
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function sanitizeQuestion(q: Question): SanitizedQuestion {
  const rawOptions = [q.correctAnswer, q.option2, q.option3, q.option4].filter(Boolean);
  const unique = Array.from(new Set(rawOptions));
  const shuffled = shuffle(unique);

  return {
    id: q.id,
    question: q.question,
    shuffledOptions: shuffled,
    topic: q.topic,
    difficulty: q.difficulty,
    source: q.source,
    quote: q.quote,
    author: q.author,
    imageUrl: q.imageUrl,
    imageCaption: q.imageCaption,
    parasha: q.parasha
  };
}

function serializeRoom(room: RoomInternal): MultiplayerRoom {
  return {
    id: room.id,
    name: room.name,
    mode: room.mode,
    subMode: room.subMode,
    hostId: room.hostId,
    hostName: room.hostName,
    players: Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      score: p.score,
      ready: p.ready,
      connected: p.connected,
      avatarSeed: p.avatarSeed,
      streak: p.streak || 0,
      lastPointsEarned: p.lastPointsEarned || 0,
      rank: p.rank || 1,
      isRemote: p.isRemote
    })),
    status: room.status,
    selectedTopics: room.selectedTopics,
    selectedDifficulties: room.selectedDifficulties,
    maxPlayers: room.maxPlayers,
    targetScore: room.targetScore,
    currentQuestionIndex: room.currentQuestionIndex,
    totalQuestionsCount: room.questions.length,
    activeQuestion: room.activeQuestion,
    activePlayer1Id: room.activePlayer1Id,
    activePlayer2Id: room.activePlayer2Id,
    activePlayerTurnId: room.activePlayerTurnId,
    activeMatchId: room.activeMatchId,
    matches: room.matches,
    answeredPlayerIds: Array.from(room.answeredPlayerIds),
    winnerName: room.winnerName,
    lastAnswerResult: room.lastAnswerResult,
    kahootState: room.kahootState,
    remotePin: room.remotePin
  };
}

function broadcastToRoom(room: RoomInternal, msg: ServerMessage) {
  const payload = JSON.stringify(msg);
  room.players.forEach(player => {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(payload);
    }
  });
}

function broadcastRoomsList() {
  const list = Array.from(rooms.values())
    .filter(r => r.status === 'lobby')
    .map(r => ({
      id: r.id,
      name: r.name,
      hostName: r.hostName,
      mode: r.mode,
      subMode: r.subMode,
      playerCount: r.players.size,
      maxPlayers: r.maxPlayers,
      status: r.status
    }));

  const msg = JSON.stringify({ type: 'room:list', payload: { rooms: list } });
  socketToPlayer.forEach((_, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

function updateKahootLeaderboard(room: RoomInternal) {
  const studentPlayers = Array.from(room.players.values())
    .filter(p => !p.isHost && !p.isRemote)
    .sort((a, b) => b.score - a.score);

  studentPlayers.forEach((p, idx) => {
    p.rank = idx + 1;
  });

  const top5 = studentPlayers.slice(0, 5).map(p => ({
    id: p.id,
    name: p.name,
    score: p.score,
    streak: p.streak || 0,
    lastPoints: p.lastPointsEarned || 0
  }));

  if (room.kahootState) {
    room.kahootState.topPlayers = top5;
  }
}

function advanceToNextQuestion(room: RoomInternal) {
  if (room.advanceTimeout) {
    clearTimeout(room.advanceTimeout);
    room.advanceTimeout = undefined;
  }

  room.answeredPlayerIds.clear();
  room.lastAnswerResult = undefined;

  // Check if current match has a winner in World Cup
  if (room.mode === 'world_cup' && room.activeMatchId && room.matches) {
    const activeMatch = room.matches.find(m => m.id === room.activeMatchId);
    if (activeMatch && activeMatch.status === 'completed') {
      const nextMatch = room.matches.find(m => m.status === 'pending' && m.player1Id && m.player2Id);
      if (nextMatch) {
        nextMatch.status = 'in_progress';
        room.activeMatchId = nextMatch.id;
        room.activePlayer1Id = nextMatch.player1Id;
        room.activePlayer2Id = nextMatch.player2Id;
      } else {
        const finalMatch = room.matches.find(m => m.round === 2 || (room.matches!.length === 3 && m.round === 1));
        const champion = finalMatch?.winnerName || activeMatch.winnerName || 'אלוף התנ"ך';
        room.status = 'game_over';
        room.winnerName = champion;
        broadcastToRoom(room, {
          type: 'game:over',
          payload: { winnerName: champion, room: serializeRoom(room) }
        });
        return;
      }
    }
  }

  // Kahoot check if game over
  if (room.mode === 'kahoot') {
    if (room.currentQuestionIndex >= Math.min(room.questions.length - 1, 14)) {
      updateKahootLeaderboard(room);
      const topStudent = room.kahootState?.topPlayers[0];
      const champion = topStudent ? topStudent.name : 'אלוף התנ"ך הכיתתי';
      room.status = 'game_over';
      room.winnerName = champion;
      broadcastToRoom(room, {
        type: 'game:over',
        payload: { winnerName: champion, room: serializeRoom(room) }
      });
      return;
    }
  }

  // Next question
  room.currentQuestionIndex = (room.currentQuestionIndex + 1) % Math.max(1, room.questions.length);
  const nextQ = room.questions[room.currentQuestionIndex];
  if (nextQ) {
    room.activeQuestion = sanitizeQuestion(nextQ);
  }

  // Reset Kahoot state for new round
  if (room.mode === 'kahoot') {
    const totalStudents = Array.from(room.players.values()).filter(p => !p.isHost && !p.isRemote).length;
    room.kahootState = {
      questionStartTime: Date.now(),
      timeLimitSeconds: 20,
      answeredCount: 0,
      totalStudentsCount: totalStudents,
      distribution: {},
      showResults: false,
      topPlayers: room.kahootState?.topPlayers || []
    };
  }

  // If turn-based, switch turn to opponent
  if (room.mode === 'head_to_head' && room.subMode === 'turn_based') {
    const playerIds = Array.from(room.players.keys());
    if (room.activePlayerTurnId === playerIds[0]) {
      room.activePlayerTurnId = playerIds[1];
    } else {
      room.activePlayerTurnId = playerIds[0];
    }
  }

  broadcastToRoom(room, { type: 'room:update', payload: { room: serializeRoom(room) } });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Enable CORS for all incoming requests (supports GitHub Pages and other domains)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: '10mb' }));
  app.use('/audio', express.static(path.resolve(__dirname, 'public/audio')));

  // Read default sheet URL
  app.get('/api/default-sheet', (_req, res) => {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const data = JSON.parse(raw);
        return res.json({ defaultUrl: data.defaultUrl || '' });
      }
    } catch (e) {
      console.warn('Failed to read sheet_config.json:', e);
    }
    return res.json({ defaultUrl: '' });
  });

  // Update default sheet URL
  app.post('/api/default-sheet', (req, res) => {
    try {
      const { url } = req.body;
      const cleanUrl = typeof url === 'string' ? url.trim() : '';
      fs.writeFileSync(CONFIG_FILE, JSON.stringify({ defaultUrl: cleanUrl }, null, 2), 'utf-8');
      return res.json({ success: true, defaultUrl: cleanUrl });
    } catch (e) {
      console.error('Failed to write sheet_config.json:', e);
      return res.status(500).json({ error: 'Failed to save sheet configuration' });
    }
  });

  // Custom Teacher Questions API
  app.get('/api/custom-questions', (_req, res) => {
    try {
      if (fs.existsSync(CUSTOM_QUESTIONS_FILE)) {
        const data = JSON.parse(fs.readFileSync(CUSTOM_QUESTIONS_FILE, 'utf-8'));
        return res.json({ questions: data });
      }
    } catch (e) {
      console.warn('Failed to read custom_questions.json:', e);
    }
    return res.json({ questions: [] });
  });

  app.post('/api/custom-questions', (req, res) => {
    try {
      const { questions } = req.body;
      if (!Array.isArray(questions)) {
        return res.status(400).json({ error: 'Invalid questions payload' });
      }
      fs.writeFileSync(CUSTOM_QUESTIONS_FILE, JSON.stringify(questions, null, 2), 'utf-8');
      return res.json({ success: true, count: questions.length });
    } catch (e) {
      console.error('Failed to save custom questions:', e);
      return res.status(500).json({ error: 'Failed to save questions' });
    }
  });

  // Gemini AI Question Generator API (Server-side @google/genai)
  app.post('/api/gemini/generate-questions', async (req, res) => {
    try {
      const { topic, difficulty, count = 5, parasha } = req.body;
      const topicPrompt = parasha ? `פרשת השבוע: ${parasha} וההפטרה שלה` : `ספר/נושא: ${topic || 'ספר בראשית'}`;
      const diffPrompt = difficulty ? `רמת קושי: ${difficulty}` : 'רמות קושי מעורבות (קל עד בינוני)';

      const prompt = `חבר ${count} שאלות אמריקאיות מעמיקות, מרתקות ומדויקות לחלוטין על פי פשט התנ"ך ומפרשיו בנושא: ${topicPrompt}, ${diffPrompt}.
לכל שאלה חובה לספק:
1. שאלת רב-ברירה ברורה
2. 4 אפשרויות תשובה, כאשר בדיוק אחת נכונה והאחרות מסיחים הגיוניים
3. התשובה הנכונה המדויקת
4. ציטוט הפסוק המדויק מהתנ"ך המוכיח את התשובה
5. מקור תנ"כי מפורט (למשל: בראשית יב, א)`;

      let formattedQuestions: Question[] = [];

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  correctAnswer: { type: Type.STRING },
                  option2: { type: Type.STRING },
                  option3: { type: Type.STRING },
                  option4: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  source: { type: Type.STRING },
                  quote: { type: Type.STRING },
                  parasha: { type: Type.STRING }
                },
                required: ['question', 'correctAnswer', 'option2', 'option3', 'option4', 'source', 'quote']
              }
            }
          }
        });

        const rawJson = response.text || '[]';
        const parsed = JSON.parse(rawJson);

        formattedQuestions = parsed.map((q: any, i: number) => ({
          id: `ai_${Date.now()}_${i}`,
          questionType: 'רב ברירה',
          topic: q.topic || topic || 'תנ"ך',
          difficulty: (q.difficulty as any) || difficulty || 'בינוני',
          question: q.question,
          correctAnswer: q.correctAnswer,
          option2: q.option2,
          option3: q.option3,
          option4: q.option4,
          source: q.source,
          quote: q.quote,
          author: 'בינה מלאכותית (מאומת תנ"ך)',
          parasha: q.parasha || parasha
        }));
      } catch (geminiErr) {
        console.warn('Gemini API temporary spike, generating authentic fallback questions:', geminiErr);
        // Fallback generator from rich built-in corpus matching topic
        const matched = BUILTIN_TANACH_QUESTIONS.filter(q => 
          !topic || topic === 'כל הנושאים' || q.topic === topic || (parasha && q.parasha === parasha)
        );
        const sourcePool = matched.length > 0 ? matched : BUILTIN_TANACH_QUESTIONS;
        const shuffled = shuffle(sourcePool).slice(0, count);
        formattedQuestions = shuffled.map((q, i) => ({
          ...q,
          id: `gen_${Date.now()}_${i}`,
          topic: topic || q.topic,
          difficulty: difficulty || q.difficulty,
          author: 'מאגר מופת תנ"כי'
        }));
      }

      return res.json({ success: true, questions: formattedQuestions });
    } catch (err) {
      console.error('Generation error:', err);
      return res.status(500).json({ 
        error: err instanceof Error ? err.message : 'שגיאה ביצירת שאלות'
      });
    }
  });

  // Google Sheets Proxy
  app.get('/api/sheet-proxy', async (req, res) => {
    try {
      const rawUrl = req.query.url as string;
      if (!rawUrl) {
        return res.status(400).json({ error: 'Missing url parameter' });
      }

      let targetUrl = rawUrl.trim();
      if (!targetUrl.includes('export?format=csv') && !targetUrl.includes('/pub?output=csv') && !targetUrl.endsWith('.csv')) {
        const match = targetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
          const sheetId = match[1];
          const gidMatch = targetUrl.match(/[#&?]gid=([0-9]+)/);
          const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
          targetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
        } else if (targetUrl.includes('/pubhtml')) {
          targetUrl = targetUrl.replace(/\/pubhtml.*$/, '/pub?output=csv');
        }
      }

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/csv, text/plain, */*'
        },
        redirect: 'follow'
      });

      if (!response.ok) {
        return res.status(response.status).json({
          error: `Google Sheets returned HTTP status ${response.status}`
        });
      }

      const csvContent = await response.text();
      if (csvContent.includes('<!DOCTYPE html>') || csvContent.includes('<html') || csvContent.includes('accounts.google.com')) {
        return res.status(403).json({
          error: 'הגיליון מוגדר כפרטי. יש לפתוח ב-Google Sheets ולשתף לכל מי שיש לו קישור'
        });
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(csvContent);
    } catch (err) {
      console.error('Sheet proxy error:', err);
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to fetch sheet from Google'
      });
    }
  });

  // Mount Vite or static
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  // Create HTTP server and mount WebSockets on port 3000
  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws: WebSocket) => {
    const sendRoomList = () => {
      const list = Array.from(rooms.values())
        .filter(r => r.status === 'lobby')
        .map(r => ({
          id: r.id,
          name: r.name,
          hostName: r.hostName,
          mode: r.mode,
          subMode: r.subMode,
          playerCount: r.players.size,
          maxPlayers: r.maxPlayers,
          status: r.status
        }));
      ws.send(JSON.stringify({ type: 'room:list', payload: { rooms: list } }));
    };

    sendRoomList();

    ws.on('message', (data: string) => {
      try {
        const msg: ClientMessage = JSON.parse(data.toString());

        switch (msg.type) {
          case 'room:list': {
            sendRoomList();
            break;
          }

          case 'room:create': {
            const { hostName, mode, subMode, selectedTopics, selectedDifficulties, targetScore } = msg.payload;
            const roomId = generateRoomCode();
            const hostId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const remotePin = Math.floor(100 + Math.random() * 900).toString();

            const hostPlayer: PlayerInternal = {
              id: hostId,
              name: hostName.trim() || 'מארח המשחק',
              isHost: true,
              score: 0,
              ready: true,
              connected: true,
              avatarSeed: Math.floor(Math.random() * 8),
              ws
            };

            const room: RoomInternal = {
              id: roomId,
              name: mode === 'kahoot' ? `קהוט תנ"ך כיתתי (${hostPlayer.name})` : `החדר של ${hostPlayer.name}`,
              mode,
              subMode,
              hostId,
              hostName: hostPlayer.name,
              players: new Map([[hostId, hostPlayer]]),
              status: 'lobby',
              selectedTopics: selectedTopics.length > 0 ? selectedTopics : ['כל הנושאים'],
              selectedDifficulties: selectedDifficulties.length > 0 ? selectedDifficulties : ['קל', 'בינוני', 'קשה'],
              maxPlayers: mode === 'head_to_head' ? 2 : mode === 'world_cup' ? 8 : 100,
              targetScore: targetScore || (mode === 'head_to_head' ? 5 : 2),
              currentQuestionIndex: 0,
              questions: [...BUILTIN_TANACH_QUESTIONS],
              answeredPlayerIds: new Set(),
              remotePin
            };

            rooms.set(roomId, room);
            socketToPlayer.set(ws, { playerId: hostId, roomId });

            ws.send(JSON.stringify({
              type: 'room:joined',
              payload: { room: serializeRoom(room), myPlayerId: hostId }
            }));

            broadcastRoomsList();
            break;
          }

          case 'room:join': {
            const { roomId, playerName, asRemote, remotePin } = msg.payload;
            const cleanCode = roomId.trim();
            const room = rooms.get(cleanCode);

            if (!room) {
              ws.send(JSON.stringify({ type: 'error', payload: { message: `לא נמצא חדר עם הקוד ${cleanCode}` } }));
              return;
            }

            // Remote control connection
            if (asRemote) {
              if (remotePin && remotePin !== room.remotePin && remotePin !== room.id) {
                ws.send(JSON.stringify({ type: 'error', payload: { message: 'קוד שלט רחוק שגוי' } }));
                return;
              }
              const remoteId = `remote_${Date.now()}`;
              const remotePlayer: PlayerInternal = {
                id: remoteId,
                name: 'שלט מנחה',
                isHost: false,
                isRemote: true,
                score: 0,
                ready: true,
                connected: true,
                ws
              };
              room.players.set(remoteId, remotePlayer);
              socketToPlayer.set(ws, { playerId: remoteId, roomId: cleanCode, isRemote: true });
              ws.send(JSON.stringify({
                type: 'room:joined',
                payload: { room: serializeRoom(room), myPlayerId: remoteId, isRemote: true }
              }));
              return;
            }

            if (room.status !== 'lobby') {
              ws.send(JSON.stringify({ type: 'error', payload: { message: 'המשחק בחדר זה כבר החל' } }));
              return;
            }

            if (room.players.size >= room.maxPlayers) {
              ws.send(JSON.stringify({ type: 'error', payload: { message: `החדר מלא (${room.maxPlayers} שחקנים)` } }));
              return;
            }

            const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const newPlayer: PlayerInternal = {
              id: playerId,
              name: playerName.trim() || `תלמיד ${room.players.size + 1}`,
              isHost: false,
              score: 0,
              streak: 0,
              ready: true,
              connected: true,
              avatarSeed: Math.floor(Math.random() * 8),
              ws
            };

            room.players.set(playerId, newPlayer);
            socketToPlayer.set(ws, { playerId, roomId: cleanCode });

            ws.send(JSON.stringify({
              type: 'room:joined',
              payload: { room: serializeRoom(room), myPlayerId: playerId }
            }));

            broadcastToRoom(room, {
              type: 'room:update',
              payload: { room: serializeRoom(room) }
            });

            broadcastRoomsList();
            break;
          }

          case 'game:start': {
            const mapping = socketToPlayer.get(ws);
            if (!mapping) return;
            const room = rooms.get(mapping.roomId);
            if (!room) return;

            // Allow host or authenticated remote to start
            if (room.hostId !== mapping.playerId && !mapping.isRemote) return;

            if (room.mode === 'head_to_head' && room.players.size < 2) {
              ws.send(JSON.stringify({ type: 'error', payload: { message: 'נדרשים 2 שחקנים כדי להתחיל קרב ראש בראש' } }));
              return;
            }

            if (room.mode === 'world_cup' && room.players.size < 4) {
              ws.send(JSON.stringify({ type: 'error', payload: { message: 'במונדיאל תנ"ך נדרשים לפחות 4 שחקנים בחדר' } }));
              return;
            }

            // Filter questions by selected topics & difficulties
            let pool = BUILTIN_TANACH_QUESTIONS;
            if (!room.selectedTopics.includes('כל הנושאים')) {
              pool = pool.filter(q => room.selectedTopics.includes(q.topic) || (q.parasha && room.selectedTopics.includes(q.parasha)));
            }
            if (room.selectedDifficulties.length > 0) {
              pool = pool.filter(q => room.selectedDifficulties.includes(q.difficulty));
            }
            if (pool.length === 0) pool = BUILTIN_TANACH_QUESTIONS;

            room.questions = shuffle(pool);
            room.currentQuestionIndex = 0;
            room.status = 'playing';
            room.answeredPlayerIds.clear();
            room.lastAnswerResult = undefined;

            const firstQ = room.questions[0];
            room.activeQuestion = sanitizeQuestion(firstQ);

            // Initialize Kahoot state
            if (room.mode === 'kahoot') {
              const totalStudents = Array.from(room.players.values()).filter(p => !p.isHost && !p.isRemote).length;
              room.kahootState = {
                questionStartTime: Date.now(),
                timeLimitSeconds: 20,
                answeredCount: 0,
                totalStudentsCount: totalStudents,
                distribution: {},
                showResults: false,
                topPlayers: []
              };
            }

            // Set up World Cup match structure
            if (room.mode === 'world_cup') {
              const playersList = Array.from(room.players.values()).filter(p => !p.isRemote);
              const matches: TournamentMatchState[] = [];
              matches.push({
                id: 's_0', round: 1, matchIndex: 0,
                player1Id: playersList[0].id, player2Id: playersList[1].id,
                player1Name: playersList[0].name, player2Name: playersList[1].name,
                score1: 0, score2: 0, status: 'in_progress'
              });
              matches.push({
                id: 's_1', round: 1, matchIndex: 1,
                player1Id: playersList[2]?.id || playersList[0].id,
                player2Id: playersList[3]?.id || playersList[1].id,
                player1Name: playersList[2]?.name || 'מתחרה 3',
                player2Name: playersList[3]?.name || 'מתחרה 4',
                score1: 0, score2: 0, status: 'pending'
              });
              matches.push({
                id: 'final', round: 2, matchIndex: 0,
                player1Id: '', player2Id: '', player1Name: '?', player2Name: '?',
                score1: 0, score2: 0, status: 'pending'
              });
              room.matches = matches;
              room.activeMatchId = 's_0';
              room.activePlayer1Id = playersList[0].id;
              room.activePlayer2Id = playersList[1].id;
            }

            broadcastToRoom(room, {
              type: 'room:update',
              payload: { room: serializeRoom(room) }
            });

            broadcastRoomsList();
            break;
          }

          case 'question:answer': {
            const mapping = socketToPlayer.get(ws);
            if (!mapping) return;
            const room = rooms.get(mapping.roomId);
            if (!room || room.status !== 'playing' || !room.activeQuestion) return;

            const player = room.players.get(mapping.playerId);
            if (!player || player.isHost || player.isRemote) return;

            if (room.answeredPlayerIds.has(player.id)) return;
            room.answeredPlayerIds.add(player.id);

            const { selectedOption, timeTakenMs } = msg.payload;
            const currentQ = room.questions[room.currentQuestionIndex];
            if (!currentQ) return;

            const isCorrect = selectedOption === currentQ.correctAnswer;

            // KAHOOT MODE ANSWER EVALUATION (Speed + Accuracy + Streak)
            if (room.mode === 'kahoot' && room.kahootState) {
              room.kahootState.distribution[selectedOption] = (room.kahootState.distribution[selectedOption] || 0) + 1;
              room.kahootState.answeredCount += 1;

              if (isCorrect) {
                player.streak = (player.streak || 0) + 1;
                const elapsedSec = (Date.now() - room.kahootState.questionStartTime) / 1000;
                const timeRatio = Math.max(0, (20 - elapsedSec) / 20);
                const speedPoints = Math.round(500 + timeRatio * 500);
                const streakBonus = Math.min((player.streak - 1) * 50, 200);
                const earned = speedPoints + streakBonus;
                player.score += earned;
                player.lastPointsEarned = earned;
              } else {
                player.streak = 0;
                player.lastPointsEarned = 0;
              }

              updateKahootLeaderboard(room);

              // Broadcast answered count update immediately
              broadcastToRoom(room, {
                type: 'room:update',
                payload: { room: serializeRoom(room) }
              });

              // If all active students answered, auto-reveal!
              const nonHostCount = Array.from(room.players.values()).filter(p => !p.isHost && !p.isRemote).length;
              if (room.answeredPlayerIds.size >= nonHostCount && !room.kahootState.showResults) {
                room.kahootState.showResults = true;
                room.lastAnswerResult = {
                  answeredByPlayerId: player.id,
                  answeredByName: 'כיתה',
                  selectedOption,
                  isCorrect: true,
                  correctAnswer: currentQ.correctAnswer,
                  quote: currentQ.quote,
                  source: currentQ.source
                };
                broadcastToRoom(room, {
                  type: 'game:answer_result',
                  payload: { result: room.lastAnswerResult, room: serializeRoom(room) }
                });
              }
              return;
            }

            // Head to Head & World Cup evaluation
            if (isCorrect) {
              player.score += 1;
            }

            if (room.mode === 'world_cup' && room.activeMatchId && room.matches) {
              const activeMatch = room.matches.find(m => m.id === room.activeMatchId);
              if (activeMatch && isCorrect) {
                if (player.id === activeMatch.player1Id) activeMatch.score1 += 1;
                else if (player.id === activeMatch.player2Id) activeMatch.score2 += 1;

                if (activeMatch.score1 >= 2 || activeMatch.score2 >= 2) {
                  activeMatch.winnerId = activeMatch.score1 >= 2 ? activeMatch.player1Id : activeMatch.player2Id;
                  activeMatch.winnerName = activeMatch.score1 >= 2 ? activeMatch.player1Name : activeMatch.player2Name;
                  activeMatch.status = 'completed';
                  // Advance to final
                  const finalM = room.matches.find(m => m.id === 'final');
                  if (finalM) {
                    if (activeMatch.id === 's_0') {
                      finalM.player1Id = activeMatch.winnerId;
                      finalM.player1Name = activeMatch.winnerName;
                    } else {
                      finalM.player2Id = activeMatch.winnerId;
                      finalM.player2Name = activeMatch.winnerName;
                    }
                  }
                }
              }
            }

            let gameOverWinner: string | undefined;
            if (room.mode === 'head_to_head' && player.score >= room.targetScore) {
              gameOverWinner = player.name;
              room.status = 'game_over';
              room.winnerName = player.name;
            }

            room.lastAnswerResult = {
              answeredByPlayerId: player.id,
              answeredByName: player.name,
              selectedOption,
              isCorrect,
              correctAnswer: currentQ.correctAnswer,
              quote: currentQ.quote,
              source: currentQ.source
            };

            broadcastToRoom(room, {
              type: 'game:answer_result',
              payload: { result: room.lastAnswerResult, room: serializeRoom(room) }
            });

            if (gameOverWinner) {
              broadcastToRoom(room, {
                type: 'game:over',
                payload: { winnerName: gameOverWinner, room: serializeRoom(room) }
              });
              return;
            }

            if (!room.advanceTimeout) {
              room.advanceTimeout = setTimeout(() => {
                advanceToNextQuestion(room);
              }, 2800);
            }
            break;
          }

          case 'kahoot:reveal': {
            const mapping = socketToPlayer.get(ws);
            if (!mapping) return;
            const room = rooms.get(mapping.roomId);
            if (!room || room.mode !== 'kahoot' || !room.kahootState) return;

            const currentQ = room.questions[room.currentQuestionIndex];
            if (!currentQ) return;

            room.kahootState.showResults = true;
            updateKahootLeaderboard(room);

            room.lastAnswerResult = {
              answeredByPlayerId: 'host',
              answeredByName: 'חשיפת תשובה',
              selectedOption: currentQ.correctAnswer,
              isCorrect: true,
              correctAnswer: currentQ.correctAnswer,
              quote: currentQ.quote,
              source: currentQ.source
            };

            broadcastToRoom(room, {
              type: 'game:answer_result',
              payload: { result: room.lastAnswerResult, room: serializeRoom(room) }
            });
            break;
          }

          case 'question:next': {
            const mapping = socketToPlayer.get(ws);
            if (!mapping) return;
            const room = rooms.get(mapping.roomId);
            if (!room || room.status !== 'playing') return;
            advanceToNextQuestion(room);
            break;
          }

          case 'remote:action': {
            const mapping = socketToPlayer.get(ws);
            if (!mapping) return;
            const room = rooms.get(mapping.roomId);
            if (!room) return;

            const { action, soundName } = msg.payload;
            if (action === 'start') {
              // Trigger start
              ws.emit('message', JSON.stringify({ type: 'game:start' }));
            } else if (action === 'next') {
              advanceToNextQuestion(room);
            } else if (action === 'reveal' && room.mode === 'kahoot') {
              const currentQ = room.questions[room.currentQuestionIndex];
              if (currentQ && room.kahootState) {
                room.kahootState.showResults = true;
                updateKahootLeaderboard(room);
                room.lastAnswerResult = {
                  answeredByPlayerId: 'host',
                  answeredByName: 'חשיפת תשובה',
                  selectedOption: currentQ.correctAnswer,
                  isCorrect: true,
                  correctAnswer: currentQ.correctAnswer,
                  quote: currentQ.quote,
                  source: currentQ.source
                };
                broadcastToRoom(room, {
                  type: 'game:answer_result',
                  payload: { result: room.lastAnswerResult, room: serializeRoom(room) }
                });
              }
            } else if (action === 'sound' && soundName) {
              broadcastToRoom(room, {
                type: 'remote:sound_trigger',
                payload: { soundName }
              });
            }
            break;
          }

          case 'game:rematch': {
            const mapping = socketToPlayer.get(ws);
            if (!mapping) return;
            const room = rooms.get(mapping.roomId);
            if (!room) return;

            room.status = 'lobby';
            room.currentQuestionIndex = 0;
            room.answeredPlayerIds.clear();
            room.lastAnswerResult = undefined;
            room.winnerName = undefined;
            room.players.forEach(p => { 
              p.score = 0; 
              p.streak = 0; 
              p.lastPointsEarned = 0; 
            });
            if (room.kahootState) {
              room.kahootState.topPlayers = [];
              room.kahootState.distribution = {};
              room.kahootState.showResults = false;
            }

            broadcastToRoom(room, {
              type: 'room:update',
              payload: { room: serializeRoom(room) }
            });
            broadcastRoomsList();
            break;
          }

          case 'room:leave': {
            handlePlayerLeave(ws);
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      handlePlayerLeave(ws);
    });
  });

  function handlePlayerLeave(ws: WebSocket) {
    const mapping = socketToPlayer.get(ws);
    if (!mapping) return;
    socketToPlayer.delete(ws);

    const room = rooms.get(mapping.roomId);
    if (!room) return;

    room.players.delete(mapping.playerId);

    if (room.players.size === 0) {
      if (room.advanceTimeout) clearTimeout(room.advanceTimeout);
      rooms.delete(room.id);
    } else {
      if (room.hostId === mapping.playerId) {
        const nextHost = room.players.values().next().value;
        if (nextHost) {
          nextHost.isHost = true;
          room.hostId = nextHost.id;
          room.hostName = nextHost.name;
        }
      }

      broadcastToRoom(room, {
        type: 'room:update',
        payload: { room: serializeRoom(room) }
      });
    }

    broadcastRoomsList();
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server & WebSocket listening on port ${PORT} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer();
