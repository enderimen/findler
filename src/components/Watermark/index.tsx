import { CSSProperties } from "react";
import { motion } from "motion/react";
import styles from "./style.module.css";

const TEXT = "FLIP MASTER";

interface WatermarkProps {
  // Harfler kendi ekseninde dönerek tek tek belirir (ana sayfa)
  animated?: boolean;
  // Giriş animasyonunun başlama gecikmesi (sn)
  delay?: number;
  // Arka planda soluk filigran olarak gösterilir (diğer sayfalar)
  faded?: boolean;
}

// watermark.png yerine Rock 3D fontuyla yazılan "FLIP MASTER" yazısı
function Watermark({ animated = false, delay = 0, faded = false }: WatermarkProps) {
  const letters = TEXT.split("");

  return (
    <div className={`${styles.watermark} ${faded ? styles.faded : ""}`} aria-hidden="true">
      {letters.map((char, i) => {
        if (char === " ") return <span key={i} className={styles.space} />;

        // Bekleme animasyonu: harfler sırayla kart gibi döner
        const idleStyle = animated ? ({ animationDelay: `${delay + 2 + i * 0.09}s` } as CSSProperties) : undefined;

        return (
          <motion.span
            key={i}
            className={styles.letter}
            initial={animated ? { rotateY: -720, scale: 0.2, opacity: 0, y: 40 } : false}
            animate={{ rotateY: 0, scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: delay + i * 0.08 }}
          >
            <span className={animated ? styles.idle : undefined} style={idleStyle}>
              {char}
            </span>
          </motion.span>
        );
      })}
    </div>
  );
}

export default Watermark;
