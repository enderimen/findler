import { GameSettings, RoomState } from './game';

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Socket olaylarına sunucunun döndüğü cevap
export type AckResponse<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export interface JoinResponse {
  roomId: string;
  playerId: string;
  state: RoomState;
}

// Davet ekranında katılmadan önce gösterilen oda özeti
export interface RoomPreview {
  hostName: string | null;
  players: { id: string; name: string; avatar: string | null; isHost: boolean }[];
  maxPlayers: number;
  settings: GameSettings;
  // Katılmaya engel bir durum varsa açıklaması
  blocked: string | null;
}
