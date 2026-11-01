import { 
  ClientMessage, 
  ServerMessage, 
  MultiplayerRoom, 
  OnlineGameMode, 
  OnlineHeadToHeadSubMode 
} from '../types/multiplayer';
import { getWebSocketUrl } from '../utils/serverConfig';

type RoomListCallback = (rooms: {
  id: string;
  name: string;
  hostName: string;
  mode: OnlineGameMode;
  subMode: OnlineHeadToHeadSubMode;
  playerCount: number;
  maxPlayers: number;
  status: MultiplayerRoom['status'];
}[]) => void;

type RoomJoinedCallback = (room: MultiplayerRoom, myPlayerId: string, isRemote?: boolean) => void;
type RoomUpdateCallback = (room: MultiplayerRoom) => void;
type AnswerResultCallback = (result: NonNullable<MultiplayerRoom['lastAnswerResult']>, room: MultiplayerRoom) => void;
type GameOverCallback = (winnerName: string, room: MultiplayerRoom) => void;
type SoundTriggerCallback = (soundName: string) => void;
type ErrorCallback = (message: string) => void;
type ConnectionChangeCallback = (connected: boolean) => void;

class MultiplayerService {
  private ws: WebSocket | null = null;
  private myPlayerId: string | null = null;
  private currentRoom: MultiplayerRoom | null = null;
  private isConnecting: boolean = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isRemoteUser: boolean = false;

