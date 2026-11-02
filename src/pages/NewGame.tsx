import styles from "@/styles/pages/new-game.module.css";
import ProfileForm from "@/components/ProfileForm";
import OnlinePlayers from "@/components/OnlinePlayers";
import Watermark from "@/components/Watermark";
import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameApi } from '@/services/socket/game';
import { Error as ErrorMessage } from '@/utils/constants';
import { getProfile } from '@/utils/helpers';
import { useRoom } from '@/hooks/useRoom';
import { useAppDispatch } from '@/store/hooks';
import { openInvite } from '@/store/slices/game';
import { Profile } from '@/types/game';

const NewGame = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { createRoom, quickPlay } = useRoom();
  // Formdaki güncel ad/avatar; listeden doğrudan davet ederken kullanılır
  const profileRef = useRef<Profile>(getProfile() ?? { name: '', avatar: null });
  const onProfileChange = useCallback((profile: Profile) => {
    profileRef.current = profile;
  }, []);

  // Listeden doğrudan davet: arka planda özel bir oda kurulur, davet gönderilir ve
  // oyuncu ayarları yapabileceği lobiye geçer (ör. 1'e 1 meydan okuma)
  const inviteFromList = async (targetId: string) => {
    const profile = profileRef.current;
    if (profile.name.length < 2 || profile.name.length > 16) throw new Error(ErrorMessage.username);
    const roomId = await createRoom(profile);
    try {
      await gameApi.invitePlayer(targetId);
    } finally {
      navigate(`/oda/${roomId}`);
    }
  };

  // Özel oda kurar ve davet linkini paylaşmak için popup'ı açar
  const newRoom = async (profile: Profile) => {
    const roomId = await createRoom(profile);
    dispatch(openInvite());
    navigate(`/oda/${roomId}`);
  };

  // Tek kişilik oda kurar; oyuncu lobide seviyeyi seçip başlatır
  const solo = async (profile: Profile) => {
    const roomId = await createRoom(profile, { solo: true });
    navigate(`/oda/${roomId}`);
  };

  // Bekleyen açık bir odaya katılır, yoksa yenisini açar
  const play = async (profile: Profile) => {
    const roomId = await quickPlay(profile);
    navigate(`/oda/${roomId}`);
  };

  return (
    <div className={styles.newGame}>
      <Watermark faded />
      <ProfileForm
        actions={[
          { label: 'Tek Kişilik', run: solo },
          { label: 'Yeni Oda', run: newRoom },
          { label: 'Hemen Oyna', run: play },
        ]}
        onChange={onProfileChange}
      />
      <div className={styles.online}>
        <OnlinePlayers canInvite onInvite={inviteFromList} hint="Davet ettiğinde senin için bir oda kurulur." />
      </div>
    </div>
  );
}

export default NewGame;
