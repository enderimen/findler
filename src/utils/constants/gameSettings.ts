import { GameMode, SymbolSet } from '@/types/game';

// Sunucudaki OPTIONS ile aynı olmalı
export const CARD_COUNT_OPTIONS = [3, 5, 7, 9, 12, 15, 20];
export const TURN_SECONDS_OPTIONS = [0, 10, 20, 30, 60];

export const MODE_LABELS: Record<GameMode, string> = {
  classic: 'Klasik',
  marathon: 'Sürekli Devam',
};

export const MODE_DESCRIPTIONS: Record<GameMode, string> = {
  classic: 'İlk bitiren kazanır, oyun biter.',
  marathon: 'Bitiren çıkar, kalanlar sıralama için devam eder.',
};

// Sıra seçenekleri arayüzde bu sırayla gösterilir
export const SYMBOL_LABELS: Record<SymbolSet, string> = {
  numbers: 'Sayılar',
  odd: 'Tek Sayılar',
  even: 'Çift Sayılar',
  letters: 'Harfler',
};

// Türk alfabesi; 20 karta kadar A–P arası kullanılır
export const ALPHABET = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ';

export const turnSecondsLabel = (seconds: number) => (seconds === 0 ? 'Süresiz' : `${seconds} sn`);

// Seviyeye göre masa (arka plan) rengi; zorluk arttıkça renk "ısınır"
export const DEFAULT_BG_COLOR = '#2D6607';
export const levelColor = (cardCount: number) => {
  if (cardCount <= 5) return DEFAULT_BG_COLOR; // yeşil
  if (cardCount <= 9) return '#075b66'; // petrol mavisi
  if (cardCount <= 12) return '#120766'; // lacivert
  if (cardCount <= 15) return '#660746'; // mürdüm
  return '#660707'; // koyu kırmızı
};
