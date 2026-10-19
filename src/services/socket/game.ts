import { io } from 'socket.io-client';
import { AckResponse, JoinResponse, RoomPreview } from '@/types/api';
import { GameSettings, Profile } from '@/types/game';
import { Error as ErrorMessage } from '@/utils/constants';

// Varsayılan olarak sayfanın açıldığı makinedeki 3001 portuna bağlanır;
// böylece aynı ağdaki başka bilgisayarlar da IP adresiyle oynayabilir.
export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ?? `${window.location.protocol}//${window.location.hostname}:3001`;

// Uygulama genelinde tek bir bağlantı kullanılır. Sayfa açılır açılmaz bağlanmayı
// denediği için ücretsiz sunucu uykudaysa uyanması da o an başlar.
export const socket = io(SERVER_URL);

const REQUEST_TIMEOUT = 5000;
// Ücretsiz sunucu (Render) uykudan uyanırken bağlantı bir dakika kadar sürebilir
const CONNECT_TIMEOUT = 90000;

const waitForConnection = () =>
  new Promise<void>((resolve, reject) => {
    if (socket.connected) return resolve();
    const onConnect = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      socket.off('connect', onConnect);
      reject(new Error(ErrorMessage.network));
    }, CONNECT_TIMEOUT);
    socket.once('connect', onConnect);
  });

// Sunucunun ack cevabını Promise'e çevirir; `ok: false` gelirse hata fırlatır.
// Bağlantı yoksa önce kurulmasını bekler, 5 sn'lik cevap süresi ondan sonra başlar.
const request = async <T = object>(event: string, payload: object = {}) => {
  await waitForConnection();
  return new Promise<T>((resolve, reject) => {
    socket.timeout(REQUEST_TIMEOUT).emit(event, payload, (err: Error | null, res: AckResponse<T>) => {
      if (err) return reject(new Error(ErrorMessage.network));
      if (!res.ok) return reject(new Error(res.error));
      resolve(res);
    });
  });
};

export const gameApi = {
  createRoom: (profile: Profile, options: { solo?: boolean } = {}) =>
    request<JoinResponse>('room:create', { ...profile, ...options }),
  quickPlay: (profile: Profile) => request<JoinResponse>('room:quickPlay', profile),
  joinRoom: (payload: Profile & { roomId: string; playerId?: string }) => request<JoinResponse>('room:join', payload),
  peekRoom: (roomId: string) => request<RoomPreview>('room:peek', { roomId }),
  leaveRoom: () => request('room:leave'),
  updateSettings: (settings: Partial<GameSettings>) => request('room:settings', settings),
  transferHost: (playerId: string) => request('room:transferHost', { playerId }),
  startGame: () => request('game:start'),
  restartGame: () => request('game:restart'),
  requestRematch: () => request('game:rematch'),
  flipCard: (index: number) => request<{ value: number }>('card:flip', { index })
};
