import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { gameApi } from "@/services/socket/game";
import { EMOJI_REACTIONS, MESSAGE_REACTIONS } from "@/utils/constants/reactions";
import styles from "./style.module.css";

// Peş peşe basılınca sunucunun sınırına takılmasın diye kısa bekleme
const COOLDOWN_MS = 600;

// Oyun tahtasının altındaki tepki çubuğu: emojiler ve hazır mesajlar
function ReactionBar() {
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [cooling, setCooling] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Mesaj listesi açıkken dışarı tıklanınca kapanır
  useEffect(() => {
    if (!messagesOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setMessagesOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [messagesOpen]);

  const send = (kind: string) => {
    if (cooling) return;
    setMessagesOpen(false);
    setCooling(true);
    timer.current = setTimeout(() => setCooling(false), COOLDOWN_MS);
    // Sınır aşılırsa sunucu reddeder; oyuncuyu hata mesajıyla rahatsız etmeye gerek yok
    gameApi.sendReaction(kind).catch(() => {});
  };

  return (
    <div ref={barRef} className={styles.bar} role="toolbar" aria-label="Tepki gönder">
      {/* Ortalama dıştaki kapsayıcıda; açılış animasyonu transform'u kendisi yazdığı için */}
      <div className={styles.messagesAnchor}>
      <AnimatePresence>
        {messagesOpen && (
          <motion.ul
            className={styles.messages}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
          >
            {MESSAGE_REACTIONS.map((r) => (
              <li key={r.kind}>
                <button type="button" onClick={() => send(r.kind)} disabled={cooling}>
                  {r.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      </div>

      {EMOJI_REACTIONS.map((r) => (
        <motion.button
          key={r.kind}
          type="button"
          className={styles.emoji}
          onClick={() => send(r.kind)}
          disabled={cooling}
          whileTap={{ scale: 1.35 }}
          aria-label={`${r.label} gönder`}
        >
          {r.label}
        </motion.button>
      ))}
      <button
        type="button"
        className={`${styles.emoji} ${messagesOpen ? styles.active : ""}`}
        onClick={() => setMessagesOpen((v) => !v)}
        aria-expanded={messagesOpen}
        aria-label="Hazır mesaj gönder"
      >
        💬
      </button>
    </div>
  );
}

export default ReactionBar;
