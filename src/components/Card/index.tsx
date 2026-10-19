import { useEffect, useState } from "react";
import styles from "./style.module.css";

// style.module.css içindeki dönüş süresiyle (transition: transform 0.6s) aynı olmalı
const FLIP_DURATION_MS = 600;

interface CardProps {
  // Açık kartta gösterilecek sembol; kapalıysa null
  label: string | null;
  disabled?: boolean;
  wrong?: boolean;
  onClick?: () => void;
}

function Card({ label, disabled = false, wrong = false, onClick }: CardProps) {
  const isFlipped = label !== null;
  // Kart kapanırken dönüş animasyonu bitene kadar sembol görünmeye devam etsin,
  // sonra DOM'dan silinsin ki inspect ile kapanmış kartların değerleri okunamasın
  const [shownLabel, setShownLabel] = useState(label);

  useEffect(() => {
    if (label !== null) {
      setShownLabel(label);
      return;
    }
    const timer = setTimeout(() => setShownLabel(null), FLIP_DURATION_MS);
    return () => clearTimeout(timer);
  }, [label]);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isFlipped}
      aria-label={isFlipped ? `Kart ${label}` : "Kapalı kart"}
      className={`${styles.flipCard} ${isFlipped ? styles.flip : ''} ${!disabled && !isFlipped ? styles.playable : ''}`}>
      <div className={styles.flipCardInner}>
        <div className={styles.flipCardFront}></div>
        <div className={`${styles.flipCardBack} ${wrong ? styles.wrong : ''}`}>{shownLabel}</div>
        <div className={styles.flipCardLeft}></div>
        <div className={styles.flipCardRight}></div>
      </div>
    </button>
  )
}

export default Card;
