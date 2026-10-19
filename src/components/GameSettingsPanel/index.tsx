import { gameApi } from "@/services/socket/game";
import { useAppDispatch } from "@/store/hooks";
import { pushNotice } from "@/store/slices/game";
import { GameMode, GameSettings, SymbolSet } from "@/types/game";
import {
  CARD_COUNT_OPTIONS,
  MODE_DESCRIPTIONS,
  MODE_LABELS,
  SYMBOL_LABELS,
  TURN_SECONDS_OPTIONS,
  turnSecondsLabel,
} from "@/utils/constants/gameSettings";
import { handleApiError, sequencePreview } from "@/utils/helpers";
import styles from "./style.module.css";

interface Option<T> {
  value: T;
  label: string;
}

interface RowProps<T> {
  label: string;
  options: Option<T>[];
  value: T;
  editable: boolean;
  hint?: string;
  onChange: (value: T) => void;
}

function Row<T extends string | number>({ label, options, value, editable, hint, onChange }: RowProps<T>) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <div className={styles.options} role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            disabled={!editable}
            className={`${styles.chip} ${option.value === value ? styles.selected : ""}`}
            onClick={() => option.value !== value && onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}

interface GameSettingsPanelProps {
  settings: GameSettings;
  editable: boolean;
  solo: boolean;
  hostName?: string;
}

// Oyun kurulurken seçilen ayarlar; yalnızca kurucu değiştirebilir
function GameSettingsPanel({ settings, editable, solo, hostName }: GameSettingsPanelProps) {
  const dispatch = useAppDispatch();

  const update = async (patch: Partial<GameSettings>) => {
    try {
      await gameApi.updateSettings(patch);
    } catch (error) {
      dispatch(pushNotice({ message: handleApiError(error), type: "error" }));
    }
  };

  return (
    <div className={`${styles.panel} ${editable ? "" : styles.readonly}`}>
      {!editable && (
        <p className={styles.lockNote}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Ayarları 👑 {hostName ?? "oda kurucusu"} belirliyor
        </p>
      )}
      {!solo && (
        <Row<GameMode>
          label="Oyun Türü"
          value={settings.mode}
          editable={editable}
          hint={MODE_DESCRIPTIONS[settings.mode]}
          options={(Object.keys(MODE_LABELS) as GameMode[]).map((mode) => ({ value: mode, label: MODE_LABELS[mode] }))}
          onChange={(mode) => update({ mode })}
        />
      )}
      <Row<SymbolSet>
        label="Kartlar"
        value={settings.symbols}
        editable={editable}
        hint={sequencePreview(settings.symbols)}
        options={(Object.keys(SYMBOL_LABELS) as SymbolSet[]).map((symbols) => ({ value: symbols, label: SYMBOL_LABELS[symbols] }))}
        onChange={(symbols) => update({ symbols })}
      />
      <Row<number>
        label="Seviye"
        value={settings.cardCount}
        editable={editable}
        hint={`${settings.cardCount} kart`}
        options={CARD_COUNT_OPTIONS.map((count) => ({ value: count, label: String(count) }))}
        onChange={(cardCount) => update({ cardCount })}
      />
      <Row<number>
        label="Hamle Süresi"
        value={settings.turnSeconds}
        editable={editable}
        options={TURN_SECONDS_OPTIONS.map((seconds) => ({ value: seconds, label: turnSecondsLabel(seconds) }))}
        onChange={(turnSeconds) => update({ turnSeconds })}
      />
    </div>
  );
}

export default GameSettingsPanel;
