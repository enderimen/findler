import { useEffect } from 'react';
import { levelColor } from '@/utils/constants/gameSettings';

// Oda açıkken arka planı seviyenin rengine boyar; odadan çıkınca varsayılan yeşile döner.
// Seviye bir oda ayarı olduğu için odadaki herkes aynı rengi görür.
export const useLevelBackground = (cardCount: number | null) => {
  useEffect(() => {
    const root = document.documentElement;
    if (cardCount === null) {
      root.style.removeProperty('--bg-color');
      return;
    }
    root.style.setProperty('--bg-color', levelColor(cardCount));
    return () => {
      root.style.removeProperty('--bg-color');
    };
  }, [cardCount]);
};
