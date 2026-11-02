import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import { gameApi, socket } from "@/services/socket/game";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { pushNotice } from "@/store/slices/game";
import { PresenceStatus } from "@/types/game";
import { handleApiError } from "@/utils/helpers";
import styles from "./style.module.css";

interface OnlinePlayersProps {
  // Lobideyken müsait oyunculara davet gönderilebilir
  canInvite: boolean;
  // Listenin altındaki açıklama
  hint?: string;
  // Davet davranışı; verilmezse oyuncu bulunduğu odaya davet edilir
  onInvite?: (targetId: string) => Promise<unknown>;
}

const STATUS_LABELS: Record<PresenceStatus, string> = {
  idle: "Müsait",
  "in-room": "Odada",
  playing: "Oyunda",
};

// Sunucudaki tekrar davet bekleme süresiyle aynı
const INVITE_COOLDOWN_MS = 15000;

// Sitede adını girmiş çevrimiçi oyuncular; müsait olanlar odaya davet edilebilir
function OnlinePlayers({ canInvite, hint, onInvite = gameApi.invitePlayer }: OnlinePlayersProps) {
  const dispatch = useAppDispatch();
  const online = useAppSelector((state) => state.game.online);
  // Az önce davet edilenler (id -> zaman); buton bir süre "Davet edildi" kalır
  const [invited, setInvited] = useState<Record<string, number>>({});
  const [, tick] = useState(0);

  const others = online.filter((p) => p.id !== socket.id);
  const sorted = [...others].sort((a, b) => Number(b.status === "idle") - Number(a.status === "idle"));

  // Bekleme süresi dolunca butonlar tekrar açılsın
  useEffect(() => {
    if (!Object.keys(invited).length) return;
    const timer = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [invited]);

  const invite = async (id: string, name: string) => {
    setInvited((prev) => ({ ...prev, [id]: Date.now() }));
    try {
      await onInvite(id);
      dispatch(pushNotice({ message: `${name} davet edildi`, type: "info" }));
    } catch (error) {
      // Davet gitmediyse buton tekrar kullanılabilsin
      setInvited((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      dispatch(pushNotice({ message: handleApiError(error), type: "error" }));
    }
  };

  return (
    <section className={styles.online} aria-label="Çevrimiçi oyuncular">
      <h3 className={styles.title}>
        <span className={styles.dot} aria-hidden="true" />
        Çevrimiçi oyuncular
        <span className={styles.count}>{others.length}</span>
      </h3>

      {others.length === 0 ? (
        <p className={styles.empty}>Şu an senden başka çevrimiçi kimse yok. Davet linkiyle arkadaşlarını çağırabilirsin.</p>
      ) : (
        <ul className={styles.list}>
          {sorted.map((p) => {
            const recently = invited[p.id] && Date.now() - invited[p.id] < INVITE_COOLDOWN_MS;
            return (
              <li key={p.id} className={styles.item}>
                <Avatar name={p.name} src={p.avatar} size={32} />
                <span className={styles.name}>{p.name}</span>
                <span className={`${styles.status} ${styles[p.status]}`}>{STATUS_LABELS[p.status]}</span>
                {canInvite && p.status === "idle" && (
                  <button
                    type="button"
                    className={styles.invite}
                    onClick={() => invite(p.id, p.name)}
                    disabled={!!recently}
                  >
                    {recently ? "Davet edildi" : "Davet Et"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {hint && others.some((p) => p.status === "idle") && <p className={styles.hint}>{hint}</p>}
    </section>
  );
}

export default OnlinePlayers;