  // Listeners
  private roomListListeners = new Set<RoomListCallback>();
  private roomJoinedListeners = new Set<RoomJoinedCallback>();
  private roomUpdateListeners = new Set<RoomUpdateCallback>();
  private answerResultListeners = new Set<AnswerResultCallback>();
  private gameOverListeners = new Set<GameOverCallback>();
  private soundTriggerListeners = new Set<SoundTriggerCallback>();
  private errorListeners = new Set<ErrorCallback>();
  private connectionChangeListeners = new Set<ConnectionChangeCallback>();

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    const wsUrl = getWebSocketUrl();

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.notifyConnectionChange(true);
        this.send({ type: 'room:list' });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (err) {
          console.error('Failed to parse incoming WebSocket message:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('Multiplayer WebSocket error:', err);
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.notifyConnectionChange(false);
        if (this.currentRoom && this.currentRoom.status !== 'game_over') {
          if (!this.reconnectTimer) {
            this.reconnectTimer = setTimeout(() => {
              this.reconnectTimer = null;
              this.connect();
            }, 3000);
          }
        }
      };
    } catch (e) {
      this.isConnecting = false;
      this.notifyConnectionChange(false);
    }
  }

  public forceReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.onclose = null;
        this.ws.close();
      } catch (e) {
        // Ignore
      }
      this.ws = null;
    }
    this.isConnecting = false;
    this.connect();
  }

  public getActiveWsUrl(): string {
    return getWebSocketUrl();
  }

  private handleServerMessage(msg: ServerMessage): void {
    switch (msg.type) {
      case 'room:list':
        this.roomListListeners.forEach(cb => cb(msg.payload.rooms));
        break;

      case 'room:joined':
        this.myPlayerId = msg.payload.myPlayerId;
        this.currentRoom = msg.payload.room;
        this.isRemoteUser = !!msg.payload.isRemote;
        this.roomJoinedListeners.forEach(cb => cb(msg.payload.room, msg.payload.myPlayerId, msg.payload.isRemote));
        this.roomUpdateListeners.forEach(cb => cb(msg.payload.room));
        break;

      case 'room:update':
        this.currentRoom = msg.payload.room;
        this.roomUpdateListeners.forEach(cb => cb(msg.payload.room));
        break;

      case 'game:answer_result':
        this.currentRoom = msg.payload.room;
        this.answerResultListeners.forEach(cb => cb(msg.payload.result, msg.payload.room));
        this.roomUpdateListeners.forEach(cb => cb(msg.payload.room));
        break;

      case 'game:over':
        this.currentRoom = msg.payload.room;
        this.gameOverListeners.forEach(cb => cb(msg.payload.winnerName, msg.payload.room));
        this.roomUpdateListeners.forEach(cb => cb(msg.payload.room));
        break;

      case 'remote:sound_trigger':
        this.soundTriggerListeners.forEach(cb => cb(msg.payload.soundName));
        break;

      case 'error':
        this.errorListeners.forEach(cb => cb(msg.payload.message));
        break;
    }
  }

  private send(msg: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      this.connect();
      setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(msg));
        }
      }, 500);
    }
  }

  public createRoom(params: {
    hostName: string;
    mode: OnlineGameMode;
    subMode: OnlineHeadToHeadSubMode;
    selectedTopics: string[];
    selectedDifficulties: string[];
    targetScore: number;
    timeLimitSeconds?: number;
  }): void {
    this.send({
      type: 'room:create',
      payload: params
    });
  }

  public joinRoom(roomId: string, playerName: string, options?: { asRemote?: boolean; remotePin?: string }): void {
    this.send({
      type: 'room:join',
      payload: { 
        roomId, 
        playerName, 
        asRemote: options?.asRemote,
        remotePin: options?.remotePin
      }
    });
  }

  public requestRoomsList(): void {
    this.send({ type: 'room:list' });
  }

  public startGame(): void {
    this.send({ type: 'game:start' });
  }

  public submitAnswer(selectedOption: string, timeTakenMs?: number): void {
    this.send({
      type: 'question:answer',
      payload: { selectedOption, timeTakenMs }
    });
  }

  public nextQuestion(): void {
    this.send({ type: 'question:next' });
  }

  public revealKahootResults(): void {
    this.send({ type: 'kahoot:reveal' });
  }

  public sendRemoteAction(action: 'start' | 'next' | 'reveal' | 'sound', soundName?: string): void {
    this.send({
      type: 'remote:action',
      payload: { action, soundName }
    });
  }

  public rematch(): void {
    this.send({ type: 'game:rematch' });
  }

  public leaveRoom(): void {
    this.send({ type: 'room:leave' });
    this.currentRoom = null;
    this.myPlayerId = null;
    this.isRemoteUser = false;
  }

  public getMyPlayerId(): string | null {
    return this.myPlayerId;
  }

  public isRemote(): boolean {
    return this.isRemoteUser;
  }

  public getCurrentRoom(): MultiplayerRoom | null {
    return this.currentRoom;
  }

  public isConnected(): boolean {
    return !!this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  // Subscriptions
  public onRoomsList(cb: RoomListCallback): () => void {
    this.roomListListeners.add(cb);
    return () => this.roomListListeners.delete(cb);
  }

  public onRoomJoined(cb: RoomJoinedCallback): () => void {
    this.roomJoinedListeners.add(cb);
    return () => this.roomJoinedListeners.delete(cb);
  }

  public onRoomUpdate(cb: RoomUpdateCallback): () => void {
    this.roomUpdateListeners.add(cb);
    return () => this.roomUpdateListeners.delete(cb);
  }

  public onAnswerResult(cb: AnswerResultCallback): () => void {
    this.answerResultListeners.add(cb);
    return () => this.answerResultListeners.delete(cb);
  }

  public onGameOver(cb: GameOverCallback): () => void {
    this.gameOverListeners.add(cb);
    return () => this.gameOverListeners.delete(cb);
  }

  public onSoundTrigger(cb: SoundTriggerCallback): () => void {
    this.soundTriggerListeners.add(cb);
    return () => this.soundTriggerListeners.delete(cb);
  }

  public onError(cb: ErrorCallback): () => void {
    this.errorListeners.add(cb);
    return () => this.errorListeners.delete(cb);
  }

  public onConnectionChange(cb: ConnectionChangeCallback): () => void {
    this.connectionChangeListeners.add(cb);
    return () => this.connectionChangeListeners.delete(cb);
  }

  private notifyConnectionChange(connected: boolean) {
    this.connectionChangeListeners.forEach(cb => cb(connected));
  }
}

export const multiplayerService = new MultiplayerService();
