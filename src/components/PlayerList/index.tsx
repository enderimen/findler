import { AnimatePresence, motion } from "motion/react";
import Avatar from "@/components/Avatar";
import { Finisher, Player } from "@/types/game";
import styles from "./style.module.css";

interface PlayerListProps {
  players: Player[];
  hostId: string;
  meId: string | null;
  activeId?: string | null;
  finishers?: Finisher[];
  // Oyun sırasında hamle sayılarını göster
  showMoves?: boolean;
  // Verilirse kurucu diğer oyunculara yetkisini devredebilir
  onTransferHost?: (playerId: string) => void;
}

// Sağ taraftaki oyuncu listesi; sırası gelen oyuncu yeşil çizgiyle işaretlenir
function PlayerList({ players, hostId, meId, activeId, finishers = [], showMoves = false, onTransferHost }: PlayerListProps) {
  return (
    <ul className={styles.list}>
      <AnimatePresence initial={false}>
        {players.map((player) => {
          const rank = finishers.findIndex((f) => f.id === player.id) + 1;
          const canTransfer = onTransferHost && player.id !== hostId && player.connected;

          return (
            <motion.li
              key={player.id}
              layout
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              // Telefonda isim gizli olduğu için dokunup/üzerine gelince görünür
              title={player.name}
              className={`${styles.item} ${player.id === activeId ? styles.active : ''} ${!player.connected ? styles.offline : ''} ${rank > 0 ? styles.finished : ''}`}
            >
              <Avatar name={player.name} src={player.avatar} crown={player.id === hostId} />
              {/* Sürekli modda bitiren oyuncu pasife geçer ve derecesi gösterilir */}
              {rank > 0 && <span className={styles.rank} aria-label={`${rank}. oldu`}>{rank}</span>}
              {/* Telefonda isim gizli olduğu için hamle sayısı avatarın köşesinde küçükçe durur */}
              {showMoves && <span className={styles.moves} aria-label={`${player.moves} hamle`}>{player.moves}</span>}
              <div className={styles.info}>
                <span className={styles.name}>{player.name}</span>
                <span className={styles.meta}>
                  {[
                    player.id === meId && 'Sen',
                    player.id === hostId && 'Oda Kurucusu',
                    !player.connected && 'Bağlantı koptu',
                    rank > 0 && `${rank}. oldu`,
                    showMoves && `${player.moves} hamle`,
                    player.wins > 0 && `${player.wins} galibiyet`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
              {canTransfer && (
                <button
                  type="button"
                  className={styles.transfer}
                  title={`Kurucu yetkisini ${player.name} oyuncusuna devret`}
                  onClick={() => onTransferHost(player.id)}
                >
                  Kurucu Yap
                </button>
              )}
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

export default PlayerList;
