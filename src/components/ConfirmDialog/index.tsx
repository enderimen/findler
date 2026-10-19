import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import styles from "./style.module.css";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  // Onay butonu kırmızı (geri alınamayan işlemler için)
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const MOBILE_QUERY = "(max-width: 640px)";

// Mobilde alttan açılan panel, geniş ekranda ortada kart şeklinde onay penceresi
function ConfirmDialog({
  title,
  message,
  confirmLabel = "Tamam",
  cancelLabel = "Vazgeç",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [isMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);

  useEffect(() => {
    // Yanlışlıkla Enter'a basılıp onaylanmasın diye odak "Vazgeç"te başlar
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const panelMotion = isMobile
    ? { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } }
    : { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } };

  // Hareketli (transform'lu) bir kapsayıcı içinde açılsa bile ekranı kaplasın diye body'ye taşınır
  return createPortal(
    <motion.div
      className={styles.overlay}
      onClick={onCancel}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={styles.panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onClick={(e) => e.stopPropagation()}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        {...panelMotion}
      >
        <span className={styles.handle} aria-hidden="true" />
        <h2 id="confirm-title" className={styles.title}>{title}</h2>
        <p id="confirm-message" className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button ref={cancelRef} type="button" className={styles.cancel} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={`${styles.confirm} ${danger ? styles.danger : ""}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

export default ConfirmDialog;
