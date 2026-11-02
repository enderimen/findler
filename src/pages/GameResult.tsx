import Confetti from 'react-confetti';
import { AnimatePresence, motion } from 'motion/react';
import leader from "@/assets/images/leader.png";
import styles from "@/styles/pages/result.module.css";
import resultSound from "@/assets/sounds/win.mp3";
import { useEffect, useRef, useState } from 'react';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import GameSettingsPanel from '@/components/GameSettingsPanel';
import SettingsSummary from '@/components/SettingsSummary';
import ShareResult from '@/components/ShareResult';
import { RoomState } from '@/types/game';
import { formatDuration, playSound } from '@/utils/helpers';

interface GameResultProps {
  room: RoomState;
  meId: string | null;
  isHost: boolean;
  // Aynı ayarlarla, aynı odada hemen yeni oyun (kurucu)
  onPlayAgain: () => void;
  // Herkesi lobiye döndür (kurucu; ör. yeni oyuncu davet etmek için)
  onBackToLobby: () => void;
  // Kurucudan tekrar oynamayı iste (diğer oyuncular)
  onRequestRematch: () => Promise<unknown>;
}

function GameResult({ room, meId, isHost, onPlayAgain, onBackToLobby, onRequestRematch }: GameResultProps) {
  const [requesting, setRequesting] = useState(false);
  // Kurucu sonraki oyunun ayarlarını bu ekrandan düzenleyebilir; bekleyen istekler korunur
  const [editing, setEditing] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Panel açılınca, altındaki butonlarla birlikte görünür olacak şekilde kaydır
  useEffect(() => {
    if (!editing) return;
    const timer = setTimeout(() => actionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 350);
    return () => clearTimeout(timer);
  }, [editing]);
  const width = window.innerWidth;
  const height = window.innerHeight;
  const winner = room.finishers[0];
  const isWinner = winner?.id === meId;
  const me = room.players.find((p) => p.id === meId);
  const isMarathon = room.settings.mode === 'marathon' && room.finishers.length > 1;
  const host = room.players.find((p) => p.id === room.hostId);
  const requested = !!meId && room.rematchRequests.includes(meId);
  const requesters = room.players.filter((p) => room.rematchRequests.includes(p.id));

  // Sonuç listesi: sürekli modda bitiriş sırası, klasikte kazanan önce
  const ordered = isMarathon
    ? room.finishers.map((f) => room.players.find((p) => p.id === f.id)).filter((p) => !!p)
    : [...room.players].sort((a, b) => Number(b.id === winner?.id) - Number(a.id === winner?.id));

  const requestRematch = async () => {
    setRequesting(true);
    try {
      await onRequestRematch();
    } finally {
      setRequesting(false);
    }
  };

  let title = `${winner?.name ?? 'Bilinmeyen oyuncu'} Kazandı!`;
  if (room.solo) title = 'Tebrikler, Bitirdin!';
  else if (isWinner) title = 'Tebrikler, Kazandın!';

  useEffect(() => {
    playSound(resultSound);
  }, []);

  return (
    <div className={styles.resultContent}>
      <motion.h1
        className={styles.resultTitle}
        initial={{ opacity: 0, scale: 0.6, y: -30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
      >
        {title}
      </motion.h1>

      <motion.div
        className={styles.leader}
        initial={{ opacity: 0, scale: 0, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 12, delay: 0.2 }}
      >
        <img src={leader} alt="Lider" />
        <p className={styles.leaderName}>{winner?.name}</p>
      </motion.div>

      {room.solo && me && room.durationMs !== null && (
        <motion.p
          className={styles.stats}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {room.settings.cardCount} kart · {formatDuration(room.durationMs)} · {me.moves} hamle · {me.mistakes} hata
        </motion.p>
      )}

      {/* Oyuncuların hamle ve hata sayıları; sade, göze batmayan bir liste */}
      {!room.solo && (
        <ol className={styles.ranking}>
          {ordered.map((player, i) => (
            <motion.li
              key={player.id}
              className={`${styles.rankItem} ${player.id === meId ? styles.rankMe : ''}`}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <span className={styles.rankNo}>{isMarathon ? `${i + 1}.` : player.id === winner?.id ? '🏆' : ''}</span>
              <Avatar name={player.name} src={player.avatar} size={32} />
              <span className={styles.rankName}>{player.name}</span>
              <span className={styles.rankStats}>{player.moves} hamle · {player.mistakes} hata</span>
            </motion.li>
          ))}
        </ol>
      )}

      {/* Sonraki oyunun ayarları: herkes özeti görür, kurucu buradan düzenleyebilir */}
      <div className={styles.nextGame}>
        <span className={styles.nextLabel}>Sonraki oyun</span>
        <SettingsSummary settings={room.settings} solo={room.solo} />
        {isHost && (
          <button type="button" className={styles.editToggle} onClick={() => setEditing((v) => !v)} aria-expanded={editing}>
            {editing ? 'Düzenlemeyi kapat' : 'Ayarları düzenle'}
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {isHost && editing && (
          <motion.div
            className={styles.editPanel}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GameSettingsPanel settings={room.settings} editable solo={room.solo} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kazanan (tek kişilikte bitiren) sonucunu sosyal medyada paylaşabilir */}
      {(isWinner || room.solo) && me && (
        <div className={styles.share}>
          <ShareResult room={room} me={me} />
        </div>
      )}

      <div ref={actionsRef} className={styles.actions}>
        {isHost ? (
          <>
            {requesters.length > 0 && (
              <p className={styles.waiting}>
                {requesters.map((p) => p.name).join(', ')} tekrar oynamak istiyor
              </p>
            )}
            <div className={styles.buttons}>
              <Button value={requesters.length > 0 ? 'Kabul Et ve Başlat' : 'Tekrar Oyna'} onClick={onPlayAgain} />
              <Button value='Lobiye Dön' onClick={onBackToLobby} />
            </div>
          </>
        ) : requested ? (
          <p className={styles.waiting}>İsteğin gönderildi. 👑 {host?.name ?? 'Oda kurucusu'} onaylayınca oyun başlayacak...</p>
        ) : (
          <>
            <Button value='Tekrar oynamak istiyorum' onClick={requestRematch} disabled={requesting} />
            <p className={styles.waiting}>Yeni oyunu 👑 {host?.name ?? 'oda kurucusu'} başlatacak.</p>
          </>
        )}
      </div>
      <Confetti
        className={styles.confettiWrapper}
        width={width}
        height={height}
        gravity={0.2}
        recycle={false}
        numberOfPieces={isWinner ? 500 : 250}
      />
    </div>
  )
}

export default GameResult;
