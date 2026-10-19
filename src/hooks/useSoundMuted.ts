import { useSyncExternalStore } from 'react';
import { isMuted, setMuted, subscribeMuted } from '@/utils/helpers';

// Ses açık/kapalı tercihini okur ve değiştirir
export const useSoundMuted = () => {
  const muted = useSyncExternalStore(subscribeMuted, isMuted);
  return [muted, setMuted] as const;
};
