import { GameSettings } from "@/types/game";
import { MODE_LABELS, SYMBOL_LABELS, turnSecondsLabel } from "@/utils/constants/gameSettings";
import styles from "./style.module.css";

interface SettingsSummaryProps {
  settings: GameSettings;
  // Tek kişilik oyunda oyun türü gösterilmez
  solo?: boolean;
}

// Oyun ayarlarının küçük etiketler halinde özeti: "Klasik · Sayılar · 12 kart · 30 sn"
function SettingsSummary({ settings, solo = false }: SettingsSummaryProps) {
  return (
    <ul className={styles.summary}>
      {!solo && <li>{MODE_LABELS[settings.mode]}</li>}
      <li>{SYMBOL_LABELS[settings.symbols]}</li>
      <li>{settings.cardCount} kart</li>
      <li>{turnSecondsLabel(settings.turnSeconds)}</li>
    </ul>
  );
}

export default SettingsSummary;
