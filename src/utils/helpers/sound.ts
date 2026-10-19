// Sesler bir kez yüklenip tekrar kullanılır; hover gibi kısa seslerde gecikmeyi önler
const cache = new Map<string, HTMLAudioElement>();

const MUTED_KEY = 'fm:muted';
const listeners = new Set<() => void>();

// Eski sürümlerin localStorage'da bıraktığı tercihi temizle
try {
  localStorage.removeItem(MUTED_KEY);
} catch {
  // Depolama kapalıysa yapılacak bir şey yok
}

const readMuted = () => {
  try {
    return sessionStorage.getItem(MUTED_KEY) === '1';
  } catch {
    return false;
  }
};

let muted = readMuted();

export const isMuted = () => muted;

// Kullanıcının ses tercihi; sekme/tarayıcı kapanana kadar hatırlanır
export const setMuted = (value: boolean) => {
  muted = value;
  try {
    sessionStorage.setItem(MUTED_KEY, value ? '1' : '0');
  } catch {
    // Depolama kapalıysa tercih sadece bu oturumda geçerli olur
  }
  // Kapatıldığında çalmakta olan sesleri de sustur
  if (value) cache.forEach((audio) => audio.pause());
  listeners.forEach((listener) => listener());
};

export const subscribeMuted = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getAudio = (src: string) => {
  let audio = cache.get(src);
  if (!audio) {
    audio = new Audio(src);
    audio.preload = 'auto';
    cache.set(src, audio);
  }
  return audio;
};

export const preloadSounds = (...sources: string[]) => sources.forEach(getAudio);

// Tarayıcı, kullanıcı sayfayla etkileşime girmeden ses çalmayı engeller.
// Bu durumda veya ses kapalıysa hata fırlatmaz, false döner.
export const playSound = (src: string, volume = 1) => {
  if (muted) return Promise.resolve(false);
  const audio = getAudio(src);
  audio.volume = volume;
  audio.currentTime = 0;
  return audio.play().then(
    () => true,
    () => false
  );
};
