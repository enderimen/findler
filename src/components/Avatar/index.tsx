import { AnimatePresence, motion } from "motion/react";
import styles from "./style.module.css";

interface AvatarProps {
  name: string;
  src: string | null;
  size?: number;
  // Oda kurucusunun avatarında taç gösterilir
  crown?: boolean;
}

// Fotoğraf yoksa kullanıcı adının baş harfini gösterir
function Avatar({ name, src, size = 44, crown = false }: AvatarProps) {
  const initial = name.trim().charAt(0).toLocaleUpperCase("tr") || "?";

  return (
    <span className={styles.wrapper} style={{ width: size, height: size }}>
      <span className={styles.avatar} style={{ fontSize: size * 0.42 }}>
        {src ? <img src={src} alt={name} /> : initial}
      </span>
      <AnimatePresence>
        {crown && (
          <motion.span
            className={styles.crown}
            style={{ fontSize: Math.max(14, size * 0.42) }}
            title="Oda Kurucusu"
            aria-label="Oda Kurucusu"
            // Yetki devredildiğinde taç yeni kurucuya düşer
            initial={{ y: -14, opacity: 0, rotate: -40 }}
            animate={{ y: 0, opacity: 1, rotate: -40 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 14 }}
          >
            👑
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export default Avatar;
