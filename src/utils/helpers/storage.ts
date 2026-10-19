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

// Kullanıcı adı ve avatar sadece tarayıcıda tutulur (sunucuya/veritabanına kaydedilmez);
// sekme ya da tarayıcı kapanınca silinir.
export const getProfile = () => read<Profile>(sessionStorage, PROFILE_KEY);
export const saveProfile = (profile: Profile) => write(sessionStorage, PROFILE_KEY, profile);

// Eski sürümler profili localStorage'da kalıcı tutuyordu; kalıntısını temizle
try {
  localStorage.removeItem(PROFILE_KEY);
} catch {
  // Depolama kapalıysa yapılacak bir şey yok
}

// Odadaki koltuk sekmeye özeldir; böylece aynı tarayıcıda iki sekmeyle test edilebilir
// ve sayfa yenilenince oyuncu kaldığı yerden devam eder.
export const getSeat = () => read<Seat>(sessionStorage, SEAT_KEY);
export const saveSeat = (seat: Seat | null) => write(sessionStorage, SEAT_KEY, seat);
