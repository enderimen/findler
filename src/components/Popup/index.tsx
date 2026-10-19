import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAppDispatch } from '@/store/hooks';
import { pushNotice } from '@/store/slices/game';
import { copyText } from '@/utils/helpers';
import styles from './styles.module.css';

interface PopupProps {
  roomId: string;
  onClose: () => void;
}

const COPIED_DURATION = 2000;
const SHARE_TITLE = 'Flip Master';

// Telefonun yerel paylaşım menüsü yalnızca https veya localhost'ta vardır
const canNativeShare = () => typeof navigator.share === 'function' && window.isSecureContext;

// Mobilde ekranın altından açılır; geniş ekranda ortada durur
const useIsMobile = () => {
  const query = '(max-width: 640px)';
  const [mobile, setMobile] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mobile;
};

// Davet linkini gösteren popup
const Popup = ({ roomId, onClose }: PopupProps) => {
  const dispatch = useAppDispatch();
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const linkRef = useRef<HTMLSpanElement>(null);
  const link = `${window.location.origin}/oda/${roomId}`;
  const message = `Flip Master'da benimle oyna! Odaya katılmak için tıkla: ${link}`;

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy = async () => {
    if (await copyText(link)) {
      setCopied(true);
      dispatch(pushNotice({ message: 'Davet linki kopyalandı!', type: 'info' }));
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED_DURATION);
      return;
    }
    // Kopyalanamazsa linki seçili bırak, kullanıcı elle kopyalayabilsin
    const selection = window.getSelection();
    if (linkRef.current && selection) {
      selection.selectAllChildren(linkRef.current);
    }
    dispatch(pushNotice({ message: 'Kopyalanamadı, linki seçip elle kopyala.', type: 'error' }));
  };

  const share = async () => {
    try {
      await navigator.share({ title: SHARE_TITLE, text: "Flip Master'da benimle oyna!", url: link });
    } catch (error) {
      // Kullanıcı paylaşım menüsünü kapattıysa sessizce geç
      if ((error as DOMException).name !== 'AbortError') copy();
    }
  };

  const sheetMotion = isMobile
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }
    : { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } };

  return (
    <motion.div
      className={styles.popupOverlay}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className={styles.popupContent}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Arkadaşlarını davet et"
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        {...sheetMotion}
      >
        <span className={styles.handle} aria-hidden="true" />
        <button type="button" className={styles.close} onClick={onClose} aria-label="Kapat">x</button>
        <p className={styles.popupTitle}>Arkadaşlarını davet etmek için aşağıdaki bağlantıyı hemen onlara gönder!</p>
        <motion.div
          className={`${styles.link} ${copied ? styles.linkCopied : ''}`}
          animate={copied ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          <span ref={linkRef} onClick={copy}>{link}</span>
          <button type="button" onClick={copy} title="Kopyala" aria-label="Bağlantıyı kopyala">
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.svg
                  key="check"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                >
                  <motion.path
                    d="M20 6 9 17l-5-5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  />
                </motion.svg>
              ) : (
                <motion.svg
                  key="copy"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </motion.svg>
              )}
            </AnimatePresence>
          </button>
        </motion.div>

        <div className={styles.shareRow}>
          {canNativeShare() && (
            <button type="button" className={`${styles.shareBtn} ${styles.native}`} onClick={share}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Paylaş
            </button>
          )}
          <a
            className={`${styles.shareBtn} ${styles.whatsapp}`}
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.24-.7.24-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43a9.38 9.38 0 0 1 6.67 2.77 9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.23 9.43-9.44 9.43M20.08 3.92A11.3 11.3 0 0 0 12.05.6C5.8.6.7 5.7.7 11.97c0 2 .52 3.95 1.52 5.67L.6 23.4l5.9-1.55a11.3 11.3 0 0 0 5.54 1.41h.01c6.26 0 11.35-5.1 11.35-11.36 0-3.03-1.18-5.89-3.32-8.03" />
            </svg>
            WhatsApp
          </a>
        </div>

        <div className={styles.copiedSlot}>
          <AnimatePresence>
            {copied && (
              <motion.p
                className={styles.copied}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                Bağlantı kopyalandı!
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Popup;
