import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { socket } from "@/services/socket/game";
import { Reaction } from "@/types/game";
import { isEmojiReaction, reactionLabel } from "@/utils/constants/reactions";
import styles from "./style.module.css";

const FLOAT_DURATION = 2.6; // sn
// Aynı anda ekranda en fazla bu kadar tepki uçsun
const MAX_VISIBLE = 12;

interface FloatingReaction extends Reaction {
  // Her tepki biraz farklı yerden çıkıp farklı salınsın diye
  offset: number;
  sway: number;
}

// Odadaki herkesin gönderdiği tepkiler ekranın alt ortasından yükselip kaybolur
function ReactionLayer() {
  const [items, setItems] = useState<FloatingReaction[]>([]);

  useEffect(() => {
    const onReaction = (reaction: Reaction) => {
      if (!reactionLabel(reaction.kind)) return;
      const item = { ...reaction, offset: (Math.random() - 0.5) * 120, sway: 20 + Math.random() * 25 };
      setItems((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), item]);
    };
    socket.on("room:reaction", onReaction);
    return () => {
      socket.off("room:reaction", onReaction);
    };
  }, []);

  const remove = (id: string) => setItems((prev) => prev.filter((r) => r.id !== id));

  return createPortal(
    <div className={styles.layer} aria-live="polite">
      <AnimatePresence>
        {items.map((r) => {
          const emoji = isEmojiReaction(r.kind);
          return (
            // Dıştaki kapsayıcı konumu (ortalama + rastgele kayma), içteki animasyonu taşır;
            // ikisi ayrı olmalı çünkü animasyon transform'u kendisi yazıyor
            <motion.div key={r.id} className={styles.slot} style={{ x: r.offset }} exit={{ opacity: 0 }}>
            <motion.div
              className={styles.item}
              initial={{ y: 0, x: 0, opacity: 0, scale: 0.4 }}
              animate={{
                y: "-45vh",
                x: [0, r.sway, -r.sway, r.sway / 2, 0],
                opacity: [0, 1, 1, 1, 0],
                scale: [0.4, 1.15, 1, 1, 0.9],
              }}
              transition={{ duration: FLOAT_DURATION, ease: "easeOut" }}
              onAnimationComplete={() => remove(r.id)}
            >
              <span className={emoji ? styles.emoji : styles.message}>{reactionLabel(r.kind)}</span>
              <span className={styles.name}>{r.name}</span>
            </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body
  );
}

export default ReactionLayer;
