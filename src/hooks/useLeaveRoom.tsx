import { useCallback, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useRoom } from '@/hooks/useRoom';

// Odadan çıkmadan önce onay ister. `requestLeave(hedef)` pencereyi açar,
// `leaveDialog` sayfada bir yere yerleştirilir.
export const useLeaveRoom = () => {
  const navigate = useNavigate();
  const { room, playerId, isHost, leaveRoom } = useRoom();
  // Onaylanınca gidilecek sayfa; null ise pencere kapalı
  const [target, setTarget] = useState<string | null>(null);

  const cancel = useCallback(() => setTarget(null), []);

  const confirm = async () => {
    const to = target ?? '/';
    setTarget(null);
    await leaveRoom();
    navigate(to);
  };

  let message = 'Odadan ayrılacaksın.';
  if (room?.status === 'playing') {
    message = room.solo
      ? 'Oyunun yarıda kalacak.'
      : 'Oyun devam ediyor. Çıkarsan bu oyuna geri dönemezsin.';
  }
  if (room && isHost && !room.solo) {
    // Sunucu yetkiyi listede kalan ilk oyuncuya verir
    const next = room.players.find((p) => p.id !== playerId);
    if (next) message += ` Kurucu yetkisi ${next.name} oyuncusuna geçecek.`;
  }

  const leaveDialog = (
    <AnimatePresence>
      {target !== null && room && (
        <ConfirmDialog
          title="Oyundan çıkmak istiyor musun?"
          message={message}
          confirmLabel="Çık"
          danger
          onConfirm={confirm}
          onCancel={cancel}
        />
      )}
    </AnimatePresence>
  );

  return { requestLeave: setTarget, leaveDialog };
};
