import { CSSProperties, RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import Card from "@/components/Card";
import ReactionBar from "@/components/ReactionBar";
import { gameApi } from "@/services/socket/game";
import { useAppDispatch } from "@/store/hooks";
import { pushNotice } from "@/store/slices/game";
import { RoomState } from "@/types/game";
import { handleApiError, playSound, symbolFor } from "@/utils/helpers";
import flipSound from "@/assets/sounds/flip.mp3";
import shuffleSound from "@/assets/sounds/card-shuffle-short.mp3";
import { cardThemeVars } from "@/utils/constants/cardThemes";
import styles from "./style.module.css";

interface BoardProps {
  room: RoomState;
  meId: string | null;
}

// Tasarımdaki tam boyut; kart sayısı veya ekran gerektirirse küçülür
const MAX_CARD_WIDTH = 150;
const CARD_RATIO = 200 / 150;
const FULL_GAP = 20;
const COMPACT_GAP = 12;

interface GridLayout {
  cols: number;
  width: number;
  gap: number;
}

// Sütun sayısı ekrana göre değil kart sayısına göre sabittir; böylece odadaki herkes
// (telefon, tablet, bilgisayar) kartları aynı dizilimde görür. Son sıra ortalanır.
const columnsFor = (count: number) => {
  if (count <= 3) return count;
  if (count === 5 || count === 9) return 3;
  return 4;
};

// Sabit sütun sayısıyla kartların kaydırma gerektirmeden sığacağı en büyük boyutu bulur
const fitGrid = (count: number, areaWidth: number, areaHeight: number): GridLayout => {
  const cols = columnsFor(count);
  const rows = Math.ceil(count / cols);
  const widthFor = (gap: number) =>
    Math.floor(
      Math.min(MAX_CARD_WIDTH, (areaWidth - gap * (cols - 1)) / cols, (areaHeight - gap * (rows - 1)) / rows / CARD_RATIO)
    );
  // Büyük kartlarda tasarımdaki 20px boşluk, küçüklerde daha dar boşluk
  const full = widthFor(FULL_GAP);
  if (full >= 110) return { cols, width: full, gap: FULL_GAP };
  return { cols, width: Math.max(widthFor(COMPACT_GAP), 40), gap: COMPACT_GAP };
};

const useGridLayout = (ref: RefObject<HTMLDivElement | null>, count: number) => {
  const [layout, setLayout] = useState<GridLayout>({ cols: 4, width: MAX_CARD_WIDTH, gap: FULL_GAP });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const style = getComputedStyle(el);
      const width = el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const height = el.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      setLayout(fitGrid(count, width, height));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, count]);

  return layout;
};

// Sunucudan gelen kalan süreyi yerel saate göre geri sayar. Kalan süre her turda
// aynı değerle (ör. 10000) gelebildiği için sayaç tur numarasıyla yeniden başlatılır.
const useCountdown = (remainingMs: number | null, turnSeq: number) => {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (remainingMs === null) {
      setSeconds(null);
      return;
    }
    const deadline = Date.now() + remainingMs;
    const tick = () => setSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [remainingMs, turnSeq]);

  return seconds;
};

