import { Profile } from '@/types/game';

const PROFILE_KEY = 'fm:profile';
const SEAT_KEY = 'fm:seat';

export interface Seat {
  roomId: string;
  playerId: string;
}

const read = <T>(storage: Storage, key: string): T | null => {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const write = (storage: Storage, key: string, value: unknown) => {
  try {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, JSON.stringify(value));
  } catch {
    // Depolama kapalıysa (gizli sekme vb.) sessizce devam et
  }
};

// Kullanıcı adı ve avatar tüm sekmelerde hatırlanır
export const getProfile = () => read<Profile>(localStorage, PROFILE_KEY);
export const saveProfile = (profile: Profile) => write(localStorage, PROFILE_KEY, profile);

// Odadaki koltuk sekmeye özeldir; böylece aynı tarayıcıda iki sekmeyle test edilebilir
// ve sayfa yenilenince oyuncu kaldığı yerden devam eder.
export const getSeat = () => read<Seat>(sessionStorage, SEAT_KEY);
export const saveSeat = (seat: Seat | null) => write(sessionStorage, SEAT_KEY, seat);
