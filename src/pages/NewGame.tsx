import styles from "@/styles/pages/new-game.module.css";
import ProfileForm from "@/components/ProfileForm";
import Watermark from "@/components/Watermark";
import { useNavigate } from 'react-router-dom';
import { useRoom } from '@/hooks/useRoom';
import { useAppDispatch } from '@/store/hooks';
import { openInvite } from '@/store/slices/game';
import { Profile } from '@/types/game';

const NewGame = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { createRoom, quickPlay } = useRoom();

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
      />
    </div>
  );
}

export default NewGame;
