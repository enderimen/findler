import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import Button from "@/components/Button";
import { useAppDispatch } from "@/store/hooks";
import { pushNotice } from "@/store/slices/game";
import { Player, RoomState } from "@/types/game";
import { createShareCard } from "@/utils/helpers/shareCard";
import styles from "./style.module.css";

interface ShareResultProps {
  room: RoomState;
  me: Player;
}

// Rekabetçi davet cümleleri; her paylaşımda biri seçilir
const CHALLENGES = [
  "Benimle oynamaya var mısın?",
  "Bu skoru geçebilir misin?",
  "Hafızana güveniyorsan gel!",
  "Sıra sende, rekabete var mısın?",
];

const formatDuration = (ms: number) => {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

// Kazananın (tek kişilikte bitirenin) sonucunu görsel ve rekabetçi bir metinle paylaşması
function ShareResult({ room, me }: ShareResultProps) {
  const dispatch = useAppDispatch();
  const site = window.location.origin;
  const challenge = useMemo(() => CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)], []);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fallbackOpen, setFallbackOpen] = useState(false);

  const { cardCount } = room.settings;
  const text = room.solo
    ? `Flip Master'da ${cardCount} kartı ${room.durationMs !== null ? `${formatDuration(room.durationMs)} sürede ` : ""}${me.mistakes} hatayla bitirdim! 🧠 ${challenge}`
    : `Flip Master'da ${cardCount} kartı ${me.moves} hamlede bitirip ${room.players.length} kişilik odada 1. oldum! 🏆 ${challenge}`;
  const message = `${text} ${site}`;

  // Görsel sonuç ekranı açılınca hazırlanır: iPhone paylaşım menüsünü ancak butona basıldıktan
  // hemen sonra açtığı için görselin o anda hazır olması gerekir
  useEffect(() => {
    let url: string | null = null;
    createShareCard({
      name: me.name,
      solo: room.solo,
      cardCount,
      moves: me.moves,
      mistakes: me.mistakes,
      durationMs: room.durationMs,
      playerCount: room.players.length,
      challenge,
      site: site.replace(/^https?:\/\//, ""),
    })
      .then((blob) => {
        setFile(new File([blob], "flip-master-sonuc.jpg", { type: "image/jpeg" }));
        url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      })
      .catch(() => {});
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
    // Sonuç ekranı boyunca aynı görsel kullanılır
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const share = async () => {
    if (!file) return;
    const data = { files: [file], text: message, title: "Flip Master" };
    if (window.isSecureContext && navigator.canShare?.(data)) {
      try {
        await navigator.share(data);
      } catch (error) {
        // Kullanıcı menüyü kapattıysa sessizce geç
        if ((error as DOMException).name !== "AbortError") setFallbackOpen(true);
      }
      return;
    }
    // Görselli paylaşımı desteklemeyen tarayıcılar (çoğu masaüstü)
    setFallbackOpen(true);
  };

  const download = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = "flip-master-sonuc.jpg";
    a.click();
    dispatch(pushNotice({ message: "Görsel indirildi", type: "info" }));
  };

  const enc = encodeURIComponent;
  const links = [
    { label: "X", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(site)}`, className: styles.x },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(site)}`, className: styles.facebook },
    { label: "WhatsApp", href: `https://wa.me/?text=${enc(message)}`, className: styles.whatsapp },
  ];

  return (
    <>
      <Button value={file ? "Sonucumu Paylaş" : "Paylaşım hazırlanıyor…"} onClick={share} disabled={!file} />

      {createPortal(
        <AnimatePresence>
          {fallbackOpen && (
            <motion.div
              className={styles.overlay}
              onClick={() => setFallbackOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className={styles.panel}
                role="dialog"
                aria-modal="true"
                aria-label="Sonucunu paylaş"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <button type="button" className={styles.close} onClick={() => setFallbackOpen(false)} aria-label="Kapat">
                  x
                </button>
                <h2 className={styles.title}>Sonucunu paylaş</h2>
                {previewUrl && <img className={styles.preview} src={previewUrl} alt="Paylaşılacak sonuç görseli" />}
                <p className={styles.hint}>
                  Görseli indirip paylaşımına ekleyebilirsin. Butonlar paylaşım metnini hazır açar.
                </p>
                <Button value="Görseli indir" onClick={download} block />
                <div className={styles.links}>
                  {links.map((l) => (
                    <a key={l.label} className={`${styles.link} ${l.className}`} href={l.href} target="_blank" rel="noopener noreferrer">
                      {l.label}
                    </a>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

export default ShareResult;