function Board({ room, meId }: BoardProps) {
  const dispatch = useAppDispatch();
  const areaRef = useRef<HTMLDivElement>(null);
  const layout = useGridLayout(areaRef, room.board.length);
  const seconds = useCountdown(room.turnRemainingMs, room.turnSeq);
  const [pending, setPending] = useState(false);

  const { symbols } = room.settings;
  const isMyTurn = room.currentPlayerId === meId;
  const iFinished = room.finishers.some((f) => f.id === meId);
  const currentPlayer = room.players.find((p) => p.id === room.currentPlayerId);
  const canFlip = isMyTurn && !room.locked && !pending;
  const target = symbolFor(room.nextExpected, symbols);
  const targetNoun = symbols === "letters" ? `${target} harfini` : `${target} numaralı kartı`;

  // Yeni bir kart açıldığında herkes çevirme sesini duyar
  const openCount = room.board.filter((v) => v !== null).length;
  const prevOpenCount = useRef(openCount);
  useEffect(() => {
    if (openCount > prevOpenCount.current) playSound(flipSound, 0.7);
    prevOpenCount.current = openCount;
  }, [openCount]);

  // Sürekli modda biri bitirince kartlar yeniden karıştırılır
  const prevDealId = useRef(room.dealId);
  useEffect(() => {
    if (room.dealId !== prevDealId.current) playSound(shuffleSound, 0.8);
    prevDealId.current = room.dealId;
  }, [room.dealId]);

  const flip = async (index: number) => {
    if (!canFlip) return;
    setPending(true);
    try {
      await gameApi.flipCard(index);
    } catch (error) {
      dispatch(pushNotice({ message: handleApiError(error), type: "error" }));
    } finally {
      setPending(false);
    }
  };

  let status: string;
  if (room.locked && openCount === room.board.length) {
    status = `${room.finishers[room.finishers.length - 1]?.name ?? "Bir oyuncu"} bitirdi! Kartlar karıştırılıyor...`;
  } else if (room.locked) {
    status = "Yanlış kart! Kartlar kapanıyor...";
  } else if (isMyTurn) {
    status = room.solo ? `${targetNoun} bul.` : `Sıra sende! ${targetNoun} bul.`;
  } else if (iFinished) {
    status = `Bitirdin! Sıra ${currentPlayer?.name ?? "..."} oyuncusunda`;
  } else {
    status = `Sıra ${currentPlayer?.name ?? "..."} oyuncusunda`;
  }

  const gridStyle = {
    // Satır genişliği sabit sütun sayısına göre; eksik kalan son sıra ortalanır
    width: layout.cols * layout.width + (layout.cols - 1) * layout.gap,
    gap: layout.gap,
    "--card-w": `${layout.width}px`,
    "--card-h": `${Math.round(layout.width * CARD_RATIO)}px`,
    "--card-font": `${Math.round(layout.width * 0.57)}px`,
    "--card-border": layout.width < 100 ? "3px" : "4px",
    // Seviyeye göre kart arkası deseni ve rengi
    ...cardThemeVars(room.board.length),
  } as CSSProperties;

  return (
    <div className={styles.board}>
      <div className={styles.status}>
        <p className={isMyTurn && !room.locked ? styles.myTurn : ""}>{status}</p>
        {seconds !== null && (
          <span className={`${styles.timer} ${seconds <= 5 ? styles.urgent : ""}`}>{seconds} sn</span>
        )}
        {room.solo && (
          <span className={styles.timer}>{room.players[0]?.mistakes ?? 0} hata</span>
        )}
      </div>
      <div ref={areaRef} className={styles.area}>
        <div className={styles.cards} style={gridStyle}>
          {room.board.map((value, index) => (
            <motion.div
              // dealId değişince (yeni oyun veya karıştırma) kartlar yeniden dağıtılır
              key={`${room.dealId}-${index}`}
              className={styles.slot}
              initial={{ opacity: 0, y: -120, rotate: (index % 2 ? 1 : -1) * 18, scale: 0.6 }}
              animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 22, delay: index * 0.05 }}
            >
              <Card
                label={value === null ? null : symbolFor(value, symbols)}
                // Kilitliyken açık olan ve sıradakinden büyük kart yanlış açılan karttır
                wrong={room.locked && value !== null && value >= room.nextExpected}
                disabled={!canFlip}
                onClick={() => flip(index)}
              />
            </motion.div>
          ))}
        </div>
      </div>
      {/* Çok oyunculu oyunda oyuncular birbirine tepki gönderebilir */}
      {!room.solo && <ReactionBar />}
    </div>
  );
}

export default Board;
