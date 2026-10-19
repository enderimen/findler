import baseLogo from '@/assets/images/base-logo.svg';

// Seviyeye göre kart arkası: masa renginden daha parlak bir zemin, seviyeye özel bir
// CSS deseni ve ortada base-logo.svg. Masa renkleri için bkz. levelColor (gameSettings.ts).
interface CardTheme {
  // Kart zemini
  base: string;
  // Desen rengi (yarı saydam)
  light: string;
  // Kartın yan kenarları (3B dönüşte görünen kalınlık)
  edge: string;
  pattern: (light: string) => string;
}

// Çapraz çizgi
const stripes = (c: string) => `repeating-linear-gradient(45deg, ${c} 0 4px, transparent 4px 12px)`;

// Zikzak
const zigzag = (c: string) =>
  [
    `linear-gradient(135deg, ${c} 25%, transparent 25%) -7px 0 / 14px 14px`,
    `linear-gradient(225deg, ${c} 25%, transparent 25%) -7px 0 / 14px 14px`,
    `linear-gradient(315deg, ${c} 25%, transparent 25%) 0 0 / 14px 14px`,
    `linear-gradient(45deg, ${c} 25%, transparent 25%) 0 0 / 14px 14px`,
  ].join(', ');

// Puantiye
const dots = (c: string) =>
  [
    `radial-gradient(${c} 2.5px, transparent 3px) 0 0 / 12px 12px`,
    `radial-gradient(${c} 2.5px, transparent 3px) 6px 6px / 12px 12px`,
  ].join(', ');

// Dama
const checker = (c: string) =>
  [
    `linear-gradient(45deg, ${c} 25%, transparent 25%, transparent 75%, ${c} 75%) 0 0 / 14px 14px`,
    `linear-gradient(45deg, ${c} 25%, transparent 25%, transparent 75%, ${c} 75%) 7px 7px / 14px 14px`,
  ].join(', ');

// Kafes
const lattice = (c: string) =>
  [
    `repeating-linear-gradient(45deg, ${c} 0 2px, transparent 2px 9px)`,
    `repeating-linear-gradient(-45deg, ${c} 0 2px, transparent 2px 9px)`,
  ].join(', ');

const THEMES: Record<'green' | 'teal' | 'indigo' | 'plum' | 'red', CardTheme> = {
  green: { base: '#3f8f12', light: '#7fd14c80', edge: '#2f6d0d', pattern: stripes },
  teal: { base: '#0e8a99', light: '#5fd3e080', edge: '#0a6772', pattern: zigzag },
  indigo: { base: '#2c1cb0', light: '#7a6cf080', edge: '#1f1480', pattern: dots },
  plum: { base: '#9c1470', light: '#e06ab880', edge: '#740f53', pattern: checker },
  red: { base: '#a3161a', light: '#f0646480', edge: '#7a1013', pattern: lattice },
};

// levelColor ile aynı eşikler
const themeFor = (cardCount: number) => {
  if (cardCount <= 5) return THEMES.green;
  if (cardCount <= 9) return THEMES.teal;
  if (cardCount <= 12) return THEMES.indigo;
  if (cardCount <= 15) return THEMES.plum;
  return THEMES.red;
};

// Card bileşeninin kullandığı CSS değişkenleri
export const cardThemeVars = (cardCount: number) => {
  const theme = themeFor(cardCount);
  return {
    // Vite küçük SVG'leri tırnak içeren data URL olarak gömer; url() tırnaksız olursa değer geçersiz sayılır
    '--card-back': `url("${baseLogo}") center / 42% auto no-repeat, ${theme.pattern(theme.light)}, ${theme.base}`,
    '--card-edge': theme.edge,
  };
};
