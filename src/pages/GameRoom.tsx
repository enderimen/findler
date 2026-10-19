import { motion } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from '@/styles/pages/room.module.css';
import Board from '@/components/Board';
import Button from '@/components/Button';
import GameSettingsPanel from '@/components/GameSettingsPanel';
import PlayerList from '@/components/PlayerList';
import InviteJoin from '@/components/InviteJoin';
import Watermark from '@/components/Watermark';
import GameResult from '@/pages/GameResult';
import { useRoom } from '@/hooks/useRoom';
import { useLeaveRoom } from '@/hooks/useLeaveRoom';
import { useLevelBackground } from '@/hooks/useLevelBackground';
import { gameApi } from '@/services/socket/game';
import { useAppDispatch } from '@/store/hooks';
import { openInvite, pushNotice } from '@/store/slices/game';
import { RoomState } from '@/types/game';
import { handleApiError } from '@/utils/helpers';
import cardBack from '@/assets/images/card-back.jpg';

// Sunucu isteklerinde hata olursa bildirim gösterir
const useAction = () => {
  const dispatch = useAppDispatch();
  return async (run: () => Promise<unknown>) => {
    try {
      await run();
    } catch (error) {
      dispatch(pushNotice({ message: handleApiError(error), type: 'error' }));
    }
  };
};

function Lobby({ room, isHost }: { room: RoomState; isHost: boolean }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { leaveRoom } = useRoom();
  const { requestLeave, leaveDialog } = useLeaveRoom();
  const act = useAction();
  const connectedCount = room.players.filter((p) => p.connected).length;
  const canStart = connectedCount >= room.minPlayers;

  return (
    <motion.div
      className={styles.lobby}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <img src={cardBack} alt="" className={styles.lobbyCard} />
      <h2 className={styles.lobbyTitle}>{room.solo ? 'Tek Kişilik Oyun' : 'Oyuncular Bekleniyor...'}</h2>
      {!room.solo && (
        <p className={styles.lobbyInfo}>
          {room.players.length}/{room.maxPlayers} oyuncu
          {!canStart && ` · Başlamak için en az ${room.minPlayers} oyuncu gerekli`}
        </p>
      )}

      <GameSettingsPanel
        settings={room.settings}
        editable={isHost}
        solo={room.solo}
        hostName={room.players.find((p) => p.id === room.hostId)?.name}
      />

      <div className={styles.lobbyActions}>
        {/* Odadan çıkıp kullanıcı adı / oyun seçimi ekranına döner.
            Tek kişilik lobide kaybedilecek bir şey olmadığı için onay sorulmaz. */}
        <Button
          value="Geri"
          onClick={async () => {
            if (!room.solo) {
              requestLeave('/yeni-oyun');
              return;
            }
            await leaveRoom();
            navigate('/yeni-oyun');
          }}
        />
        {!room.solo && <Button value="Arkadaşını Davet Et" onClick={() => dispatch(openInvite())} />}
        {isHost && (
          <Button
            value={room.solo ? 'Başla' : 'Oyunu Başlat'}
            onClick={() => act(gameApi.startGame)}
            disabled={!canStart}
          />
        )}
      </div>
      {!isHost && (
        <p className={styles.lobbyInfo}>
          Oyunu 👑 {room.players.find((p) => p.id === room.hostId)?.name ?? 'oda kurucusu'} başlatacak.
        </p>
      )}
      {leaveDialog}
    </motion.div>
  );
}

function RoomContent() {
  const { roomId = '' } = useParams<{ roomId: string }>();
  const act = useAction();
  const { room, playerId, isHost, rejoining, connected, joinRoom } = useRoom();

  if (!room || room.roomId !== roomId) {
    if (rejoining) {
      return (
        <div className={styles.center}>
          <p className={styles.lobbyInfo}>{connected ? 'Odaya bağlanılıyor...' : 'Sunucuya bağlanılıyor...'}</p>
        </div>
      );
    }

    // Davet linkiyle gelen oyuncu önce kullanıcı adını girer
    return (
      <div className={`${styles.room} ${styles.center}`}>
        <InviteJoin roomId={roomId} onJoin={(profile) => joinRoom(roomId, profile)} />
      </div>
    );
  }

  if (room.status === 'finished') {
    return (
      <div className={styles.room}>
        <GameResult
          room={room}
          meId={playerId}
          isHost={isHost}
          onPlayAgain={() => act(gameApi.startGame)}
          onBackToLobby={() => act(gameApi.restartGame)}
          onRequestRematch={() => act(gameApi.requestRematch)}
        />
      </div>
    );
  }

  return (
    <div className={styles.room}>
      <div className={`${styles.main} ${room.status === 'lobby' ? styles.scrollable : ''}`}>
        {room.status === 'lobby' ? <Lobby room={room} isHost={isHost} /> : <Board room={room} meId={playerId} />}
      </div>
      {!room.solo && (
        <aside className={styles.side}>
          <PlayerList
            players={room.players}
            hostId={room.hostId}
            meId={playerId}
            activeId={room.status === 'playing' ? room.currentPlayerId : null}
            finishers={room.finishers}
            showMoves={room.status === 'playing'}
            onTransferHost={isHost ? (id) => act(() => gameApi.transferHost(id)) : undefined}
          />
        </aside>
      )}
    </div>
  );
}

function GameRoom() {
  const { roomId = '' } = useParams<{ roomId: string }>();
  const { room } = useRoom();
  // Odadaki seviyeye göre arka plan rengi (lobide kurucu seviye seçtikçe değişir)
  useLevelBackground(room && room.roomId === roomId ? room.settings.cardCount : null);

  return (
    <>
      <Watermark faded />
      <RoomContent />
    </>
  );
}

export default GameRoom;
