import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { playSound } from "@/utils/helpers";
import hoverSound from "@/assets/sounds/card-sound-hover.mp3";
import cardBack from "@/assets/images/card-back.jpg";
import styles from "./style.module.css";

const FAN_CARDS = 9;
const SPREAD = 110; // Yelpazenin toplam açısı (derece)
const HOVER_SOUND_DELAY = 200; // Ses, kartın kalkma hareketine denk gelsin diye (ms)

// Ana sayfadaki kart yelpazesi: kartlar masadan yükselip iskambil gibi açılır
function CardFan() {
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Fare kart üzerinden gecikme dolmadan ayrılırsa ses çalmaz
  const playHover = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => playSound(hoverSound, 0.5), HOVER_SOUND_DELAY);
  };
  const cancelHover = () => clearTimeout(hoverTimer.current);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  return (
    <div className={styles.fan} aria-hidden="true">
      {Array.from({ length: FAN_CARDS }, (_, i) => {
        const angle = -SPREAD / 2 + (SPREAD / (FAN_CARDS - 1)) * i;
        return (
          <motion.div
            key={i}
            className={styles.card}
            style={{ backgroundImage: `url(${cardBack})` }}
            initial={{ y: 420, rotate: 0, opacity: 0 }}
            animate={{ y: 0, rotate: angle, opacity: 1 }}
            whileHover={{ y: -18 }}
            onHoverStart={playHover}
            onHoverEnd={cancelHover}
            transition={{
              y: { type: "spring", stiffness: 120, damping: 16, delay: i * 0.06 },
              opacity: { duration: 0.2, delay: i * 0.06 },
              rotate: { type: "spring", stiffness: 90, damping: 12, delay: 0.55 + i * 0.03 },
            }}
          />
        );
      })}
      {/* Öndeki kart en son gelip hafifçe yerine oturur */}
      <motion.div
        className={`${styles.card} ${styles.front}`}
        style={{ backgroundImage: `url(${cardBack})` }}
        initial={{ y: 420, scale: 0.8, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        whileHover={{ y: -10, rotate: 2 }}
        onHoverStart={playHover}
        onHoverEnd={cancelHover}
        transition={{ type: "spring", stiffness: 140, damping: 14, delay: 1 }}
      />
    </div>
  );
}

export default CardFan;
