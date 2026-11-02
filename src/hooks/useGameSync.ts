import { useEffect } from 'react';
import { socket, gameApi } from '@/services/socket/game';
import { useAppDispatch } from '@/store/hooks';
import { joined, left, pushNotice, setConnected, setOnline, setRoom } from '@/store/slices/game';
import { Notice, OnlinePlayer, RoomState } from '@/types/game';
import { getProfile, getSeat, handleApiError, playSound, saveLastScores, saveSeat } from '@/utils/helpers';
import joinSound from '@/assets/sounds/join.mp3';

// Socket olaylarını store'a bağlar. Uygulamada bir kez (MainLayout'ta) çalışır.
export const useGameSync = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Sayfa yenilenince veya bağlantı kopup gelince odaya kaldığı yerden döner
    const rejoin = async () => {
      const seat = getSeat();
      if (!seat) return;
      const profile = getProfile();
      try {
        const res = await gameApi.joinRoom({
          roomId: seat.roomId,
          playerId: seat.playerId,
          name: profile?.name ?? '',
          avatar: profile?.avatar ?? null,
        });
        dispatch(joined(res));
      } catch (error) {
        saveSeat(null);
        dispatch(left());
        dispatch(pushNotice({ message: handleApiError(error), type: 'error' }));
      }
    };

    const onConnect = () => {
      dispatch(setConnected(true));
      // Tarayıcıda adı kayıtlıysa çevrimiçi listesinde görünsün
      const profile = getProfile();
      if (profile) gameApi.sayHello(profile).catch(() => {});
      // Dinleyici kurulduktan sonra güncel listeyi iste; sonraki değişiklikler presence:list ile gelir
      gameApi.getOnline().then((res) => dispatch(setOnline(res.list)), () => {});
      rejoin();
    };
    const onPresence = (list: OnlinePlayer[]) => dispatch(setOnline(list));
    const onDisconnect = () => dispatch(setConnected(false));

    const onState = (state: RoomState) => {
      // Odadan çıktıktan sonra gelebilecek gecikmiş yayınları yok say
      if (getSeat()?.roomId !== state.roomId) return;
      dispatch(setRoom(state));
      // Skor Tablosu odadan çıktıktan sonra da son odanın skorlarını gösterebilsin
      if (state.players.some((p) => p.games > 0)) {
        saveLastScores({
          roomId: state.roomId,
          solo: state.solo,
          meId: getSeat()?.playerId ?? null,
          players: state.players.map(({ id, name, avatar, wins, games }) => ({ id, name, avatar, wins, games })),
        });
      }
    };

    const onNotice = (notice: Pick<Notice, 'message' | 'type'>) => {
      dispatch(pushNotice(notice));
      if (notice.type === 'join') playSound(joinSound, 0.6);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:state', onState);
    socket.on('room:notice', onNotice);
    socket.on('presence:list', onPresence);

    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:state', onState);
      socket.off('room:notice', onNotice);
      socket.off('presence:list', onPresence);
    };
  }, [dispatch]);
};
