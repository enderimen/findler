import { useCallback } from 'react';
import { gameApi } from '@/services/socket/game';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { joined, left } from '@/store/slices/game';
import { JoinResponse } from '@/types/api';
import { Profile } from '@/types/game';
import { saveProfile, saveSeat } from '@/utils/helpers';

// Oda durumu ve odaya giriş/çıkış işlemleri
export const useRoom = () => {
  const dispatch = useAppDispatch();
  const { room, playerId, rejoining, connected } = useAppSelector((state) => state.game);

  const me = room?.players.find((p) => p.id === playerId) ?? null;
  const isHost = !!room && room.hostId === playerId;

  const enter = useCallback(
    (profile: Profile, res: JoinResponse) => {
      saveProfile(profile);
      saveSeat({ roomId: res.roomId, playerId: res.playerId });
      dispatch(joined(res));
      return res.roomId;
    },
    [dispatch]
  );

  const createRoom = async (profile: Profile, options: { solo?: boolean } = {}) =>
    enter(profile, await gameApi.createRoom(profile, options));

  const quickPlay = async (profile: Profile) => enter(profile, await gameApi.quickPlay(profile));

  const joinRoom = async (roomId: string, profile: Profile) =>
    enter(profile, await gameApi.joinRoom({ roomId, ...profile }));

  const leaveRoom = async () => {
    saveSeat(null);
    dispatch(left());
    await gameApi.leaveRoom().catch(() => {});
  };

  return { room, playerId, me, isHost, rejoining, connected, createRoom, quickPlay, joinRoom, leaveRoom };
};
