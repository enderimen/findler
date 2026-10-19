import { SymbolSet } from '@/types/game';
import { ALPHABET } from '@/utils/constants/gameSettings';

// Sıralamadaki yeri (1..N) ekranda gösterilecek sembole çevirir
export const symbolFor = (value: number, symbols: SymbolSet) => {
  switch (symbols) {
    case 'letters':
      return ALPHABET[value - 1] ?? '?';
    case 'odd':
      return String(value * 2 - 1); // 1, 3, 5, 7...
    case 'even':
      return String((value - 1) * 2); // 0, 2, 4, 6...
    default:
      return String(value);
  }
};

// Ayarlarda seçilen sıranın ilk birkaç elemanı: "1, 3, 5, 7 …"
export const sequencePreview = (symbols: SymbolSet, count = 4) =>
  `${Array.from({ length: count }, (_, i) => symbolFor(i + 1, symbols)).join(', ')} …`;

export const formatDuration = (ms: number) => {
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};
