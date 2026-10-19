export type RoomStatus = 'lobby' | 'playing' | 'finished';

export type GameMode = 'classic' | 'marathon';
export type SymbolSet = 'numbers' | 'odd' | 'even' | 'letters';

export interface GameSettings {
  mode: GameMode;
  symbols: SymbolSet;
  cardCount: number;
  // 0 = süresiz
  turnSeconds: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string | null;
  connected: boolean;
  // Bu odada kazandığı / oynadığı oyun sayısı (sadece oda açık kaldıkça tutulur)
  wins: number;
  games: number;
  mistakes: number;
  // Bu oyunda açtığı kart sayısı
  moves: number;
}

export interface Finisher {
  id: string;
  name: string;
}

// Sunucunun odadaki herkese yayınladığı durum. Kapalı kartlar `null` gelir.
export interface RoomState {
  roomId: string;
  isPublic: boolean;
  solo: boolean;
  hostId: string;
  status: RoomStatus;
  settings: GameSettings;
  gameId: number;
  // Kartlar her dağıtıldığında/karıştırıldığında artar
  dealId: number;
  // Her yeni hamle süresinde artar
  turnSeq: number;
  players: Player[];
  // Kart değerleri sıralamadaki yeridir (1..N); harf modunda istemci harfe çevirir
  board: (number | null)[];
  nextExpected: number;
  currentPlayerId: string | null;
  turnRemainingMs: number | null;
  locked: boolean;
  finishers: Finisher[];
  // Oyun bitince tekrar oynamak isteyen oyuncuların id'leri
  rematchRequests: string[];
  winnerId: string | null;
  durationMs: number | null;
  minPlayers: number;
  maxPlayers: number;
}

export type NoticeType = 'join' | 'leave' | 'start' | 'info' | 'error';

export interface Notice {
  id: number;
  message: string;
  type: NoticeType;
}

export interface Profile {
  name: string;
  avatar: string | null;
}

// Skor Tablosu sayfası için son oynanan odanın skorları
export interface RoomScores {
  roomId: string;
  solo: boolean;
  // Bu tarayıcıdaki oyuncu ("Sen" işareti için)
  meId: string | null;
  players: Pick<Player, 'id' | 'name' | 'avatar' | 'wins' | 'games'>[];
}
