import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import ProfileForm from "@/components/ProfileForm";
import { gameApi } from "@/services/socket/game";
import { RoomPreview } from "@/types/api";
import { Profile } from "@/types/game";
import SettingsSummary from "@/components/SettingsSummary";
import { handleApiError } from "@/utils/helpers";
import styles from "./style.module.css";

interface InviteJoinProps {
  roomId: string;
  onJoin: (profile: Profile) => Promise<unknown>;
}

// Davet linkiyle gelen kişinin gördüğü kart: kim davet etti, odada kimler var, ayarlar ne
function InviteJoin({ roomId, onJoin }: InviteJoinProps) {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<RoomPreview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    gameApi
      .peekRoom(roomId)
      .then((res) => active && setPreview(res))
      .catch((err) => active && setError(handleApiError(err)));
    return () => {
      active = false;
    };
  }, [roomId]);

  const unavailable = error || preview?.blocked;

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
    >
      {!preview && !error && <p className={styles.muted}>Oda bilgileri yükleniyor...</p>}

      {preview && (
        <>
          <div className={styles.players}>
            {preview.players.map((player, i) => (
              <motion.span
                key={player.id}
                className={styles.playerAvatar}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.08 }}
              >
                <Avatar name={player.name} src={player.avatar} size={44} crown={player.isHost} />
              </motion.span>
            ))}
            {Array.from({ length: Math.max(0, preview.maxPlayers - preview.players.length) }, (_, i) => (
              <span key={`empty-${i}`} className={styles.emptySeat} aria-hidden="true" />
            ))}
          </div>

          <h1 className={styles.title}>Bir oyuna davet edildin!</h1>
          <p className={styles.subtitle}>
            {preview.hostName ? <><strong>{preview.hostName}</strong> seni odasına çağırıyor</> : "Odaya katıl"}
            {" · "}
            {preview.players.length}/{preview.maxPlayers} oyuncu
          </p>

          <SettingsSummary settings={preview.settings} />
        </>
      )}

      {unavailable ? (
        <div className={styles.unavailable}>
          <p>{unavailable}</p>
          <Button value="Yeni Oyun Kur" block onClick={() => navigate("/yeni-oyun")} />
        </div>
      ) : (
        preview && (
          <>
            <hr className={styles.divider} />
            <ProfileForm variant="stacked" actions={[{ label: "Odaya Katıl", run: onJoin }]} />
          </>
        )
      )}
    </motion.div>
  );
}

export default InviteJoin;
